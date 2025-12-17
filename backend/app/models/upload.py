"""
Upload and version history models.
"""
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel

UploadType = Literal["content", "design"]


class UploadResponse(BaseModel):
    """Schema for upload response."""
    id: str
    project_id: str
    uploaded_by: str
    uploader_name: Optional[str] = None
    file_id: str
    filename: str
    content_type: str
    file_size: int
    version: int
    upload_type: str
    design_type: Optional[str] = None
    uploaded_at: datetime
    is_current: bool
