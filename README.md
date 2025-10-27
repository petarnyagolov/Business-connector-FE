# Business-connector-FE
Business platform frontend

## 🏗️ Architecture

### Chat System - Hybrid WebSocket + HTTP

Our chat system uses an optimized **hybrid approach**:

```
┌─────────────────────────────────────────────────┐
│           COMMUNICATION PROTOCOL                │
├─────────────────────┬───────────────────────────┤
│ Feature             │ Protocol                  │
├─────────────────────┼───────────────────────────┤
│ Text messages       │ WebSocket (STOMP) ⚡      │
│ Typing indicators   │ WebSocket (STOMP) ⚡      │
│ Read receipts       │ WebSocket (STOMP) ⚡      │
│ Notifications       │ WebSocket (STOMP) ⚡      │
│ File upload         │ HTTP (Multipart) 📤       │
│ File download       │ HTTP (Stream) 📥          │
└─────────────────────┴───────────────────────────┘
```

**Why hybrid?**
- 🚀 **WebSocket**: Real-time updates, low latency, perfect for messages
- 📦 **HTTP**: Reliable file transfers, no size limits, native browser support
- ⚡ **Best of both**: Fast notifications + robust file handling

### Key Benefits

- ✅ **No file size limits** (WebSocket was limited to ~1MB)
- ✅ **33% less bandwidth** (no base64 encoding)
- ✅ **No connection drops** (large files don't break WebSocket)
- ✅ **Real-time updates** (WebSocket notifications after upload)
- ✅ **Progress tracking** (native browser support)

## 📚 Documentation

- [FILE_UPLOAD_HTTP_BACKEND.md](docs/FILE_UPLOAD_HTTP_BACKEND.md) - Backend implementation guide
- [HYBRID_APPROACH_SUMMARY.md](docs/HYBRID_APPROACH_SUMMARY.md) - Architecture overview
- [WEBSOCKET_IMPLEMENTATION.md](docs/WEBSOCKET_IMPLEMENTATION.md) - WebSocket setup
- [WEBSOCKET_CHAT_MIGRATION.md](docs/WEBSOCKET_CHAT_MIGRATION.md) - Migration history

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test
```

## 🔧 Backend Requirements

The backend must implement:

### File Upload Endpoint
```
POST /api/chat/{requestId}/files
Content-Type: multipart/form-data

Form Data:
- files: MultipartFile[] (one or more files)
- message: String (optional text message)
```

After successful upload, backend must send WebSocket notification:
```
Destination: /topic/chat/{requestId}
Payload: ChatMessageDto (with file metadata)
```

See [FILE_UPLOAD_HTTP_BACKEND.md](docs/FILE_UPLOAD_HTTP_BACKEND.md) for complete implementation.

## 🎯 Technology Stack

- **Angular** - Frontend framework
- **@stomp/stompjs** - WebSocket client (STOMP protocol)
- **SockJS** - WebSocket fallback
- **RxJS** - Reactive programming
- **Angular HttpClient** - HTTP requests

## 📝 Recent Changes

### v1.0 (October 2025)
- ✨ Implemented hybrid HTTP + WebSocket architecture
- 🔧 Changed file uploads from WebSocket to HTTP
- 📚 Added comprehensive documentation
- 🐛 Fixed message persistence, date formatting, read receipts
- 🗑️ Removed base64 encoding for files

See [CHANGELOG.md](CHANGELOG.md) for complete history.

