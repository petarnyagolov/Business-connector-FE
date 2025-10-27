# 💬 WebSocket Chat Migration Guide

## Миграция от HTTP Polling към WebSocket

Този документ описва как чат функционалността е мигрирана от HTTP polling към real-time WebSocket комуникация.

---

## 📋 Обобщение на промените

### ❌ Премахнато (HTTP Polling):
1. ~~`POST /chat/send`~~ → **WebSocket** `/app/chat/{chatId}/send`
2. ~~`POST /chat/{id}/mark-read`~~ → **WebSocket** `/app/chat/{chatId}/mark-read`
3. ~~`setInterval()` polling~~ → **WebSocket** `/user/queue/chat-updates`
4. ~~Typing indicator polling~~ → **WebSocket** `/app/chat/{chatId}/typing`

### ✅ Запазено (HTTP):
1. `GET /chat/user-chats` - **Initial load** при login
2. `GET /chat/{id}/messages` - **Load history** при отваряне на чат
3. `DELETE /chat/{id}` - Изтриване на чат

---

## 🔌 WebSocket Channels

### SUBSCRIBE (Receiving):

#### 1. `/user/queue/chat-updates` - Chat List Updates
```typescript
this.wsService.chatUpdates.subscribe((updates: ChatUpdateDto[]) => {
  console.log('Chat list updated:', updates);
  // Update sidebar with new messages, unread counts, etc.
});
```

**Какво получаваш:**
```typescript
interface ChatUpdateDto {
  chatId: string;              // requestId
  messagePreview: string;      // "Здравейте, имам въпрос..."
  senderName: string;          // "Петър Няголов"
  senderEmail: string;         // "petyr@example.com"
  timestamp: string;           // ISO datetime
  unreadCount: number;         // 3
  updateType: 'NEW_MESSAGE' | 'TYPING' | 'MESSAGE_READ' | 'CHAT_CREATED';
}
```

**Кога се изпраща:**
- При ново съобщение в който и да е чат
- При създаване на нов чат
- При mark as read
- При typing indicator (optional)

---

#### 2. `/queue/chat/{chatId}` - Chat Messages (Dynamic)
```typescript
// Subscribe when opening a chat
this.wsService.subscribeToChat(chatId);

// Listen for messages
this.wsService.activeChatMessages.subscribe((messages: ChatMessageDto[]) => {
  console.log('Chat messages:', messages);
  // Display messages in chat window
});
```

**Какво получаваш:**
```typescript
interface ChatMessageDto {
  id?: number;
  message?: string;             // Text content
  senderName: string;           // "Петър Няголов"
  senderEmail: string;          // "petyr@example.com"
  timestamp: string;            // ISO datetime
  isRead: boolean;              // true/false
  messageType?: 'TEXT' | 'FILE' | 'IMAGE';
  fileName?: string;            // For files
  fileUrl?: string;             // Download URL
  fileType?: string;            // MIME type
  fileSize?: number;            // Bytes
}
```

**ВАЖНО:** Typing indicators също идват тук!
```typescript
{
  type: 'TYPING',
  userId: 123,
  userEmail: 'other@example.com',
  isTyping: true
}
```

---

#### 3. `/queue/chat/{chatId}/typing` - Typing Indicators (Legacy)
```typescript
this.wsService.typingIndicators.subscribe((indicators: Map<string, TypingIndicator>) => {
  indicators.forEach((typing, userEmail) => {
    if (typing.isTyping) {
      console.log(`${userEmail} is typing...`);
    }
  });
});
```

**Note:** Този канал е deprecated. Typing indicators сега идват през `/queue/chat/{chatId}` с `type: 'TYPING'`.

---

#### 4. `/user/queue/errors` - Error Messages
```typescript
this.wsService.chatErrors.subscribe((error: WebSocketError | null) => {
  if (error) {
    console.error('WebSocket error:', error.error);
    // Show toast/snackbar notification
    this.showError(error.error);
  }
});
```

**Примери за грешки:**
```typescript
{ error: "Нямате достъп до този чат" }
{ error: "Грешка при изпращане на съобщението" }
{ error: "Невалидни файлови данни" }
{ error: "Файлът е твърде голям (максимум 10MB)" }
```

---

