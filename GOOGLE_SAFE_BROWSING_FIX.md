# 🔴 КРИТИЧНО: Google Safe Browsing - План за отстраняване на проблема

## Проблем
Google Safe Browsing маркира xdealhub.com като **фишинг/опасен сайт** поради:

### 🚨 Основна причина (КРИТИЧНА)
**Динамично генериране и автоматично изпращане на форма към external payment gateway**

Кодът в `header.component.ts` (редове 220-246):
```typescript
const form = document.createElement('form');
form.method = 'POST';
form.action = res.url;  // External ePay URL
document.body.appendChild(form);
form.submit();  // Автоматично изпращане без потребителско действие
```

Това е **класическа фишинг техника** използвана от хакери!

---

## ✅ Приложени решения в кода

### 1. **Security Headers в index.html** ✅
- Content Security Policy (CSP)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Referrer Policy

### 2. **Потребителско потвърждение преди redirect** ✅
Добавен `confirm()` dialog преди изпращане към ePay:
```typescript
const confirmMessage = `Ще бъдете пренасочени към сигурната страница за плащане на ePay.bg...`;
if (!confirm(confirmMessage)) {
  this.isProcessingPurchase = false;
  return;
}
```

### 3. **XSS защита в NotificationService** ✅
Заменена опасната `innerHTML` с безопасни DOM методи и HTML escaping.

### 4. **robots.txt** ✅
Създаден `public/robots.txt` за легитимност на сайта.

### 5. **security.txt** ✅
Създаден `public/.well-known/security.txt` за отговорно disclosure.

---

## 🔧 ДОПЪЛНИТЕЛНИ ЗАДЪЛЖИТЕЛНИ СТЪПКИ

### A. **Server-Side Security Headers** (СПЕШНО!)

Трябва да конфигурирате backend-а (`api.xdealhub.com`) да връща:

```nginx
# За Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.xdealhub.com wss://api.xdealhub.com; frame-src 'self' https://www.googletagmanager.com https://demo.epay.bg https://epay.bg; form-action 'self' https://demo.epay.bg https://epay.bg; base-uri 'self'; object-src 'none'" always;
```

### B. **HTTPS навсякъде** (ЗАДЪЛЖИТЕЛНО!)

Уверете се, че:
1. ✅ Основният домейн `xdealhub.com` използва HTTPS
2. ✅ API `api.xdealhub.com` използва HTTPS
3. ✅ Websocket `wss://api.xdealhub.com` (не `ws://`)
4. ❌ HTTP Strict Transport Security (HSTS):
   ```
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   ```

### C. **Google Search Console Report** (ВАЖНО!)

1. Отидете на https://search.google.com/search-console
2. Добавете вашия сайт (ако не е добавен)
3. Проверете **Security Issues** секцията
4. След fix-овете, подайте **Reconsideration Request**:
   - Опишете промените
   - Покажете commit history
   - Обяснете легитимността на ePay integration

### D. **Google Safe Browsing Report** (КРИТИЧНО!)

Докладвайте грешка директно на Google:
1. Отидете на https://safebrowsing.google.com/safebrowsing/report_error/
2. Въведете URL: `https://xdealhub.com`
3. Изберете "This is not a dangerous site"
4. Опишете:
   ```
   This is a legitimate Bulgarian business platform (B2B marketplace).
   
   The ePay.bg integration is a certified Bulgarian payment gateway (similar to Stripe/PayPal).
   We have added:
   - User confirmation before redirect
   - Security headers (CSP, X-Frame-Options, etc.)
   - Clear logging and transparency
   
   ePay.bg is certified by Bulgarian National Bank and is used by thousands of Bulgarian businesses.
   Official site: https://www.epay.bg/
   
   Please review and remove the phishing warning.
   ```

### E. **SSL/TLS Configuration**

Проверете SSL сертификата:
```bash
# Тествайте SSL конфигурацията
curl -I https://xdealhub.com
openssl s_client -connect xdealhub.com:443 -servername xdealhub.com
```

Използвайте https://www.ssllabs.com/ssltest/ за пълен одит.

### F. **Transparency и Trust Signals**

Добавете на сайта:

