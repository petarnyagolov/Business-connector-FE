import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, ChatMessageDto } from '../../service/chat.service';
import { AuthService } from '../../service/auth.service';
import { Subject, takeUntil, debounceTime } from 'rxjs';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  template: `
    <div class="chat-sidebar" [class.open]="isOpen">
      <div class="chat-header">
        <h3>
          <mat-icon>chat</mat-icon>
          Чатове
        </h3>
        <button mat-icon-button (click)="closeSidebar()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="chat-list" *ngIf="!selectedChat">
        <div *ngIf="chats.length === 0" class="no-chats">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>Няма активни чатове</p>
        </div>
        
        <div 
          *ngFor="let chat of chats" 
          class="chat-item"
          (click)="selectChat(chat)"
          [class.unread]="chat.unreadCount > 0"
        >
          <div class="chat-avatar">
            <mat-icon>business</mat-icon>
          </div>
          <div class="chat-content">
            <div class="chat-title">{{ chat.requestTitle }}</div>
            <div class="chat-subtitle">{{ chat.otherPartyName }}</div>
            <div class="chat-last-message">{{ (chat.lastMessage || '') | slice:0:50 }}{{ (chat.lastMessage || '').length > 50 ? '...' : '' }}</div>
            <div class="chat-time">{{ formatTime(chat.lastMessageTime) }}</div>
          </div>
          <div class="chat-badge" *ngIf="chat.unreadCount > 0">
            <span class="unread-count">{{ chat.unreadCount }}</span>
          </div>
        </div>
      </div>

      <div class="chat-messages-view" *ngIf="selectedChat">
        <div class="chat-messages-header">
          <button mat-icon-button (click)="backToList()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="chat-info">
            <div class="chat-title">{{ selectedChat.requestTitle }}</div>
            <div class="chat-subtitle">{{ selectedChat.otherPartyName }}</div>
          </div>
        </div>

        <div class="messages-container" #messagesContainer>
          <div *ngFor="let message of messages" class="message" [class.own]="isOwnMessage(message)">
            <div class="message-content">
              <div class="message-text">{{ message.message }}</div>
              <div class="message-time">{{ formatTime(message.createdAt) }}</div>
            </div>
          </div>
          
          <!-- Typing индикатор -->
          <div *ngIf="typingUsers.length > 0" class="typing-indicator">
            <div class="typing-content">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="typing-text">{{ getTypingText() }}</div>
            </div>
          </div>
        </div>

        <div class="message-input-container">
          <mat-form-field appearance="outline" class="message-input">
            <input 
              matInput 
              [(ngModel)]="newMessage" 
              placeholder="Напишете съобщение..."
              (keydown.enter)="sendMessage()"
              (input)="onMessageInput()"
            >
          </mat-form-field>
          <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!newMessage.trim()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
    <div class="chat-overlay" *ngIf="isOpen" (click)="closeSidebar()"></div>
  `,
  styles: [`
    .chat-sidebar {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 1000;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .chat-sidebar.open {
      right: 0;
    }

    .chat-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.3);
      z-index: 999;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #1976d2;
      color: white;
    }

    .chat-header h3 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .chat-list {
      flex: 1;
      overflow-y: auto;
    }

    .no-chats {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: #666;
    }

    .no-chats mat-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .chat-item {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .chat-item:hover {
      background-color: #f5f5f5;
    }

    .chat-item.unread {
      background-color: #e3f2fd;
    }

    .chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #1976d2;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      margin-right: 12px;
    }

    .chat-content {
      flex: 1;
    }

    .chat-title {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .chat-subtitle {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .chat-last-message {
      font-size: 13px;
      color: #888;
      margin-bottom: 2px;
    }

    .chat-time {
      font-size: 11px;
      color: #aaa;
    }

    .chat-badge {
      display: flex;
      align-items: center;
    }

    .unread-count {
      background: #f44336;
      color: white;
      border-radius: 50%;
      padding: 2px 6px;
      font-size: 11px;
      min-width: 18px;
      text-align: center;
    }

    .chat-messages-view {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px); /* Отчитаме header-а */
    }

    .chat-messages-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f9f9f9;
      flex-shrink: 0; /* Не се компресира */
    }

    .chat-info {
      margin-left: 8px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 16px; /* Добавяме padding за последните съобщения */
    }

    .message {
      margin-bottom: 16px;
      display: flex;
    }

    .message.own {
      justify-content: flex-end;
    }

    .message-content {
      max-width: 70%;
      background: #e0e0e0;
      padding: 8px 12px;
      border-radius: 12px;
    }

    .message.own .message-content {
      background: #1976d2;
      color: white;
    }

    .message-text {
      word-break: break-word;
    }

    .message-time {
      font-size: 10px;
      opacity: 0.7;
      margin-top: 4px;
    }

    .message-input-container {
      display: flex;
      align-items: center;
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      gap: 8px;
      background: white; /* Добавяме фон */
      flex-shrink: 0; /* Не се компресира */
      position: sticky; /* Правим го sticky */
      bottom: 0; /* Залепяме към дъното */
      z-index: 10; /* Над останалото съдържание */
    }

    .message-input {
      flex: 1;
    }

    .message-input ::ng-deep .mat-mdc-form-field-wrapper {
      padding-bottom: 0 !important;
    }

    .typing-indicator {
      display: flex;
      margin-bottom: 16px;
    }

    .typing-content {
      background: #f0f0f0;
      padding: 8px 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: #999;
      border-radius: 50%;
      animation: typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    .typing-text {
      font-size: 12px;
      color: #666;
    }

    @keyframes typing {
      0%, 60%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      30% {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ChatSidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeEvent = new EventEmitter<void>();

  chats: ChatMessageDto[] = [];
  selectedChat: ChatMessageDto | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  typingUsers: string[] = [];
  isTyping = false;

  private destroy$ = new Subject<void>();
  private typingTimer?: any;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🚀 ChatSidebarComponent ngOnInit called');
    
    // Subscribe за списъка с чатове
    this.chatService.chats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chats => {
        console.log('📨 Received chats:', chats.length);
        this.chats = chats;
      });

    // Subscribe за нови съобщения в реално време
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (this.selectedChat && message.requestId === this.selectedChat.requestId) {
          this.messages.push(message);
          this.scrollToBottom();
          
          // Автоматично маркиране като прочетено
          if (!this.isOwnMessage(message)) {
            this.chatService.markAsRead(this.selectedChat.requestId).subscribe();
          }
        }
      });

    // Subscribe за typing индикатори
    this.chatService.typing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(typing => {
        const currentUserEmail = this.authService.getUserEmail();
        if (typing.userEmail !== currentUserEmail && 
            (!this.selectedChat || typing.requestId === this.selectedChat.requestId)) {
          if (typing.isTyping) {
            if (!this.typingUsers.includes(typing.userEmail)) {
              this.typingUsers.push(typing.userEmail);
            }
          } else {
            this.typingUsers = this.typingUsers.filter(email => email !== typing.userEmail);
          }
        }
      });

    if (this.isOpen) {
      console.log('🔓 Chat sidebar is open, calling refreshChats');
      this.chatService.refreshChats();
    } else {
      console.log('🔒 Chat sidebar is closed, not calling refreshChats');
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatService.disconnectFromChat();
  }

  closeSidebar(): void {
    this.closeEvent.emit();
    this.selectedChat = null;
    this.chatService.disconnectFromChat();
  }

  selectChat(chat: ChatMessageDto): void {
    console.log('🔥 selectChat called with:', chat.requestId);
    this.selectedChat = chat;
    this.loadMessages(chat.requestId);
    
    this.chatService.markAsRead(chat.requestId).subscribe({
      next: () => {
        this.chatService.refreshChats();
      }
    });

    console.log('🔥 About to call connectToChat with:', chat.requestId);
    console.log('🔥 ChatService instance:', this.chatService);
    console.log('🔥 connectToChat method exists:', typeof this.chatService.connectToChat);
    
    this.chatService.connectToChat(chat.requestId);
  }

  backToList(): void {
    this.selectedChat = null;
    this.messages = [];
    this.chatService.disconnectFromChat();
  }

  loadMessages(requestId: string): void {
    this.chatService.getChatMessages(requestId).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedChat) return;

    const message = this.newMessage.trim();
    this.newMessage = '';

    // Спираме typing индикатора
    this.stopTyping();

    this.chatService.sendMessage(this.selectedChat.requestId, message).subscribe({
      next: () => {
        // Съобщението ще се покаже автоматично чрез WebSocket
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.newMessage = message; 
      }
    });
  }

  onMessageInput(): void {
    if (!this.selectedChat) return;

    // Стартираме typing индикатора
    if (!this.isTyping) {
      this.isTyping = true;
      this.chatService.sendTypingStatus(this.selectedChat.requestId, true);
    }

    // Рестартираме таймера за спиране на typing
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      this.stopTyping();
    }, 1000);
  }

  private stopTyping(): void {
    if (this.isTyping && this.selectedChat) {
      this.isTyping = false;
      this.chatService.sendTypingStatus(this.selectedChat.requestId, false);
      clearTimeout(this.typingTimer);
    }
  }

  getTypingText(): string {
    if (this.typingUsers.length === 1) {
      return 'пише...';
    } else if (this.typingUsers.length > 1) {
      return `${this.typingUsers.length} души пишат...`;
    }
    return '';
  }

  isOwnMessage(message: ChatMessage): boolean {
    const currentUserEmail = this.authService.getUserEmail();
    return message.senderEmail === currentUserEmail;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' });
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }
}
