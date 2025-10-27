import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface NotificationEvent {
  id: number;
  title: string;
  url: string;
  type: 'NEW_REQUEST_IN_INDUSTRY' | 'RESPONSE_TO_MY_REQUEST' | 'MY_RESPONSE_CHOSEN' | 'REQUEST_STATUS_CHANGED' | 'COMPANY_CREATED_IN_INDUSTRY';
  referenceId: string;
  createdAt: string;
  isRead: boolean;
  device?: string;
}

export interface ChatMessageDto {
  id?: number;
  message?: string;
  senderName: string;
  senderEmail: string;
  timestamp: string;
  isRead: boolean;
  messageType?: 'TEXT' | 'FILE' | 'IMAGE';
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
}

export interface ChatUpdateDto {
  chatId: string;
  messagePreview: string;
  senderName: string;
  senderEmail: string;
  timestamp: string;
  unreadCount: number;
  updateType: 'NEW_MESSAGE' | 'TYPING' | 'MESSAGE_READ' | 'CHAT_CREATED';
}

export interface TypingIndicator {
  userId: number;
  userEmail: string;
  isTyping: boolean;
}

export interface WebSocketError {
  error: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {
  private client!: Client;
  private connected$ = new BehaviorSubject<boolean>(false);
  private notifications$ = new BehaviorSubject<NotificationEvent[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private newNotificationSubject = new BehaviorSubject<boolean>(false);
  
  private chatUpdates$ = new BehaviorSubject<ChatUpdateDto[]>([]);
  private activeChatMessages$ = new BehaviorSubject<ChatMessageDto[]>([]);
  private typingIndicators$ = new BehaviorSubject<Map<string, TypingIndicator>>(new Map());
  private chatErrors$ = new BehaviorSubject<WebSocketError | null>(null);
  
  private activeChatId: string | null = null;
  private activeChatSubscription: any = null;
  private typingSubscription: any = null;
  
  private fullNotificationsLoaded = false;
  private authMessageSent = false;

  constructor(private authService: AuthService) {
    this.initializeWebSocketConnection();
    
    setTimeout(() => {
      if (this.authService.getAccessToken()) {
        console.log('🚀 Auto-connecting WebSocket after initialization...');
        this.connect();
      }
    }, 100);
  }

  private decodeJwtToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('❌ Error decoding JWT token:', e);
      return null;
    }
  }

