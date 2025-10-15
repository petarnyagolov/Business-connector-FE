// Manual WebSocket Test with Chat Service Authentication Pattern
// Копирайте това в browser console

console.log('🚀 Starting manual WebSocket test with chat authentication pattern...');

function testWebSocketWithChatAuth() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.log('❌ No access token found - please login first');
    return;
  }
  
  console.log('🔑 Using token:', token.substring(0, 20) + '...');
  
  // Use same WebSocket URL pattern as chat service
  const apiUrl = 'http://localhost:8081';
  const wsBaseUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  const wsUrl = `${wsBaseUrl}/ws`;
  
  console.log('🔗 Connecting to:', wsUrl);
  
  // Create WebSocket connection
  const socket = new WebSocket(wsUrl);
  
  // Initialize STOMP client (using same pattern as chat service)
  const stompClient = Stomp.over(socket);
  
  stompClient.debug = (str) => {
    console.log('📡 STOMP:', str);
  };
  
  stompClient.connect({}, 
    // onConnect callback
    (frame) => {
      console.log('✅ STOMP Connected:', frame);
      
      // Step 1: Send authentication message (like chat service)
      stompClient.send('/app/auth', {}, JSON.stringify({ 
        token: token 
      }));
      console.log('🔑 Sent authentication message');
      
      // Step 2: Subscribe to notification channels
      const notificationSub = stompClient.subscribe('/user/queue/notifications', (message) => {
        console.log('📬 NOTIFICATION RECEIVED:', message.body);
        
        try {
          const notification = JSON.parse(message.body);
          console.log('📋 Parsed notification:', notification);
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title || 'New Notification', {
              body: notification.message || 'You have a new notification',
              icon: '/logo.png'
            });
          }
        } catch (e) {
          console.log('📄 Raw notification:', message.body);
        }
      });
      
      const unreadSub = stompClient.subscribe('/user/queue/unread-count', (message) => {
        console.log('📊 UNREAD COUNT RECEIVED:', message.body);
      });
      
      console.log('📡 Subscribed to notification channels');
      
      // Step 3: Send connect message
      const deviceInfo = {
        device: 'desktop',
        timestamp: new Date().toISOString()
      };
      
      stompClient.send('/app/notifications/connect', {}, JSON.stringify(deviceInfo));
      console.log('📱 Sent connect message:', deviceInfo);
    },
    // onError callback
    (error) => {
      console.log('❌ STOMP connection error:', error);
    }
  );
  
  return stompClient;
}

// Start the test
const testClient = testWebSocketWithChatAuth();

console.log(`
🎯 WebSocket notification test started with chat authentication pattern!

Authentication flow:
1. ✅ Connect to WebSocket
2. 🔑 Send /app/auth with JWT token
3. 📡 Subscribe to /user/queue/notifications
4. 📱 Send /app/notifications/connect

Next steps:
1. Open another tab/window
2. Login as different user
3. Create a new request
4. Watch this console for notifications

To stop: testClient.disconnect()
`);

// Make client available globally
window.testNotificationClient = testClient;
