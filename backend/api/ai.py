import os
import httpx
import logging
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, field_validator
from typing import List, Dict, Any

logger = logging.getLogger(__name__)
# Set logger level to DEBUG to capture more detailed logs
# You might want to set this based on an environment variable in production
logger.setLevel(logging.DEBUG) 
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

router = APIRouter()

# --- Configuration --- Get API Key and Endpoint from Environment Variables --- #
# IMPORTANT: User must set these environment variables for the backend service.
LLM_API_KEY = os.getenv("LLM_API_KEY")
# Default to a common OpenAI-compatible endpoint if not set
LLM_API_ENDPOINT = os.getenv("LLM_API_ENDPOINT", "https://openrouter.ai/api/v1") 
# You might need to change the default model based on the endpoint
DEFAULT_MODEL = os.getenv("LLM_MODEL", "qwen/qwen3-30b-a3b:free").strip() # Ensure default is also stripped

class ChatMessage(BaseModel):
    role: str # e.g., "user", "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = DEFAULT_MODEL
    # Add other parameters like temperature, max_tokens if needed

    @field_validator('model')
    @classmethod
    def strip_model_whitespace(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

async def call_llm_api(payload: Dict[str, Any]) -> str:
    """Makes the actual API call to the LLM provider."""
    logger.debug("Entering call_llm_api function.") # Added log
    if not LLM_API_KEY:
        logger.error("LLM_API_KEY environment variable is not set.")
        raise HTTPException(status_code=500, detail="AI service is not configured (Missing API Key).")
    if not LLM_API_ENDPOINT:
         logger.error("LLM_API_ENDPOINT environment variable is not set.")
         raise HTTPException(status_code=500, detail="AI service is not configured (Missing API Endpoint).")

    headers = {
        # Mask the key in logs if desired, but ensure the actual header is correct
        "Authorization": f"Bearer {LLM_API_KEY}", 
        "Content-Type": "application/json",
        # Optional OpenRouter headers for ranking/identification
        "HTTP-Referer": "http://localhost:3000", # Replace with your actual site URL if desired
        "X-Title": "Elektron Dashboard", # Replace with your actual site name if desired
    }
    
    # Log endpoint and payload (mask sensitive parts if necessary)
    masked_key = f"{LLM_API_KEY[:5]}...{LLM_API_KEY[-4:]}" if LLM_API_KEY else "None"
    logger.debug(f"LLM API Endpoint: {LLM_API_ENDPOINT}")
    logger.debug(f"LLM API Key (Masked): {masked_key}")
    # Consider redacting or summarizing messages if they contain sensitive info
    logger.debug(f"LLM Request Payload: {payload}") 

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            logger.info(f"Sending request to LLM endpoint: {LLM_API_ENDPOINT}")
            
            response = await client.post(LLM_API_ENDPOINT + "/chat/completions", headers=headers, json=payload) # Corrected endpoint path
            
            logger.info(f"Received response status code: {response.status_code}") # Added log
            
            # Log response headers and raw text for debugging if needed
            # logger.debug(f"LLM Response Headers: {response.headers}")
            # logger.debug(f"LLM Response Raw Text: {response.text}")
            
            response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
            
            response_data = response.json()
            logger.info("Received successful response from LLM API.")
            logger.debug(f"LLM Response Data: {response_data}") # Added log
            
            # --- Parse the response --- 
            # This structure assumes an OpenAI-compatible response.
            # Adjust based on the actual API you are using (e.g., Gemini, Anthropic).
            if response_data.get("choices") and len(response_data["choices"]) > 0:
                message = response_data["choices"][0].get("message", {}).get("content")
                if message:
                    logger.debug(f"Extracted message content: {message[:100]}...") # Log first 100 chars
                    return message.strip()
                else:
                    logger.error("LLM API response missing message content.")
                    raise HTTPException(status_code=500, detail="AI service returned unexpected response format (missing content).")
            else:
                logger.error(f"LLM API response missing choices or empty choices array: {response_data}")
                raise HTTPException(status_code=500, detail="AI service returned unexpected response structure (missing choices).")

        except httpx.HTTPStatusError as e:
            # Log the detailed error from the LLM API
            logger.exception(f"HTTP error calling LLM API: {e.response.status_code} - {e.response.text}", exc_info=True) # Added exc_info
            raise HTTPException(status_code=e.response.status_code, detail=f"Error from AI service: {e.response.text}")
        except httpx.RequestError as e:
            # Log network-related errors
            logger.exception(f"Request error calling LLM API: {e}", exc_info=True) # Added exc_info
            raise HTTPException(status_code=503, detail=f"Could not connect to AI service: {e}")
        except Exception as e:
            # Log any other unexpected errors with traceback
            logger.exception(f"An unexpected error occurred in call_llm_api: {e}", exc_info=True) # Added exc_info
            raise HTTPException(status_code=500, detail=f"An internal error occurred while contacting the AI service.")

@router.post("/chat")
async def handle_chat(chat_request: ChatRequest):
    """Receives chat messages from frontend, calls LLM API, returns response."""
    logger.debug(f"Received chat request: Model={chat_request.model}, Messages Count={len(chat_request.messages)}") # Added log
    
    # Prepare payload for the LLM API (OpenAI format)
    # You might need to adapt this if your chosen LLM uses a different format
    api_payload = {
        "model": "qwen/qwen3-30b-a3b:free", # <-- HARDCODED FOR DIAGNOSTIC PURPOSES
        "messages": [msg.dict() for msg in chat_request.messages], 
        # Add other parameters like "temperature", "max_tokens" here if needed
    }
    logger.debug(f"Prepared API payload for LLM (MODEL IS HARDCODED): {api_payload}") # Updated log

    try:
        ai_response_content = await call_llm_api(api_payload)
        logger.debug("Successfully received response content from call_llm_api.") # Added log
        return {"role": "assistant", "content": ai_response_content}
    except HTTPException as e:
        # Re-raise HTTPExceptions directly to keep the original status code and detail
        logger.error(f"HTTPException occurred during AI chat handling: {e.status_code} - {e.detail}")
        raise e
    except Exception as e:
        # Catch any other unexpected errors during the process
        logger.exception(f"Unexpected error in handle_chat: {e}", exc_info=True) # Added exc_info
        raise HTTPException(status_code=500, detail="An internal server error occurred processing the chat request.")

# You can add more AI-related endpoints here later 