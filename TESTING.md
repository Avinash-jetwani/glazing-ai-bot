# Testing Guide for Lead Bot Project

## Overview
This project consists of two main components:
1. **Backend API** (FastAPI + WebSockets) - Runs locally or in Docker
2. **Frontend Widget** (React) - Runs with Vite dev server

## Quick Start (The Simplest Way)

### 1. Start the Backend API
```bash
# Navigate to the API directory
cd apps/api

# Start the FastAPI server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Start the Frontend Widget
```bash
# In a new terminal, navigate to the widget directory
cd apps/widget

# Start the development server
npm run dev
# Note the URL (typically http://localhost:5173)
```

### 3. Test the WebSocket Connection
- Open the frontend URL (typically http://localhost:5173)
- Click on the chat button
- You should see "Connected" status in the chat window
- Try sending a message to verify the connection

## Testing the WebSocket Connection Separately

### Using the Test HTML Page
```bash
# Start a simple HTTP server for the test page
cd apps/widget
python -m http.server 8080

# Open in browser
# http://localhost:8080/wsTestPage.html
```

### Using the Browser Console
```javascript
// Open browser console on your widget page (http://localhost:5173)
// Run this to test the WebSocket manually
const testWs = new WebSocket('ws://localhost:8000/ws/demo-widget-key');
testWs.onopen = () => console.log('Test connection open');
testWs.onmessage = (event) => console.log('Test message:', event.data);
testWs.onerror = (err) => console.error('Test error:', err);
testWs.onclose = (event) => console.log('Test closed:', event.code, event.reason);

// Send a test message
testWs.send('Hello from console');
```

## Troubleshooting Common WebSocket Issues

### 1. Connection Error 1006 (Abnormal Closure)
- **Cause**: Backend server not running or WebSocket URL incorrect
- **Solution**:
  - Ensure FastAPI server is running on port 8000
  - Check terminal for backend errors
  - Verify WebSocket URL is correct (ws://localhost:8000/ws/demo-widget-key)

### 2. Connection Works in Test Page But Not in React App
- **Cause**: Component lifecycle issues or URL construction problems
- **Solution**:
  - Check the React app's console for specific errors
  - Verify the WebSocket URL construction logic matches between the test page and React app
  - Ensure WebSocket connections are properly cleaned up on component unmount

### 3. "Component unmounted" Errors
- **Cause**: React component unmounts while WebSocket operations are ongoing
- **Solution**:
  - Make sure to use the `isMountedRef` to prevent state updates after unmount
  - Don't initialize WebSocket connections for hidden/unmounted components

## Docker Setup (Alternative)

If you prefer using Docker:

```bash
# Start all services
docker-compose up -d

# Check logs
docker logs -f glazing-ai-api

# Access the frontend same as before
# http://localhost:5173
```

## Chat Status Indicators

The chat widget shows connection status:
- 🟢 **Connected**: WebSocket connection is active
- 🔴 **Disconnected**: No WebSocket connection
- If disconnected, a "Reconnect" button will appear

## Testing WebSocket with Different Widget Keys

You can test different widget keys:
1. In the WebSocket test page, enter a different key and click Connect
2. In the React app, modify the `widgetKey` state in App.tsx or pass a key via the script tag:
   ```html
   <script id="glazing-widget-script" data-key="your-custom-key" src="http://localhost:5173/main.js"></script>
   ```

Remember: The backend API must be running for the WebSocket connection to work properly. If you encounter any issues, check both frontend and backend console logs.
