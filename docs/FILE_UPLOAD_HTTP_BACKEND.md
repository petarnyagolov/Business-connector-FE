# File Upload via HTTP - Backend Implementation Guide

## 📋 Overview

Files are now uploaded via **HTTP POST** (multipart/form-data) instead of WebSocket to avoid:
- Base64 encoding overhead (33% size increase)
- WebSocket connection drops with large files
- Message size limitations

## 🎯 Required Backend Endpoint

### POST `/api/chat/{requestId}/files`

**Purpose:** Upload one or multiple files to a chat

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Path Variable: `requestId` (String) - The chat/request ID
- Form Data:
  - `files` (MultipartFile[]) - One or more files
  - `message` (String, optional) - Optional text message to send with files

**Example Request:**
```http
POST /api/chat/7e118916-5c45-44ca-beb7-087009961992/files HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary
Authorization: Bearer {jwt_token}

------WebKitFormBoundary
Content-Disposition: form-data; name="files"; filename="image.png"
Content-Type: image/png

{binary file data}
------WebKitFormBoundary
Content-Disposition: form-data; name="message"

Check out this image!
------WebKitFormBoundary--
```

**Response:**
```json
{
  "success": true,
  "messageIds": [123, 124],
  "message": "Files uploaded successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "File upload failed: File too large"
}
```

## 🔧 Spring Boot Implementation Example

```java
@RestController
@RequestMapping("/api/chat")
public class ChatFileController {
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @PostMapping("/{requestId}/files")
    public ResponseEntity<?> uploadFiles(
            @PathVariable String requestId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "message", required = false) String message,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        try {
            // Validate access
            if (!chatService.hasAccess(requestId, userDetails.getUsername())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("success", false, "message", "Access denied"));
            }
            
            List<Long> messageIds = new ArrayList<>();
            
            // Process each file
            for (MultipartFile file : files) {
                // Save file to storage (S3, filesystem, etc.)
                String fileUrl = fileStorageService.store(file, requestId);
                
                // Create chat message with file attachment
                ChatMessage chatMessage = chatService.createFileMessage(
                    requestId,
                    userDetails.getUsername(),
                    file.getOriginalFilename(),
                    file.getContentType(),
                    file.getSize(),
                    fileUrl,
                    message // Only for first file or if multiple messages
                );
                
                messageIds.add(chatMessage.getId());
                
                // Send WebSocket notification to all chat participants
                ChatMessageDto wsMessage = ChatMessageDto.builder()
                    .id(chatMessage.getId())
                    .message(message)
                    .senderEmail(userDetails.getUsername())
                    .senderName(chatMessage.getSenderName())
                    .timestamp(chatMessage.getCreatedAt().toString())
                    .messageType("FILE")
                    .fileName(file.getOriginalFilename())
                    .fileUrl(fileUrl)
                    .fileSize(file.getSize())
                    .fileType(file.getContentType())
                    .isRead(false)
                    .build();
                
                // Send to specific chat subscribers
                messagingTemplate.convertAndSend(
                    "/topic/chat/" + requestId,
                    wsMessage
                );
                
                // Send chat update notification
                ChatUpdateDto updateDto = ChatUpdateDto.builder()
                    .chatId(requestId)
                    .updateType("NEW_MESSAGE")
                    .messagePreview(file.getOriginalFilename())
                    .timestamp(LocalDateTime.now())
                    .unreadCount(chatService.getUnreadCount(requestId, otherPartyEmail))
                    .build();
                
                messagingTemplate.convertAndSendToUser(
                    otherPartyEmail,
                    "/queue/chat-updates",
                    updateDto
                );
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "messageIds", messageIds,
                "message", "Files uploaded successfully"
            ));
            
        } catch (Exception e) {
            log.error("File upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("success", false, "message", "File upload failed: " + e.getMessage()));
        }
    }
}
```

## 📤 WebSocket Notification Flow

After successful file upload via HTTP:

1. **Backend saves file** to storage (S3, filesystem, database)
2. **Backend creates ChatMessage** entity with file metadata
3. **Backend sends WebSocket notification** to chat topic:
   ```
   Destination: /topic/chat/{requestId}
   Payload: ChatMessageDto (with file info)
   ```
