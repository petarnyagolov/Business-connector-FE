# 🔄 Обновяване на ChatServiceNative за WebSocket

## Стъпки за миграция

### 1. Инжектирай NotificationWebSocketService

```typescript
import { NotificationWebSocketService, ChatUpdateDto } from './notification-websocket.service';

@Injectable({
  providedIn: 'root'
})
export class ChatServiceNative {
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private wsService: NotificationWebSocketService // ✅ NEW
  ) {
    // ...
  }
}
```

### 2. Премахни HTTP Polling

```typescript
// ❌ ИЗТРИЙ ТОЗ КОД:
private startPolling(): void {
  this.stopPolling();
  this.pollingInterval = setInterval(() => {
    this.loadChats();
  }, 10000);
}

// ❌ ИЗТРИЙ:
private stopPolling(): void {
  if (this.pollingInterval) {
    clearInterval(this.pollingInterval);
    this.pollingInterval = null;
  }
}

// ❌ ИЗТРИЙ полето:
private pollingInterval: any;
```

### 3. Subscribe за WebSocket chat updates

```typescript
constructor(
  private http: HttpClient,
  private authService: AuthService,
  private wsService: NotificationWebSocketService
) {
  console.log('🔥 ChatServiceNative constructor called');
  this.apiUrl = environment.apiUrl;

  // ✅ Listen to auth changes
  this.authService.isAuthenticated$.subscribe(isAuth => {
    console.log('🔐 Auth status changed:', isAuth);
    if (isAuth) {
      this.initializeWebSocketChat(); // ✅ NEW
    } else {
      this.chatsSubject.next([]);
      this.selectedChatSubject.next(null);
    }
  });
  
  // ✅ NEW: Subscribe to WebSocket chat updates
  this.wsService.chatUpdates.subscribe(updates => {
    if (updates && updates.length > 0) {
      this.handleChatUpdates(updates);
    }
  });
}

// ✅ NEW: Initialize WebSocket-based chat
private initializeWebSocketChat(): void {
  console.log('💬 Initializing WebSocket chat...');
  
  // Load initial chat list via HTTP (only once)
  this.loadChats();
}

// ✅ NEW: Handle WebSocket chat updates
private handleChatUpdates(updates: ChatUpdateDto[]): void {
  console.log('💬 Handling chat updates:', updates.length);
  
  const chats = this.chatsSubject.value;
  
  updates.forEach(update => {
    const existingChat = chats.find(c => c.id === update.chatId);
    
    if (existingChat) {
      // Update existing chat
      existingChat.lastMessage = update.messagePreview;
      existingChat.lastMessageTime = update.timestamp;
      
      if (update.updateType === 'NEW_MESSAGE') {
        // Increment unread if not selected chat
        const selectedChat = this.selectedChatSubject.value;
        if (!selectedChat || selectedChat.id !== update.chatId) {
          existingChat.unreadCount = (existingChat.unreadCount || 0) + 1;
        }
      } else if (update.updateType === 'MESSAGE_READ') {
        existingChat.unreadCount = 0;
      }
      
      // Move to top of list
      const updatedChats = [
        existingChat,
        ...chats.filter(c => c.id !== update.chatId)
      ];
      this.chatsSubject.next(updatedChats);
      
    } else if (update.updateType === 'CHAT_CREATED') {
      // New chat created, reload full list
      this.loadChats();
    }
  });
}
```

### 4. Обнови sendMessage за да използва WebSocket

```typescript
// ✅ UPDATED: Use WebSocket instead of HTTP
sendMessage(chatId: string, content: string): Observable<any> {
  console.log('💬 Sending message via WebSocket:', chatId);
  
  // Send via WebSocket
  this.wsService.sendChatMessage(chatId, content);
  
  // Return observable for compatibility
  return new Observable(observer => {
    observer.next({ success: true });
    observer.complete();
  });
  
  // ❌ OLD HTTP code (DELETE):
  // return this.http.post(`${this.apiUrl}/chat/send`, { chatId, content });
}
```

