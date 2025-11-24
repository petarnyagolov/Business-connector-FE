import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './component/header/header.component';
import { FooterComponent } from './component/footer/footer.component';
import { ChatSidebarComponent } from './component/chat-sidebar/chat-sidebar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconButton } from '@angular/material/button';
import { CookieConsentComponent } from './component/cookie-consent/cookie-consent.component';
import { PwaUpdateService } from './service/pwa-update.service';
import { ChatServiceNative as ChatService } from './service/chat-native.service';
import { AuthService } from './service/auth.service';
import { NotificationWebSocketService } from './service/notification-websocket.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  styleUrl: './app.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    FooterComponent,
    ChatSidebarComponent,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatToolbarModule,
    CookieConsentComponent
  ]
})

export class AppComponent implements OnInit, OnDestroy {
  title = 'Business-connector-FE';
  chatSidebarOpen = false;
  unreadCount = 0;
  isAuthenticated = false;
  isOffline = !navigator.onLine;

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService, 
    private authService: AuthService,
    private notificationService: NotificationWebSocketService,
    private pwaUpdateService: PwaUpdateService
  ) {}

  ngOnInit(): void {
    window.addEventListener('online', () => {
      this.isOffline = false;
    });

    window.addEventListener('offline', () => {
      this.isOffline = true;
    });

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

