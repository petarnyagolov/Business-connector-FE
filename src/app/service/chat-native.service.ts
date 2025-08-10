import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: number;
  requestId: string;
  senderEmail: string;
  senderName: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatMessageDto {
  requestId: string;
  requestTitle: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherPartyName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatServiceNative {
  private apiUrl = environment.apiUrl;
  private webSocket: WebSocket | null = null;
  private currentRequestId: string | null = null;
  
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  private chatsSubject = new BehaviorSubject<ChatMessageDto[]>([]);
  public chats$ = this.chatsSubject.asObservable();

  private messagesSubject = new Subject<ChatMessage>();
  public messages$ = this.messagesSubject.asObservable();

  private typingSubject = new Subject<{ userEmail: string; isTyping: boolean }>();
  public typing$ = this.typingSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('🔥 ChatServiceNative constructor called');
    console.log('🔗 API URL:', this.apiUrl);
    
    // Subscribe to auth status changes only once
    this.authService.authStatus$.subscribe(isAuthenticated => {
      console.log('🔐 Auth status changed:', isAuthenticated);
      if (isAuthenticated) {
        // Add small delay to avoid immediate multiple calls
        setTimeout(() => {
          this.loadUserChats();
          this.loadTotalUnreadCount();
        }, 100);
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
    console.log('🚀 connectToChat called with requestId:', requestId);
    
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      console.log('🔌 Closing existing WebSocket connection');
      this.webSocket.close();
    }

    this.currentRequestId = requestId;
    const jwtToken = this.authService.getAccessToken();
    
    if (!jwtToken) {
      console.error('❌ No JWT token available for WebSocket connection');
      return;
    }

    // Check if backend is reachable first and discover WebSocket endpoints
    this.checkAccess(requestId).pipe(
      switchMap(() => this.discoverWebSocketEndpoints())
    ).subscribe({
      next: (wsInfo) => {
        console.log('✅ Backend access check successful, WebSocket info:', wsInfo);
        this.attemptWebSocketConnection(requestId, jwtToken);
      },
      error: (error) => {
        console.error('❌ Backend access check failed:', error);
        if (error.status === 0) {
          console.error('❌ Backend server appears to be down (CORS/connection error)');
        }
        // Still try WebSocket connection even if discovery fails
        this.attemptWebSocketConnection(requestId, jwtToken);
      }
    });
  }

  // Discover available WebSocket endpoints from backend
  private discoverWebSocketEndpoints(): Observable<any> {
    console.log('🔍 Discovering WebSocket endpoints...');
    
    // Try some common Spring Boot info endpoints
    return this.http.get(`${this.apiUrl}/actuator/mappings`).pipe(
      catchError(() => {
        console.log('📡 /actuator/mappings not available, trying other endpoints...');
        return this.http.get(`${this.apiUrl}/actuator/info`).pipe(
          catchError(() => {
            console.log('📡 /actuator/info not available, trying basic info...');
            return this.http.get(`${this.apiUrl}/info`).pipe(
              catchError(() => {
                console.log('📡 No info endpoints available');
                return of({ discovered: false });
              })
            );
          })
        );
      })
    );
  }

  private attemptWebSocketConnection(requestId: string, jwtToken: string): void {
    // Try different WebSocket URL formats since SockJS is removed
    // Common Spring Boot WebSocket paths and variations
    const possibleUrls = [
      'ws://localhost:8081/ws',
      'ws://localhost:8081/websocket', 
      'ws://localhost:8081/chat',
      'ws://localhost:8081/chat-websocket',
      'ws://localhost:8081/app/ws',
      'ws://localhost:8081/api/ws',
      'ws://localhost:8081/stomp',
      'ws://localhost:8081/socket',
      'ws://localhost:8081/ws/chat'
    ];
    
    console.log('🔗 Attempting native WebSocket connection...');
    console.log('🎫 Using JWT token:', jwtToken ? 'Token present' : 'No token');
    
    this.tryWebSocketUrls(possibleUrls, 0, requestId, jwtToken);
  }

  private tryWebSocketUrls(urls: string[], index: number, requestId: string, jwtToken: string): void {
    if (index >= urls.length) {
      console.error('❌ All WebSocket URL attempts failed');
      return;
    }

    const wsUrl = urls[index];
    console.log(`🔗 Trying WebSocket URL ${index + 1}/${urls.length}:`, wsUrl);
    
    try {
      // Create WebSocket connection without SockJS
      this.webSocket = new WebSocket(wsUrl);
      console.log('📡 WebSocket object created, readyState:', this.webSocket.readyState);
      
      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.webSocket && this.webSocket.readyState === WebSocket.CONNECTING) {
          console.error(`⏱️ WebSocket connection timeout for ${wsUrl} - trying next`);
          this.webSocket.close();
          // Try next URL
          setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
        }
      }, 5000); // Reduced timeout for faster failover
      
      this.webSocket.onopen = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`✅ WebSocket connection OPENED successfully to ${wsUrl}!`);
        console.log('📡 WebSocket readyState after open:', this.webSocket?.readyState);
        
        // Send authentication message first
        this.webSocket?.send(JSON.stringify({
          type: 'auth',
          token: jwtToken
        }));
        console.log('📤 Sent authentication message');
        
        // Then send join message for the specific chat
        setTimeout(() => {
          this.webSocket?.send(JSON.stringify({
            type: 'join',
            requestId: requestId
          }));
          console.log('📤 Sent join message for requestId:', requestId);
        }, 100);
      };
      
      this.webSocket.onmessage = (event) => {
        console.log('📨 WebSocket message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          console.log('📨 Parsed message:', message);
          
          // Handle different message types
          if (message.type === 'chat-message') {
            this.messagesSubject.next(message);
          } else if (message.type === 'typing') {
            this.typingSubject.next(message);
          } else {
            console.log('📨 Other message type:', message.type);
          }
        } catch (e) {
          console.error('❌ Error parsing WebSocket message:', e, 'Raw data:', event.data);
        }
      };
      
      this.webSocket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ WebSocket ERROR occurred for ${wsUrl}:`, error);
        console.log('📡 WebSocket readyState after error:', this.webSocket?.readyState);
        
        // Log more details about the error
        console.error(`❌ WebSocket error details for ${wsUrl}:`, {
          url: wsUrl,
          readyState: this.webSocket?.readyState,
          protocol: this.webSocket?.protocol,
          extensions: this.webSocket?.extensions
        });
        
        // Try next URL after a short delay
        setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
      };
      
      this.webSocket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket connection CLOSED for ${wsUrl}:`, event.code, event.reason);
        console.log('📡 WebSocket readyState after close:', this.webSocket?.readyState);
        
        // Handle specific close codes with more detail
        if (event.code === 1006) {
          console.error(`❌ WebSocket closed abnormally (1006) for ${wsUrl} - trying next URL`);
          setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
        } else if (event.code === 1001) {
          console.log(`ℹ️ WebSocket closed (1001) for ${wsUrl} - Endpoint going away, trying next`);
          setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
        } else if (event.code === 1000) {
          console.log('✅ WebSocket closed normally (1000)');
        } else if (event.code === 1002) {
          console.error(`❌ WebSocket closed (1002) for ${wsUrl} - Protocol error, trying next`);
          setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
        } else if (event.code === 1003) {
          console.error(`❌ WebSocket closed (1003) for ${wsUrl} - Unsupported data type, trying next`);
          setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
        } else {
          console.log(`🔌 WebSocket closed with code: ${event.code} for ${wsUrl} - ${event.reason}, trying next`);
          setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
        }
      };
      
    } catch (error) {
      console.error(`💥 Failed to create WebSocket for ${wsUrl}:`, error);
      console.log('📡 WebSocket creation failed, trying next URL...');
      // Try next URL
      setTimeout(() => this.tryWebSocketUrls(urls, index + 1, requestId, jwtToken), 1000);
    }
  }

  sendMessage(requestId: string, message: string): Observable<any> {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      // Send as native WebSocket message (no STOMP protocol)
      const messageData = {
        type: 'chat-message',
        requestId: requestId,
        message: message,
        timestamp: new Date().toISOString()
      };
      
      console.log('📤 Sending message:', messageData);
      this.webSocket.send(JSON.stringify(messageData));
      
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    } else {
      console.error('❌ WebSocket is not connected. ReadyState:', this.webSocket?.readyState);
      return new Observable(observer => {
        observer.error({ error: 'WebSocket not connected' });
      });
    }
  }

  sendTypingStatus(requestId: string, isTyping: boolean): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const typingData = {
        type: 'typing',
        requestId: requestId,
        isTyping: isTyping
      };
      
      console.log('📤 Sending typing status:', typingData);
      this.webSocket.send(JSON.stringify(typingData));
    } else {
      console.log('⚠️ Cannot send typing status - WebSocket not connected');
    }
  }

  markAsRead(requestId: string): Observable<any> {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      const markReadData = {
        type: 'mark-read',
        requestId: requestId
      };
      
      console.log('📤 Sending mark as read:', markReadData);
      this.webSocket.send(JSON.stringify(markReadData));
    }
    
    // Also call REST API as fallback
    return this.http.post(`${this.apiUrl}/chat/${requestId}/mark-read`, {});
  }

  disconnectFromChat(): void {
    console.log('🔌 Disconnecting from chat...');
    
    if (this.webSocket) {
      console.log('📡 WebSocket state before disconnect:', this.webSocket.readyState);
      
      // Send leave message before closing if connection is open
      if (this.webSocket.readyState === WebSocket.OPEN && this.currentRequestId) {
        const leaveData = {
          type: 'leave',
          requestId: this.currentRequestId
        };
        
        console.log('📤 Sending leave message:', leaveData);
        this.webSocket.send(JSON.stringify(leaveData));
      }
      
      // Close the connection
      if (this.webSocket.readyState === WebSocket.OPEN || this.webSocket.readyState === WebSocket.CONNECTING) {
        this.webSocket.close(1000, 'Normal closure by client');
      }
      
      this.webSocket = null;
    }
    
    this.currentRequestId = null;
    console.log('✅ WebSocket disconnected and cleaned up');
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
        const totalUnread = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
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
