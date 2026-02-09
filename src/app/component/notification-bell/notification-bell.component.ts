import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil, filter } from 'rxjs';

import { NotificationWebSocketService, NotificationEvent } from '../../service/notification-websocket.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <div class="notification-bell">
      <button 
        mat-icon-button 
        [matMenuTriggerFor]="notificationMenu"
        class="notification-button"
        [class.bell-animation]="animating">
        <mat-icon 
          [matBadge]="unreadCount" 
          [matBadgeHidden]="unreadCount === 0"
          matBadgeColor="warn"
          matBadgeSize="small"
          [class.has-notifications]="unreadCount > 0"
          aria-hidden="false"
          [attr.aria-label]="'Непрочетени известия: ' + unreadCount">
          notifications
        </mat-icon>
      </button>
      
      <mat-menu #notificationMenu="matMenu" class="notification-menu">
        <div class="notification-header" (click)="$event.stopPropagation()">
          <h4>Известия</h4>
          <div style="display: flex; align-items: center; gap: 8px;">
            @if (unreadCount > 0) {
              <button 
                mat-button 
                (click)="markAllAsRead()"
                class="mark-all-btn">
                Маркирай всички
              </button>
            }
          </div>
        </div>
        
        <mat-divider></mat-divider>
        
        @if (notifications.length > 0) {
          <div class="notifications-list">
            @for (notification of notifications.slice(0, 5); track notification.id) {
              <button 
                mat-menu-item
                [class.unread]="!notification.isRead"
                (click)="onNotificationClick(notification)"
                class="notification-item">
                
                <div class="notification-content">
                  <div class="notification-icon">
                    <mat-icon [color]="getNotificationColor(notification.type)">
                      {{ getNotificationIcon(notification.type) }}
                    </mat-icon>
                  </div>
                  
                  <div class="notification-text">
                    <p class="notification-title">{{ notification.title }}</p>
                    <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
                  </div>
                  
                  @if (!notification.isRead) {
                    <div class="notification-actions">
                      <button 
                        mat-icon-button 
                        (click)="markAsRead(notification.id, $event)"
                        class="mark-read-btn">
                        <mat-icon>done</mat-icon>
                      </button>
                    </div>
                  }
                </div>
              </button>
            }
          </div>
        }
        
        @if (notifications.length === 0) {
          <div class="empty-state" (click)="$event.stopPropagation()">
            <mat-icon>notifications_none</mat-icon>
            <p>Няма нови известия</p>
          </div>
        }
        
        @if (notifications.length > 0) {
          <mat-divider></mat-divider>
        }
        
        @if (notifications.length > 5) {
          <button 
            mat-menu-item
            (click)="seeAllNotifications()"
            class="see-all-btn">
            <mat-icon>visibility</mat-icon>
            <span>Виж всички известия</span>
          </button>
        }
      </mat-menu>
    </div>
  `,
  styleUrls: ['./notification-bell.component.scss']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: NotificationEvent[] = [];
  unreadCount = 0;
  animating = false;
  userTimezone = '';
  private destroy$ = new Subject<void>();

  constructor(
    private wsService: NotificationWebSocketService,
    private router: Router
  ) {
    // Детектираме timezone-а на потребителя
    this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  ngOnInit(): void {
    
    this.wsService.connect();
    
    this.wsService.notifications
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications: NotificationEvent[]) => {
        
        if (this.notifications.length < notifications.length || 
            (this.unreadCount < this.countUnread(notifications))) {
          this.animateBell();
        }
        
        this.notifications = notifications;
      });
    
    this.wsService.unreadCount
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {

        if (count > this.unreadCount) {
          this.animateBell();
        }
        
        this.unreadCount = count;
      });
      
    this.wsService.newNotificationEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe((shouldAnimate: boolean) => {
        if (shouldAnimate) {
          this.animateBell();
        }
      });
      
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onNotificationClick(notification: NotificationEvent): void {
    
    if (!notification.isRead) {
      this.markAsRead(notification.id);
    }
    
    if (notification.url) {
      this.router.navigate([notification.url]);
    }
  }

  markAsRead(notificationId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    
    this.wsService.markAsRead(notificationId);
  }

  markAllAsRead(): void {
    this.wsService.markAllAsRead();
  }

  seeAllNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'NEW_REQUEST_IN_INDUSTRY': return 'business';
      case 'RESPONSE_TO_MY_REQUEST': return 'reply';
      case 'MY_RESPONSE_CHOSEN': return 'star';
      case 'REQUEST_STATUS_CHANGED': return 'update';
      case 'COMPANY_CREATED_IN_INDUSTRY': return 'domain';
      default: return 'notifications';
    }
  }

  getNotificationColor(type: string): string {
    switch (type) {
      case 'NEW_REQUEST_IN_INDUSTRY': return 'primary';
      case 'RESPONSE_TO_MY_REQUEST': return 'accent';
      case 'MY_RESPONSE_CHOSEN': return 'warn';
      case 'REQUEST_STATUS_CHANGED': return 'primary';
      case 'COMPANY_CREATED_IN_INDUSTRY': return 'primary';
      default: return 'primary';
    }
  }

  formatTime(createdAt: string): string {
    // Backend изпраща локално време без timezone, парсваме директно
    const date = new Date(createdAt);
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Сега';
    if (diffMins < 60) return `${diffMins} мин`;
    if (diffHours < 24) return `${diffHours} час${diffHours !== 1 ? 'а' : ''}`;
    if (diffDays < 30) return `${diffDays} ден${diffDays !== 1 ? 'и' : ''}`;
    
    return date.toLocaleDateString('bg-BG', {
      timeZoneName: 'short'
    });
  }

  getTimezoneInfo(): string {
    const offset = -new Date().getTimezoneOffset() / 60;
    const sign = offset >= 0 ? '+' : '-';
    return `${this.userTimezone} (UTC${sign}${Math.abs(offset)})`;
  }
  
  // Метод за анимиране на камбанката
  animateBell(): void {
    console.log('🔔 Animating notification bell');
    this.animating = true;
    setTimeout(() => {
      this.animating = false;
    }, 2000);
  }
  
  // Метод за броене на непрочетени нотификации
  countUnread(notifications: NotificationEvent[]): number {
    return notifications.filter(n => !n.isRead).length;
  }
}