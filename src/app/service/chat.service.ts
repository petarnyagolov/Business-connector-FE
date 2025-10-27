import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

declare let Stomp: any;

export interface ChatMessage {
  id: number;
  requestId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: string | number; 
  isRead: boolean;
  fileAttachments?: FileAttachment[]; // Добавяме файлови прикачки
}

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string; // URL за download от сървъра
  tempFileData?: string; // Base64 данни за временни файлове
}

export interface ChatMessageDto {
  id: number;
  requestId: string;
  requestTitle: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: number; // Unix timestamp
  isRead: boolean;
  isMyRequest: boolean;
  otherPartyCompanyName: string;
  displaySenderName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = environment.apiUrl;
  private stompClient: any = null;
  private currentRequestId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private chatsSubject = new BehaviorSubject<ChatMessageDto[]>([]);
  public chats$ = this.chatsSubject.asObservable();

  private messagesSubject = new Subject<ChatMessage>();
  public messages$ = this.messagesSubject.asObservable();

  private typingSubject = new Subject<{ userEmail: string; isTyping: boolean; requestId: string }>();
  public typing$ = this.typingSubject.asObservable();

  private fileErrorSubject = new Subject<string>();
  public fileError$ = this.fileErrorSubject.asObservable();

  public baseApiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.authService.authStatus$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.loadUserChats();
        this.loadTotalUnreadCount();
      } else {
        this.chatsSubject.next([]);
        this.unreadCountSubject.next(0);
        this.disconnectFromChat();
      }
    });
  }

  getAllUserChats(): Observable<ChatMessageDto[]> {
    return this.http.get<ChatMessageDto[]>(`${this.apiUrl}/chat/user/chats`);
  }

  getChatMessages(requestId: string): Observable<ChatMessage[]> {
    return this.http.get<any[]>(`${this.apiUrl}/chat/${requestId}/messages`).pipe(
      map((messages: any[]) => messages.map((message: any) => {
        // Преобразуваме FILE съобщенията във fileAttachments формат
        if (message.messageType === 'FILE') {
          return {
            ...message,
            fileAttachments: [{
              id: message.id?.toString() || 'file-' + Date.now(),
              fileName: message.fileName,
              fileSize: message.fileSize,
              fileType: message.fileType,
              fileUrl: message.downloadUrl
            }]
          } as ChatMessage;
        }
        return message as ChatMessage;
      }))
    );
  }

  getUnreadCount(requestId: string): Observable<{unreadCount: number}> {
    return this.http.get<{unreadCount: number}>(`${this.apiUrl}/chat/${requestId}/unread-count`);
  }

  checkAccess(requestId: string): Observable<{hasAccess: boolean}> {
    return this.http.get<{hasAccess: boolean}>(`${this.apiUrl}/chat/${requestId}/access`);
  }

  connectToChat(requestId: string): void {
    console.log('🔌 Connecting to chat:', requestId);
    
    if (this.stompClient && this.stompClient.connected) {
      this.disconnectFromChat();
    }

    this.currentRequestId = requestId;
    const jwtToken = this.authService.getAccessToken();
    
    if (!jwtToken) {
      console.error('❌ No JWT token available for WebSocket connection');
      return;
    }

    const wsBaseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${wsBaseUrl}/ws`;
    
    console.log('🌐 Connecting to WebSocket URL:', wsUrl);

    try {
      // Инициализираме STOMP клиента
      const socket = new WebSocket(wsUrl);
      this.stompClient = Stomp.over(socket);
      
      // Конфигурираме STOMP клиента
      this.stompClient.debug = (str: string) => {
        console.log('� STOMP:', str);
      };

      this.stompClient.connect({}, 
        // onConnect callback
        (frame: any) => {
          console.log('✅ STOMP Connected:', frame);
          this.reconnectAttempts = 0;
          
          // Изпращаме authentication съобщение
          this.stompClient.send('/app/auth', {}, JSON.stringify({ 
            token: jwtToken 
          }));
          console.log('� Sent authentication message');
          
          // Subscribe за съобщения
          this.stompClient.subscribe(`/queue/chat/${requestId}`, (message: any) => {
            console.log('📨 Received message:', message.body);
            try {
              const chatMessage = JSON.parse(message.body);
              console.log('📨 Parsed chat message:', chatMessage);
              
              // Ако съобщението е файл, преобразувай го във fileAttachments формат
              if (chatMessage.messageType === 'FILE') {
                chatMessage.fileAttachments = [{
                  id: chatMessage.id?.toString() || 'file-' + Date.now(),
                  fileName: chatMessage.fileName,
                  fileSize: chatMessage.fileSize,
                  fileType: chatMessage.fileType,
                  fileUrl: chatMessage.downloadUrl
                }];
                console.log('📨 Converted FILE message to fileAttachments format');
              }
              
              // Ако съобщението има fileAttachments, ги обогатяваме с временните данни
              if (chatMessage.fileAttachments && Array.isArray(chatMessage.fileAttachments)) {
                chatMessage.fileAttachments = chatMessage.fileAttachments.map((attachment: any) => {
                  const tempFileData = this.getFileData(attachment.id, chatMessage.requestId);
                  return {
                    ...attachment,
                    tempFileData
                  };
                });
                console.log('📨 Enriched file attachments with temp data');
              }
              
              this.messagesSubject.next(chatMessage);
              this.loadUserChats();
              this.loadTotalUnreadCount();
            } catch (error) {
              console.error('❌ Error parsing chat message:', error);
            }
          });
          
          // Subscribe за typing events
          this.stompClient.subscribe(`/queue/chat/${requestId}/typing`, (message: any) => {
            console.log('⌨️ Received typing event:', message.body);
            try {
              const typingData = JSON.parse(message.body);
              this.typingSubject.next({
                ...typingData,
                requestId
              });
            } catch (error) {
              console.error('❌ Error parsing typing event:', error);
            }
          });
        },
        // onError callback
        (error: any) => {
          console.error('❌ STOMP connection error:', error);
          this.stompClient = null;
          
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            setTimeout(() => {
              if (this.currentRequestId) {
                this.connectToChat(this.currentRequestId);
              }
            }, this.reconnectInterval);
          }
        }
      );

    } catch (error) {
      console.error('❌ Error creating STOMP connection:', error);
    }
  }

  sendMessage(requestId: string, message: string): Observable<any> {
    console.log('📤 Sending message via STOMP:', message);
    
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/chat/${requestId}/send`, {}, JSON.stringify({ 
        message 
      }));
      console.log('📡 Sent STOMP message to /app/chat/' + requestId + '/send');
      
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    } else {
      console.log('📡 STOMP not connected, using REST API fallback');
      return this.http.post(`${this.apiUrl}/chat/${requestId}/messages`, { message });
    }
  }

  sendTypingStatus(requestId: string, isTyping: boolean): void {
    console.log('⌨️ Sending typing status:', isTyping);
    
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/chat/${requestId}/typing`, {}, JSON.stringify({ 
        isTyping 
      }));
      console.log('📡 Sent STOMP typing status');
    }
  }

  markAsRead(requestId: string): Observable<any> {
    console.log('📖 Marking messages as read');
    
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.send(`/app/chat/${requestId}/mark-read`, {}, JSON.stringify({}));
      console.log('📡 Sent STOMP mark-read message');
    }
    
    return this.http.post(`${this.apiUrl}/chat/${requestId}/mark-read`, {});
  }

  disconnectFromChat(): void {
    console.log('🔌 Disconnecting from chat');
    
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect(() => {
        console.log('✅ STOMP disconnected');
      });
    }
    this.stompClient = null;
    this.currentRequestId = null;
    this.reconnectAttempts = 0;
  }

  loadUserChats(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.getAllUserChats().subscribe({
      next: (chats) => {
        this.chatsSubject.next(chats);
      },
      error: (error) => {
        console.error('Error loading user chats:', error);
      }
    });
  }

  loadTotalUnreadCount(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.getAllUserChats().subscribe({
      next: (chats) => {
        const totalUnread = chats.filter(chat => !chat.isRead).length;
        this.unreadCountSubject.next(totalUnread);
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  refreshChats(): void {
    this.loadUserChats();
    this.loadTotalUnreadCount();
  }

  sendMessageWithFiles(requestId: string, message: string, files: File[]): Observable<any> {
    const tempFiles: FileAttachment[] = [];
    
    const filePromises = files.map((file, index) => {
      return new Promise<FileAttachment>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const fileAttachment: FileAttachment = {
            id: this.generateFileId(),
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            tempFileData: reader.result as string
          };
          resolve(fileAttachment);
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          reject(error);
        };
        reader.readAsDataURL(file);
      });
    });

    return new Observable(observer => {
      Promise.all(filePromises).then(attachments => {
        tempFiles.push(...attachments);
        this.storeTemporaryFiles(requestId, tempFiles);
        
        if (this.stompClient && this.stompClient.connected) {
          // Изпращаме всеки файл като отделно съобщение според backend API
          tempFiles.forEach(fileAttachment => {
            const fileBase64 = fileAttachment.tempFileData?.split(',')[1] || '';
            
            const fileMessage = {
              fileName: fileAttachment.fileName,
              fileType: fileAttachment.fileType,
              fileData: fileBase64,
              fileSize: fileAttachment.fileSize,
              message: message || '' 
            };
            
            this.stompClient.send(`/app/chat/${requestId}/send-file`, {}, JSON.stringify(fileMessage));
          });
          
          observer.next({ success: true });
          observer.complete();
        } else {
          observer.error('File upload requires STOMP connection');
        }
      }).catch(error => {
        console.error('Error processing files:', error);
        observer.error(error);
      });
    });
  }

  generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  storeTemporaryFiles(requestId: string, files: FileAttachment[]): void {
    const storageKey = `chat_files_${requestId}`;
    const existingFiles = this.getTemporaryFiles(requestId);
    const allFiles = [...existingFiles, ...files];
    
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(allFiles));
      console.log('💾 Stored temporary files for request:', requestId, files.length);
    } catch (error) {
      console.error('❌ Error storing temporary files:', error);
      this.cleanupOldTemporaryFiles();
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(allFiles));
      } catch (retryError) {
        console.error('❌ Failed to store files even after cleanup:', retryError);
      }
    }
  }

  getTemporaryFiles(requestId: string): FileAttachment[] {
    const storageKey = `chat_files_${requestId}`;
    try {
      const storedFiles = sessionStorage.getItem(storageKey);
      return storedFiles ? JSON.parse(storedFiles) : [];
    } catch (error) {
      console.error('❌ Error retrieving temporary files:', error);
      return [];
    }
  }

  getFileData(fileId: string, requestId: string): string | null {
    console.log('🔍 Looking for file data:', fileId, 'in request:', requestId);
    const files = this.getTemporaryFiles(requestId);
    console.log('🔍 Found files in storage:', files.length);
    
    if (files.length > 0) {
      console.log('🔍 File IDs in storage:', files.map(f => f.id));
      const file = files.find(f => f.id === fileId);
      if (file) {
        console.log('✅ Found matching file:', file.fileName);
        return file.tempFileData || null;
      } else {
        console.log('❌ No matching file found for ID:', fileId);
      }
    } else {
      console.log('❌ No files found in storage for request:', requestId);
    }
    
    return null;
  }

  private cleanupOldTemporaryFiles(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('chat_files_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.slice(0, Math.ceil(keysToRemove.length / 2)).forEach(key => {
      sessionStorage.removeItem(key);
    });
    
    console.log('🧹 Cleaned up old temporary files:', keysToRemove.length);
  }

  clearAllTemporaryFiles(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('chat_files_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('🧹 Cleared all temporary chat files:', keysToRemove.length);
  }

  downloadFile(attachment: FileAttachment, requestId: string, messageId: number): Observable<Blob> {
    const downloadUrl = `${this.apiUrl}/chat/${requestId}/messages/${messageId}/download`;
    
    return this.http.get(downloadUrl, {
      responseType: 'blob',
      headers: {
        'Authorization': `Bearer ${this.authService.getAccessToken()}`
      }
    });
  }
}
