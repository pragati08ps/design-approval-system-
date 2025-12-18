"""
User models and schemas.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

# Valid user roles
UserRole = Literal[
    "Designer",
    "Digital Marketer",
    "Admin",
    "Frontend Developer",
    "Manager",
    "Python Developer",
    "Client"
]


class UserRegister(BaseModel):
    """Schema for user registration."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (without password)."""
    id: str
    name: str
    email: str
    role: str
    created_at: datetime
    is_active: bool = True


class User(BaseModel):
    """Internal user model."""
    id: str
    name: str
    email: str
    role: str
    password: str
    created_at: datetime
    is_active: bool = True


class UserCreate(BaseModel):
    """Schema for creating a user (Admin only)."""
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole


class UserUpdate(BaseModel):
    """Schema for updating a user (Admin only)."""
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[UserRole] = None


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
