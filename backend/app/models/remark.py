"""
Remark models and schemas.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RemarkCreate(BaseModel):
    """Schema for creating a remark."""
    project_id: str
    remark_text: str


class RemarkResponse(BaseModel):
    """Schema for remark response."""
    id: str
    project_id: str
    user_id: str
    user_name: Optional[str] = None
    user_role: Optional[str] = None
    stage: str
    remark_text: str
    upload_version: int
    created_at: datetime