### 5. Обнови markAsRead за WebSocket

```typescript
// ✅ UPDATED: Use WebSocket
markAsRead(chatId: string): Observable<any> {
  console.log('✅ Marking as read via WebSocket:', chatId);
  
  this.wsService.markChatAsRead(chatId);
  
  // Update local state
  const chats = this.chatsSubject.value;
  const chat = chats.find(c => c.id === chatId);
  if (chat) {
    chat.unreadCount = 0;
    this.chatsSubject.next([...chats]);
  }
  
  return new Observable(observer => {
    observer.next({ success: true });
    observer.complete();
  });
  
  // ❌ OLD HTTP code (DELETE):
  // return this.http.post(`${this.apiUrl}/chat/${chatId}/mark-read`, {});
}
```

### 6. Добави typing indicator методи

```typescript
// ✅ NEW: Send typing indicator
sendTypingIndicator(chatId: string, isTyping: boolean): void {
  this.wsService.sendTypingIndicator(chatId, isTyping);
}

// ✅ NEW: Get typing status for a chat
getTypingStatus(chatId: string): Observable<boolean> {
  return this.wsService.typingIndicators.pipe(
    map(indicators => {
      const currentUserEmail = this.authService.getEmail(); // Implement this
      return Array.from(indicators.values())
        .some(t => t.isTyping && t.userEmail !== currentUserEmail);
    })
  );
}
```

### 7. Премахни getUnreadCount (optional)

```typescript
// ⚠️ OPTIONAL: Може да се премахне ако count-а идва от WebSocket chat updates

// ❌ DELETE (optional):
// getUnreadCount(): Observable<number> {
//   return this.http.get<number>(`${this.apiUrl}/chat/unread-count`);
// }

// ✅ NEW: Get unread count from local state
getTotalUnreadCount(): number {
  return this.chatsSubject.value
    .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
}
```

### 8. Запази HTTP методи за initial load

```typescript
// ✅ KEEP: Initial load of chat list
loadChats(): Observable<Chat[]> {
  return this.http.get<Chat[]>(`${this.apiUrl}/chat/user-chats`)
    .pipe(
      tap(chats => {
        console.log('📋 Loaded chat list:', chats.length);
        this.chatsSubject.next(chats);
      })
    );
}

// ✅ KEEP: Load chat history
loadChatMessages(chatId: string): Observable<ChatMessage[]> {
  return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${chatId}/messages`)
    .pipe(
      tap(messages => {
        console.log('💬 Loaded chat messages:', messages.length);
      })
    );
}

