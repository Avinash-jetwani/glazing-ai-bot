/**
 * WebSocket Connection Test Utility
 * Run this in your browser console to test direct WebSocket connections
 * to help diagnose connection issues independently of the React components.
 */

// Testing WebSocket connection directly
window.testWebSocketConnection = function(widgetKey = 'demo-widget-key') {
  // Try direct localhost connection first
  const urls = [
    `ws://localhost:8000/ws/${widgetKey}`,
    `ws://${window.location.hostname}:8000/ws/${widgetKey}`,
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/${widgetKey}`
  ];

  const results = [];

  // Test each URL in sequence
  const testNextUrl = (index) => {
    if (index >= urls.length) {
      console.log('✅ Testing complete!');
      console.table(results);
      return;
    }

    const url = urls[index];
    console.log(`Testing connection to: ${url}`);

    const ws = new WebSocket(url);
    let connectionSuccessful = false;

    // Set timeout for connection
    const timeout = setTimeout(() => {
      if (!connectionSuccessful) {
        ws.close();
        results.push({
          url,
          status: 'Timeout',
          error: 'Connection timed out after 5 seconds'
        });
        testNextUrl(index + 1);
      }
    }, 5000);

    ws.onopen = () => {
      connectionSuccessful = true;
      clearTimeout(timeout);
      console.log(`✅ Connection succeeded to ${url}`);

      // Send ping message
      ws.send(JSON.stringify({
        type: 'ping',
        timestamp: new Date().toISOString()
      }));

      // Wait for response and then close
      setTimeout(() => {
        ws.close(1000, 'Test complete');
        results.push({
          url,
          status: 'Success',
          error: null
        });
        testNextUrl(index + 1);
      }, 2000);
    };

    ws.onmessage = (event) => {
      console.log(`Received from ${url}:`, event.data);
    };

    ws.onerror = (error) => {
      clearTimeout(timeout);
      console.error(`❌ Error connecting to ${url}:`, error);
    };

    ws.onclose = (event) => {
      clearTimeout(timeout);
      if (!connectionSuccessful) {
        results.push({
          url,
          status: 'Failed',
          error: `Closed with code ${event.code}: ${event.reason || 'No reason'}`
        });
        testNextUrl(index + 1);
      }
    };
  };

  // Start testing with the first URL
  testNextUrl(0);

  return "Testing WebSocket connections... Check the console for results.";
};

// Add to window on load
if (typeof window !== 'undefined') {
  console.log('WebSocket connection test utility loaded. Run testWebSocketConnection() in the console to test connections.');
}
