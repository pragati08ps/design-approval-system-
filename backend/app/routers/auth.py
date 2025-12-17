"""
Authentication routes: registration, login, and user info.
"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.auth.password import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.auth.dependencies import get_current_user
from app.database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user.

    Args:
        user_data: User registration data

    Returns:
        JWT token and user information

    Raises:
        HTTPException: If email already exists
    """
    db = get_database()

    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "role": user_data.role,
        "created_at": datetime.utcnow(),
        "is_active": True
    }

    # Insert user
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Create JWT token
    token = create_access_token({
        "user_id": user_id,
        "role": user_data.role
    })

    # Prepare user response
    user_response = UserResponse(
        id=user_id,
        name=user_data.name,
        email=user_data.email,
        role=user_data.role,
        created_at=user_doc["created_at"],
        is_active=True
    )

    return TokenResponse(
        access_token=token,
        user=user_response
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """
    Login user and return JWT token.

    Args:
        credentials: Login credentials

    Returns:
        JWT token and user information

    Raises:
        HTTPException: If credentials are invalid
    """
    db = get_database()

    # Find user by email
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )

    # Create JWT token
    user_id = str(user["_id"])
    token = create_access_token({
        "user_id": user_id,
        "role": user["role"]
    })

    # Prepare user response
    user_response = UserResponse(
        id=user_id,
        name=user["name"],
        email=user["email"],
        role=user["role"],
        created_at=user["created_at"],
        is_active=user["is_active"]
    )

    return TokenResponse(
        access_token=token,
        user=user_response
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current user from JWT token

    Returns:
        User information
    """
    return current_user
