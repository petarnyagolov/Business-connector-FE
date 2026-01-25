import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationWebSocketService, ChatUpdateDto, ChatMessageDto as WsChatMessageDto } from './notification-websocket.service';

export interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl?: string;
  tempFileData?: string;
}

export interface ChatMessage {
  id: number;
  requestId: string;
  senderEmail: string;
  senderName: string;
  message?: string;
  createdAt: string;
  isRead: boolean;
  messageType?: 'TEXT' | 'FILE' | 'IMAGE';
  fileName?: string;
  fileUrl?: string;
  fileAttachments?: FileAttachment[];
}
export interface ChatMessageDto {
  requestId: string;
  requestTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherPartyName: string;
  isRead?: boolean;
  message?: string;
  createdAt?: string;
  displaySenderName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatServiceNative {
  private apiUrl = environment.apiUrl;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private chatsSubject = new BehaviorSubject<ChatMessageDto[]>([]);
  public chats$ = this.chatsSubject.asObservable();
  
  private openChatSidebarSubject = new BehaviorSubject<boolean>(false);
  public openChatSidebar$ = this.openChatSidebarSubject.asObservable();

  public fileError$ = new BehaviorSubject<string | null>(null);
  
  public get typing$() {
    return this.wsService.typingIndicators;
  }
  
  public get messages$() {
    return this.wsService.activeChatMessages;
  }

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private wsService: NotificationWebSocketService
  ) {
    this.authService.authStatus$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        setTimeout(() => this.initializeWebSocketChat(), 100);
      } else {
        this.chatsSubject.next([]);
        this.unreadCountSubject.next(0);
      }
    });
    
    this.wsService.chatUpdates.subscribe(updates => {
      if (updates && updates.length > 0) {
        this.handleChatUpdates(updates);
      }
    });
  }
  
  private initializeWebSocketChat(): void {
    this.loadUserChats();
  }
  
  private handleChatUpdates(updates: ChatUpdateDto[]): void {
    const chats = this.chatsSubject.value;
    let chatsChanged = false;
    let shouldOpenSidebar = false;
    
    updates.forEach(update => {
      const existingChat = chats.find(c => c.requestId === update.chatId);
      
      if (existingChat) {
        existingChat.lastMessage = update.messagePreview;
        existingChat.lastMessageTime = update.timestamp;
        
        if (update.updateType === 'NEW_MESSAGE') {
          const currentChatId = this.wsService.getActiveChatId();
          if (!currentChatId || currentChatId !== update.chatId) {
            existingChat.unreadCount = update.unreadCount || (existingChat.unreadCount || 0) + 1;
            shouldOpenSidebar = true;
          }
        } else if (update.updateType === 'MESSAGE_READ') {
          existingChat.unreadCount = 0;
        }
        
        chatsChanged = true;
      } else if (update.updateType === 'CHAT_CREATED') {
        shouldOpenSidebar = true;
        this.loadUserChats();
        return;
      }
    });
    
    if (chatsChanged) {
      const sortedChats = chats.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      this.chatsSubject.next([...sortedChats]);
      this.updateTotalUnreadCount();
    }
    
    if (shouldOpenSidebar) {
      this.openChatSidebarSubject.next(true);
    }
  }
  
  private updateTotalUnreadCount(): void {
    const total = this.chatsSubject.value
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    this.unreadCountSubject.next(total);
  }
  
  getAllUserChats(): Observable<ChatMessageDto[]> {
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    return this.http.get<ChatMessageDto[]>(`${this.apiUrl}/chat/user/chats`, { headers })
      .pipe(tap(chats => {
        console.log('📋 Loaded chat list:', chats.length);
        this.chatsSubject.next(chats);
        this.updateTotalUnreadCount();
      }));
  }

  getChatMessages(requestId: string): Observable<ChatMessage[]> {
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${requestId}/messages`, { headers })
      .pipe(tap(messages => {
        console.log('💬 Loaded', messages.length, 'messages for chat:', requestId);
      }));
  }

  getUnreadCount(requestId: string): Observable<{unreadCount: number}> {
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    return this.http.get<{unreadCount: number}>(`${this.apiUrl}/chat/${requestId}/unread-count`, { headers });
  }

  checkAccess(requestId: string): Observable<{hasAccess: boolean}> {
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    return this.http.get<{hasAccess: boolean}>(`${this.apiUrl}/chat/${requestId}/access`, { headers });
  }
  
  deleteChat(requestId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/${requestId}`);
  }
  
  connectToChat(requestId: string): Observable<void> {
    return new Observable(observer => {
      this.getChatMessages(requestId).subscribe(messages => {
        const wsMessages: WsChatMessageDto[] = messages.map(msg => ({
          id: msg.id,
          message: msg.message,
          senderName: msg.senderName,
          senderEmail: msg.senderEmail,
          timestamp: msg.createdAt,
          isRead: msg.isRead,
          messageType: msg.messageType,
          fileName: msg.fileName,
          fileUrl: msg.fileUrl
        }));
        
        this.wsService.setActiveChatMessages(wsMessages);
        this.wsService.subscribeToChat(requestId);
        
        observer.next();
        observer.complete();
      });
    });
  }
  
  disconnectFromChat(): void {
    this.wsService.unsubscribeFromActiveChat();
  }
  
  sendMessage(requestId: string, message: string): Observable<any> {
    this.wsService.sendChatMessage(requestId, message);
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }
  
  sendTypingStatus(requestId: string, isTyping: boolean): void {
    this.wsService.sendTypingIndicator(requestId, isTyping);
  }
  
  markAsRead(requestId: string): Observable<any> {
    this.wsService.markChatAsRead(requestId);
    
    const chats = this.chatsSubject.value;
    const chat = chats.find(c => c.requestId === requestId);
    if (chat) {
      chat.unreadCount = 0;
      this.chatsSubject.next([...chats]);
      this.updateTotalUnreadCount();
    }
    
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }
  
  sendMessageWithFiles(requestId: string, message: string, files: File[]): Observable<any> {
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file, file.name);
    });
    
    if (message && message.trim()) {
      formData.append('message', message.trim());
    }
    
    return this.http.post(`${this.apiUrl}/chat/${requestId}/files`, formData).pipe(
      tap(() => {
        this.fileError$.next(null);
      }),
      catchError(error => {
        const errorMsg = error.error?.message || 'Грешка при качване на файлове';
        this.fileError$.next(errorMsg);
        return throwError(() => error);
      })
    );
  }
  
  downloadFile(attachment: FileAttachment, requestId: string): Observable<Blob> {
    if (attachment.fileUrl) {
      return this.http.get(attachment.fileUrl, { responseType: 'blob' });
    }
    
    const fileUrl = `${this.apiUrl}/chat/${requestId}/messages/${attachment.id}/download`;
    return this.http.get(fileUrl, { responseType: 'blob' });
  }
  
  loadUserChats(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.getAllUserChats().subscribe({
      next: (chats) => {
      },
      error: (error) => {
      }
    });
  }

  loadTotalUnreadCount(): void {
    const total = this.chatsSubject.value
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    this.unreadCountSubject.next(total);
  }

  refreshChats(): void {
    this.loadUserChats();
  }
  
  getTotalUnreadCount(): number {
    return this.chatsSubject.value
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }
  
  getChats(): ChatMessageDto[] {
    return this.chatsSubject.value;
  }
  
  isWebSocketConnected(): boolean {
    let isConnected = false;
    this.wsService.isConnected$.subscribe(connected => isConnected = connected).unsubscribe();
    return isConnected;
  }
}
