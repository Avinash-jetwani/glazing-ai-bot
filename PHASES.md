# GlazingAI Chat Widget - Project Phases

This document provides an overview of all development phases for the GlazingAI Chat Widget project, including implementation details, testing procedures, and technical information.

## Phase A: Foundation

### Implementation Details
- Created GitHub repository structure
- Set up Docker infrastructure:
  - FastAPI backend service
  - PostgreSQL database
  - Redis service for caching
- Configured Docker Compose for local development
- Established environment variables and configuration
- Set up basic project structure:
  - `/apps/api`: Backend API service
  - `/apps/widget`: Frontend widget

### Testing Instructions
1. Clone the repository
2. Start the Docker services:
   ```
   docker-compose up -d
   ```
3. Verify services are running:
   ```
   docker-compose ps
   ```
4. Check backend health endpoint:
   ```
   curl http://localhost:8000/healthz
   ```

### Technical Notes
- FastAPI runs on port 8000
- Database migrations are handled automatically on container startup
- Default configuration is in `.env.example` file

## Phase B: Widget Static UI

### Implementation Details
- Created React-based widget UI:
  - Chat interface with message history
  - User input form
  - Loading/typing indicators
  - Basic styling with Tailwind CSS
- Set up build process using Vite
- Added Storybook for component development/testing
- Created demo page to showcase the widget

### Testing Instructions
1. Navigate to the widget directory:
   ```
   cd apps/widget
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. Open the demo page in your browser:
   ```
   http://localhost:5174/demo
   ```
   Note: Port may vary (5173, 5174, etc.) - check terminal output for correct port
5. To view component stories:
   ```
   npm run storybook
   ```

### Technical Notes
- Widget is designed to be embedded in any website
- Styling is contained and won't affect parent site
- Widget state persists in browser storage
- Widget key identifies the widget instance
- Key components:
  - `/apps/widget/src/components/ChatModal.tsx`: Main chat interface
  - `/apps/widget/src/components/Fab.tsx`: Floating action button
  - `/apps/widget/public/demo.html`: Demo page for testing

## Phase C: WebSocket Echo

### Implementation Details
- Added WebSocket endpoint to FastAPI backend:
  - Main endpoint at `/ws/{widget_key}`
  - Test endpoint at `/ws/test` for direct testing
- Implemented real-time message exchange with JSON-based protocol
- Added session management with UUID generation for each connection
- Set up optional Redis storage for persisting sessions (configurable via `USE_REDIS` env variable)
- Implemented connection handling with ping/pong for keepalive (30-second interval)
- Created comprehensive message type system:
  - `text`: Basic text messages from user
  - `echo`: Server responses to user messages
  - `system`: System notifications and status updates
  - `ping`/`pong`: Connection keepalive messages
  - `status`: Status indicators (e.g., "thinking")
  - `token`: Individual tokens for streaming responses
  - `completion`: Final assembled response
  - `error`: Error messages with details

### Testing Instructions
1. Start the backend:
   ```
   docker-compose up -d
   ```
2. Start the frontend:
   ```
   cd apps/widget && npm run dev
   ```
3. Open the demo page in your browser:
   ```
   http://localhost:5174/demo
   ```
   Note: Port may vary (5173, 5174, etc.) - check terminal output for correct port
4. Click on the chat button in the bottom right corner
5. Send messages in the chat and verify they're echoed back
6. Test connection resilience:
   ```
   docker-compose restart api
   ```
   The widget should automatically reconnect

### Technical Notes
- WebSocket connections use endpoint: `ws://localhost:8000/ws/{widget_key}`
- WebSockets automatically adapt to secure connections (wss:// vs ws://)
- Sessions are identified by a UUID generated on connection
- Session information is stored in Redis (when enabled) with a 24-hour TTL
- Connection lifecycle includes:
  - Connection establishment and acceptance
  - Session creation with UUID
  - Automatic keepalive via ping/pong
  - Message exchange with JSON formatting
  - Graceful disconnection with error handling
- Reconnection logic:
  - Exponential backoff strategy (increasing delay between attempts)
  - Maximum 15 reconnect attempts
  - Manual reconnect button after max attempts
- Key components:
  - `/apps/api/main.py`: FastAPI WebSocket endpoints
  - `/apps/widget/src/hooks/useWebSocket.ts`: Frontend WebSocket hook
  - `/apps/widget/src/components/ChatModal.tsx`: Chat UI with connection status

## Phase D: LLM Integration

### Implementation Details
- Added LangChain and OpenAI integration
- Created token streaming pipeline
- Implemented system prompts for AI personality
- Added fake LLM mode for testing without API costs
- Created toggleable real/fake mode via environment variables
- Enhanced WebSocket to stream tokens for realistic typing effect

### Testing Instructions
1. Configure LLM mode in `.env` file:
   - For fake LLM testing:
     ```
     USE_FAKE_LLM=true
     ```
   - For real OpenAI integration:
     ```
     USE_FAKE_LLM=false
     OPENAI_API_KEY=your-api-key-here
     ```

2. Switch between modes:
   ```
   # For fake mode
   docker-compose exec api sh -c "sed -i 's/USE_FAKE_LLM=false/USE_FAKE_LLM=true/g' /app/.env"

   # For real OpenAI mode
   docker-compose exec api sh -c "sed -i 's/USE_FAKE_LLM=true/USE_FAKE_LLM=false/g' /app/.env"
   ```

3. Restart API after changing mode:
   ```
   docker-compose restart api
   ```

4. Test in browser at:
   ```
   http://localhost:5174/demo
   ```
   Note: Port may vary (5173, 5174, etc.) - check terminal output for correct port

### Technical Notes
- The system prompt for the AI assistant is located at `apps/api/prompts/system.txt`
- Token streaming uses a custom callback handler
- Fake LLM uses predefined responses with realistic delays
- LLM integration supports:
  - Direct OpenAI API calls
  - LangChain integration as fallback
- Environment variables control model settings:
  - `MODEL_NAME`: The OpenAI model to use (default: gpt-3.5-turbo)
  - `TEMPERATURE`: Controls randomness (default: 0.7)

## Future Phases

### Phase E: Analytics & Logging
- Track user interactions
- Collect conversation metrics
- Implement user feedback mechanisms

### Phase F: Multi-tenant Support
- Support multiple widgets with different settings
- Add client/tenant management
- Implement tenant-specific prompts and models

### Phase G: Advanced NLP Features
- Add conversation summarization
- Implement sentiment analysis
- Add RAG (Retrieval Augmented Generation) for company-specific knowledge
