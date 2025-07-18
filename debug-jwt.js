// Тест за JWT декодиране
// Копирайте този код в browser console за debug

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwZXR5cm55YWdvbG92QGdtYWlsLmNvbSIsImlhdCI6MTc1MjY3MDE2MywiZXhwIjoxNzUyNzU2NTYzLCJyb2xlcyI6WyJVU0VSIl0sImZpcnN0TmFtZSI6ItCf0LXRgtGK0YAiLCJsYXN0TmFtZSI6ItCd0Y_Qs9C-0LvQvtCyIiwiZW1haWxWZXJpZmllZCI6ZmFsc2UsImxhbmciOiJiZyJ9.zlOqBHuf4JqxzctS9Sf7Fm3-kqNibtLnLntYZfFjeMw";

console.log("Testing JWT decode:");
const parts = token.split('.');
console.log("Parts:", parts.length);

const payload = parts[1];
console.log("Payload raw:", payload);
console.log("Payload length:", payload.length);

// Тест 1: С padding
const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
console.log("Padded payload:", paddedPayload);

try {
  const decoded1 = JSON.parse(atob(paddedPayload));
  console.log("✅ Decoded with padding:", decoded1);
} catch (e) {
  console.error("❌ Failed with padding:", e);
}

// Тест 2: Без padding
try {
  const decoded2 = JSON.parse(atob(payload));
  console.log("✅ Decoded without padding:", decoded2);
} catch (e) {
  console.error("❌ Failed without padding:", e);
}

// Тест 3: Проверка на localStorage
console.log("LocalStorage token:", localStorage.getItem('accessToken'));