1. **Privacy Policy** страница (`/privacy`)
2. **Terms of Service** (`/terms`)
3. **Contact Information** (ясно видим email, телефон, адрес)
4. **About Us** страница с легитимна информация за компанията
5. **SSL сертификат badge** (например от Comodo/Let's Encrypt)
6. **ePay.bg лого и линк** на payment страницата

### G. **ePay Integration Documentation**

Създайте публична страница `/payment-info`:
```html
<h2>Безопасно плащане чрез ePay.bg</h2>
<p>XDealHub използва ePay.bg - лицензиран от БНБ платежен агрегатор.</p>
<p>ePay.bg е сертифициран PCI DSS Level 1 доставчик.</p>
<p>При плащане ще бъдете пренасочени към защитена страница на ePay.bg.</p>
<p>Повече информация: <a href="https://www.epay.bg" target="_blank">www.epay.bg</a></p>
```

---

## 📊 Мониторинг

След deploy на промените:

1. **Google Safe Browsing Status API**:
   ```bash
   curl "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"client":{"clientId":"xdealhub","clientVersion":"1.0"},"threatInfo":{"threatTypes":["MALWARE","SOCIAL_ENGINEERING"],"platformTypes":["ANY_PLATFORM"],"threatEntryTypes":["URL"],"threatEntries":[{"url":"https://xdealhub.com"}]}}'
   ```

2. **VirusTotal Scan**:
   https://www.virustotal.com/gui/url/[BASE64_ENCODED_URL]/detection

3. **SecurityHeaders.com**:
   https://securityheaders.com/?q=https://xdealhub.com

---

## ⏱️ Timeline за възстановяване

- **Незабавно** (днес):
  1. ✅ Deploy промените в кода
  2. ✅ Добавете server-side headers
  3. ✅ Подайте Google Safe Browsing report

- **24-48 часа**:
  1. Създайте Privacy Policy, Terms, Payment Info страници
  2. Добавете trust signals (SSL badge, contact info)
  3. Подайте reconsideration request в Search Console

- **3-7 дни**:
  1. Мониторинг на Google Safe Browsing status
  2. Проверка на SSL Labs rating
  3. Follow-up с Google ако все още е маркиран

---

## 🎯 Дългосрочни мерки

1. **Замяна на form.submit() с window.location.href**:
   ```typescript
   // По-безопасен начин (без dynamic form creation)
   const paymentUrl = `${res.url}?ENCODED=${encodeURIComponent(res.encoded)}&CHECKSUM=${encodeURIComponent(res.checksum)}&PAGE=paylogin`;
   window.location.href = paymentUrl;
   ```
   ⚠️ Проверете дали ePay поддържа GET параметри!

2. **Iframe integration** (ако ePay поддържа):
   По-безопасен от auto-submit форма.

3. **Payment API вместо redirect** (дългосрочно):
   Проверете дали ePay има REST API за директна интеграция.

---

## 📝 Checklist преди deploy

- [ ] Security headers в index.html
- [ ] Server-side headers конфигурирани
- [ ] User confirmation преди ePay redirect
- [ ] XSS защита в NotificationService
- [ ] robots.txt deployed
- [ ] security.txt deployed
- [ ] HTTPS навсякъде (включително WebSocket)
- [ ] SSL сертификат валиден
- [ ] Privacy Policy страница
- [ ] Terms of Service страница
- [ ] Payment Info страница
- [ ] Google Safe Browsing report submitted
- [ ] Search Console reconsideration request
- [ ] SSL Labs scan passed (минимум Grade A)

---

## 🆘 Контакти за помощ

- **Google Safe Browsing Help**: https://support.google.com/webmasters/answer/9008080
- **ePay.bg Technical Support**: support@epay.bg
- **Bulgarian Cyber Police**: cybercrime@mvr.bg (ако има фалшиво отчитане)

---

## 📌 Важни линкове

- Google Safe Browsing Status: https://transparencyreport.google.com/safe-browsing/search?url=xdealhub.com
- Search Console: https://search.google.com/search-console
- Report Error: https://safebrowsing.google.com/safebrowsing/report_error/
- SSL Labs Test: https://www.ssllabs.com/ssltest/analyze.html?d=xdealhub.com
- SecurityHeaders: https://securityheaders.com/?q=https://xdealhub.com

---

**Последна актуализация**: 7 декември 2025
**Статус**: 🟡 В процес на отстраняване
**Очаквано време за възстановяване**: 3-7 дни след submit на reports
