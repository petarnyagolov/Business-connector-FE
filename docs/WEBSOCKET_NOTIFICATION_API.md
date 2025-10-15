# Документация WebSocket API для нотификаций

## Обзор WebSocket эндпоинтов

### URL подключения
WebSocket URL конструируется на основе базового API URL:
```
ws(s)://<API_BASE_URL>/ws
```

### Авторизация
JWT токен передается непосредственно в заголовках при установке соединения:
```
{
  "Authorization": "Bearer <JWT_TOKEN>"
}
```

## Доступные каналы (Destinations)

### Исходящие (Отправка команд серверу)

#### Подключение
```
/app/notifications/connect
```
**Формат сообщения:**
```json
{
  "device": "desktop|mobile"
}
```

#### Получение всех нотификаций
```
/app/notifications/get-all
```
**Формат сообщения:**
```json
{
  "device": "desktop|mobile"
}
```

#### Получение непрочитанных нотификаций
```
/app/notifications/get-unread
```
**Формат сообщения:**
```json
{
  "device": "desktop|mobile"
}
```

#### Получение количества непрочитанных
```
/app/notifications/get-count
```
**Формат сообщения:**
```json
{
  "device": "desktop|mobile"
}
```

#### Маркировка нотификации как прочитанной
```
/app/notifications/mark-read
```
**Формат сообщения:**
```json
{
  "notificationId": 123,
  "device": "desktop|mobile"
}
```

#### Маркировка всех нотификаций как прочитанных
```
/app/notifications/mark-all-read
```
**Формат сообщения:**
```json
{
  "device": "desktop|mobile"
}
```

### Входящие (Получение данных от сервера)

#### Одиночная нотификация
```
/user/queue/notifications
```
**Формат ответа:**
```json
{
  "id": 123,
  "title": "Заголовок нотификации",
  "url": "/path/to/resource",
  "type": "NEW_REQUEST_IN_INDUSTRY",
  "referenceId": "REF-123",
  "createdAt": "2023-06-15T14:30:00Z",
  "isRead": false,
  "device": "desktop"
}
```

#### Список нотификаций
```
/user/queue/notifications-list
```
**Формат ответа:**
```json
[
  {
    "id": 123,
    "title": "Заголовок нотификации",
    "url": "/path/to/resource",
    "type": "NEW_REQUEST_IN_INDUSTRY",
    "referenceId": "REF-123",
    "createdAt": "2023-06-15T14:30:00Z",
    "isRead": false,
    "device": "desktop"
  },
  {...}
]
```

#### Количество непрочитанных нотификаций
```
/user/queue/unread-count
```
**Формат ответа:**
```json
5
```

## Типы нотификаций

| Тип | Описание | Иконка | Цвет |
|-----|----------|--------|------|
| NEW_REQUEST_IN_INDUSTRY | Новая публикация в секторе | business | primary |
| RESPONSE_TO_MY_REQUEST | Ответ на публикацию | reply | accent |
| MY_RESPONSE_CHOSEN | Избрано предложение | star | warn |
| REQUEST_STATUS_CHANGED | Изменение статуса | update | primary |
| COMPANY_CREATED_IN_INDUSTRY | Новая компания в секторе | domain | primary |

## Пример использования WebSocket API

```typescript
// 1. Установить WebSocket соединение с JWT авторизацией
const client = new Client({
  brokerURL: wsUrl,
  connectHeaders: {
    'Authorization': `Bearer ${token}`
  }
});

// 2. Подключиться к каналам
client.onConnect = () => {
  // Получать одиночные нотификации
  client.subscribe('/user/queue/notifications', handleNotification);
  
  // Получать списки нотификаций
  client.subscribe('/user/queue/notifications-list', handleNotificationsList);
  
  // Получать количество непрочитанных
  client.subscribe('/user/queue/unread-count', handleUnreadCount);
  
  // Отправить сообщение о подключении
  client.publish({
    destination: '/app/notifications/connect',
    body: JSON.stringify({ device: 'desktop' })
  });
  
  // Запросить текущие данные
  client.publish({
    destination: '/app/notifications/get-all',
    body: JSON.stringify({ device: 'desktop' })
  });
};

// 3. Активировать соединение
client.activate();
```

## Примечания

- `device` может быть "desktop" или "mobile" и определяется автоматически на клиенте
- Сервер отправляет нотификации на соответствующие каналы в зависимости от типа запроса
- Формат дат - ISO 8601 (например, "2023-06-15T14:30:00Z")
- При маркировке нотификации как прочитанной сервер обновляет счетчик непрочитанных