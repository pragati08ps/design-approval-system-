"""
Project models and schemas.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field

# Valid design types
DesignType = Literal[
    "Poster",
    "Webpage",
    "Video",
    "Brochure",
    "Flyers",
    "Logo",
    "Nameboard",
    "Letterhead"
]

# Valid workflow stages
WorkflowStage = Literal[
    "digital_marketer",
    "designer",
    "graphic_designer",
    "manager",
    "admin",
    "client",
    "completed"
]


class ProjectCreate(BaseModel):
    """Schema for creating a new project (Digital Marketer)."""
    project_name: str = Field(..., min_length=3, max_length=200)
    content_description: str
    expected_completion_date: datetime


class DesignerUpload(BaseModel):
    """Schema for designer uploading design."""
    design_type: DesignType


class ProjectUpdate(BaseModel):
    """Schema for updating project details."""
    project_name: Optional[str] = None
    content_description: Optional[str] = None
    expected_completion_date: Optional[datetime] = None


class ProjectResponse(BaseModel):
    """Schema for project response."""
    id: str
    project_name: str
    digital_marketer_id: str
    digital_marketer_name: Optional[str] = None
    content_description: str
    expected_completion_date: datetime
    actual_completion_date: Optional[datetime] = None
    current_stage: str
    design_type: Optional[str] = None
    posted: bool = False
    created_at: datetime
    updated_at: datetime


class ApprovalAction(BaseModel):
    """Schema for approval/rejection actions."""
    action: Literal["approve", "reject"]
    remark: Optional[str] = None


class PostingUpdate(BaseModel):
    """Schema for updating posting status."""
    posted: bool
