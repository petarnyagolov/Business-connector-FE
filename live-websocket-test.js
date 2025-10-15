// Live WebSocket Notification Test Script
// Копирайте това в browser console на втори tab/прозорец

console.log('🚀 Starting LIVE WebSocket notification test...');

// 1. Connect to WebSocket manually with authentication
function testLiveWebSocket() {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    console.log('❌ No access token found - please login first');
    return;
  }
  
  console.log('🔑 Using token:', token.substring(0, 20) + '...');
  
  // Create WebSocket connection to match your backend
  const wsUrl = 'ws://localhost:8081/ws';
  console.log('🔗 Connecting to:', wsUrl);
  
  // Create STOMP connection similar to your service
  const StompJs = window.StompJs || { Client: window.StompClient };
  
  const client = new StompJs.Client({
    brokerURL: wsUrl,
    connectHeaders: {
      'Authorization': `Bearer ${token}`,
      'login': token,
      'passcode': token
    },
    debug: function (str) {
      console.log('📡 STOMP:', str);
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });
  
  client.onConnect = function (frame) {
    console.log('✅ WebSocket CONNECTED:', frame);
    
    // Subscribe to user notifications
    const subscription = client.subscribe('/user/queue/notifications', function (message) {
      console.log('🔔 NOTIFICATION RECEIVED:', message.body);
      
      try {
        const notification = JSON.parse(message.body);
        console.log('📬 Parsed notification:', notification);
        
        // Show browser notification if possible
        if ('Notification' in window) {
          new Notification(notification.title || 'New Notification', {
            body: notification.message || 'You have a new notification',
            icon: '/logo.png'
          });
        }
      } catch (e) {
        console.log('📄 Raw notification:', message.body);
      }
    });
    
    console.log('📡 Subscribed to notifications, subscription:', subscription);
    
    // Send connection message
    const deviceInfo = {
      type: 'CONNECT',
      device: 'desktop',
      timestamp: new Date().toISOString()
    };
    
    client.publish({
      destination: '/app/connect',
      body: JSON.stringify(deviceInfo)
    });
    
    console.log('📱 Sent connect message:', deviceInfo);
  };
  
  client.onDisconnect = function () {
    console.log('❌ WebSocket DISCONNECTED');
  };
  
  client.onStompError = function (frame) {
    console.log('🚨 WebSocket ERROR:', frame);
  };
  
  console.log('🔌 Activating connection...');
  client.activate();
  
  return client;
}

// Start the test
const wsClient = testLiveWebSocket();

// Instructions
console.log(`
🎯 WebSocket test started!

Next steps:
1. Open another tab/window
2. Login as different user (or same user)
3. Create a new request
4. Watch this console for notifications

To stop: wsClient.deactivate()
`);

// Make client available globally
window.testWsClient = wsClient;