#### 5. `/user/queue/auth` - Auth Confirmation
```typescript
// Automatically handled by service
// Backend sends: { success: true, message: "Authentication successful" }
```

**Initial data** (notifications + chat updates) се изпращат автоматично след auth.

---

### PUBLISH (Sending):

#### 1. Send Text Message
```typescript
this.wsService.sendChatMessage(chatId, message);
```

**Backend endpoint:** `/app/chat/{chatId}/send`

**Payload:**
```json
{ "message": "Здравейте, имам въпрос..." }
```

---

#### 2. Send File
```typescript
const reader = new FileReader();
reader.onload = (e) => {
  const base64Data = e.target.result.split(',')[1]; // Remove "data:..." prefix
  
  this.wsService.sendChatFile(
    chatId,
    file.name,
    file.type,
    base64Data,
    file.size,
    'Optional text message' // or null
  );
};
reader.readAsDataURL(file);
```

**Backend endpoint:** `/app/chat/{chatId}/send-file`

**Payload:**
```json
{
  "fileName": "document.pdf",
  "fileType": "application/pdf",
  "fileData": "base64EncodedString...",
  "fileSize": 1024000,
  "message": "Ето документа" // optional
}
```

---

#### 3. Send Typing Indicator
```typescript
// Start typing
this.wsService.sendTypingIndicator(chatId, true);

// Stop typing (after 2-3 seconds of inactivity)
this.wsService.sendTypingIndicator(chatId, false);
```

**Backend endpoint:** `/app/chat/{chatId}/typing`

**Payload:**
```json
{ "isTyping": true }
```

---

#### 4. Mark as Read
```typescript
this.wsService.markChatAsRead(chatId);
```

**Backend endpoint:** `/app/chat/{chatId}/mark-read`

**Payload:**
```json
{}
```

**Note:** Автоматично се изпраща при отваряне на чат (500ms delay).

---

