import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, takeUntil, debounceTime } from 'rxjs';
import { ChatServiceNative as ChatService, ChatMessage, ChatMessageDto, FileAttachment } from '../../service/chat-native.service';
import { AuthService } from '../../service/auth.service';
import { NotificationService } from '../../service/notification.service';

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
    MatTooltipModule,
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

      @if (!selectedChat) {
        <div class="chat-list">
          @if (chats.length === 0) {
            <div class="no-chats">
              <mat-icon>chat_bubble_outline</mat-icon>
              <p>Няма активни чатове</p>
            </div>
          }
          
          @for (chat of chats; track chat.requestId) {
            <div 
              class="chat-item"
              (click)="selectChat(chat)"
              [class.unread]="!chat.isRead"
            >
              <div class="chat-avatar">
                <mat-icon>business</mat-icon>
              </div>
              <div class="chat-content">
                <div class="chat-title">{{ chat.requestTitle }}</div>
                <div class="chat-last-message">{{ chat.displaySenderName }}: {{ (chat.message || '') | slice:0:45 }}{{ (chat.message || '').length > 45 ? '...' : '' }}</div>
                <div class="chat-time">{{ formatTimestamp(chat.createdAt) }}</div>
              </div>
              @if (!chat.isRead) {
                <div class="chat-badge">
                  <span class="unread-count">1</span>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (selectedChat) {
        <div class="chat-messages-view">
          <div class="chat-messages-header">
            <button mat-icon-button (click)="backToList()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="chat-info">
              <div class="chat-title">{{ selectedChat.requestTitle }}</div>
            </div>
          </div>

          <div class="messages-container" #messagesContainer>
            @for (message of messages; track message.id) {
              <div class="message" [class.own]="isOwnMessage(message)">
                <div class="message-content">
                  <div class="message-text">{{ message.message }}</div>
                  
                  @if (message.fileAttachments && message.fileAttachments.length > 0) {
                    <div class="message-attachments">
                      @for (attachment of message.fileAttachments; track attachment.fileName; let i = $index) {
                        <div class="attachment-item">
                          <mat-icon class="attachment-icon">{{ getFileIcon(attachment.fileType) }}</mat-icon>
                          <div class="attachment-info">
                            <div class="attachment-name">{{ attachment.fileName }}</div>
                            <div class="attachment-size">{{ formatFileSize(attachment.fileSize) }}</div>
                          </div>
                          <button 
                            mat-icon-button 
                            class="download-btn" 
                            (click)="downloadFile(attachment, message.requestId)"
                            matTooltip="Изтегли файл"
                          >
                            <mat-icon>download</mat-icon>
                          </button>
                        </div>
                      }
                    </div>
                  }
                  
                  <div class="message-time">{{ formatTime(message.createdAt) }}</div>
                </div>
              </div>
            }
            
            @if (typingUsers.length > 0) {
              <div class="typing-indicator">
                <div class="typing-content">
                  <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="typing-text">{{ getTypingText() }}</div>
                </div>
              </div>
            }
          </div>

          <div class="message-input-container">
            @if (selectedFiles.length > 0) {
              <div class="selected-files-preview">
                @for (file of selectedFiles; track file.name; let i = $index) {
                  <div class="file-preview-item">
                    <mat-icon class="file-icon">{{ getFileIcon(file.type) }}</mat-icon>
                    <div class="file-info">
                      <div class="file-name">{{ file.name }}</div>
                      <div class="file-size">{{ formatFileSize(file.size) }}</div>
                    </div>
                    <button mat-icon-button (click)="removeSelectedFile(i)" class="remove-file-btn">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                }
              </div>
            }

            <div class="input-row">
              <button mat-icon-button (click)="triggerFileInput()" matTooltip="Прикачи файл">
                <mat-icon>attach_file</mat-icon>
              </button>
              
              <mat-form-field appearance="outline" class="message-input">
                <input 
                  matInput 
                  [(ngModel)]="newMessage" 
                  placeholder="Напишете съобщение..."
                  (keydown.enter)="sendMessage()"
                  (input)="onMessageInput()"
                >
              </mat-form-field>
              
              <button mat-icon-button color="primary" (click)="sendMessage()" [disabled]="!canSendMessage()">
                <mat-icon>send</mat-icon>
              </button>
            </div>

            <input 
              #fileInput 
              type="file" 
              multiple 
              accept=".pdf,.jpeg,.jpg,.png,.doc,.docx,.xls,.xlsx" 
              (change)="onFilesSelected($event)"
              style="display: none;"
            >
          </div>
        </div>
      }
    </div>
    @if (isOpen) {
      <div class="chat-overlay" (click)="closeSidebar()"></div>
    }
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
      height: calc(100vh - 64px); 
    }

    .chat-messages-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f9f9f9;
      flex-shrink: 0; 
    }

    .chat-info {
      margin-left: 8px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 16px; 
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
      border-top: 1px solid #e0e0e0;
      background: white;
      flex-shrink: 0;
      position: sticky;
      bottom: 0;
      z-index: 10;
      flex-direction: column; 
      padding: 0; 
    }

    .input-row {
      display: flex;
      align-items: center;
      padding: 16px;
      gap: 8px;
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

    .message-attachments {
      margin-top: 8px;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 8px;
    }

    .attachment-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      border-radius: 4px;
    }

    .attachment-icon {
      font-size: 16px !important;
      color: #1976d2;
    }

    .attachment-info {
      flex: 1;
    }

    .attachment-name {
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .attachment-size {
      font-size: 11px;
      opacity: 0.8;
    }

    .download-btn {
      width: 24px !important;
      height: 24px !important;
      line-height: 24px !important;
    }

    .download-btn mat-icon {
      font-size: 16px !important;
    }

    .selected-files-preview {
      border-top: 1px solid #e0e0e0;
      padding: 8px 16px;
      background: #fafafa;
      max-height: 120px;
      overflow-y: auto;
    }

    .file-preview-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      margin-bottom: 8px;
      border-bottom: 1px solid #eee;
    }

    .file-preview-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }

    .file-icon {
      font-size: 16px !important;
      color: #1976d2;
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 200px;
    }

    .file-size {
      font-size: 11px;
      color: #666;
    }

    .remove-file-btn {
      width: 20px !important;
      height: 20px !important;
      line-height: 20px !important;
      min-width: 20px !important;
    }

    .remove-file-btn mat-icon {
      font-size: 14px !important;
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ChatSidebarComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Output() closeEvent = new EventEmitter<void>();
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  chats: ChatMessageDto[] = [];
  selectedChat: ChatMessageDto | null = null;
  messages: ChatMessage[] = [];
  newMessage = '';
  typingUsers: string[] = [];
  isTyping = false;
  selectedFiles: File[] = []; 

  private destroy$ = new Subject<void>();
  private typingTimer?: any;
  private messageSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('🚀 ChatSidebarComponent ngOnInit called');
    
    this.chatService.chats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chats => {
        console.log('📨 Received chats:', chats.length);
        this.chats = chats;
        
        if (this.selectedChat) {
          const updatedChat = chats.find(c => c.requestId === this.selectedChat!.requestId);
          if (updatedChat) {
            this.selectedChat = updatedChat;
          }
        }
      });

    this.chatService.typing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(typingMap => {
        const currentUserEmail = this.authService.getUserEmail();
        const wasTyping = this.typingUsers.length > 0;
        this.typingUsers = [];
        
        typingMap.forEach((indicator, chatId) => {
          if (this.selectedChat && chatId === this.selectedChat.requestId) {
            if (indicator.isTyping && indicator.userEmail !== currentUserEmail) {
              if (!this.typingUsers.includes(indicator.userEmail)) {
                this.typingUsers.push(indicator.userEmail);
              }
            }
          }
        });
        
        const isTypingNow = this.typingUsers.length > 0;
        if (wasTyping !== isTypingNow) {
          setTimeout(() => this.scrollToBottom(), 50);
        }
      });

    this.chatService.fileError$
      .pipe(takeUntil(this.destroy$))
      .subscribe((fileError: string | null) => {
        if (fileError) {
          this.notificationService.error(`Грешка при изпращане на файл: ${fileError}`);
        }
      });

    if (this.isOpen) {
      this.chatService.refreshChats();
    } else {
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.messageSubscription?.unsubscribe();
    this.chatService.disconnectFromChat();
  }

  closeSidebar(): void {
    this.closeEvent.emit();
    this.selectedChat = null;
    this.chatService.disconnectFromChat();
  }

  selectChat(chat: ChatMessageDto): void {
    
    this.selectedChat = chat;
    this.loadMessages(chat.requestId);

    this.chatService.connectToChat(chat.requestId).subscribe(() => {
      if (!chat.isRead || chat.unreadCount > 0) {
        chat.unreadCount = 0;
        chat.isRead = true;
        
        this.chatService.markAsRead(chat.requestId).subscribe();
      }
    });
    
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
    
    this.messageSubscription = this.chatService.messages$.subscribe(messagesArray => {
      
      if (messagesArray && messagesArray.length > 0) {
        const transformedMessages = messagesArray
          .filter(msg => msg.id !== undefined)
          .map(msg => {
            const timestamp = msg.timestamp || new Date().toISOString();
            
            const fileAttachments: FileAttachment[] = [];
            if (msg.fileName && msg.messageType && (msg.messageType === 'FILE' || msg.messageType === 'IMAGE')) {
              fileAttachments.push({
                id: msg.id?.toString() || '',
                fileName: msg.fileName,
                fileSize: msg.fileSize || 0,
                fileType: msg.fileType || '',
                fileUrl: msg.fileUrl
              });
            }
            
            return {
              id: msg.id!,
              requestId: chat.requestId,
              senderEmail: msg.senderEmail,
              senderName: msg.senderName,
              message: msg.message,
              createdAt: timestamp,
              isRead: msg.isRead,
              messageType: msg.messageType,
              fileName: msg.fileName,
              fileUrl: msg.fileUrl,
              fileAttachments: fileAttachments.length > 0 ? fileAttachments : undefined
            };
          });
        
        if (this.messages.length === 0) {
          this.messages = transformedMessages;
        } else {
          transformedMessages.forEach(newMsg => {
            const exists = this.messages.some(existingMsg => 
              existingMsg.id === newMsg.id
            );
            
            if (!exists) {
              this.messages.push(newMsg);
            }
          });
        }
        this.messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  backToList(): void {
    this.selectedChat = null;
    this.messages = [];
    this.chatService.disconnectFromChat();
  }

  loadMessages(requestId: string): void {
    this.messages = [];
  }

  sendMessage(): void {
    if (!this.canSendMessage() || !this.selectedChat) return;

    const message = this.newMessage.trim();
    const filesToSend = [...this.selectedFiles];
    this.selectedFiles = [];

    this.stopTyping();

    if (filesToSend.length > 0) {
      this.chatService.sendMessageWithFiles(this.selectedChat.requestId, message, filesToSend).subscribe({
        next: () => {
          this.newMessage = '';
        },
        error: (error) => {
          let errorMessage = 'Грешка при изпращане на файловете';
          
          if (error.status === 413 || error.error?.message?.includes('размер') || error.error?.message?.includes('size')) {
            errorMessage = 'Файловете са твърде големи. Максималният размер е 10MB.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.notificationService.error(errorMessage);
          
          this.selectedFiles = filesToSend;
        }
      });
    } else {
      
      this.chatService.sendMessage(this.selectedChat.requestId, message).subscribe({
        next: () => {
          this.newMessage = '';
        },
        error: (error) => {
          this.newMessage = message;
        }
      });
    }
  }

  onMessageInput(): void {
    if (!this.selectedChat) return;

    if (!this.isTyping) {
      this.isTyping = true;
      this.chatService.sendTypingStatus(this.selectedChat.requestId, true);
    }

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

  formatTime(dateInput: string | number): string {
    let date: Date;
    
    if (typeof dateInput === 'number') {
      if (dateInput < Date.now() / 1000) {
        date = new Date(Math.floor(dateInput * 1000)); 
      } else {
        date = new Date(dateInput); 
      }
    } else {
      date = new Date(dateInput);
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' });
    }
  }

  formatTimestamp(timestamp: number | string | undefined): string {
    if (!timestamp) return '';
    
    let date: Date;
    
    if (typeof timestamp === 'string') {
      if (timestamp.includes('T') || timestamp.includes('-')) {
        date = new Date(timestamp);
      } else {
        const numericValue = parseInt(timestamp, 10);
        if (isNaN(numericValue)) {
          console.error('❌ Invalid timestamp string:', timestamp);
          return '';
        }
        if (numericValue < 10000000000) {
          date = new Date(numericValue * 1000); 
        } else {
          date = new Date(numericValue); 
        }
      }
    } else {
      if (timestamp < 10000000000) {
        date = new Date(timestamp * 1000); 
      } else {
        date = new Date(timestamp); 
      }
    }
    
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return diffInMinutes < 1 ? 'Сега' : `${diffInMinutes} мин`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      const dayOfWeek = date.toLocaleDateString('bg-BG', { weekday: 'short' });
      const time = date.toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' });
      return `${dayOfWeek} ${time}`;
    } else {
      return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: '2-digit' });
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

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const allowedExtensions = ['.pdf', '.jpeg', '.jpg', '.png', '.doc', '.docx', '.xls', '.xlsx'];
      
      let rejectedFiles: string[] = [];
      
      const validFiles = newFiles.filter(file => {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const isValidType = allowedTypes.includes(file.type);
        const isValidExtension = allowedExtensions.includes(fileExtension);
        
        if (!isValidType && !isValidExtension) {
          console.warn(`File ${file.name} is not allowed. Only PDF, JPEG, JPG, PNG, DOC, DOCX, XLS, XLSX files are permitted.`);
          rejectedFiles.push(file.name);
          return false;
        }
        
        return true;
      });
      
      if (rejectedFiles.length > 0) {
        this.notificationService.warning(`Следните файлове не бяха добавени поради неподдържан формат:\n${rejectedFiles.join('\n')}\n\nРазрешени са само PDF, JPEG, JPG, PNG, Word и Excel файлове.`);
      }
      
      const uniqueFiles = validFiles.filter(newFile => 
        !this.selectedFiles.some(existingFile => 
          existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      );
      
      this.selectedFiles.push(...uniqueFiles);
      
      input.value = '';
      
      console.log('Valid files selected:', this.selectedFiles.length);
    }
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  canSendMessage(): boolean {
    return this.newMessage.trim().length > 0 || this.selectedFiles.length > 0;
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) {
      return 'image';
    } else if (fileType === 'application/pdf') {
      return 'picture_as_pdf';
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return 'description';
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return 'table_chart';
    } else if (fileType.includes('text')) {
      return 'text_snippet';
    } else {
      return 'attach_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  downloadFile(attachment: FileAttachment, requestId: string): void {
    const message = this.messages.find(msg => 
      msg.fileAttachments?.some(att => att.id === attachment.id)
    );
    
    if (!message) {
      console.error('Could not find message for attachment:', attachment.fileName);
      return;
    }
    
    this.chatService.downloadFile(attachment, requestId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Error downloading file:', error);
      }
    });
  }

}
