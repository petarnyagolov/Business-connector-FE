# Project Context
Project: Business Offers & Proposals Platform (B2B matching system)  
**This is the FRONTEND repository only.** Backend is in a separate repository with its own configuration.

Stack:
- **Frontend**: Angular 20+ (TypeScript), standalone components, Material Design
- **Backend** (separate repo): Spring Boot (Java), PostgreSQL, REST API, JWT auth
- **Real-time**: STOMP/WebSocket (notifications + chat), HTTP multipart (file uploads)
- **Infrastructure**: VPS, Docker, Nginx reverse proxy, GitHub Pages, Ngrok tunneling
- **Payments**: ePay.bg integration (backend-initiated redirects)
- **Email**: Zoho Mail / Mailgun API (backend-handled)

# Role & Communication
You are an expert Senior Full-Stack Developer helping this specific project.
**Always answer in BULGARIAN.** Be concise, technical and professional.

---

# Frontend Architecture (Angular)

## Project Structure
```
src/app/
├── component/           # Standalone components (Angular 20+)
│   ├── admin/          # Admin panel (AdminGuard protected)
│   ├── chat-sidebar/   # Real-time chat UI
│   ├── company-*/      # Company CRUD operations
│   ├── request-*/      # Request management
│   └── ...
├── service/            # All services are providedIn: 'root'
│   ├── auth.service.ts              # JWT + refresh token
│   ├── chat-native.service.ts       # HTTP + WebSocket chat
│   ├── notification-websocket.service.ts  # STOMP client
│   ├── company.service.ts           # Company CRUD + caching
│   └── ...
├── guard/              # Route guards (AdminGuard)
├── interceptor/        # auth.interceptor.ts (JWT injection)
├── model/              # TypeScript interfaces
└── app.routes.ts       # All routing config
```

## Critical Architecture Patterns

### 1. Hybrid Chat System (WebSocket + HTTP)
**DO NOT use WebSocket for file uploads!** Use HTTP multipart instead.

- **WebSocket (STOMP)**: text messages, typing indicators, read receipts, notifications
- **HTTP POST**: file uploads to `/api/chat/{requestId}/files`
- After HTTP upload, backend sends WebSocket notification to `/topic/chat/{requestId}`
- See `chat-native.service.ts` for implementation
- **Why?** No base64 encoding (33% smaller), no connection drops, native progress tracking

### 2. Authentication Flow
- JWT stored in `localStorage.accessToken` and `localStorage.refreshToken`
- `auth.interceptor.ts` injects `Authorization: Bearer {token}` header
- **FormData exception**: interceptor skips `Content-Type` for multipart requests
- Refresh token auto-retry on 401 (see `handle401Error` in interceptor)
- `AuthService.authStatus$` BehaviorSubject for reactive auth state
- Cache cleared on login: `companyService.cacheUserCompanies()`, `companyRequestService.cacheUserRequests()`

### 3. Standalone Components (Angular 20+)
All components use `standalone: true` with explicit imports:
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterModule],
  templateUrl: './example.component.html'
})
```
**No NgModules** (deprecated pattern). Use functional route guards (`canActivate: [AuthGuard]`).

### 4. Real-time WebSocket Service
`NotificationWebSocketService` manages STOMP connection:
- Connects on `authStatus$` change (authenticated users only)
- Subscriptions:
  - `/user/{email}/queue/notifications` - user notifications
  - `/user/{email}/queue/chat-updates` - chat list updates
  - `/topic/chat/{requestId}` - active chat messages
- **Token refresh handling**: reconnects WebSocket after token refresh
- See `notification-websocket.service.ts` lines 78-180 for connection logic

### 5. Environment Configuration
```typescript
// environment.ts (production)
apiUrl: 'https://api.xdealhub.com'
websocketUrl: 'wss://api.xdealhub.com/ws'

