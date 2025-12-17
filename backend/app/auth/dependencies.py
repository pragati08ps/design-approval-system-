"""
Authentication dependencies for route protection.
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from bson import ObjectId
from app.auth.jwt_handler import verify_token
from app.database import get_database
from app.models.user import UserResponse

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserResponse:
    """
    Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer credentials

    Returns:
        UserResponse object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    payload = verify_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )

    # Fetch user from database
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Convert ObjectId to string
    user["id"] = str(user["_id"])
    del user["_id"]
    del user["password_hash"]

    return UserResponse(**user)


def require_role(*allowed_roles: str):
    """
    Dependency factory to restrict access to specific roles.

    Args:
        allowed_roles: Tuple of allowed role names

    Returns:
        Dependency function
    """
    async def role_checker(
        current_user: UserResponse = Depends(get_current_user)
    ) -> UserResponse:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker
