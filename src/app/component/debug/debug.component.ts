import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../service/auth.service';
import { NotificationWebSocketService } from '../../service/notification-websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-debug',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  template: `
    <div style="padding: 20px;">
      <h2>🔧 Debug Information</h2>
      
      <mat-card style="margin: 10px 0; padding: 15px;">
        <h3>Environment Configuration</h3>
        <div><strong>API URL:</strong> {{ apiUrl }}</div>
        <div><strong>WebSocket URL:</strong> {{ websocketUrl }}</div>
        <div><strong>Production:</strong> {{ isProduction }}</div>
        <button mat-raised-button color="warn" (click)="forceReconnect()" style="margin-top: 10px;">
          Force Reconnect WebSocket
        </button>
      </mat-card>

      <mat-card style="margin: 10px 0; padding: 15px;">
        <h3>Backend Connection Tests</h3>
        <button mat-raised-button color="primary" (click)="testAuthEndpoint()" [disabled]="testing">
          Test Auth Endpoint
        </button>
        <button mat-raised-button color="accent" (click)="testNotificationsEndpoint()" [disabled]="testing" style="margin-left: 10px;">
          Test Notifications Endpoint
        </button>
        <button mat-raised-button color="warn" (click)="testWebSocket()" [disabled]="testing" style="margin-left: 10px;">
          Test WebSocket
        </button>
        <button mat-raised-button color="warn" (click)="testWebSocketAuth()" [disabled]="testing" style="margin-left: 10px;">
          Test WebSocket (Auth)
        </button>
        
        @if (testing) {
          <div style="margin-top: 10px;">
            <p>Testing... ⏳</p>
          </div>
        }
      </mat-card>
      
      <mat-card style="margin: 10px 0; padding: 15px;">
        <h3>Notification Tests (New Architecture)</h3>
        <button mat-raised-button color="primary" (click)="testNotificationsConnect()" style="margin-right: 10px;">
          Re-authenticate (Refresh Notifications)
        </button>
        <button mat-raised-button color="warn" (click)="forceReconnect()">
          Force Reconnect WebSocket
        </button>
        <button mat-raised-button color="accent" (click)="testNotificationSound()" style="margin-left: 10px;">
          🎵 Test Notification Sound
        </button>
        
        <div style="margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 5px; font-family: monospace;">
          <h4>Debug Info:</h4>
          <div><strong>WS Connected:</strong> {{ wsConnected }}</div>
          <div><strong>Subscription Channel:</strong> /user/queue/notifications</div>
          <div><strong>Notifications (Local):</strong> {{ totalNotifications }}</div>
          <div><strong>Unread (Computed):</strong> {{ unreadCount }}</div>
          <button mat-button color="primary" (click)="refreshDebugInfo()" style="margin-top: 10px;">
            Refresh Debug Info
          </button>
        </div>
      </mat-card>

      <mat-card style="margin: 10px 0; padding: 15px;">
        <h3>Test Results</h3>
        @for (result of testResults; track result.endpoint) {
          <div 
            [style.color]="result.success ? 'green' : 'red'"
            style="margin: 5px 0; font-family: monospace;">
            <strong>{{ result.endpoint }}:</strong> {{ result.message }}
            @if (result.details) {
              <div style="margin-left: 20px; color: #666; font-size: 12px;">
                {{ result.details }}
              </div>
            }
          </div>
        }
      </mat-card>

      <mat-card style="margin: 10px 0; padding: 15px;">
        <h3>Notification System Status</h3>
        <div><strong>WebSocket Connected:</strong> 
          <span [style.color]="wsConnected ? 'green' : 'red'">
            {{ wsConnected ? '✅ Connected' : '❌ Disconnected' }}
          </span>
        </div>
        <div><strong>Subscriptions:</strong> {{ totalSubscriptions }}</div>
        <div><strong>Unread Count:</strong> {{ unreadCount }}</div>
        <div><strong>Total Notifications:</strong> {{ totalNotifications }}</div>
        
        <div style="margin-top: 15px;">
          <button mat-raised-button color="primary" (click)="refreshDebugInfo()" style="margin-right: 10px;">
            Refresh Status
          </button>
          <button mat-raised-button color="warn" (click)="forceReconnect()" style="margin-right: 10px;">
            Force Reconnect
          </button>
          <button mat-raised-button color="accent" (click)="checkSubscriptions()">
            Check Subscriptions
          </button>
        </div>
      </mat-card>
      
      @if (wsConnected) {
        <mat-card style="margin: 10px 0; padding: 15px;">
          <h3>WebSocket Subscriptions</h3>
          <div style="font-family: monospace; background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
            @for (sub of activeSubscriptions; track sub.id) {
              <div style="margin-bottom: 4px;">
                <strong>ID #{{ sub.id }}:</strong> {{ sub.destination }}
              </div>
            }
            @if (activeSubscriptions.length === 0) {
              <div>No active subscriptions found</div>
            }
          </div>
        </mat-card>
      }
    </div>
  `
})
export class DebugComponent implements OnInit, OnDestroy {
  apiUrl = environment.apiUrl;
  websocketUrl = environment.websocketUrl;
  isProduction = environment.production;
  testing = false;
  testResults: any[] = [];
  wsConnected = false;
  unreadCount = 0;
  totalNotifications = 0;
  totalSubscriptions = 0;
  
