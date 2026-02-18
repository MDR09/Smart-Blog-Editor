"""
Post management routes: CRUD operations for blog posts
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from ..database import get_database
from ..models import PostCreate, PostUpdate, PostResponse, PostInDB
from ..auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["Posts"])

def post_helper(post) -> dict:
    """Helper to convert MongoDB document to dict"""
    created_at = post["created_at"]
    updated_at = post["updated_at"]
    
    # Ensure timestamps are ISO strings with 'Z' suffix for UTC
    if isinstance(created_at, datetime):
        created_at = created_at.isoformat() + 'Z'
    if isinstance(updated_at, datetime):
        updated_at = updated_at.isoformat() + 'Z'
    
    return {
        "id": str(post["_id"]),
        "title": post["title"],
        "content": post["content"],
        "status": post["status"],
        "author_id": str(post["author_id"]),
        "created_at": created_at,
        "updated_at": updated_at
    }

@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post: PostCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new draft post
    """
    db = get_database()
    
    post_dict = {
        "title": post.title,
        "content": post.content.dict(),
        "status": "draft",
        "author_id": str(current_user["_id"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.posts.insert_one(post_dict)
    created_post = await db.posts.find_one({"_id": result.inserted_id})
    
    return PostResponse(**post_helper(created_post))

@router.get("/", response_model=List[PostResponse])
async def get_posts(
    status: Optional[str] = Query(None, regex="^(draft|published)$"),
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all posts for the current user, optionally filtered by status
    """
    db = get_database()
    
    query = {"author_id": str(current_user["_id"])}
    if status:
        query["status"] = status
    
    posts = await db.posts.find(query).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
    
    return [PostResponse(**post_helper(post)) for post in posts]

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific post by ID
    """
    db = get_database()
    
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if str(post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this post"
        )
    
    return PostResponse(**post_helper(post))

@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a post (auto-save endpoint)
    """
    db = get_database()
    
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if str(post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    # Build update dict with only provided fields
    update_data = {"updated_at": datetime.utcnow()}
    if post_update.title is not None:
        update_data["title"] = post_update.title
    if post_update.content is not None:
        update_data["content"] = post_update.content.dict()
    
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": update_data}
    )
    
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return PostResponse(**post_helper(updated_post))

@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Change post status to published
    """
    db = get_database()
    
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if str(post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to publish this post"
        )
    
    await db.posts.update_one(
        {"_id": ObjectId(post_id)},
        {"$set": {"status": "published", "updated_at": datetime.utcnow()}}
    )
    
    updated_post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return PostResponse(**post_helper(updated_post))

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a post
    """
    db = get_database()
    
    if not ObjectId.is_valid(post_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID"
        )
    
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if str(post["author_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    await db.posts.delete_one({"_id": ObjectId(post_id)})
    return None
