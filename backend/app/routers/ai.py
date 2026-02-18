"""
AI Integration routes: Text generation using Google Gemini API
"""
import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from google import genai
from google.genai import types
from dotenv import load_dotenv
from ..models import AIGenerateRequest, AIGenerateResponse
from ..auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/ai", tags=["AI"])

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

async def generate_stream(text: str, action: str):
    """
    Generate text using Gemini API and stream the response
    """
    if not GEMINI_API_KEY or not client:
        yield "data: Error: GEMINI_API_KEY not configured\n\n"
        return
    
    try:
        # Build prompt based on action
        prompts = {
            "summarize": f"Summarize the following text concisely in 2-3 sentences:\n\n{text}",
            "fix_grammar": f"Fix any grammar and spelling errors in the following text, maintain the same tone and style:\n\n{text}",
            "continue": f"Continue writing the following text in a natural way:\n\n{text}",
            "expand": f"Expand on the following text with more details and examples:\n\n{text}"
        }
        
        prompt = prompts.get(action, prompts["summarize"])
        
        # Stream response using new API
        response = client.models.generate_content_stream(
            model='models/gemini-2.5-flash',
            contents=prompt
        )
        
        for chunk in response:
            if chunk.text:
                # Send as Server-Sent Events (SSE) format
                yield f"data: {chunk.text}\n\n"
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

@router.post("/generate")
async def generate_ai_text(
    request: AIGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate or modify text using AI (streaming response)
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please set GEMINI_API_KEY in .env file"
        )
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty"
        )
    
    return StreamingResponse(
        generate_stream(request.text, request.action),
        media_type="text/event-stream"
    )

@router.post("/generate-sync", response_model=AIGenerateResponse)
async def generate_ai_text_sync(
    request: AIGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate or modify text using AI (non-streaming, for simple requests)
    """
    if not GEMINI_API_KEY or not client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service not configured. Please set GEMINI_API_KEY in .env file"
        )
    
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty"
        )
    
    try:
        # Build prompt based on action
        prompts = {
            "summarize": f"Summarize the following text concisely in 2-3 sentences:\n\n{request.text}",
            "fix_grammar": f"Fix any grammar and spelling errors in the following text, maintain the same tone and style:\n\n{request.text}",
            "continue": f"Continue writing the following text in a natural way:\n\n{request.text}",
            "expand": f"Expand on the following text with more details and examples:\n\n{request.text}"
        }
        
        prompt = prompts.get(request.action, prompts["summarize"])
        
        # Generate content using new API
        response = client.models.generate_content(
            model='models/gemini-2.5-flash',
            contents=prompt
        )
        
        return AIGenerateResponse(
            generated_text=response.text,
            action=request.action
        )
        
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg or "not found" in error_msg.lower():
            detail = "AI service unavailable. Please get a valid Gemini API key from https://aistudio.google.com/app/apikey and update .env file"
        elif "403" in error_msg or "forbidden" in error_msg.lower() or "API_KEY_INVALID" in error_msg:
            detail = "Invalid or expired Gemini API key. Get a new key from https://aistudio.google.com/app/apikey"
        else:
            detail = f"AI generation failed: {error_msg}"
        
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=detail
        )