  activeSubscriptions: { id: string, destination: string }[] = [];
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private notificationWsService: NotificationWebSocketService
  ) {}

  ngOnInit(): void {
    const connectionSub = this.notificationWsService.isConnected$.subscribe((connected: boolean) => {
      this.wsConnected = connected;
      
      if (connected) {
        this.refreshDebugInfo();
      } else {
        this.activeSubscriptions = [];
      }
    });
    
    if (connectionSub) {
      this.subscriptions.push(connectionSub);
    }

    const unreadSub = this.notificationWsService['unreadCount$']?.subscribe((count: number) => {
      this.unreadCount = count;
    });
    
    if (unreadSub) {
      this.subscriptions.push(unreadSub);
    }

    const notificationsSub = this.notificationWsService['notifications$']?.subscribe((notifications: any[]) => {
      this.totalNotifications = notifications?.length || 0;
    });
    
    if (notificationsSub) {
      this.subscriptions.push(notificationsSub);
    }
    
    setTimeout(() => {
      this.refreshDebugInfo();
    }, 1000);
    
    const refreshInterval = setInterval(() => {
      if (this.wsConnected) {
        this.refreshDebugInfo();
      }
    }, 10000); 
    
    this.subscriptions.push({ unsubscribe: () => clearInterval(refreshInterval) } as Subscription);
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => {
      if (sub) {
        sub.unsubscribe();
      }
    });
    this.subscriptions = [];
  }
  
  checkSubscriptions(): void {
    this.refreshDebugInfo();
  }

  async testAuthEndpoint(): Promise<void> {
    this.testing = true;
    try {
      const testCredentials = {
        username: 'test@example.com',
        password: 'testpassword'
      };
      
      const url = `${environment.apiUrl}/auth/login`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCredentials)
      });
      
      const result = await response.text();
      
      this.testResults.push({
        endpoint: 'Auth Login',
        success: response.status !== 500 && response.status !== 404,
        message: `Status: ${response.status} ${response.statusText}`,
        details: response.status === 400 ? 'Expected 400 - endpoint exists but credentials invalid' : result.substring(0, 200)
      });
    } catch (error: any) {
      this.testResults.push({
        endpoint: 'Auth Login',
        success: false,
        message: 'Connection Error',
        details: error.message
      });
    } finally {
      this.testing = false;
    }
  }

  async testNotificationsEndpoint(): Promise<void> {
    this.testing = true;
    try {
      
      const url = `${environment.apiUrl}/notifications/unread`;
      
      const token = this.authService.getAccessToken();
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });
      
      const result = await response.text();
      
      this.testResults.push({
        endpoint: 'Notifications (with auth)',
        success: response.status === 200,
        message: `Status: ${response.status} ${response.statusText}`,
        details: token ? result.substring(0, 200) : 'No auth token available - please login first'
      });
    } catch (error: any) {
      this.testResults.push({
        endpoint: 'Notifications (with auth)',
        success: false,
        message: 'Connection Error',
        details: error.message
      });
    } finally {
      this.testing = false;
    }
  }

  testWebSocket(): void {
    this.testing = true;
    try {
      
      const ws = new WebSocket(environment.websocketUrl);
      
      ws.onopen = () => {
        this.testResults.push({
          endpoint: 'WebSocket',
          success: true,
          message: 'Connection successful',
          details: 'WebSocket opened successfully'
        });
        this.testing = false;
        ws.close();
      };
      
      ws.onerror = (error) => {
        this.testResults.push({
          endpoint: 'WebSocket',
          success: false,
          message: 'Connection failed',
          details: 'WebSocket connection error'
        });
        this.testing = false;
      };
      
      ws.onclose = (event) => {
        if (!this.testResults.some(r => r.endpoint === 'WebSocket')) {
          this.testResults.push({
            endpoint: 'WebSocket',
            success: event.code === 1000,
            message: `Connection closed: ${event.code}`,
            details: event.reason || 'Normal closure'
          });
          this.testing = false;
        }
      };
      
      setTimeout(() => {
        if (this.testing) {
          this.testResults.push({
            endpoint: 'WebSocket',
            success: false,
            message: 'Connection timeout',
            details: 'WebSocket connection timed out after 5 seconds'
          });
          this.testing = false;
          ws.close();
        }
      }, 5000);
      
    } catch (error: any) {
      this.testResults.push({
        endpoint: 'WebSocket',
        success: false,
        message: 'WebSocket Error',
        details: error.message
      });
      this.testing = false;
    }
  }

  testWebSocketAuth(): void {
    
    const token = this.authService.getAccessToken();
    if (!token) {
      this.testResults.push({
        endpoint: 'WebSocket Auth',
        success: false,
        message: 'No auth token',
        details: 'Please login first to test authenticated WebSocket connection'
      });
      return;
    }
    
    if (this.notificationWsService['client']?.connected) {
      console.log('✅ WebSocket already connected via service');
      this.testResults.push({
        endpoint: 'WebSocket Auth',
        success: true,
        message: 'Already connected',
        details: 'WebSocket is connected via NotificationWebSocketService'
      });
      return;
    }
    
    this.notificationWsService.connect();
    
    setTimeout(() => {
      const connected = this.notificationWsService['client']?.connected || false;
      this.testResults.push({
        endpoint: 'WebSocket Auth',
        success: connected,
        message: connected ? 'Connection successful' : 'Connection failed',
        details: connected ? 'WebSocket connected with authentication' : 'WebSocket failed to connect - check console for errors'
      });
      this.refreshNotificationStatus();
    }, 2000);
  }

  refreshNotificationStatus(): void {
    const wsConnected = this.notificationWsService['client']?.connected || false;
  }
  
  testNotificationsConnect(): void {
    
    if (!this.notificationWsService['client']?.connected) {
      this.testResults.push({
        endpoint: 'Re-authenticate',
        success: false,
        message: 'WebSocket not connected',
        details: 'Please connect WebSocket first'
      });
      return;
    }
    
    this.notificationWsService.refreshNotifications();
    
    this.testResults.push({
      endpoint: 'Re-authenticate (New Architecture)',
      success: true,
      message: 'Auth message sent - backend will send List<NotificationEvent>',
      details: 'Check console for notifications from /user/queue/notifications'
    });
  }

  testNotificationSound(): void {
    console.log('🎵 Testing notification sound...');
    this.notificationWsService.testNotificationSound();
    
    this.testResults.push({
      endpoint: 'Notification Sound Test',
      success: true,
      message: 'Sound played! 🔊',
      details: 'Short beep sound (A5 note, 200ms)'
    });
  }
  
  forceReconnect(): void {
    console.log('🔄 Forcing WebSocket reconnection...');
    
    // New service doesn't have forceReconnect - use disconnect/connect instead
    console.log('🔄 Using disconnect/connect pattern');
    this.notificationWsService.disconnect();
    setTimeout(() => {
      this.notificationWsService.connect();
    }, 500);
    
    // Add a test result for UI feedback
    this.testResults.push({
      endpoint: 'Force Reconnect',
      success: true,
      message: 'Reconnection initiated',
      details: 'Check console for connection events'
    });
    
    // Refresh debug info after some time to show new connection status
    setTimeout(() => this.refreshDebugInfo(), 5000);
  }

  refreshDebugInfo(): void {
    console.log('🔄 Refreshing debug information...');
    
    // Get connection status
    this.wsConnected = this.notificationWsService['client']?.connected || false;
    
    // Get active subscriptions - direct access since new service doesn't expose this method
    this.activeSubscriptions = [];
    
    try {
      // @ts-ignore - accessing private property
      const subscriptions = this.notificationWsService['client']?._stompHandler?._subscriptions || {};
      const subsKeys = Object.keys(subscriptions);
      
      // Populate active subscriptions for UI display
      subsKeys.forEach(id => {
        const sub = subscriptions[id];
        if (sub) {
            this.activeSubscriptions.push({
              id,
              destination: sub.destination || 'unknown'
            });
          }
        });
    } catch (err) {
      console.error('❌ Error accessing subscriptions:', err);
    }
    
    // Update count
    this.totalSubscriptions = this.activeSubscriptions.length;
    
    // Map subscriptions by destination for duplicate detection
    const destMap = new Map<string, number>();
    this.activeSubscriptions.forEach(sub => {
      if (sub.destination !== 'unknown') {
        const count = destMap.get(sub.destination) || 0;
        destMap.set(sub.destination, count + 1);
      }
    });
    
    // Log subscription details
    console.log(`🔍 Active subscriptions (${this.totalSubscriptions}):`);
    
    // Display duplicates more prominently
    destMap.forEach((count, destination) => {
      const isDuplicate = count > 1;
      console.log(`  - ${destination}: ${count} subscription(s) ${isDuplicate ? '⚠️ DUPLICATE!' : ''}`);
    });
    
    // Log individual subscriptions for detailed debugging
    console.log(`🔍 Individual subscriptions:`);
    this.activeSubscriptions.forEach(sub => {
      console.log(`  - #${sub.id}: ${sub.destination}`);
    });
    
    // Get notifications and unread count
    this.totalNotifications = this.notificationWsService['notifications$']?.value?.length || 0;
    this.unreadCount = this.notificationWsService['unreadCount$']?.value || 0;
    
    // Log notification details if any exist
    if (this.totalNotifications > 0) {
      const notifications = this.notificationWsService['notifications$']?.value || [];
      console.log(`📊 Notifications sample (${notifications.length} total):`);
      
      // Count read vs unread
      const unreadCount = notifications.filter((n: any) => !n.isRead).length;
      console.log(`📊 Unread: ${unreadCount}/${notifications.length}`);
      
      // Show the most recent notifications
      console.log('📊 Recent notifications:');
      notifications.slice(0, 3).forEach((n: any, i: number) => {
        console.log(`  ${i + 1}. ID: ${n.id}, Title: ${n.title}, Read: ${n.isRead}, Date: ${n.createdAt}`);
      });
    }
    
    console.log('✅ Debug information refreshed');
  }
}
