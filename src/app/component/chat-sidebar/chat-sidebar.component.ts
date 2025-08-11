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
import { ChatService, ChatMessage, ChatMessageDto, FileAttachment } from '../../service/chat.service';
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

      <div class="chat-list" *ngIf="!selectedChat">
        <div *ngIf="chats.length === 0" class="no-chats">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>Няма активни чатове</p>
        </div>
        
        <div 
          *ngFor="let chat of chats" 
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
          <div class="chat-badge" *ngIf="!chat.isRead">
            <span class="unread-count">1</span>
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
          </div>
        </div>

        <div class="messages-container" #messagesContainer>
          <div *ngFor="let message of messages" class="message" [class.own]="isOwnMessage(message)">
            <div class="message-content">
              <div class="message-text">{{ message.message }}</div>
              
              <div *ngIf="message.fileAttachments && message.fileAttachments.length > 0" class="message-attachments">
                <div *ngFor="let attachment of message.fileAttachments" class="attachment-item">
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
              </div>
              
              <div class="message-time">{{ formatTime(message.createdAt) }}</div>
            </div>
          </div>
          
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
          <div *ngIf="selectedFiles.length > 0" class="selected-files-preview">
            <div *ngFor="let file of selectedFiles; let i = index" class="file-preview-item">
              <mat-icon class="file-icon">{{ getFileIcon(file.type) }}</mat-icon>
              <div class="file-info">
                <div class="file-name">{{ file.name }}</div>
                <div class="file-size">{{ formatFileSize(file.size) }}</div>
              </div>
              <button mat-icon-button (click)="removeSelectedFile(i)" class="remove-file-btn">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

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
            accept="image/*,.pdf,.doc,.docx,.txt" 
            (change)="onFilesSelected($event)"
            style="display: none;"
          >
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

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('🚀 ChatSidebarComponent ngOnInit called');
    
    this.chatService.chats$
      .pipe(takeUntil(this.destroy$))
      .subscribe(chats => {
        console.log('📨 Received chats:', chats.length);
        this.chats = chats;
      });

    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('🔔 Received new message in sidebar:', message);
        console.log('🔔 Message has fileAttachments:', !!message.fileAttachments, message.fileAttachments?.length || 0);
        
        if (this.selectedChat && message.requestId === this.selectedChat.requestId) {
          this.messages.push(message);
          this.scrollToBottom();
          
          if (!this.isOwnMessage(message)) {
            this.chatService.markAsRead(this.selectedChat.requestId).subscribe();
          }
        }
      });

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
    
    if (!chat.isRead) {
      this.chatService.markAsRead(chat.requestId).subscribe({
        next: () => {
          this.chatService.refreshChats();
        }
      });
    }

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
    if (!this.canSendMessage() || !this.selectedChat) return;

    const message = this.newMessage.trim();
    const filesToSend = [...this.selectedFiles];
    
    this.selectedFiles = [];

    this.stopTyping();

    if (filesToSend.length > 0) {
      this.chatService.sendMessageWithFiles(this.selectedChat.requestId, message, filesToSend).subscribe({
        next: () => {
          console.log('Message with files sent successfully');
          
          const localMessage: ChatMessage = {
            id: Date.now(), 
            requestId: this.selectedChat!.requestId,
            senderEmail: this.authService.getUserEmail() || '',
            senderName: 'You', 
            message: message,
            createdAt: Date.now(),
            isRead: true,
            fileAttachments: [] 
          };
          
          Promise.all(filesToSend.map(file => this.convertFileToBase64(file)))
            .then(fileAttachments => {
              localMessage.fileAttachments = fileAttachments;
              console.log('✅ Added file attachments to local message:', fileAttachments.length);
              
              fileAttachments.forEach(attachment => {
                console.log('📎 File attachment:', {
                  id: attachment.id,
                  fileName: attachment.fileName,
                  hasData: !!attachment.tempFileData
                });
              });
              
              this.chatService.storeTemporaryFiles(this.selectedChat!.requestId, fileAttachments);
            });
          
          this.messages.push(localMessage);
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error sending message with files:', error);
          this.newMessage = message;
          this.selectedFiles = filesToSend;
        }
      });
    } else {
      this.chatService.sendMessage(this.selectedChat.requestId, message).subscribe({
        next: () => {
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error sending message:', error);
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
      date = new Date(Math.floor(dateInput * 1000));
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

  formatTimestamp(timestamp: number): string {
    const date = new Date(Math.floor(timestamp * 1000));
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
      
      const uniqueFiles = newFiles.filter(newFile => 
        !this.selectedFiles.some(existingFile => 
          existingFile.name === newFile.name && existingFile.size === newFile.size
        )
      );
      
      this.selectedFiles.push(...uniqueFiles);
      
      input.value = '';
      
      console.log('Files selected:', this.selectedFiles.length);
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
    console.log('🔽 Downloading file:', attachment.fileName);
    console.log('🔽 Attachment ID:', attachment.id);
    console.log('🔽 Request ID:', requestId);
    
    const fileData = this.chatService.getFileData(attachment.id, requestId);
    
    if (fileData) {
      console.log('✅ File data found, downloading...');
      const link = document.createElement('a');
      link.href = fileData;
      link.download = attachment.fileName;
      link.click();
    } else {
      console.error('❌ File data not found for:', attachment.fileName);
      
      const allFiles = this.chatService.getTemporaryFiles(requestId);
      console.log('🗂️ All files in storage for request:', allFiles);
      console.log('🗂️ Looking for file ID:', attachment.id);
      
      if (attachment.tempFileData) {
        console.log('✅ Found tempFileData in attachment, using it...');
        const link = document.createElement('a');
        link.href = attachment.tempFileData;
        link.download = attachment.fileName;
        link.click();
      } else {
        console.error('❌ No tempFileData in attachment either');
      }
    }
  }

  private async convertFileToBase64(file: File): Promise<FileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: this.chatService.generateFileId(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          tempFileData: reader.result as string
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