4. **Backend sends chat update** to other participant:
   ```
   Destination: /user/{email}/queue/chat-updates
   Payload: ChatUpdateDto (unread count, preview)
   ```

## 🔄 Frontend Flow

```typescript
// 1. User selects files and presses Enter
sendMessage() {
  if (filesToSend.length > 0) {
    // HTTP POST multipart upload
    this.chatService.sendMessageWithFiles(requestId, message, files).subscribe({
      next: () => {
        console.log('✅ Files uploaded');
        // UI automatically updates when WebSocket notification arrives
      },
      error: (error) => {
        console.error('❌ Upload failed:', error);
        // Show error to user
      }
    });
  }
}

// 2. WebSocket receives notification
// notification-websocket.service.ts automatically handles:
this.client.subscribe('/topic/chat/' + chatId, (message) => {
  const chatMessage: ChatMessageDto = JSON.parse(message.body);
  // Add to activeChatMessages$
  // UI reactively updates
});
```

## 📥 File Download (Already Implemented)

File download already uses HTTP:

```typescript
downloadFile(attachment: FileAttachment, requestId: string): Observable<Blob> {
  if (attachment.fileUrl) {
    return this.http.get(attachment.fileUrl, { responseType: 'blob' });
  }
  const fileUrl = `${this.apiUrl}/chat/${requestId}/files/${attachment.id}`;
  return this.http.get(fileUrl, { responseType: 'blob' });
}
```

**Backend needs:**
```java
@GetMapping("/{requestId}/files/{fileId}")
public ResponseEntity<Resource> downloadFile(
    @PathVariable String requestId,
    @PathVariable Long fileId,
    @AuthenticationPrincipal UserDetails userDetails
) {
    // Validate access
    // Load file from storage
    // Return as Resource with Content-Disposition header
}
```

## 🔒 Security Considerations

1. **File Size Limits:** Configure max file size in `application.properties`:
   ```properties
   spring.servlet.multipart.max-file-size=10MB
   spring.servlet.multipart.max-request-size=50MB
   ```

2. **File Type Validation:** Check MIME types and extensions
   ```java
   private static final Set<String> ALLOWED_TYPES = Set.of(
       "image/jpeg", "image/png", "image/gif",
       "application/pdf", "application/msword",
       "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
   );
   ```

3. **Virus Scanning:** Consider integrating antivirus for uploaded files

4. **Access Control:** Always verify user has access to the chat before upload/download

5. **Storage Security:** 
   - Use presigned URLs for S3
   - Store files outside web root
   - Generate unique filenames to prevent overwriting

## 📊 Benefits vs WebSocket Approach

| Aspect | HTTP Upload | WebSocket Upload |
|--------|-------------|------------------|
| File size limit | ~100MB+ | ~1MB (connection drops) |
| Encoding overhead | None (binary) | 33% (base64) |
| Browser support | Native multipart | Manual chunking |
| Progress tracking | Built-in | Manual implementation |
| Memory usage | Streaming | Full file in memory |
| Complexity | Simple | Complex |

## ✅ Testing Checklist

- [ ] Upload single small file (<1MB)
- [ ] Upload multiple small files
- [ ] Upload large file (>10MB)
- [ ] Upload with message text
- [ ] Upload without message text
- [ ] Verify WebSocket notification received
- [ ] Verify file appears in chat UI
- [ ] Verify download works
- [ ] Test concurrent uploads
- [ ] Test file type validation
- [ ] Test file size validation
- [ ] Test access control (unauthorized user)
- [ ] Test error handling (network failure, server error)

## 🐛 Common Issues

**Issue:** "Maximum upload size exceeded"
- Solution: Increase `spring.servlet.multipart.max-file-size`

**Issue:** Files not appearing in chat
- Solution: Ensure WebSocket notification is sent after file save

**Issue:** Download returns 404
- Solution: Check file URL generation and storage path

**Issue:** Slow uploads
- Solution: Consider direct S3 uploads with presigned URLs

---

**Last Updated:** October 24, 2025  
**Frontend Implementation:** Complete ✅  
**Backend Implementation:** Pending ⏳
