# WebSocket Implementation Documentation

## Преглед

Чат системата във Business-connector-FE използва STOMP over WebSocket за real-time комуникация, базирана на документацията от backend-a.

## Архитектура

### ChatService - WebSocket управление

**Основни компоненти:**
- `STOMP Client` - за WebSocket връзката
- `SockJS` - за fallback съвместимост
- `BehaviorSubject` streams за reactive data

**Основни методи:**
```typescript
// Свързване към чат
connectToChat(requestId: string): void

// Изпращане на съобщение чрез WebSocket
sendMessage(requestId: string, message: string): Observable<any>

// Изпращане на typing статус
sendTypingStatus(requestId: string, isTyping: boolean): void

// Маркиране като прочетено
markAsRead(requestId: string): Observable<any>

// Прекъсване на връзката
disconnectFromChat(): void
```

**Reactive streams:**
```typescript
// Нови съобщения в реално време
messages$: Subject<ChatMessage>

// Typing индикатори
typing$: Subject<{ userEmail: string; isTyping: boolean }>

// Списък с чатове
chats$: BehaviorSubject<ChatMessageDto[]>

// Общ брой непрочетени
unreadCount$: BehaviorSubject<number>
```

### WebSocket Endpoints

**Свързване:**
```javascript
const socket = new SockJS(`http://localhost:8081/ws?token=${jwtToken}`);
const stompClient = new Client({ webSocketFactory: () => socket });
```

**Subscribe destinations:**
- `/topic/chat/{requestId}` - нови съобщения
- `/topic/chat/{requestId}/typing` - typing индикатори  
- `/topic/chat/{requestId}/read` - read статус
- `/user/queue/errors` - лични грешки

**Publish destinations:**
- `/app/chat/{requestId}/send` - изпращане на съобщение
- `/app/chat/{requestId}/typing` - typing статус
- `/app/chat/{requestId}/mark-read` - маркиране като прочетено

### ChatSidebarComponent - UI компонент

**Нови функционалности:**
- Real-time получаване на съобщения
- Typing индикатори с анимация
- Автоматично маркиране като прочетено
- Fallback към REST API при проблеми

**Нови properties:**
```typescript
typingUsers: string[] = [];      // Списък с потребители които пишат
isTyping: boolean = false;       // Дали текущият потребител пише
typingTimer?: any;               // Timer за typing индикатора
```

**Event handlers:**
```typescript
onMessageInput(): void          // При писане в input полето
private stopTyping(): void      // Спиране на typing индикатора
getTypingText(): string        // Текст за typing индикатора
```

## Поток на данни

### Инициализация
1. ChatService се инициализира при стартиране на приложението
2. Subscribe за authStatus$ - при login зарежда чатове
3. Експозира reactive streams за components

### Отваряне на чат
1. ChatSidebarComponent извиква `selectChat()`
2. Зарежда съобщения чрез REST API
3. Извиква `chatService.connectToChat(requestId)`
4. ChatService създава STOMP връзка и subscribe за topics
5. Subscribe за нови съобщения, typing и read статус

### Изпращане на съобщение
1. Потребителят въвежда съобщение и натиска Enter/Send
2. Извиква се `sendMessage()` в ChatService
3. Ако WebSocket е свързан - изпраща чрез STOMP
4. Ако не е свързан - fallback към REST API
5. Backend broadcasting новото съобщение на всички subscribers
6. ChatService получава съобщението чрез `/topic/chat/{requestId}`
7. Добавя се към messages масива и се скролва надолу

### Typing индикатори
1. При въвеждане в input полето се извиква `onMessageInput()`
2. Изпраща се typing статус чрез WebSocket
3. Стартира се timer за спиране след 1 секунда
4. Другите потребители получават typing статус
5. Показва се анимиран индикатор

### Затваряне на чат
1. При затваряне на sidebar или смяна на чат
2. Извиква се `disconnectFromChat()`
3. STOMP клиентът се deactivate
4. Изчистват се локалните състояния

## Fallback стратегия

При проблеми с WebSocket:
1. `sendMessage()` автоматично използва REST API
2. Получаването на съобщения продължава чрез REST API polling
3. Typing индикаторите се деактивират
4. Read статусът се обработва чрез REST API

## Грешки и debugging

**Console съобщения:**
- `STOMP Connected:` - успешна връзка
- `Received message:` - ново съобщение
- `STOMP error:` - проблеми с връзката
- `WebSocket error:` - networking проблеми

**Честі проблеми:**
1. **401 Unauthorized** - изтекъл или невалиден JWT token
2. **403 Forbidden** - няма достъп до чата
3. **Connection failed** - backend не е достъпен
4. **STOMP errors** - неправилна STOMP конфигурация

## Тестване

**Unit tests:**
- ChatService WebSocket методи
- ChatSidebarComponent typing функционалност
- Reactive streams behavior

**Integration tests:**
- End-to-end чат функционалност
- Fallback механизми
- Error handling

**Manual testing:**
1. Отвори два browser-a с различни потребители
2. Създай чат между тях
3. Тестване на real-time съобщения
4. Тестване на typing индикатори
5. Тестване при прекъсване на връзката

## Performance оптимизации

1. **Lazy connection** - WebSocket се свързва само при отваряне на чат
2. **Automatic cleanup** - връзката се прекъсва при затваряне
3. **Debounced typing** - typing индикаторите с 1 секунда debounce
4. **Unsubscribe pattern** - правилно изчистване на RxJS subscriptions

## Сигурност

1. **JWT токен** в WebSocket URL за автентикация
2. **Backend валидация** на достъпа до всеки чат
3. **XSS защита** - escaping на съобщенията
4. **Rate limiting** - backend ограничава честотата на съобщенията

## Бъдещи подобрения

1. **File uploads** - споделяне на файлове
2. **Message reactions** - emoji реакции
3. **Message editing** - редактиране на изпратени съобщения
4. **Push notifications** - уведомления при нови съобщения
5. **Chat search** - търсене в историята на съобщенията