// ✅ KEEP: Delete chat
deleteChat(chatId: string): Observable<any> {
  return this.http.delete(`${this.apiUrl}/chat/${chatId}`);
}
```

---

## 🎯 Пълен обновен ChatServiceNative

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';
import { NotificationWebSocketService, ChatUpdateDto } from './notification-websocket.service';

export interface Chat {
  id: string;
  requestId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  otherUserName: string;
  otherUserEmail: string;
}

export interface ChatMessage {
  id: number;
  message?: string;
  senderName: string;
  senderEmail: string;
  timestamp: string;
  isRead: boolean;
  messageType?: 'TEXT' | 'FILE' | 'IMAGE';
  fileName?: string;
  fileUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatServiceNative {
  private apiUrl: string = '';
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private selectedChatSubject = new BehaviorSubject<Chat | null>(null);

  chats$ = this.chatsSubject.asObservable();
  selectedChat$ = this.selectedChatSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private wsService: NotificationWebSocketService
  ) {
    console.log('🔥 ChatServiceNative constructor called');
    this.apiUrl = environment.apiUrl;

    // Listen to auth changes
    this.authService.isAuthenticated$.subscribe(isAuth => {
      console.log('🔐 Auth status changed:', isAuth);
      if (isAuth) {
        this.initializeWebSocketChat();
      } else {
        this.chatsSubject.next([]);
        this.selectedChatSubject.next(null);
      }
    });
    
    // Subscribe to WebSocket chat updates
    this.wsService.chatUpdates.subscribe(updates => {
      if (updates && updates.length > 0) {
        this.handleChatUpdates(updates);
      }
    });
  }
  
  private initializeWebSocketChat(): void {
    console.log('💬 Initializing WebSocket chat...');
    this.loadChats().subscribe();
  }
  
  private handleChatUpdates(updates: ChatUpdateDto[]): void {
    console.log('💬 Handling', updates.length, 'chat updates');
    
    const chats = this.chatsSubject.value;
    
    updates.forEach(update => {
      const existingChat = chats.find(c => c.id === update.chatId);
      
      if (existingChat) {
        existingChat.lastMessage = update.messagePreview;
        existingChat.lastMessageTime = update.timestamp;
        
        if (update.updateType === 'NEW_MESSAGE') {
          const selectedChat = this.selectedChatSubject.value;
          if (!selectedChat || selectedChat.id !== update.chatId) {
            existingChat.unreadCount = (existingChat.unreadCount || 0) + 1;
          }
        } else if (update.updateType === 'MESSAGE_READ') {
          existingChat.unreadCount = 0;
        }
        
        const updatedChats = [
          existingChat,
          ...chats.filter(c => c.id !== update.chatId)
        ];
        this.chatsSubject.next(updatedChats);
        
      } else if (update.updateType === 'CHAT_CREATED') {
        this.loadChats().subscribe();
      }
    });
  }

  // HTTP methods (keep for initial load)
  loadChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}/chat/user-chats`)
      .pipe(tap(chats => this.chatsSubject.next(chats)));
  }

  loadChatMessages(chatId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${chatId}/messages`);
  }

  deleteChat(chatId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/${chatId}`);
  }

  // WebSocket methods
  sendMessage(chatId: string, content: string): Observable<any> {
    this.wsService.sendChatMessage(chatId, content);
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  markAsRead(chatId: string): Observable<any> {
    this.wsService.markChatAsRead(chatId);
    
    const chats = this.chatsSubject.value;
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      chat.unreadCount = 0;
      this.chatsSubject.next([...chats]);
    }
    
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  sendTypingIndicator(chatId: string, isTyping: boolean): void {
    this.wsService.sendTypingIndicator(chatId, isTyping);
  }

  getTotalUnreadCount(): number {
    return this.chatsSubject.value
      .reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
  }

  selectChat(chat: Chat | null): void {
    this.selectedChatSubject.next(chat);
  }

  getChats(): Chat[] {
    return this.chatsSubject.value;
  }

  getSelectedChat(): Chat | null {
    return this.selectedChatSubject.value;
  }
}
```

---

## ✅ Migration Checklist

- [ ] Import `NotificationWebSocketService`
- [ ] Inject service в constructor
- [ ] Премахни `startPolling()` и `stopPolling()`
- [ ] Премахни `pollingInterval` property
- [ ] Добави `initializeWebSocketChat()`
- [ ] Добави `handleChatUpdates()`
- [ ] Subscribe за `wsService.chatUpdates`
- [ ] Обнови `sendMessage()` за WebSocket
- [ ] Обнови `markAsRead()` за WebSocket
- [ ] Добави `sendTypingIndicator()`
- [ ] Запази HTTP методи за initial load
- [ ] Тествай нова функционалност

---

## 🎉 Result

След тези промени, `ChatServiceNative` ще използва:
- ✅ WebSocket за real-time messages
- ✅ WebSocket за typing indicators
- ✅ WebSocket за chat list updates
- ✅ HTTP само за initial load (history)

**Performance:** От 360+ requests/час към **1 connection!** 🚀
