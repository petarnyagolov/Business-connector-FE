import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './component/header/header.component';
import { ChatSidebarComponent } from './component/chat-sidebar/chat-sidebar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { ChatServiceNative as ChatService } from './service/chat-native.service';
import { AuthService } from './service/auth.service';
import { NotificationWebSocketService } from './service/notification-websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [CommonModule, RouterModule, HeaderComponent, ChatSidebarComponent, MatButtonModule, MatIconModule, MatBadgeModule]
})

export class AppComponent implements OnInit, OnDestroy {
  title = 'Business-connector-FE';
  chatSidebarOpen = false;
  unreadCount = 0;
  isAuthenticated = false;

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService, 
    private authService: AuthService,
    private notificationService: NotificationWebSocketService
  ) {}

  ngOnInit(): void {
    this.authService.authStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isAuthenticated = status;
        
        if (status) {
          this.notificationService.connect();
        } else {
          this.notificationService.disconnect();
        }
      });

    this.chatService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleChatSidebar(): void {
    this.chatSidebarOpen = !this.chatSidebarOpen;
    if (this.chatSidebarOpen) {
      this.chatService.refreshChats();
    }
  }

  closeChatSidebar(): void {
    this.chatSidebarOpen = false;
  }
}

