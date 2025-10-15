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

@Injectable({
  providedIn: 'root'
})
export class NotificationWebSocketService {
  private client!: Client;
  private connected$ = new BehaviorSubject<boolean>(false);
  private notifications$ = new BehaviorSubject<NotificationEvent[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private newNotificationSubject = new BehaviorSubject<boolean>(false);
  
  // Флаг, указващ дали имаме пълния списък с нотификации
  private fullNotificationsLoaded = false;

  constructor(private authService: AuthService) {
    this.initializeWebSocketConnection();
  }

  /**
   * Helper метод за правилно декодиране на JWT токен
   * JWT токените използват Base64URL encoding, което е малко различно от стандартния Base64
   */
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
    // Получаваме токен за авторизация и email
    const token = this.authService.getAccessToken();
    let userEmail = '';
    
    if (token) {
      const payload = this.decodeJwtToken(token);
      if (payload) {
        userEmail = payload.sub || payload.email || '';
        console.log('✅ Decoded user email:', userEmail);
      }
    }
    
    // Използваме същия WebSocket URL pattern като chat service
    const wsBaseUrl = environment.apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    // ВАЖНО: Добавяме username като query parameter
    const wsUrl = userEmail ? `${wsBaseUrl}/ws?username=${encodeURIComponent(userEmail)}` : `${wsBaseUrl}/ws`;
    
    console.log('🌐 Initializing WebSocket connection to:', wsUrl);
    console.log('👤 User email for connection:', userEmail);
    
    this.client = new Client({
      brokerURL: wsUrl,
      // Изпращаме токена директно в connectHeaders
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
      
      // ВАЖНО: Първо subscribe-ваме за нотификации, СЛЕД ТОВА изпращаме auth
      // Backend автоматично ще изпрати notifications след успешна auth!
      this.subscribeToNotifications();
      
      // Изпращаме auth message - backend ще отговори с notifications автоматично
      this.sendAuthMessage();
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
    if (!this.client.connected) {
      const token = this.authService.getAccessToken();
      if (!token) {
        return;
      }
      
      this.client.activate();
    } 
  }

  disconnect(): void {
    if (this.client.connected) {
      this.client.deactivate();
    }
  }
  
  private sendAuthMessage(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
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
      console.log('🔑 Sending auth message...');
    }
    
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
      
      const sub1 = this.client.subscribe('/user/topic/notifications', (message: IMessage) => {
        
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
            
            // 🆕 Изчисляваме unread count локално от масива
            const unreadCount = validNotifications.filter(n => !n.isRead).length;
            this.unreadCount$.next(unreadCount);
            
            console.log('✅ Updated notifications list:', validNotifications.length);
            console.log('📊 Initial unread count:', unreadCount);
          } else if (data && data.id) {
            // Единично notification
            console.log('📨 [PARSED] Single notification:', data);
            this.handleNewNotification(data);
          } else {
            console.error('❌ Invalid notification format:', message.body);
          }
        } catch (error) {
          console.error('❌ Error parsing notifications:', error, message.body);
        }
      });
      console.log('✅ Subscribed to /user/topic/notifications, subscription ID:', sub1.id);
      
      console.log('✅ Successfully subscribed to notification channel');
    } catch (error) {
      console.error('❌ Error subscribing to notification channels:', error);
    }
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

    const gain = audioContext.createGain();
    gain.connect(audioContext.destination);

    const delay = audioContext.createDelay();
    delay.delayTime.value = 0.18; 
    const feedback = audioContext.createGain();
    feedback.gain.value = 0.3; 
    delay.connect(feedback);
    feedback.connect(delay);
    gain.connect(delay);
    delay.connect(audioContext.destination);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

    const osc1 = audioContext.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(520, now); 
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = audioContext.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(400, now + 0.12); 
    osc2.connect(gain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);

    console.log("🔔 Soft messenger-style notification with echo played");
  } catch (err) {
    console.error("❌ Error playing notification sound:", err);
  }
}


  /**
   * 🎵 PUBLIC метод за тестване на notification звука
   * Използвай в browser console: 
   * notificationService.testNotificationSound()
   */
  public testNotificationSound(): void {
    console.log('🎵 Testing notification sound...');
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

  refreshNotifications(): void {
    if (this.connected$.value && this.client?.connected) {
      this.sendAuthMessage();
    } else {
      console.warn('⚠️ Cannot refresh notifications - WebSocket not connected');
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