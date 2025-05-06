from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uuid
import json
import logging
import traceback
from typing import Dict, List, Any, Optional
from datetime import datetime
import asyncio
import os
import pathlib

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="GlazingAI API", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains like ["https://example.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Add CORS headers for WebSocket responses
@app.middleware("http")
async def add_cors_headers(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"  # In production, use specific domain
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

# Redis connection - optional for local development
use_redis = os.environ.get("USE_REDIS", "false").lower() == "true"
redis_client = None

if use_redis:
    try:
        import redis
        # Use connection pool for better stability
        redis_connection_pool = redis.ConnectionPool(
            host=os.environ.get("REDIS_HOST", "redis"),
            port=int(os.environ.get("REDIS_PORT", 6379)),
            db=0,
            decode_responses=True
        )
        def get_redis_client():
            return redis.Redis(connection_pool=redis_connection_pool)
        # Test connection
        redis_client = get_redis_client()
        redis_client.ping()
        logger.info("Connected to Redis successfully")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {str(e)}")
        use_redis = False
else:
    logger.info("Redis is disabled for local development")

# Store active WebSocket connections
active_connections: Dict[str, List[WebSocket]] = {}

# Load system prompt
SYSTEM_PROMPT_PATH = pathlib.Path(__file__).parent / "prompts" / "system.txt"
system_prompt = ""
try:
    if SYSTEM_PROMPT_PATH.exists():
        with open(SYSTEM_PROMPT_PATH, "r") as f:
            system_prompt = f.read().strip()
        logger.info(f"Loaded system prompt: {len(system_prompt)} chars")
    else:
        logger.warning(f"System prompt file not found at {SYSTEM_PROMPT_PATH}")
except Exception as e:
    logger.error(f"Error loading system prompt: {str(e)}")

# Keepalive ping task
async def keepalive_ping(websocket: WebSocket, session_id: str):
    """Send ping messages to keep connection alive."""
    try:
        while True:
            await asyncio.sleep(30)  # Send ping every 30 seconds
            try:
                if websocket.client_state == websocket.application_state == 1:  # WebSocket.CONNECTED
                    logger.debug(f"Sending keepalive ping to session {session_id}")
                    await websocket.send_json({
                        "type": "ping",
                        "timestamp": datetime.now().isoformat(),
                        "session_id": session_id
                    })
                else:
                    logger.debug(f"WebSocket for session {session_id} not connected, stopping keepalive")
                    break
            except Exception as e:
                logger.error(f"Error sending keepalive: {str(e)}")
                break
    except asyncio.CancelledError:
        logger.debug(f"Keepalive task cancelled for session {session_id}")
    except Exception as e:
        logger.error(f"Unexpected error in keepalive task: {str(e)}")

@app.get("/healthz")
async def health_check():
    """Health check endpoint for the API."""
    # Check Redis connection if enabled
    redis_status = "disabled"
    if use_redis:
        try:
            redis_client = get_redis_client()
            redis_client.ping()
            redis_status = "healthy"
        except Exception as e:
            redis_status = f"unhealthy: {str(e)}"
        
    return {
        "status": "healthy", 
        "service": "glazing-ai-api",
        "redis": redis_status,
        "timestamp": datetime.now().isoformat()
    }

# Import LLM helper - after app initialization to avoid circular imports
from llm import get_llm_response

async def process_message(websocket: WebSocket, session_id: str, message: str):
    """Process incoming WebSocket messages."""
    logger.info(f"Processing message: {message} from session {session_id}")
    
    try:
        # Try to parse as JSON
        try:
            data = json.loads(message)
            message_type = data.get("type", "text")
            
            if message_type == "ping":
                # Handle ping messages
                logger.info(f"Ping received from session {session_id}")
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat(),
                    "session_id": session_id
                })
                return
        except json.JSONDecodeError:
            # Not JSON, treat as plain text
            pass
        
        # Process with LLM and stream response
        # Initialize streaming to track complete response
        full_response = ""
        stream_start_time = datetime.now()
        
        # Send "thinking" status message
        await websocket.send_json({
            "type": "status",
            "message": "thinking",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        })
        
        # Define token callback for streaming
        async def send_token(token: str):
            nonlocal full_response
            full_response += token
            # Send token as separate message for streaming UI
            await websocket.send_json({
                "type": "token",
                "token": token,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            })
        
        # Process with LLM
        logger.info(f"Sending to LLM: {message}")
        
        # Stream tokens from LLM
        async for _ in get_llm_response(
            prompt=message,
            system_prompt=system_prompt,
            streaming_callback=send_token
        ):
            # Each token is handled by the callback
            pass
        
        # Calculate time taken
        time_taken = (datetime.now() - stream_start_time).total_seconds()
        logger.info(f"LLM response completed in {time_taken:.2f}s: {len(full_response)} chars")
        
        # Send completion message
        await websocket.send_json({
            "type": "completion",
            "message": full_response,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error processing message: {str(e)}")
        logger.error(traceback.format_exc())
        try:
            # Send error message to client
            error_msg = f"Error processing your message: {str(e)}"
            await websocket.send_json({
                "type": "error",
                "message": error_msg,
                "session_id": session_id
            })
        except Exception:
            pass

@app.websocket("/ws/{widget_key}")
async def websocket_endpoint(websocket: WebSocket, widget_key: str):
    """WebSocket endpoint for real-time chat."""
    # Log connection attempt
    logger.debug(f"WebSocket connection attempt with widget_key={widget_key}, client={websocket.client}")
    
    # Accept the connection
    await websocket.accept()
    logger.debug(f"Connection accepted for client={websocket.client}")
    
    # Generate a unique session ID
    session_id = str(uuid.uuid4())
    logger.info(f"New WebSocket connection: widget_key={widget_key}, session_id={session_id}")
    
    # Start keepalive task
    keepalive_task = None
    
    try:
        # Store session in Redis if available
        if use_redis and redis_client:
            try:
                redis_client.setex(
                    f"session:{session_id}", 
                    86400,  # 24 hours in seconds
                    json.dumps({"widget_key": widget_key, "created_at": datetime.now().isoformat()})
                )
            except Exception as e:
                logger.error(f"Error storing session in Redis: {str(e)}")
        
        # Add connection to active connections
        if widget_key not in active_connections:
            active_connections[widget_key] = []
        active_connections[widget_key].append(websocket)
        
        # Send welcome message
        welcome_message = {
            "type": "system",
            "message": f"Connected successfully with widget key: {widget_key}",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send_json(welcome_message)
        
        # Start keepalive task
        keepalive_task = asyncio.create_task(keepalive_ping(websocket, session_id))
        
        # Main communication loop
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                await process_message(websocket, session_id, data)
                
        except WebSocketDisconnect:
            logger.info(f"WebSocket disconnected gracefully: session_id={session_id}")
        except Exception as e:
            logger.error(f"Error in WebSocket communication: {str(e)}")
            logger.error(traceback.format_exc())
            
    except Exception as e:
        logger.error(f"Error setting up WebSocket: {str(e)}")
        logger.error(traceback.format_exc())
    
    finally:
        # Cancel keepalive task if it exists
        if keepalive_task:
            keepalive_task.cancel()
            
        # Always clean up the connection
        try:
            if widget_key in active_connections and websocket in active_connections[widget_key]:
                active_connections[widget_key].remove(websocket)
                if not active_connections[widget_key]:
                    del active_connections[widget_key]
            logger.info(f"WebSocket connection cleaned up: session_id={session_id}")
        except Exception as cleanup_error:
            logger.error(f"Error during connection cleanup: {str(cleanup_error)}")

@app.websocket("/ws/test")
async def test_websocket_endpoint(websocket: WebSocket):
    """Simple test WebSocket endpoint."""
    await websocket.accept()
    logger.info("Test WebSocket connection accepted")
    
    try:
        await websocket.send_json({
            "type": "system",
            "message": "Connected to test endpoint",
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            data = await websocket.receive_text()
            logger.info(f"Test endpoint received: {data}")
            
            await websocket.send_json({
                "type": "echo",
                "message": f"You sent: {data}",
                "timestamp": datetime.now().isoformat()
            })
            
    except WebSocketDisconnect:
        logger.info("Test WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in test WebSocket: {str(e)}")
        logger.error(traceback.format_exc())