// environment.development.ts
apiUrl: 'http://localhost:8080'
websocketUrl: 'ws://localhost:8080/ws'
```
**Never hardcode URLs** - always use `environment.apiUrl`.

### 6. ePay Payment Integration Flow
**Critical**: Frontend does NOT directly integrate with ePay API. All payment logic is backend-initiated.

**Payment flow:**
1. User selects credit package → Frontend sends purchase request to backend
2. Backend creates payment record in DB and generates ePay payment URL
3. Backend returns payment URL to frontend
4. Frontend opens `EpayPaymentDialogComponent` with iframe showing ePay checkout
5. User completes payment on ePay.bg (redirected via iframe or full page)
6. ePay redirects back to Angular routes:
   - Success: `/payment/success` → `PaymentSuccessComponent`
   - Cancel: `/payment/cancel` → `PaymentCancelComponent`
7. Frontend polls backend `/api/payments/status/{transactionId}` to verify payment
8. Backend webhook from ePay validates and updates payment status
9. Frontend updates user credits from JWT token refresh

**Key components:**
- `EpayPaymentDialogComponent`: Shows ePay iframe with security sandbox
- `PaymentSuccessComponent`: Polls backend for status, displays success/pending
- `PaymentCancelComponent`: Handles cancellation
- `CreditsService`: Reactive credits counter (reads from JWT claims)

**Important:** Never store payment secrets in frontend. Backend handles all ePay HMAC validation.

---

# Development Workflows

## Local Development
```bash
npm start                 # Runs on http://127.0.0.1:4200
npm run start:public      # Exposes via ngrok (see ngrok-tunnel.js)
npm test                  # Karma + Jasmine tests
npm run validate:env      # Checks environment variables
```

## Key npm Scripts
- `start`: `ng serve --host=127.0.0.1` (default dev mode)
- `start:public`: Starts Angular + ngrok tunnel (for mobile testing)
- `prebuild`: Runs `validate:env` before every build
- `build`: Production build to `dist/business-connector-fe`

## Debugging WebSocket Issues
Use provided debug scripts:
```bash
node debug-auth.js                   # Test JWT token validity
node live-websocket-test.js          # Monitor WebSocket traffic
node notification-chat-auth-test.js  # Test chat WebSocket flow
```

## Admin Features
Access via `/admin` routes (protected by `AdminGuard`):
- Credit management
- User verification
- System analytics
- Check `admin-layout.component.ts` for navigation structure

---

# Coding Standards

## TypeScript Rules
1. **Interfaces over classes** for models (`model/*.ts`)
2. **Descriptive English identifiers** (no Bulgarian variable names)
3. **Comments in ENGLISH** only when necessary
4. Use **RxJS operators** correctly: `tap()` for side effects, `switchMap()` for dependent streams
5. Always unsubscribe with `takeUntil(destroy$)` pattern

## Angular Best Practices
1. **Standalone components only** (`standalone: true`)
2. **Lazy loading** for large routes (see `loadComponent()` in `app.routes.ts`)
3. **Material Design** (use `@angular/material` components)
4. **SCSS** for styles (not CSS)
5. **OnPush change detection** when performance-critical

## Service Patterns
All services use `providedIn: 'root'` (singleton):
```typescript
@Injectable({ providedIn: 'root' })
export class ExampleService {
  private apiUrl = environment.apiUrl + '/example';
  constructor(private http: HttpClient) {}
}
```

## Error Handling
```typescript
.pipe(
  catchError(error => {
    console.error('Context-specific error message:', error);
    return throwError(() => new Error('User-friendly message'));
  })
)
```

---

# Security Requirements

1. **Never log sensitive data**: mask tokens, passwords, emails in production logs
2. **JWT validation**: backend must verify token signature and expiry
3. **CSRF**: use SameSite cookies if switching from localStorage
4. **XSS**: Angular sanitizes templates by default, but be careful with `innerHTML`
5. **File uploads**: backend must validate file types and sizes (max 10MB)

---

# Testing Requirements

## Unit Tests (Jasmine + Karma)
- **Test first**: write tests before implementation
- **Mock services**: use `jasmine.createSpyObj()` for service dependencies
- **Cover edge cases**: auth failures, WebSocket disconnects, empty responses

Example:
```typescript
it('should refresh token on 401', fakeAsync(() => {
  authService.refreshToken().subscribe();
  tick();
  expect(localStorage.getItem('accessToken')).toBeTruthy();
}));
```

## Integration Tests
- Test full authentication flow (login → store tokens → API call)
- Test WebSocket connection lifecycle (connect → subscribe → disconnect)
- Test file upload (FormData → HTTP POST → WebSocket notification)

---

# Common Tasks

## Add New Component
```bash
ng generate component component/new-feature --standalone
```
Remember to add route in `app.routes.ts` and protect with `canActivate: [AuthGuard]` if needed.

## Add New Service
```bash
ng generate service service/new-feature
```
Ensure `providedIn: 'root'` and inject `HttpClient` for API calls.

## Add New Model
Create TypeScript interface in `model/new-model.ts`:
```typescript
export interface NewModel {
  id: number;
  name: string;
  createdAt: string;
}
```

## Update Backend Integration
1. Update `environment.ts` and `environment.development.ts` if new endpoint
2. Create/update service method with proper error handling
3. Write Jasmine test for the service method
4. Update component to call service and handle Observable

---

# Deployment & Infrastructure

## Docker
See `Dockerfile` - simple Node.js Alpine image:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4200
CMD ["npm", "start"]
```

## Production Build
```bash
npm run build  # Outputs to dist/business-connector-fe
```
Served via Nginx reverse proxy on VPS.

## Ngrok Tunneling (Development)
For testing on mobile devices:
```bash
npm run start:public  # Starts Angular + ngrok
```
Check `ngrok-tunnel.js` for config (authtoken hardcoded - move to env var!).

---

# Deliverable Format

**Angular Components:**
```
src/app/component/example/
├── example.component.ts       # Logic + @Component decorator
├── example.component.html     # Template
├── example.component.scss     # Styles
└── example.component.spec.ts  # Jasmine tests
```

**Angular Services:**
```
src/app/service/example.service.ts
src/app/service/example.service.spec.ts
```

**Always include:**
- Full file path (e.g., `src/app/service/example.service.ts`)
- All imports and declarations
- Jasmine tests for new logic
- TypeScript types/interfaces

---

# Additional Notes

- **PWA support**: `ngsw-config.json` configured (Service Worker)
- **GitHub Pages deployment**: `CNAME` file for custom domain
- **404 handling**: Custom `404.html` in `src/` for SPA routing
- **Sitemap**: `public/sitemap.xml` for SEO
- **Cookie consent**: `CookieConsentComponent` (GDPR compliance)
