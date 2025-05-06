/**
 * A simple utility to test WebSocket connectivity.
 * Run this from the browser console to test the WebSocket connection.
 */
export const testWebSocketConnection = (widgetKey: string = 'demo-widget-key') => {
  console.log(`Testing WebSocket connection with widget key: ${widgetKey}`);

  try {
    // Ensure the widget key is valid
    const safeWidgetKey = widgetKey || 'demo-widget-key';
    const wsUrl = `ws://localhost:8000/ws/${safeWidgetKey}`;

    console.log(`Connecting to WebSocket URL: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ WebSocket connection established successfully');

      // Send a test message
      try {
        console.log('Sending test message...');
        ws.send('Hello from the widget!');
      } catch (e) {
        console.error('Failed to send test message:', e);
      }
    };

    ws.onmessage = (event) => {
      console.log('📨 Message received:', event.data);

      try {
        const data = JSON.parse(event.data);
        console.log('Parsed message:', data);
      } catch (e) {
        console.error('Failed to parse message as JSON:', e);
      }
    };

    ws.onclose = (event) => {
      console.log(`❌ WebSocket connection closed with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
    };

    ws.onerror = (error) => {
      console.error('⚠️ WebSocket error:', error);
      console.log('WebSocket readyState:', ws.readyState);
      console.log('Try checking if the API server is running at localhost:8000');
    };

    // Return the WebSocket instance so it can be closed manually
    return ws;
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    return null;
  }
};

// Define a global function for browser console access
function defineGlobalTestFunction() {
  if (typeof window !== 'undefined') {
    console.log('Defining global testWebSocketConnection function');
    (window as any).testWebSocketConnection = testWebSocketConnection;
    console.log('Global testWebSocketConnection function is now available');
  }
}

// Call the function to define the global
defineGlobalTestFunction();

export default testWebSocketConnection;
