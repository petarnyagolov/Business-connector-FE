// Console monitoring script за real-time notification debugging
// Копирайте това в browser console за да видите WebSocket activity

console.log('🚀 Starting notification monitoring...');

// Monitor WebSocket messages
const originalWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  const ws = new originalWebSocket(url, protocols);
  
  ws.addEventListener('open', (event) => {
    console.log('🔌 WebSocket OPENED:', event);
  });
  
  ws.addEventListener('message', (event) => {
    console.log('📨 WebSocket MESSAGE received:', event.data);
    try {
      const data = JSON.parse(event.data);
      console.log('📋 Parsed message:', data);
    } catch (e) {
      console.log('📄 Raw message:', event.data);
    }
  });
  
  ws.addEventListener('close', (event) => {
    console.log('🔌 WebSocket CLOSED:', event);
  });
  
  ws.addEventListener('error', (event) => {
    console.log('❌ WebSocket ERROR:', event);
  });
  
  return ws;
};

// Monitor fetch requests to notification endpoints
const originalFetch = window.fetch;
window.fetch = function(url, options) {
  if (url.includes('/notifications')) {
    console.log('🌐 Notification API call:', url, options);
  }
  
  return originalFetch.apply(this, arguments)
    .then(response => {
      if (url.includes('/notifications')) {
        console.log('📥 Notification API response:', response.status, response.statusText);
      }
      return response;
    });
};

console.log('✅ Monitoring activated! Create a request in another tab to see notifications...');
