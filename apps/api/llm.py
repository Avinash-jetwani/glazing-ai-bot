# Temporary file for fixing the API

import os
import logging
import asyncio
from typing import (
    AsyncIterator,
    Any,
    Optional,
    Callable,
)
from langchain.callbacks.base import BaseCallbackHandler
import random
from dotenv import load_dotenv

# Load environment variables from all possible locations
load_dotenv()  # From .env in current directory
load_dotenv("/app/.env")  # Explicitly from /app/.env (Docker container path)

# Configure logging
logger = logging.getLogger(__name__)

# Get API Key from environment - force reload from environment to get latest values
os.environ.setdefault("USE_FAKE_LLM", "true")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
USE_FAKE_LLM = os.environ.get("USE_FAKE_LLM", "true").lower() == "true"

# For debugging - log the environment variables
logger.info(f"USE_FAKE_LLM set to: {USE_FAKE_LLM}")
logger.info(f"OPENAI_API_KEY available: {bool(OPENAI_API_KEY)}")


class StreamingCallbackHandler(BaseCallbackHandler):
    """Callback handler for streaming LLM responses."""

    def __init__(self, streaming_callback: Callable[[str], Any]) -> None:
        """Initialize with callback to handle each token."""
        self.streaming_callback = streaming_callback

    def on_llm_new_token(self, token: str, **kwargs: Any) -> None:
        """Run on new LLM token. Only available when streaming is enabled."""
        if self.streaming_callback:
            # Handle both coroutine and regular functions
            if asyncio.iscoroutinefunction(self.streaming_callback):
                # Don't await here - it's awaited in the LangChain internals
                self.streaming_callback(token)
            else:
                self.streaming_callback(token)


class FakeLLM:
    """Fake LLM implementation for testing without API costs."""

    def __init__(self) -> None:
        self.responses = [
            "Hello! I'm a simulated AI assistant for testing purposes.",
            "I can help answer your questions about our products and services.",
            "This is a placeholder response to demonstrate token streaming.",
            "In production, this would be replaced with a real LLM API call.",
            "To test the system properly, I'll simulate thinking and response delays.",
        ]

    async def astream(self, prompt: str, **kwargs: Any) -> AsyncIterator[str]:
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
    streaming_callback: Optional[Callable[[str], Any]] = None,
) -> AsyncIterator[str]:
    """Get response from LLM, either real or fake based on configuration."""

    # Re-check the environment variable to ensure it's up to date
    use_fake = os.environ.get("USE_FAKE_LLM", "true").lower() == "true"
    logger.info(f"Running with USE_FAKE_LLM={use_fake}")

    if use_fake:
        logger.info("Using fake LLM for response")
        fake_llm = FakeLLM()

        # Always stream tokens, regardless of streaming_callback
        async for token in fake_llm.astream(prompt):
            if streaming_callback:
                # Properly await coroutine callbacks
                if asyncio.iscoroutinefunction(streaming_callback):
                    await streaming_callback(token)
                else:
                    streaming_callback(token)
            yield token
    else:
        # Use real OpenAI/LangChain implementation
        try:
            from langchain_openai import ChatOpenAI

            # Update imports for the correct message types
            from langchain_core.messages import HumanMessage, SystemMessage

            # Get the latest API key from environment
            api_key = os.environ.get("OPENAI_API_KEY", "")
            if not api_key:
                logger.error("OpenAI API key not found")
                raise ValueError(
                    "OpenAI API key not found. Set OPENAI_API_KEY in environment or .env file."
                )

            # Create messages
            messages = []
            if system_prompt:
                messages.append(SystemMessage(content=system_prompt))
            messages.append(HumanMessage(content=prompt))

            # Create OpenAI client with streaming enabled and a callback handler
            logger.info(
                f"Creating ChatOpenAI with key length: {len(api_key)}, "
                f"model: {os.environ.get('MODEL_NAME', 'gpt-3.5-turbo')}"
            )

            # Use a direct approach with OpenAI API
            try:
                # Import the OpenAI client
                import openai

                # Configure the OpenAI client
                openai.api_key = api_key

                # Create the chat completion with streaming
                logger.info("Starting direct OpenAI API call with streaming")

                # Build the messages list in OpenAI format
                openai_messages = []
                if system_prompt:
                    openai_messages.append({"role": "system", "content": system_prompt})
                openai_messages.append({"role": "user", "content": prompt})

                # Use the AsyncClient for streaming
                client = openai.AsyncClient(api_key=api_key)

                # Create a streaming response
                logger.info("Starting OpenAI streaming chat completion")
                stream = await client.chat.completions.create(
                    model=os.environ.get("MODEL_NAME", "gpt-3.5-turbo"),
                    messages=openai_messages,
                    temperature=float(os.environ.get("TEMPERATURE", "0.7")),
                    stream=True,
                )

                logger.info("Processing OpenAI streaming response")
                async for chunk in stream:
                    if (
                        hasattr(chunk.choices[0], "delta")
                        and hasattr(chunk.choices[0].delta, "content")
                        and chunk.choices[0].delta.content
                    ):
                        content = chunk.choices[0].delta.content
                        logger.info(f"Received content chunk: {content[:10]}...")

                        if streaming_callback:
                            # Properly await coroutine callbacks
                            if asyncio.iscoroutinefunction(streaming_callback):
                                await streaming_callback(content)
                            else:
                                streaming_callback(content)

                        yield content

                logger.info("OpenAI streaming completed successfully")

            # If direct OpenAI approach fails, try LangChain
            except (ImportError, Exception) as direct_api_error:
                logger.warning(
                    f"Direct OpenAI API approach failed: {str(direct_api_error)}, "
                    "trying LangChain"
                )

                # Create LangChain ChatOpenAI with streaming
                callback_handler = (
                    StreamingCallbackHandler(streaming_callback)
                    if streaming_callback
                    else None
                )

                llm = ChatOpenAI(
                    openai_api_key=api_key,
                    model_name=os.environ.get("MODEL_NAME", "gpt-3.5-turbo"),
                    temperature=float(os.environ.get("TEMPERATURE", "0.7")),
                    streaming=True,
                    callbacks=[callback_handler] if callback_handler else None,
                )

                # Use the simple astream method instead of astream_events
                logger.info("Starting to stream tokens from LangChain ChatOpenAI")
                response = await llm.agenerate([messages])
                content = response.generations[0][0].text

                # If we got here, we couldn't stream, so send the entire content at once
                logger.info(f"Got complete response: {content[:30]}...")
                if streaming_callback:
                    # Send the full content through the callback to simulate streaming
                    if asyncio.iscoroutinefunction(streaming_callback):
                        await streaming_callback(content)
                    else:
                        streaming_callback(content)

                # Yield the entire content
                yield content

        except ImportError as e:
            logger.error(f"LangChain/OpenAI module not installed: {str(e)}")
            raise ImportError(
                "Required packages not installed. Run: pip install langchain-openai openai"
            )
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            # Fall back to fake LLM in case of error
            logger.info("Falling back to fake LLM due to error")
            fake_llm = FakeLLM()
            async for token in fake_llm.astream(prompt):
                if streaming_callback:
                    # Properly await coroutine callbacks
                    if asyncio.iscoroutinefunction(streaming_callback):
                        await streaming_callback(token)
                    else:
                        streaming_callback(token)
                yield token
