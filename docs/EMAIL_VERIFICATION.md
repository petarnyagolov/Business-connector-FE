# Email Verification - Централизирана логика с модерен табов UI

## Преглед

Логиката за верификация на имейл в приложението е централизирана в един сервис - `EmailVerificationService`. 
Вместо стандартния диалог, сега използваме модерна табова страница за по-добро потребителско изживяване.

## Архитектура

### Основни компоненти:

1. **EmailVerificationService** - Главният сервис за всички операции по верификация
2. **AuthService** - Базовите JWT и HTTP операции  
3. **EmailVerificationComponent** - Модерна табова страница за верификация (заменя диалога)
4. **Router** - Навигация към страницата за верификация

## Използване

### В компонентите (препоръчан начин):

```typescript
// В constructor:
constructor(
  private emailVerificationService: EmailVerificationService
) {}

// Преди критично действие:
onSubmit(): void {
  this.emailVerificationService.checkVerificationOrPrompt().subscribe((canProceed: boolean) => {
    if (!canProceed) {
      return; // Потребителят ще бъде пренасочен към страницата за верификация
    }

    // Продължаваме с действието
    this.processAction();
  });
}
```

### Нов workflow:
1. При нужда от верификация, потребителят се пренасочва към `/verify-email`
2. Имейлът се автоматично попълва от localStorage
3. Потребителят може да избира между автоматична и ръчна верификация
4. След верификация, може да се върне назад с бутона "Назад"

### API методи:

#### EmailVerificationService:

- `checkVerificationOrPrompt()` - **ГЛАВЕН МЕТОД** - Проверява верификация и навигира към страницата ако е необходимо
- `isEmailVerified()` - Проверява само дали имейлът е верифициран (без диалог) 
- `canPerformAction()` - Проверява дали потребителят може да изпълни действие
- `resendVerificationLink(email)` - Изпраща линк за верификация
- `verifyEmailWithToken(token)` - Верифицира имейл с токен от линк

#### AuthService (използвани вътрешно):

- `isEmailVerified()` - JWT проверка за emailVerified поле
- `getUserEmail()` - Връща имейл от JWT токен
- `canPerformAction()` - Комбинирана проверка за authentication + verification
- `decodeToken()` - Декодиране на JWT токен
- `verifyEmailWithToken()` - HTTP заявка за верификация с токен
- `resendVerificationLink()` - HTTP заявка за повторно изпращане

## Компоненти използващи верификация:

- ✅ `CreateRequestComponent` - Преди създаване на заявка
- ✅ `RequestDetailsComponent` - Преди изпращане на отговор

## Потоци на работа:

### 1. Създаване на заявка/отговор:
```
1. Потребител кликва "Изпрати"
2. checkVerificationOrPrompt() проверява emailVerified в JWT
3a. Ако е верифициран → продължава с действието
3b. Ако НЕ е верифициран → показва диалог
4. В диалога потребителят може да изпрати нов линк
5. При затваряне на диалога, действието се отменя
```

### 2. Верификация чрез линк:
```
1. Потребител кликва върху линк в имейл
2. EmailVerificationComponent зарежда с токен в URL
3. verifyEmailWithToken() прави HTTP заявка към backend
4. При успех → препраща към login/companies
5. При грешка → показва форма за повторно изпращане
```

## Сигурност:

- Всички критични действия са защитени с проверка за emailVerified
- JWT токенът съдържа emailVerified поле
- Backend API валидира emailVerified при всяка заявка
- Токените за верификация имат срок на валидност

## Конфигурация:

### API Endpoints:
- `GET /email/verify?t={token}` - Верификация с токен
- `POST /email/resend-verification?email={email}` - Повторно изпращане

### JWT структура:
```json
{
  "sub": "user@example.com",
  "emailVerified": true,
  "exp": 1234567890
}
```

## Съобщения за грешки (на български):

- "Невалиден или изтекъл линк за верификация."
- "Възникна неочаквана грешка. Моля опитайте отново."
- "Липсва токен за верификация в линка."
- "Възникна грешка при изпращане на линка."

## Тестване:

За тестване на функционалността:

1. Влезте с потребител с неверифициран имейл
2. Опитайте да създадете заявка или отговор
3. Трябва да се появи диалог за верификация
4. Тествайте "Изпрати линк" функционалността
5. Тествайте верификация чрез линк

## Известни проблеми и решения:

### DatePipe грешки с дата масиви
**Проблем**: DatePipe не може да форматира дата масиви във формат `[YYYY, MM, DD]`
**Решение**: Използва се custom `FormatDateArrayPipe` в компонентите:
- `user-responses.component.html`
- `user-requests.component.html` 
- `company-requests.component.html`

```typescript
// Вместо:
{{ item.availableFrom | date:'dd.MM.yyyy' }}

// Използвайте:
{{ item.availableFrom | formatDateArray }}
```
