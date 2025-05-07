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
   http://localhost:5173/demo
   ```
5. To view component stories:
   ```
   npm run storybook
   ```

### Technical Notes
- Widget is designed to be embedded in any website
- Styling is contained and won't affect parent site
- Widget state persists in browser storage
- Widget key identifies the widget instance

## Phase C: WebSocket Echo

### Implementation Details
- Added WebSocket endpoint to FastAPI backend
- Implemented real-time message exchange
- Added session management for conversations
- Created connection handling with ping/pong for keepalive
- Implemented message types:
  - User messages
  - System messages
  - Status updates
  - Tokens (for streaming)
  - Completion messages

### Testing Instructions
1. Start the backend:
   ```
   docker-compose up -d
   ```
2. Start the frontend:
   ```
   cd apps/widget && npm run dev
   ```
3. Open the demo page
4. Send messages in the chat
5. Verify that messages are echoed back

### Technical Notes
- WebSocket connections use the endpoint: `ws://localhost:8000/ws/{widget_key}`
- Sessions are identified by a UUID
- Connection lifecycle includes:
  - Connection establishment
  - Authentication (basic)
  - Message exchange
  - Ping/pong for keepalive
  - Graceful disconnection

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
   http://localhost:5173/demo
   ```

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
