import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: number;
  requestId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: string | number; 
  isRead: boolean;
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
  private webSocket: WebSocket | null = null;
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
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${requestId}/messages`);
  }

  getUnreadCount(requestId: string): Observable<{unreadCount: number}> {
    return this.http.get<{unreadCount: number}>(`${this.apiUrl}/chat/${requestId}/unread-count`);
  }

  checkAccess(requestId: string): Observable<{hasAccess: boolean}> {
    return this.http.get<{hasAccess: boolean}>(`${this.apiUrl}/chat/${requestId}/access`);
  }

  connectToChat(requestId: string): void {
    console.log('🔌 Connecting to chat:', requestId);
    
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.disconnectFromChat();
    }

    this.currentRequestId = requestId;
    const jwtToken = this.authService.getAccessToken();
    
    if (!jwtToken) {
      console.error('❌ No JWT token available for WebSocket connection');
      return;
    }

    const wsBaseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = `${wsBaseUrl}/ws?token=${encodeURIComponent(jwtToken)}`;
    
    console.log('🌐 Connecting to WebSocket URL:', wsUrl);

    try {
      this.webSocket = new WebSocket(wsUrl);

      this.webSocket.onopen = (event) => {
        console.log('✅ WebSocket Connected to chat:', requestId);
        this.reconnectAttempts = 0;
        
        if (this.webSocket) {
          const connectFrame = `CONNECT\naccept-version:1.0,1.1,1.2\nhost:localhost\n\n\x00`;
          this.webSocket.send(connectFrame);
          console.log('📡 Sent STOMP CONNECT frame');
        }
      };

      this.webSocket.onmessage = (event) => {
        console.log('📨 Raw WebSocket message:', event.data);
        
        if (typeof event.data === 'string' && event.data.startsWith('CONNECTED')) {
          console.log('✅ STOMP Connected, subscribing to topics...');
          
          if (this.webSocket) {
            const subscribeFrame = `SUBSCRIBE\nid:sub-1\ndestination:/topic/chat/${requestId}\n\n\x00`;
            this.webSocket.send(subscribeFrame);
            console.log('📡 Subscribed to /topic/chat/' + requestId);
            
            const subscribeTypingFrame = `SUBSCRIBE\nid:sub-2\ndestination:/topic/chat/${requestId}/typing\n\n\x00`;
            this.webSocket.send(subscribeTypingFrame);
            console.log('📡 Subscribed to typing events');
          }
          
          return;
        }
        
        // Обработваме MESSAGE frames
        if (typeof event.data === 'string' && event.data.startsWith('MESSAGE')) {
          try {
            const lines = event.data.split('\n');
            const bodyIndex = lines.findIndex(line => line === '') + 1;
            const body = lines.slice(bodyIndex).join('\n').replace(/\x00$/, '');
            
            if (body) {
              const message = JSON.parse(body);
              console.log('📨 Parsed STOMP message:', message);
              
              this.messagesSubject.next(message);
              this.loadUserChats();
              this.loadTotalUnreadCount();
            }
          } catch (error) {
            console.error('❌ Error parsing STOMP message:', error);
          }
        }
      };

      this.webSocket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.webSocket = null;
        
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
          setTimeout(() => {
            if (this.currentRequestId) {
              this.connectToChat(this.currentRequestId);
            }
          }, this.reconnectInterval);
        }
      };

      this.webSocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket connection:', error);
    }
  }

  sendMessage(requestId: string, message: string): Observable<any> {
    console.log('📤 Sending message via WebSocket:', message);
    
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const stompFrame = `SEND\ndestination:/app/chat/${requestId}/send\ncontent-type:application/json\n\n${JSON.stringify({ message })}\x00`;
      this.webSocket.send(stompFrame);
      console.log('📡 Sent STOMP SEND frame to /app/chat/' + requestId + '/send');
      
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    } else {
      console.log('📡 WebSocket not connected, using REST API fallback');
      return this.http.post(`${this.apiUrl}/chat/${requestId}/messages`, { message });
    }
  }

  sendTypingStatus(requestId: string, isTyping: boolean): void {
    console.log('⌨️ Sending typing status:', isTyping);
    
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const stompFrame = `SEND\ndestination:/app/chat/${requestId}/typing\ncontent-type:application/json\n\n${JSON.stringify({ isTyping })}\x00`;
      this.webSocket.send(stompFrame);
      console.log('📡 Sent STOMP typing frame');
    }
  }

  markAsRead(requestId: string): Observable<any> {
    console.log('📖 Marking messages as read');
    
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const stompFrame = `SEND\ndestination:/app/chat/${requestId}/mark-read\ncontent-type:application/json\n\n{}\x00`;
      this.webSocket.send(stompFrame);
      console.log('📡 Sent STOMP mark-read frame');
    }
    
    return this.http.post(`${this.apiUrl}/chat/${requestId}/mark-read`, {});
  }

  disconnectFromChat(): void {
    console.log('🔌 Disconnecting from chat');
    
    if (this.webSocket) {
      if (this.webSocket.readyState === WebSocket.OPEN) {
        const disconnectFrame = `DISCONNECT\n\n\x00`;
        this.webSocket.send(disconnectFrame);
      }
      this.webSocket.close(1000, 'Normal closure');
      this.webSocket = null;
    }
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
}
