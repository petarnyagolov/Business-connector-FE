# 🚀 WebSocket Chat - Quick Reference

## 📡 Available Methods

### Subscribe/Unsubscribe
```typescript
// Subscribe to a chat (auto-subscribes on open)
wsService.subscribeToChat(chatId);

// Unsubscribe from active chat (auto on close)
wsService.unsubscribeFromActiveChat();
```

### Send Messages
```typescript
// Send text message
wsService.sendChatMessage(chatId, 'Hello!');

// Send file
wsService.sendChatFile(chatId, fileName, fileType, base64Data, fileSize, 'Optional message');

// Send typing indicator
wsService.sendTypingIndicator(chatId, true);  // Start typing
wsService.sendTypingIndicator(chatId, false); // Stop typing

// Mark as read
wsService.markChatAsRead(chatId);
```

### Observables
```typescript
// Chat list updates
wsService.chatUpdates.subscribe(updates => { ... });

// Active chat messages
wsService.activeChatMessages.subscribe(messages => { ... });

// Typing indicators
wsService.typingIndicators.subscribe(indicators => { ... });

// Errors
wsService.chatErrors.subscribe(error => { ... });

// Connection status
wsService.isConnected$.subscribe(connected => { ... });
```

### Utility Methods
```typescript
// Get active chat ID
const chatId = wsService.getActiveChatId();

// Set initial messages (after HTTP load)
wsService.setActiveChatMessages(messages);

// Clear messages
wsService.clearActiveChatMessages();
```

---

## 🔌 WebSocket Channels

### Backend → Frontend (SUBSCRIBE)
| Channel | Purpose |
|---------|---------|
| `/user/queue/chat-updates` | Chat list, unread counts |
| `/queue/chat/{chatId}` | Messages + typing (dynamic) |
| `/user/queue/errors` | Error messages |
| `/user/queue/auth` | Auth confirmation |

### Frontend → Backend (PUBLISH)
| Destination | Purpose |
|------------|---------|
| `/app/chat/{chatId}/send` | Send text message |
| `/app/chat/{chatId}/send-file` | Send file |
| `/app/chat/{chatId}/typing` | Typing indicator |
| `/app/chat/{chatId}/mark-read` | Mark as read |

---

## 🎯 Common Patterns

### Open Chat
```typescript
// 1. Load history (HTTP)
chatService.loadChatMessages(chatId).subscribe(messages => {
  wsService.setActiveChatMessages(messages);
});

// 2. Subscribe to real-time updates
wsService.subscribeToChat(chatId);

// 3. Listen for new messages
wsService.activeChatMessages.subscribe(messages => {
  this.displayMessages(messages);
});
```

### Close Chat
```typescript
// Unsubscribe and cleanup
wsService.unsubscribeFromActiveChat();
```

### Handle Typing
```typescript
// Send typing on input change
onInputChange() {
  this.wsService.sendTypingIndicator(chatId, true);
  
  clearTimeout(this.typingTimeout);
  this.typingTimeout = setTimeout(() => {
    this.wsService.sendTypingIndicator(chatId, false);
  }, 2000);
}

// Display typing indicator
wsService.typingIndicators.subscribe(indicators => {
  const otherUsers = Array.from(indicators.values())
    .filter(t => t.isTyping && t.userEmail !== currentUserEmail);
  
  this.showTyping = otherUsers.length > 0;
});
```

### Handle Errors
```typescript
wsService.chatErrors.subscribe(error => {
  if (error) {
    this.snackBar.open(error.error, 'Close', { duration: 5000 });
  }
});
```

---

## ⚠️ Important Notes

1. **chatId = requestId** - Те са едно и също
2. **Typing идва в същия канал** - Проверявай за `type: 'TYPING'`
3. **Auto mark-as-read** - Изпраща се автоматично при отваряне (500ms delay)
4. **Dynamic subscriptions** - Subscribe само за активния чат за performance
5. **Spring auto-resolves** - `/user/queue/...` автоматично добавя email-а
6. **Errors auto-clear** - След 5 секунди
7. **Unsubscribe при ngOnDestroy** - Избягвай memory leaks

---

## 🐛 Troubleshooting

### Messages not received?
```typescript
// Check connection
console.log('Connected:', wsService.isConnected$.value);

// Check active chat
console.log('Active chat:', wsService.getActiveChatId());

// Check subscriptions
console.log('Has messages:', wsService.activeChatMessages.value.length);
```

### Typing not working?
```typescript
// Check if other user email is excluded
const currentEmail = authService.getEmail();
const others = indicators.filter(t => t.userEmail !== currentEmail);
console.log('Other users typing:', others);
```

### File upload failed?
```typescript
// Check error channel
wsService.chatErrors.subscribe(error => {
  console.error('Upload error:', error);
});

// Validate size < 10MB
// Validate file type allowed
```

---

## 📚 Full Documentation

See `WEBSOCKET_CHAT_MIGRATION.md` for complete guide.
