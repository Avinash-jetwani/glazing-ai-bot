# Testing Guide for Lead Bot Project

## Overview
This project consists of two main components:
1. **Backend API** (FastAPI + WebSockets + LLM) - Runs locally or in Docker
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

## Testing Each Phase

### Testing Phase A: Foundation
- Verify repository structure: `ls -la`
- Verify Docker configuration: `docker-compose config`
- Verify tooling setup: `cat .pre-commit-config.yaml`

### Testing Phase B: Widget Static UI
- Open widget in browser: http://localhost:5173
- Click the chat button to open the modal
- Verify the UI elements are displayed properly
- Test ESC key to close the modal

### Testing Phase C: WebSocket Echo
- Ensure backend is running on port 8000
- Open the widget and click on the chat button
- Type a message and send it
- Verify the message is echoed back from the server

### Testing Phase D: LLM Integration
- Ensure backend is running with USE_FAKE_LLM=true (default)
- Open the widget and click on the chat button
- Type a question like "Tell me about your windows"
- Observe the token streaming effect (words appearing one by one)
- Verify the thinking indicator appears while waiting for a response
- Try sending another message while the AI is responding (should be disabled)

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

## Testing with a Real LLM API

To test with a real LLM (OpenAI API):

1. Create a `.env` file in the `apps/api` directory:
```bash
# Copy the example file
cp .env.example apps/api/.env

# Edit the file to add your OpenAI API key
# Change USE_FAKE_LLM=false
```

2. Restart the backend server:
```bash
cd apps/api
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. Test the chat with real LLM responses

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

### 4. LLM Response Issues
- **Cause**: Issues with LLM integration or token streaming
- **Solution**:
  - Check backend logs for LLM-related errors
  - Verify system prompt file exists at `apps/api/prompts/system.txt`
  - Ensure required dependencies are installed (`pip install -r requirements.txt`)
  - For real API use, verify your API key is set correctly in `.env`

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

The chat widget shows various status indicators:
- 🟢 **Connected**: WebSocket connection is active
- 🔴 **Disconnected**: No WebSocket connection
- ⚫️ **Thinking**: AI is processing your query (streaming tokens)
- If disconnected, a "Reconnect" button will appear

## Project Architecture

### Phase A - Foundation
- GitHub repository with proper structure and protection
- Docker infrastructure (Postgres, Redis)
- Development tooling and CI stub

### Phase B - Widget Static UI
- React/TypeScript frontend with Tailwind CSS
- Chat interface components
- Embedding script for third-party sites

### Phase C - WebSocket Echo
- FastAPI backend with WebSocket endpoints
- Session management with Redis (optional)
- Real-time messaging with reconnection logic

### Phase D - LLM Integration
- LangChain integration for AI capabilities
- Token streaming implementation
- System prompt for AI personality
- Fallback to fake LLM for testing

Remember: The backend API must be running for the WebSocket connection to work properly. If you encounter any issues, check both frontend and backend console logs.
