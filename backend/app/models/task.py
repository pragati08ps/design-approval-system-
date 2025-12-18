"""
Task models and schemas.
"""
from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, Field

# Task status types
TaskStatus = Literal["pending", "in_progress", "completed", "cancelled"]

# Task priority types
TaskPriority = Literal["low", "medium", "high", "urgent"]

# Design types
DesignType = Literal["webdesign", "logo", "poster", "brochure", "flyers", "video", "nameboard", "letterhead"]


class Checkpoint(BaseModel):
    title: str
    completed: bool = False


class TaskCreate(BaseModel):
    """Schema for creating a task."""
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    assigned_to: List[str]  # List of User IDs
    project_id: Optional[str] = None  # Optional link to project
    due_date: datetime
    priority: TaskPriority = "medium"
    allocated_hours: Optional[float] = None
    design_type: Optional[DesignType] = None
    checkpoints: Optional[List[Checkpoint]] = None


class TaskUpdate(BaseModel):
    """Schema for updating a task."""
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = None
    assigned_to: Optional[List[str]] = None
    due_date: Optional[datetime] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    allocated_hours: Optional[float] = None
    design_type: Optional[DesignType] = None
    checkpoints: Optional[List[Checkpoint]] = None
    start_time: Optional[datetime] = None
    time_spent_ms: Optional[int] = None
    is_timer_running: Optional[bool] = None


class TaskResponse(BaseModel):
    """Schema for task response."""
    id: str
    title: str
    description: Optional[str]
    assigned_to: List[str]  # List of User IDs
    assigned_to_names: List[str] = []  # List of user names
    project_id: Optional[str]
    project_name: Optional[str] = None
    due_date: datetime
    priority: TaskPriority
    status: TaskStatus
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    design_type: Optional[str] = None
    checkpoints: List[Checkpoint] = []
    # Timer fields
    allocated_hours: Optional[float] = None
    start_time: Optional[datetime] = None
    time_spent_ms: int = 0
    is_timer_running: bool = False
    # File upload fields
    file_id: Optional[str] = None
    filename: Optional[str] = None
    uploaded_at: Optional[datetime] = None
