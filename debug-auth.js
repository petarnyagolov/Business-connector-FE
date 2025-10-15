// Auth debugging script
// Копирайте това в browser console за да проверите auth state

console.log('🔍 Auth Debugging Started...');

// Check localStorage for tokens
const accessToken = localStorage.getItem('access_token');
const refreshToken = localStorage.getItem('refresh_token');

console.log('🔑 Access Token:', accessToken ? 'EXISTS (length: ' + accessToken.length + ')' : 'NOT FOUND');
console.log('🔑 Refresh Token:', refreshToken ? 'EXISTS (length: ' + refreshToken.length + ')' : 'NOT FOUND');

if (accessToken) {
  try {
    // Decode JWT token
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    console.log('👤 Token payload:', payload);
    console.log('⏰ Token expires:', new Date(payload.exp * 1000));
    console.log('⏰ Current time:', new Date());
    console.log('⚡ Token valid:', payload.exp * 1000 > Date.now());
  } catch (e) {
    console.log('❌ Failed to decode token:', e);
  }
}

// Check if AuthService exists and has methods
console.log('🏪 AuthService methods available:', typeof window.authService);

// Monitor HTTP interceptors
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (url.includes('localhost:8081')) {
    console.log('🌐 HTTP Request to:', url);
    console.log('📋 Request options:', options);
    if (options && options.headers) {
      console.log('🔑 Headers:', options.headers);
      console.log('🔒 Authorization header:', options.headers['Authorization'] || 'NOT SET');
    }
  }
  return originalFetch.apply(this, arguments);
};

console.log('✅ Auth monitoring activated!');
