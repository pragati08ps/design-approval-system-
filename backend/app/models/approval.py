"""
Approval models and schemas.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel

ApprovalStatus = Literal["pending", "approved", "rejected"]


class ApprovalResponse(BaseModel):
    """Schema for approval response."""
    id: str
    project_id: str
    stage: str
    reviewer_id: str
    reviewer_name: Optional[str] = None
    status: str
    reviewed_at: Optional[datetime] = None
    created_at: datetime
