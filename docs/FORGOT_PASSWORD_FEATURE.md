# Forgot Password & Reset Password Feature

## Overview
Complete implementation of forgot password and reset password functionality for XDealHub platform.

## Features
- **Forgot Password**: User enters email → receives reset link via email
- **Reset Password**: User clicks link → enters new password with validation
- **Shared Password Validation**: Reusable validators for consistent password rules across registration and reset
- **Security**: Token-based authentication, backend validates tokens and expiry
- **User Experience**: Modern Material Design UI with animations and helpful error messages

## Architecture

### Components

#### 1. `ForgotPasswordComponent` (`/forgot-password`)
- **Purpose**: Request password reset email
- **Features**:
  - Email input with validation
  - Loading state during submission
  - Success message after email sent
  - Link back to login
- **Files**:
  - `forgot-password.component.ts`
  - `forgot-password.component.html`
  - `forgot-password.component.scss`
  - `forgot-password.component.spec.ts`

#### 2. `ResetPasswordComponent` (`/reset-password?token=...`)
- **Purpose**: Set new password using token from email
- **Features**:
  - Token extraction from URL query params
  - New password input with strength validation
  - Confirm password with mismatch detection
  - Real-time password requirements display
  - Show/hide password toggle
  - Invalid token error handling
- **Files**:
  - `reset-password.component.ts`
  - `reset-password.component.html`
  - `reset-password.component.scss`
  - `reset-password.component.spec.ts`

### Shared Validators

#### `PasswordValidators` (`validators/password.validators.ts`)
Centralized password validation logic used by both registration and password reset:

**Methods**:
1. `passwordStrength(control)`: Validates password meets requirements
   - At least 1 lowercase letter
   - At least 1 uppercase letter
   - At least 1 digit
   - At least 1 special character (!@#$%^&*...)
   - Supports Unicode (Cyrillic, etc.)

2. `passwordMatch(form)`: Validates password and confirmPassword match
   - Cross-field validation
   - Preserves other validation errors
   - Only sets `passwordMismatch` error

**Usage**:
```typescript
this.form = this.fb.group({
  password: ['', [
    Validators.required,
    Validators.minLength(8),
    Validators.maxLength(100),
    PasswordValidators.passwordStrength
  ]],
  confirmPassword: ['', [Validators.required]]
}, { validators: PasswordValidators.passwordMatch });
```

### Backend Integration

#### AuthService Methods

**`forgotPassword(email: string): Observable<any>`**
- POST to `/auth/forgot-password?email={email}`
- Returns success message even if email doesn't exist (security best practice)

**`resetPassword(token: string, newPassword: string): Observable<any>`**
- POST to `/auth/reset-password`
- Body: `{ token, newPassword }`
- Returns success message or error

#### Backend Endpoints (Java/Spring Boot)

**POST `/auth/forgot-password`**
```java
@PostMapping("/forgot-password")
public ResponseEntity<?> forgotPassword(@RequestParam("email") @Email @NotBlank String email)
```
- Generates reset token
- Sends email with reset link
- Returns 200 OK regardless of email existence

**POST `/auth/reset-password`**
```java
@PostMapping("/reset-password")
public ResponseEntity<?> resetPassword(@RequestBody @Valid ResetPasswordRequest request)

public record ResetPasswordRequest(
  @NotBlank String token,
  @NotNull @Size(min = 8, max = 100) char[] newPassword
)
```
- Validates token (not expired, not used)
- Validates password strength
- Updates user password
- Invalidates token

## User Flow

### Forgot Password Flow
1. User navigates to `/login`
2. Clicks "Забравена парола?" link
3. Redirected to `/forgot-password`
4. Enters email address
5. Submits form → Backend sends email
6. Success message displayed
7. User checks email inbox

### Reset Password Flow
1. User receives email with reset link
2. Link format: `https://xdealhub.com/reset-password?token={token}`
3. User clicks link → Redirected to app
4. Token extracted from URL query params
5. User enters new password (with real-time validation)
6. User confirms password
7. Submits form → Backend validates and updates
8. Success message → Auto-redirect to `/login`
9. User logs in with new password

## UI/UX Details

### Forgot Password UI
- **Icon**: lock_reset
- **Gradient background**: #f5f7fa → #c3cfe2
- **Primary color**: #13636a
- **Animations**: Slide-in on mount, fade-in on success
- **Responsive**: Mobile-optimized layout

### Reset Password UI
- **Icon**: vpn_key
- **Password requirements indicator**: Real-time validation with check/close icons
- **Show/hide password**: Eye icon toggle for both fields
- **Error states**: 
  - Invalid/expired token → Error message with link to request new token
  - Password mismatch → Clear error under confirm field
  - Weak password → Requirements list with colored indicators (red/green)

## Routing

```typescript
// app.routes.ts
{ path: 'forgot-password', component: ForgotPasswordComponent },
{ path: 'reset-password', component: ResetPasswordComponent },
```

## SEO & Accessibility

### robots.txt
No specific entries needed (auth pages don't need indexing)

### sitemap.xml
No entries needed (transient pages, not for SEO)

## Testing

### Unit Tests
- Form validation tests
- Service method call verification
- Error handling tests
- Token extraction tests
- Password matching tests

**Run tests**:
```bash
npm test
```

## Security Considerations

1. **Token-based reset**: Unique, time-limited tokens
2. **No email enumeration**: Returns success even if email doesn't exist
3. **Password strength**: Enforced on both frontend and backend
4. **Token expiry**: Backend validates token age
5. **One-time use**: Token invalidated after successful reset
6. **HTTPS only**: All password-related operations over secure connection

## Deployment Checklist

- [ ] Environment variables configured (backend email SMTP)
- [ ] Email templates created and tested
- [ ] Token expiry time configured (recommended: 1 hour)
- [ ] HTTPS enabled in production
- [ ] Error logging configured
- [ ] Monitoring alerts for failed resets

## Future Enhancements

- [ ] Rate limiting for forgot password requests
- [ ] Multi-factor authentication option
- [ ] Password reset history tracking
- [ ] Admin panel to manually reset passwords
- [ ] SMS-based password reset option
- [ ] Password strength meter visualization
- [ ] Remember device option to skip 2FA

## Troubleshooting

### Common Issues

**Email not received**:
- Check spam folder
- Verify SMTP configuration
- Check backend logs for email sending errors
- Verify email address exists in database

**Invalid token error**:
- Token expired (default 1 hour)
- Token already used
- Token malformed in URL
- User clicks old reset link after requesting new one

**Password validation fails**:
- Check password meets all requirements
- Verify no extra spaces
- Try different special characters
- Check min/max length (8-100 characters)

## Related Files

**Components**:
- `src/app/component/forgot-password/`
- `src/app/component/reset-password/`
- `src/app/component/register/` (uses shared validators)
- `src/app/component/login/` (has forgot password link)

**Services**:
- `src/app/service/auth.service.ts`

**Validators**:
- `src/app/validators/password.validators.ts`

**Routing**:
- `src/app/app.routes.ts`

**Tests**:
- `*.component.spec.ts` files

## Support

For issues or questions, contact:
- Email: support@xdealhub.com
- Issue tracker: GitHub repository