  private initializeWebSocketConnection(): void {
    const token = this.authService.getAccessToken();
    let userEmail = '';
    
    if (token) {
      const payload = this.decodeJwtToken(token);
      if (payload) {
        userEmail = payload.sub || payload.email || '';
        console.log('✅ Decoded user email:', userEmail);
      }
    }
    
    const wsBaseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const wsUrl = userEmail ? `${wsBaseUrl}/ws?username=${encodeURIComponent(userEmail)}` : `${wsBaseUrl}/ws`;
    
    console.log('🌐 Initializing WebSocket connection to:', wsUrl);
    console.log('👤 User email for connection:', userEmail);
    
    this.client = new Client({
      brokerURL: wsUrl,
      connectHeaders: token ? {
        'Authorization': `Bearer ${token}`
      } : {},
      debug: (str) => {
        console.log('🔌 STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = (frame) => {
      console.log('✅ Connected to WebSocket:', frame);
      this.connected$.next(true);
      this.authMessageSent = false;
      
      this.subscribeToNotifications();
      
      this.subscribeToChatUpdates();
      
      setTimeout(() => {
        this.sendAuthMessage();
        this.authMessageSent = true;
        
        setTimeout(() => {
          if (!this.fullNotificationsLoaded) {
            console.log('⚠️ No notifications received yet, retrying auth...');
            this.sendAuthMessage();
          }
        }, 3000);
      }, 200);
    };

    this.client.onDisconnect = () => {
      console.log('❌ Disconnected from WebSocket');
      this.connected$.next(false);
    };

    this.client.onStompError = (frame) => {
    };

    this.client.onWebSocketError = (event) => {
    };
  }

  connect(): void {
    if (!this.client) {
      console.error('❌ WebSocket client not initialized');
      return;
    }
    
    if (this.client.connected) {
      console.log('ℹ️ WebSocket already connected, skipping...');
      return;
    }
    
    if (this.client.active) {
      console.log('ℹ️ WebSocket connection already in progress, skipping...');
      return;
    }
    
    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('❌ Cannot connect - no authentication token available');
      return;
    }
    
    console.log('🔌 Activating WebSocket connection...');
    this.client.activate();
  }

  disconnect(): void {
    if (this.client.connected) {
      this.client.deactivate();
    }
  }
  
  private sendAuthMessage(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      console.error('❌ Cannot send auth message - no token available');
      return;
    }
    
    if (!this.client || !this.client.connected) {
      console.error('❌ Cannot send auth message - WebSocket not connected');
      return;
    }
    
    let userEmail = '';
    try {
      const payload = this.decodeJwtToken(token);
      if (payload) {
        userEmail = payload.sub || payload.email || '';
      }
    } catch (e) {
      console.error('❌ Error in sendAuthMessage:', e);
    }
    
    console.log('🔑 Sending auth message with user:', userEmail);
    
    this.client.publish({
      destination: '/app/auth',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        token: token,
        email: userEmail  
      })
    });
  }
  
  private subscribeToNotifications(): void {
    
    try {
      
      const sub1 = this.client.subscribe('/user/queue/notifications', (message: IMessage) => {
        
        try {
          const data = JSON.parse(message.body);
          
          if (Array.isArray(data)) {
            console.log('📑 [PARSED] Initial notifications list:', data.length, 'items');
            
            const validNotifications = data.filter(n => n && n.id);
            validNotifications.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            
            this.notifications$.next(validNotifications);
            this.fullNotificationsLoaded = true;
            
            const unreadCount = validNotifications.filter(n => !n.isRead).length;
            this.unreadCount$.next(unreadCount);
          } else if (data && data.id) {
            this.handleNewNotification(data);
          } else {
            console.error('❌ Invalid notification format:', message.body);
          }
        } catch (error) {
          console.error('❌ Error parsing notifications:', error, message.body);
        }
      });
    } catch (error) {
      console.error('❌ Error subscribing to notification channels:', error);
    }
  }
  
  private subscribeToChatUpdates(): void {
    
    try {
      this.client.subscribe('/user/queue/chat-updates', (message: IMessage) => {
        
        try {
          const updates: ChatUpdateDto[] = JSON.parse(message.body);
          
          this.chatUpdates$.next(updates);
          
        } catch (error) {
          console.error('❌ Error parsing chat updates:', error);
        }
      });
      
      this.client.subscribe('/user/queue/auth', (message: IMessage) => {
        
        try {
          const response = JSON.parse(message.body);
        } catch (error) {
        }
      });
      
      this.client.subscribe('/user/queue/errors', (message: IMessage) => {
        
        try {
          const error: WebSocketError = JSON.parse(message.body);
          
          this.chatErrors$.next(error);
          setTimeout(() => {
            if (this.chatErrors$.value?.error === error.error) {
              this.chatErrors$.next(null);
            }
          }, 5000);
          
        } catch (err) {
        }
      });
      
      
    } catch (error) {
    }
  }
  
  subscribeToChat(chatId: string): void {
    console.log('💬 Subscribing to chat:', chatId);
    
    this.unsubscribeFromActiveChat();
    
    this.activeChatId = chatId;
    
    try {
      this.activeChatSubscription = this.client.subscribe(`/queue/chat/${chatId}`, (message: IMessage) => {
        
        try {
          const data = JSON.parse(message.body);
          
          if (data.type === 'TYPING') {
            this.handleTypingIndicator(chatId, data);
          } else {
            const chatMessage: ChatMessageDto = {
              ...data,
              timestamp: data.timestamp || data.createdAt || new Date().toISOString()
            };
            
            const currentMessages = this.activeChatMessages$.value;
            const updatedMessages = [...currentMessages, chatMessage];
            this.activeChatMessages$.next(updatedMessages);
            
            this.playNotificationSound();
          }
          
        } catch (error) {
        }
      });
      
      this.typingSubscription = this.client.subscribe(`/queue/chat/${chatId}/typing`, (message: IMessage) => {
        
        try {
          const typing: TypingIndicator = JSON.parse(message.body);
          this.handleTypingIndicator(chatId, typing);
        } catch (error) {
        }
      });
      
      setTimeout(() => {
        this.markChatAsRead(chatId);
      }, 500);
      
    } catch (error) {
    }
  }
  
  unsubscribeFromActiveChat(): void {
    if (this.activeChatSubscription) {
      this.activeChatSubscription.unsubscribe();
      this.activeChatSubscription = null;
    }
    
    if (this.typingSubscription) {
      this.typingSubscription.unsubscribe();
      this.typingSubscription = null;
    }
    
    this.activeChatId = null;
    this.activeChatMessages$.next([]);
    this.typingIndicators$.next(new Map());
  }
  
  private handleTypingIndicator(chatId: string, typing: TypingIndicator): void {
    const indicators = this.typingIndicators$.value;
    
    if (typing.isTyping) {
      indicators.set(typing.userEmail, typing);
    } else {
      indicators.delete(typing.userEmail);
    }
    
    this.typingIndicators$.next(new Map(indicators));
  }

  private handleNewNotification(notification: NotificationEvent): void {
    console.log('🔔 Handling new notification:', notification);
    
    const currentNotifications = this.notifications$.value;
    const isDuplicate = currentNotifications.some(n => n.id === notification.id);
    
    if (isDuplicate) {
      console.log('🔄 Duplicate notification detected, skipping...');
      return;
    }
    
    const updatedNotifications = [notification, ...currentNotifications];
    this.notifications$.next(updatedNotifications);
    
    const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
    this.unreadCount$.next(unreadCount);
    
    this.playNotificationSound();
    this.notifyNewNotification();
  }
  
  private playNotificationSound(): void {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    const masterGain = audioContext.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(audioContext.destination);

    const createPianoTone = (
      freq: number,
      startTime: number,
      duration: number,
      fadeOutTime: number
    ) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);

      osc.connect(gain);
      gain.connect(masterGain);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.03); 
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + fadeOutTime);

      osc.start(startTime);
      osc.stop(startTime + duration + fadeOutTime + 0.1);
    };

    createPianoTone(660, now, 0.15, 0.3); 
    createPianoTone(440, now + 0.12, 0.3, 1.0); 
  } catch (err) {
  }
}

  public testNotificationSound(): void {
    this.playNotificationSound();
  }
  
  private notificationEventSubject = new BehaviorSubject<boolean>(false);
  
  private notifyNewNotification(): void {
    this.notificationEventSubject.next(false);
    
    setTimeout(() => {
      this.notificationEventSubject.next(true);
      
      setTimeout(() => {
        this.notificationEventSubject.next(false);
        console.log('✅ Notification animation completed');
      }, 3000);
    }, 50);
  }
  
  get newNotificationEvent(): Observable<boolean> {
    return this.notificationEventSubject.asObservable();
  }

  public isDocumentVisible(): boolean {
    return !document.hidden;
  }
  
  reestablishConnection(): void {
    if (this.client) {
      this.disconnect();
      setTimeout(() => {
        this.connect();
      }, 500);
    } else {
      this.initializeWebSocketConnection();
      this.connect();
    }
  }

  markAsRead(notificationId: number): void {
    const device = this.getDeviceType();
    this.client.publish({
      destination: '/app/notifications/mark-read',
      body: JSON.stringify({ notificationId, device })
    });

    const notifications = this.notifications$.value;
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.notifications$.next([...notifications]);
      
      const unreadCount = notifications.filter(n => !n.isRead).length;
      this.unreadCount$.next(unreadCount);
    }
  }

  markAllAsRead(): void {
    const device = this.getDeviceType();
    console.log('✅ Marking all notifications as read for device:', device);
    
    this.client.publish({
      destination: '/app/notifications/mark-all-read',
      body: JSON.stringify({ device })
    });

    const notifications = this.notifications$.value;
    notifications.forEach(n => n.isRead = true);
    this.notifications$.next([...notifications]);
    
    this.unreadCount$.next(0);
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    if (isPWA || isMobile) {
      return 'mobile';
    }
    return 'desktop';
  }

  get isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  get notifications(): Observable<NotificationEvent[]> {
    return this.notifications$.asObservable();
  }

  get unreadCount(): Observable<number> {
    return this.unreadCount$.asObservable();
  }

  get chatUpdates(): Observable<ChatUpdateDto[]> {
    return this.chatUpdates$.asObservable();
  }
  
  get activeChatMessages(): Observable<ChatMessageDto[]> {
    return this.activeChatMessages$.asObservable();
  }
  
  get typingIndicators(): Observable<Map<string, TypingIndicator>> {
    return this.typingIndicators$.asObservable();
  }
  
  get chatErrors(): Observable<WebSocketError | null> {
    return this.chatErrors$.asObservable();
  }
  
  getActiveChatId(): string | null {
    return this.activeChatId;
  }
  
  sendChatMessage(chatId: string, message: string): void {
    if (!this.client?.connected) {
      console.error('❌ Cannot send message - WebSocket not connected');
      return;
    }
    
    if (!message || message.trim().length === 0) {
      console.warn('⚠️ Cannot send empty message');
      return;
    }
    
    console.log('💬 Sending message to chat:', chatId);
    
    this.client.publish({
      destination: `/app/chat/${chatId}/send`,
      body: JSON.stringify({ message: message.trim() })
    });
  }
  
  sendChatFile(chatId: string, fileName: string, fileType: string, fileData: string, fileSize: number, message?: string): void {
    if (!this.client?.connected) {
      return;
    }
    
    this.client.publish({
      destination: `/app/chat/${chatId}/send-file`,
      body: JSON.stringify({
        fileName,
        fileType,
        fileData,
        fileSize,
        message: message || null
      })
    });
  }
  
  sendTypingIndicator(chatId: string, isTyping: boolean): void {
    if (!this.client?.connected) {
      return;
    }
    
    this.client.publish({
      destination: `/app/chat/${chatId}/typing`,
      body: JSON.stringify({ isTyping })
    });
  }
  
  markChatAsRead(chatId: string): void {
    if (!this.client?.connected) {
      return;
    }
    
    this.client.publish({
      destination: `/app/chat/${chatId}/mark-read`,
      body: JSON.stringify({})
    });
  }
  
  setActiveChatMessages(messages: ChatMessageDto[]): void {
    this.activeChatMessages$.next(messages);
  }
  
  clearActiveChatMessages(): void {
    this.activeChatMessages$.next([]);
  }

  refreshNotifications(): void {
    if (this.connected$.value && this.client?.connected) {
      console.log('🔄 Refreshing notifications...');
      this.fullNotificationsLoaded = false;
      this.sendAuthMessage();
    } else {
      console.warn('⚠️ Cannot refresh notifications - WebSocket not connected');
      if (!this.client?.connected) {
        console.log('🔌 Attempting to reconnect...');
        this.connect();
      }
    }
  }

  getCurrentNotifications(): NotificationEvent[] {
    return this.notifications$.value;
  }

  getCurrentUnreadCount(): number {
    return this.unreadCount$.value;
  }
  
  isFullNotificationsLoaded(): boolean {
    return this.fullNotificationsLoaded;
  }
}