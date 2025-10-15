// Добавете тези debug log-ове в browser console за manual тестване

// 1. Проверете дали WebSocket се свързва
const ws = new WebSocket('ws://localhost:8081/ws');
ws.onopen = () => console.log('✅ WebSocket connected manually');
ws.onerror = (error) => console.log('❌ WebSocket error:', error);
ws.onclose = (event) => console.log('🔌 WebSocket closed:', event.code, event.reason);

// 2. Test STOMP connection (ако имате @stomp/stompjs)
// import { Client } from '@stomp/stompjs';
// const client = new Client({
//   brokerURL: 'ws://localhost:8081/ws',
//   debug: (str) => console.log('STOMP:', str)
// });
// client.activate();

// 3. Проверете дали notification service се initialize правилно
// В Angular DevTools или console:
// angular.getComponent(document.querySelector('app-notification-bell'))