## 🎯 Пример за Angular Component

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NotificationWebSocketService, ChatMessageDto, ChatUpdateDto } from './services/notification-websocket.service';
import { ChatServiceNative } from './services/chat-native.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  chatId: string = 'some-request-id';
  messages: ChatMessageDto[] = [];
  inputMessage: string = '';
  isOtherUserTyping: boolean = false;
  
  private typingTimeout: any;

  constructor(
    private wsService: NotificationWebSocketService,
    private chatService: ChatServiceNative
  ) {}

  ngOnInit(): void {
    // 1. Load initial chat messages (HTTP)
    this.chatService.loadChatMessages(this.chatId).subscribe(messages => {
      console.log('Initial messages loaded:', messages.length);
      this.wsService.setActiveChatMessages(messages);
    });
    
    // 2. Subscribe to WebSocket for this chat
    this.wsService.subscribeToChat(this.chatId);
    
    // 3. Listen for new messages
    this.wsService.activeChatMessages
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
        console.log('Messages updated:', messages.length);
      });
    
    // 4. Listen for typing indicators
    this.wsService.typingIndicators
      .pipe(takeUntil(this.destroy$))
      .subscribe(indicators => {
        // Check if other user is typing (exclude yourself)
        const currentUserEmail = this.getCurrentUserEmail();
        this.isOtherUserTyping = Array.from(indicators.values())
          .some(t => t.isTyping && t.userEmail !== currentUserEmail);
      });
    
    // 5. Listen for errors
    this.wsService.chatErrors
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        if (error) {
          alert(error.error);
        }
      });
  }

  sendMessage(): void {
    if (!this.inputMessage.trim()) return;
    
    this.wsService.sendChatMessage(this.chatId, this.inputMessage);
    this.inputMessage = '';
    this.sendTyping(false);
  }

  onInputChange(): void {
    // Send typing=true
    this.sendTyping(true);
    
    // Auto-send typing=false after 2 seconds
    clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.sendTyping(false);
    }, 2000);
  }

  private sendTyping(isTyping: boolean): void {
    this.wsService.sendTypingIndicator(this.chatId, isTyping);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = (e.target!.result as string).split(',')[1];
      
      this.wsService.sendChatFile(
        this.chatId,
        file.name,
        file.type,
        base64Data,
        file.size
      );
    };
    reader.readAsDataURL(file);
  }

  ngOnDestroy(): void {
    // Unsubscribe от чата
    this.wsService.unsubscribeFromActiveChat();
    
    // Cleanup
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private getCurrentUserEmail(): string {
    // Get from auth service
    return 'petyr@example.com';
  }
}
```

---

## 📊 Flow диаграма

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User Login                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. WebSocket Connect + Auth                                │
│    - Send token to /app/auth                                │
│    - Subscribe to /user/queue/chat-updates                  │
│    - Subscribe to /user/queue/errors                        │
│    - Subscribe to /user/queue/auth                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend sends initial data                               │
│    ✅ /user/queue/auth: { success: true }                   │
│    📋 /user/queue/chat-updates: [chat list]                 │
│    🔔 /user/queue/notifications: [notifications]            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User opens chat                                          │
│    - HTTP GET /chat/{id}/messages (load history)            │
│    - WebSocket subscribe to /queue/chat/{chatId}            │
│    - WebSocket send /app/chat/{chatId}/mark-read            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Real-time chat                                           │
│    💬 Send: /app/chat/{chatId}/send                         │
│    📨 Receive: /queue/chat/{chatId}                         │
│    ⌨️  Typing: /app/chat/{chatId}/typing                    │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Benefits

| Metric | HTTP Polling | WebSocket |
|--------|-------------|-----------|
| **Latency** | 0-10 seconds | < 100ms |
| **Requests/hour** | 360+ per user | 1 connection |
| **Server Load** | High (constant polling) | Low (event-driven) |
| **Battery Usage** | High | Low |
| **Real-time** | ❌ No | ✅ Yes |
| **Typing indicators** | ❌ Impossible | ✅ Yes |
| **Scalability** | Poor | Excellent |

---

## 🔒 Security Notes

1. **Authentication**: Token се валидира при всяко WebSocket свързване
2. **Authorization**: Backend проверява `hasAccessToChat()` преди всяка операция
3. **User isolation**: Всеки user получава само своите съобщения
4. **File validation**: Backend валидира file type и size
5. **Error handling**: Грешки се изпращат на `/user/queue/errors`

---

## 🐛 Debugging

### Enable WebSocket debug logging:
```typescript
// В notification-websocket.service.ts constructor
this.client = new Client({
  debug: (str) => {
    console.log('🔌 STOMP Debug:', str);
  }
});
```

### Check connection status:
```typescript
this.wsService.isConnected$.subscribe(connected => {
  console.log('WebSocket connected:', connected);
});
```

### Monitor chat updates:
```typescript
this.wsService.chatUpdates.subscribe(updates => {
  console.log('Chat updates received:', updates);
});
```

---

## 📝 Migration Checklist

- [✅] Add WebSocket interfaces (ChatMessageDto, ChatUpdateDto, etc.)
- [✅] Add chat subjects in NotificationWebSocketService
- [✅] Implement `subscribeToChatUpdates()`
- [✅] Implement `subscribeToChat(chatId)` (dynamic)
- [✅] Implement `unsubscribeFromActiveChat()`
- [✅] Implement `sendChatMessage()`
- [✅] Implement `sendChatFile()`
- [✅] Implement `sendTypingIndicator()`
- [✅] Implement `markChatAsRead()`
- [✅] Call `subscribeToChatUpdates()` in onConnect
- [✅] Update components to use WebSocket instead of HTTP
- [✅] Remove HTTP polling (`setInterval`)
- [✅] Test all chat operations
- [✅] Test typing indicators
- [✅] Test file upload
- [✅] Test error handling
- [✅] Test reconnection logic

---

## 🎉 Result

**Before:** Чатът използваше HTTP polling с refresh на всеки 10 секунди.

**After:** Чатът е real-time с WebSocket - мигновени съобщения, typing indicators, и много по-малко натоварване на сървъра!

---

## 📚 Related Documentation

- `WEBSOCKET_USAGE_GUIDE.md` - Backend WebSocket API guide
- `NOTIFICATION_CONNECTION_DEBUG.md` - WebSocket connection debugging
- `WEBSOCKET_DEBUG_GUIDE.md` - Frontend debugging patterns

---

**Author:** AI Assistant  
**Date:** October 22, 2025  
**Status:** ✅ Complete
