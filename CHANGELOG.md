# Changelog

All notable changes to Business Connector Frontend will be documented in this file.

## [Unreleased] - 2025-10-24

### 🚀 Added - Hybrid HTTP + WebSocket Architecture

#### File Upload via HTTP (Breaking Change from WebSocket)
- **Changed**: File uploads now use HTTP multipart/form-data instead of WebSocket
  - Eliminates 33% base64 encoding overhead
  - Prevents WebSocket disconnections with large files (>1MB)
  - Supports files up to backend limit (10MB+)
  - Native browser progress tracking support
  
- **Added**: `sendMessageWithFiles()` HTTP implementation in `chat-native.service.ts`
  - Uses Angular HttpClient with FormData
  - Automatic error handling with user-friendly messages
  - Maintains WebSocket for real-time notifications after upload
  
- **Added**: Comprehensive documentation:
  - `docs/FILE_UPLOAD_HTTP_BACKEND.md` - Backend implementation guide
  - `docs/HYBRID_APPROACH_SUMMARY.md` - Architecture overview
  
#### Frontend Changes
- **Modified**: `chat-native.service.ts`
  - Removed base64 encoding logic
  - Removed WebSocket file sending via STOMP
  - Added HTTP POST to `/api/chat/{requestId}/files`
  - Added `throwError` and `catchError` RxJS imports
  
- **Improved**: Error handling
  - File upload errors now show in console with context
  - `fileError$` BehaviorSubject for UI error display
  
#### Architecture Benefits
- ✅ **Reliability**: No more WebSocket connection drops
- ✅ **Performance**: 33% less data transmitted (no base64)
- ✅ **Scalability**: Backend can use streaming/chunking
- ✅ **User Experience**: Progress tracking (future enhancement)
- ✅ **Real-time**: WebSocket still used for instant notifications

### 🔧 Technical Details

**Before (WebSocket):**
```
File (1.6MB) → Base64 (2.1MB) → WebSocket SEND → ❌ Connection drops
```

**After (HTTP + WebSocket):**
```
File (1.6MB) → HTTP POST → Backend saves → WebSocket notification (200 bytes) → ✅ Success
```

### 📋 Backend Requirements

Backend must implement:
```java
@PostMapping("/api/chat/{requestId}/files")
- Accept multipart/form-data with "files" parameter
- Optional "message" text parameter
- Save files to storage (S3/filesystem)
- Send WebSocket notification to /topic/chat/{requestId}
- Send chat update to /user/{email}/queue/chat-updates
```

See `docs/FILE_UPLOAD_HTTP_BACKEND.md` for complete implementation guide.

### 🐛 Fixes from Previous WebSocket Migration

- ✅ Fixed old messages disappearing when new ones arrive (append logic)
- ✅ Fixed date formatting for all message types (intelligent parser)
- ✅ Fixed "Invalid Date" errors (timestamp fallback)
- ✅ Fixed mark-as-read timing (Observable flow)
- ✅ Fixed unread badge not disappearing (selectedChat sync)
- ✅ Fixed file attachments not displaying (fileAttachments mapping)
- ✅ Added comprehensive debug logging throughout file upload flow

### 🗑️ Removed
- WebSocket file sending logic (base64 encoding, chunking)
- `sendFile()` method that used WebSocket
- File size limit of 1MB (now backend-configurable)

### 📈 Migration Status

- [x] Frontend: HTTP file upload implemented
- [x] Frontend: WebSocket notification handling maintained
- [x] Documentation: Backend guide created
- [ ] Backend: HTTP endpoint implementation (pending)
- [ ] Testing: End-to-end file upload flow
- [ ] Testing: Large file uploads (>10MB)

---

## Project Creation - Initial Setup

The following tools were used to generate this project:
- Angular CLI (ng)

The following steps were used to generate this project:
- Create Angular project with ng: `ng new Business-connector-FE --defaults --skip-install --skip-git --no-standalone `.
- Update angular.json with port.
- Create project file (`Business-connector-FE.esproj`).
- Create `launch.json` to enable debugging.
- Update package.json to add `jest-editor-support`.
- Update `start` script in `package.json` to specify host.
- Add `karma.conf.js` for unit tests.
- Update `angular.json` to point to `karma.conf.js`.
- Add project to solution.
- Write this file.

