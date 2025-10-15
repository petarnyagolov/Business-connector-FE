import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';

import { NotificationWebSocketService, NotificationEvent } from '../../service/notification-websocket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterModule
  ],
  template: `
    <div class="notifications-page">
      <div class="notifications-header">
        <h1>
          <mat-icon>notifications</mat-icon>
          Всички Известия
        </h1>
        
        <div class="header-actions">
          <button 
            mat-raised-button
            color="primary"
            *ngIf="unreadCount > 0"
            (click)="markAllAsRead()"
            [disabled]="isLoading">
            <mat-icon>done_all</mat-icon>
            Маркирай всички като прочетени
          </button>
        </div>
      </div>

      <div class="notifications-stats" *ngIf="!isLoading">
        <div class="stat-card">
          <div class="stat-number">{{ allNotifications.length }}</div>
          <div class="stat-label">Общо известия</div>
        </div>
        <div class="stat-card unread">
          <div class="stat-number">{{ unreadCount }}</div>
          <div class="stat-label">Непрочетени</div>
        </div>
      </div>

      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Зареждане на известия...</p>
      </div>

      <div class="notifications-container" *ngIf="!isLoading">
        <div 
          *ngFor="let notification of allNotifications; trackBy: trackByNotificationId"
          class="notification-card"
          [class.unread]="!notification.isRead"
          (click)="onNotificationClick(notification)">
          
          <div class="notification-header">
            <div class="notification-icon">
              <mat-icon [color]="getNotificationColor(notification.type)">
                {{ getNotificationIcon(notification.type) }}
              </mat-icon>
            </div>
            
            <div class="notification-meta">
              <span class="notification-type">{{ getNotificationTypeLabel(notification.type) }}</span>
              <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
            </div>
            
            <div class="notification-actions">
              <button 
                *ngIf="!notification.isRead"
                mat-icon-button
                (click)="markAsRead(notification.id, $event)"
                matTooltip="Маркирай като прочетено">
                <mat-icon>done</mat-icon>
              </button>
              
              <div *ngIf="notification.isRead" class="read-indicator">
                <mat-icon color="primary">check_circle</mat-icon>
              </div>
            </div>
          </div>
          
          <div class="notification-body">
            <h3 class="notification-title">{{ notification.title }}</h3>
            <div class="notification-reference" *ngIf="notification.referenceId">
              <mat-icon>link</mat-icon>
              <span>ID: {{ notification.referenceId }}</span>
            </div>
          </div>
        </div>

        <div class="empty-state" *ngIf="allNotifications.length === 0">
          <mat-icon>notifications_none</mat-icon>
          <h2>Няма известия</h2>
          <p>Все още няма получени известия.</p>
          <button mat-raised-button color="primary" routerLink="/requests">
            <mat-icon>explore</mat-icon>
            Разгледай публикации
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  allNotifications: NotificationEvent[] = [];
  unreadCount = 0;
  isLoading = true;
  private destroy$ = new Subject<void>();

  constructor(
    private wsService: NotificationWebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.wsService.connect();
    
    this.setupVisibilityChangeListener();
    
    setTimeout(() => {
      this.loadAllNotifications();
    }, 500);
    
    this.wsService.notifications
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications: NotificationEvent[]) => {
        console.log('📨 Real-time notifications update:', notifications.length);
        this.allNotifications = notifications;
        this.isLoading = false;
      });
    
    this.wsService.unreadCount
      .pipe(takeUntil(this.destroy$))
      .subscribe((count: number) => {
        console.log('📊 Unread count update:', count);
        this.unreadCount = count;
      });
  }

  private setupVisibilityChangeListener(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.loadAllNotifications();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAllNotifications(): void {
    this.isLoading = true;
    
    setTimeout(() => {
      if (this.isLoading && this.wsService.isFullNotificationsLoaded()) {
        this.isLoading = false;
      } else if (this.isLoading) {
        this.allNotifications = this.wsService.getCurrentNotifications();
        this.unreadCount = this.wsService.getCurrentUnreadCount();
        this.isLoading = false;
      }
    }, 3000);
  }

  trackByNotificationId(index: number, notification: NotificationEvent): number {
    return notification.id;
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

  getNotificationTypeLabel(type: string): string {
    switch (type) {
      case 'NEW_REQUEST_IN_INDUSTRY': return 'Нова публикация в сектора';
      case 'RESPONSE_TO_MY_REQUEST': return 'Отговор на публикация';
      case 'MY_RESPONSE_CHOSEN': return 'Избрано предложение';
      case 'REQUEST_STATUS_CHANGED': return 'Промяна в статуса';
      case 'COMPANY_CREATED_IN_INDUSTRY': return 'Нова компания в сектора';
      default: return 'Известие';
    }
  }

  formatTime(createdAt: string): string {
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}