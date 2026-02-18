"""
Pydantic models for request/response validation and MongoDB documents
"""
from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
    
    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

# ============ User Models ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime
    
    class Config:
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# ============ Post Models ============

class PostContent(BaseModel):
    """Content model supporting both Lexical JSON and HTML"""
    lexical: Dict[str, Any] = Field(default_factory=dict)
    html: str = ""

class PostCreate(BaseModel):
    """Model for creating a new post"""
    title: str = "Untitled"
    content: PostContent = Field(default_factory=PostContent)

class PostUpdate(BaseModel):
    """Model for updating a post (all fields optional)"""
    title: Optional[str] = None
    content: Optional[PostContent] = None

class PostResponse(BaseModel):
    """Response model for a post"""
    id: str
    title: str
    content: PostContent
    status: str
    author_id: str
    created_at: str  # Changed to string for ISO format with 'Z'
    updated_at: str  # Changed to string for ISO format with 'Z'
    
    class Config:
        json_encoders = {ObjectId: str}

class PostInDB(BaseModel):
    """Complete post model as stored in database"""
    title: str
    content: PostContent
    status: str = "draft"  # draft or published
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ============ AI Models ============

class AIGenerateRequest(BaseModel):
    """Request model for AI text generation"""
    text: str
    action: str  # "summarize" or "fix_grammar" or "continue"
    max_tokens: int = 500

class AIGenerateResponse(BaseModel):
    """Response model for AI generated text"""
    generated_text: str
    action: str
