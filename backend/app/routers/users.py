from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from datetime import datetime
from ..models.user import UserCreate, UserUpdate, UserResponse
from ..database import get_database
from ..auth.dependencies import get_current_user
from ..auth.password import hash_password

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[UserResponse])
async def get_all_users(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get all users (Accessible to all authenticated users)"""
    # Permission check removed to allow task assignment by any user

    
    users_collection = db.users
    users = await users_collection.find().to_list(length=None)
    
    return [
        UserResponse(
            id=str(user["_id"]),
            name=user["name"],
            email=user["email"],
            role=user["role"],
            created_at=user.get("created_at", datetime.now())
        )
        for user in users
    ]

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new user (Admin only)"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create users"
        )
    
    users_collection = db.users
    
    # Check if email already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_dict = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "created_at": datetime.now(),
        "is_active": True
    }
    
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(user_dict["_id"]),
        name=user_dict["name"],
        email=user_dict["email"],
        role=user_dict["role"],
        created_at=user_dict["created_at"]
    )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    user_data: UserUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a user (Admin only)"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update users"
        )
    
    from bson import ObjectId
    
    users_collection = db.users
    
    # Build update data
    update_data = {}
    if user_data.name:
        update_data["name"] = user_data.name
    if user_data.email:
        # Check if new email already exists
        existing_user = await users_collection.find_one({"email": user_data.email, "_id": {"$ne": ObjectId(user_id)}})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        update_data["email"] = user_data.email
    if user_data.role:
        update_data["role"] = user_data.role
    if user_data.password:
        update_data["password_hash"] = hash_password(user_data.password)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    # Update user
    result = await users_collection.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=True
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=str(result["_id"]),
        name=result["name"],
        email=result["email"],
        role=result["role"],
        created_at=result.get("created_at", datetime.now())
    )

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete a user (Admin only)"""
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete users"
        )
    
    from bson import ObjectId
    
    # Prevent self-deletion
    if str(current_user.id) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    users_collection = db.users
    result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return None
