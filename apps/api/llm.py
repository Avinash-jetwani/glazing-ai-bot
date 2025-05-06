import os
import logging
import asyncio
from typing import AsyncIterator, List, Dict, Any, Optional, Callable, Union
from langchain.callbacks.base import BaseCallbackHandler
from langchain.schema import LLMResult
import time
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Get API Key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
USE_FAKE_LLM = os.getenv("USE_FAKE_LLM", "true").lower() == "true"

class StreamingCallbackHandler(BaseCallbackHandler):
    """Callback handler for streaming LLM responses."""
    
    def __init__(self, streaming_callback: Callable[[str], None]):
        """Initialize with callback to handle each token."""
        self.streaming_callback = streaming_callback
        
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""
        if self.streaming_callback:
            self.streaming_callback(token)


class FakeLLM:
    """Fake LLM implementation for testing without API costs."""
    
    def __init__(self):
        self.responses = [
            "Hello! I'm a simulated AI assistant for testing purposes.",
            "I can help answer your questions about our products and services.",
            "This is a placeholder response to demonstrate token streaming.",
            "In production, this would be replaced with a real LLM API call.",
            "To test the system properly, I'll simulate thinking and response delays."
        ]
    
    async def astream(self, prompt: str, **kwargs) -> AsyncIterator[str]:
        """Stream a fake response token by token."""
        # Pick a random response
        response = random.choice(self.responses)
        
        # Stream it token by token with realistic delays
        words = response.split()
        for word in words:
            # Add the word and space
            yield word + " "
            # Random delay between words to simulate thinking
            await asyncio.sleep(random.uniform(0.1, 0.3))


async def get_llm_response(
    prompt: str, 
    system_prompt: Optional[str] = None,
    streaming_callback: Optional[Callable[[str], None]] = None
) -> Union[str, AsyncIterator[str]]:
    """Get response from LLM, either real or fake based on configuration."""
    
    if USE_FAKE_LLM:
        logger.info("Using fake LLM for response")
        fake_llm = FakeLLM()
        
        if streaming_callback:
            # Stream with callback
            async for token in fake_llm.astream(prompt):
                streaming_callback(token)
                yield token
        else:
            # Collect all tokens for non-streaming response
            result = ""
            async for token in fake_llm.astream(prompt):
                result += token
            return result
    else:
        # Use real OpenAI/LangChain implementation
        try:
            from langchain_openai import ChatOpenAI
            from langchain.schema import HumanMessage, SystemMessage
            
            if not OPENAI_API_KEY:
                logger.error("OpenAI API key not found")
                raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY in environment or .env file.")
            
            # Create messages
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=prompt))
            
            # Create OpenAI client
            llm = ChatOpenAI(
                openai_api_key=OPENAI_API_KEY,
                model_name="gpt-3.5-turbo",
                temperature=0.7,
                streaming=True
            )
            
            if streaming_callback:
                # Stream with callback
                callback_handler = StreamingCallbackHandler(streaming_callback)
                async for token in llm.astream_events(
                    messages,
                    event_type="on_llm_new_token",
                    callbacks=[callback_handler]
                ):
                    if "token" in token:
                        token_str = token["token"]
                        yield token_str
            else:
                # Return complete response
                result = await llm.ainvoke(messages)
                return result.content
                
        except ImportError:
            logger.error("LangChain OpenAI module not installed")
            raise ImportError("Required packages not installed. Run: pip install langchain-openai")
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            # Fall back to fake LLM in case of error
            logger.info("Falling back to fake LLM due to error")
            fake_llm = FakeLLM()
            result = ""
            async for token in fake_llm.astream(prompt):
                if streaming_callback:
                    streaming_callback(token)
                result += token
                yield token if streaming_callback else result 