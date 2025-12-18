"""
Project management and workflow routes.
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, File, Form, UploadFile, HTTPException, status, Depends
from bson import ObjectId
from app.models.user import UserResponse
from app.models.project import (
    ProjectCreate,
    ProjectResponse,
    ApprovalAction,
    PostingUpdate,
    DesignerUpload
)
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.utils.permissions import (
    get_next_stage,
    validate_stage_transition,
    can_create_project,
    can_upload_design
)
from app.utils.gridfs_handler import upload_file_to_gridfs

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Create a new project (Admin and Manager only).

    Args:
        project_data: Project creation data
        current_user: Current authenticated user

    Returns:
        Created project

    Raises:
        HTTPException: If user is not Admin or Manager
    """
    if not can_create_project(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin, Manager, and Digital Marketer can create projects"
        )

    db = get_database()

    # Create project document
    project_doc = {
        "project_name": project_data.project_name,
        "digital_marketer_id": ObjectId(current_user.id),
        "content_description": project_data.content_description,
        "expected_completion_date": project_data.expected_completion_date,
        "actual_completion_date": None,
        "current_stage": "digital_marketer",
        "design_type": None,
        "posted": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    result = await db.projects.insert_one(project_doc)

    return ProjectResponse(
        id=str(result.inserted_id),
        project_name=project_data.project_name,
        digital_marketer_id=current_user.id,
        digital_marketer_name=current_user.name,
        content_description=project_data.content_description,
        expected_completion_date=project_data.expected_completion_date,
        actual_completion_date=None,
        current_stage="digital_marketer",
        design_type=None,
        posted=False,
        created_at=project_doc["created_at"],
        updated_at=project_doc["updated_at"]
    )


@router.post("/{project_id}/upload-content")
async def upload_content(
    project_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload content file for a project (Digital Marketer).

    Args:
        project_id: Project ID
        file: Content file
        current_user: Current authenticated user

    Returns:
        Success message

    Raises:
        HTTPException: If project not found or user unauthorized
    """
    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Verify project exists
    project = await db.projects.find_one({"_id": obj_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check if user is the digital marketer or designer
    if str(project["digital_marketer_id"]) != current_user.id and current_user.role != "Digital Marketer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project creator can upload content"
        )

    # Upload file to GridFS
    file_data = await file.read()
    file_id = await upload_file_to_gridfs(
        file_data,
        file.filename,
        file.content_type or "application/octet-stream"
    )

    # Get current version number
    max_version = await db.uploads.find_one(
        {"project_id": obj_id},
        sort=[("version", -1)]
    )
    next_version = (max_version["version"] + 1) if max_version else 1

    # Mark all previous uploads as not current
    await db.uploads.update_many(
        {"project_id": obj_id, "upload_type": "content"},
        {"$set": {"is_current": False}}
    )

    # Create upload record
    upload_doc = {
        "project_id": obj_id,
        "uploaded_by": ObjectId(current_user.id),
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "file_size": len(file_data),
        "version": next_version,
        "upload_type": "content",
        "design_type": None,
        "uploaded_at": datetime.utcnow(),
        "is_current": True
    }

    await db.uploads.insert_one(upload_doc)

    # Update project stage to designer
    await db.projects.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "current_stage": "designer",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {"message": "Content uploaded successfully", "file_id": str(file_id)}


@router.post("/{project_id}/upload-design")
async def upload_design(
    project_id: str,
    design_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Upload design file (Designer only).

    Args:
        project_id: Project ID
        design_type: Type of design
        file: Design file
        current_user: Current authenticated user

    Returns:
        Success message

    Raises:
        HTTPException: If unauthorized or project not in correct stage
    """
    if not can_upload_design(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Designers can upload designs"
        )

    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Verify project exists
    project = await db.projects.find_one({"_id": obj_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check if project is in designer stage
    if project["current_stage"] != "designer":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Project is not in designer stage. Current stage: {project['current_stage']}"
        )

    # Upload file to GridFS
    file_data = await file.read()
    file_id = await upload_file_to_gridfs(
        file_data,
        file.filename,
        file.content_type or "application/octet-stream"
    )

    # Get current version number
    max_version = await db.uploads.find_one(
        {"project_id": obj_id},
        sort=[("version", -1)]
    )
    next_version = (max_version["version"] + 1) if max_version else 1

    # Mark all previous uploads as not current
    await db.uploads.update_many(
        {"project_id": obj_id},
        {"$set": {"is_current": False}}
    )

    # Create upload record
    upload_doc = {
        "project_id": obj_id,
        "uploaded_by": ObjectId(current_user.id),
        "file_id": file_id,
        "filename": file.filename,
        "content_type": file.content_type or "application/octet-stream",
        "file_size": len(file_data),
        "version": next_version,
        "upload_type": "design",
        "design_type": design_type,
        "uploaded_at": datetime.utcnow(),
        "is_current": True
    }

    await db.uploads.insert_one(upload_doc)

    # Update project with design type and move to graphic_designer stage
    await db.projects.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "design_type": design_type,
                "current_stage": "graphic_designer",
                "updated_at": datetime.utcnow()
            }
        }
    )

    return {"message": "Design uploaded successfully", "file_id": str(file_id)}


@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all projects accessible to the current user.

    Args:
        current_user: Current authenticated user

    Returns:
        List of projects
    """
    db = get_database()

    # Build query based on role
    # Allow all users to view all projects
    query = {}


    # Get projects
    projects = await db.projects.find(query).sort("created_at", -1).to_list(length=1000)

    # Populate digital marketer names
    result = []
    for project in projects:
        marketer = await db.users.find_one({"_id": project["digital_marketer_id"]})
        result.append(
            ProjectResponse(
                id=str(project["_id"]),
                project_name=project["project_name"],
                digital_marketer_id=str(project["digital_marketer_id"]),
                digital_marketer_name=marketer["name"] if marketer else "Unknown",
                content_description=project["content_description"],
                expected_completion_date=project["expected_completion_date"],
                actual_completion_date=project.get("actual_completion_date"),
                current_stage=project["current_stage"],
                design_type=project.get("design_type"),
                posted=project.get("posted", False),
                created_at=project["created_at"],
                updated_at=project["updated_at"]
            )
        )

    return result


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get a specific project by ID.

    Args:
        project_id: Project ID
        current_user: Current authenticated user

    Returns:
        Project details
    """
    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    project = await db.projects.find_one({"_id": obj_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Get digital marketer info
    marketer = await db.users.find_one({"_id": project["digital_marketer_id"]})

    return ProjectResponse(
        id=str(project["_id"]),
        project_name=project["project_name"],
        digital_marketer_id=str(project["digital_marketer_id"]),
        digital_marketer_name=marketer["name"] if marketer else "Unknown",
        content_description=project["content_description"],
        expected_completion_date=project["expected_completion_date"],
        actual_completion_date=project.get("actual_completion_date"),
        current_stage=project["current_stage"],
        design_type=project.get("design_type"),
        posted=project.get("posted", False),
        created_at=project["created_at"],
        updated_at=project["updated_at"]
    )


@router.post("/{project_id}/approve-reject")
async def approve_or_reject_project(
    project_id: str,
    action_data: ApprovalAction,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Approve or reject a project at current stage.

    Args:
        project_id: Project ID
        action_data: Approval action (approve/reject with optional remark)
        current_user: Current authenticated user

    Returns:
        Success message with new stage

    Raises:
        HTTPException: If unauthorized or invalid action
    """
    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Get project
    project = await db.projects.find_one({"_id": obj_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    current_stage = project["current_stage"]

    # Validate stage transition
    validate_stage_transition(current_stage, current_user.role, action_data.action)

    # Get next stage
    next_stage = get_next_stage(current_stage, action_data.action)

    # Create approval record
    approval_doc = {
        "project_id": obj_id,
        "stage": current_stage,
        "reviewer_id": ObjectId(current_user.id),
        "status": "approved" if action_data.action == "approve" else "rejected",
        "reviewed_at": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    await db.approvals.insert_one(approval_doc)

    # Add remark if provided
    if action_data.remark:
        latest_upload = await db.uploads.find_one(
            {"project_id": obj_id, "is_current": True}
        )
        upload_version = latest_upload["version"] if latest_upload else 0

        remark_doc = {
            "project_id": obj_id,
            "user_id": ObjectId(current_user.id),
            "stage": current_stage,
            "remark_text": action_data.remark,
            "upload_version": upload_version,
            "created_at": datetime.utcnow()
        }
        await db.remarks.insert_one(remark_doc)

    # Update project stage and completion date if approved to completed
    update_data = {
        "current_stage": next_stage,
        "updated_at": datetime.utcnow()
    }

    if next_stage == "completed":
        update_data["actual_completion_date"] = datetime.utcnow()

    await db.projects.update_one(
        {"_id": obj_id},
        {"$set": update_data}
    )

    return {
        "message": f"Project {action_data.action}ed successfully",
        "new_stage": next_stage
    }


@router.patch("/{project_id}/posting", response_model=ProjectResponse)
async def update_posting_status(
    project_id: str,
    posting_data: PostingUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Update posting status (only for completed projects).

    Args:
        project_id: Project ID
        posting_data: Posting status update
        current_user: Current authenticated user

    Returns:
        Updated project

    Raises:
        HTTPException: If project not completed or unauthorized
    """
    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Get project
    project = await db.projects.find_one({"_id": obj_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Check if project is completed
    if project["current_stage"] != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only update posting status for completed projects"
        )

    # Update posting status
    await db.projects.update_one(
        {"_id": obj_id},
        {
            "$set": {
                "posted": posting_data.posted,
                "updated_at": datetime.utcnow()
            }
        }
    )

    # Get updated project
    updated_project = await db.projects.find_one({"_id": obj_id})
    marketer = await db.users.find_one({"_id": updated_project["digital_marketer_id"]})

    return ProjectResponse(
        id=str(updated_project["_id"]),
        project_name=updated_project["project_name"],
        digital_marketer_id=str(updated_project["digital_marketer_id"]),
        digital_marketer_name=marketer["name"] if marketer else "Unknown",
        content_description=updated_project["content_description"],
        expected_completion_date=updated_project["expected_completion_date"],
        actual_completion_date=updated_project.get("actual_completion_date"),
        current_stage=updated_project["current_stage"],
        design_type=updated_project.get("design_type"),
        posted=updated_project.get("posted", False),
        created_at=updated_project["created_at"],
        updated_at=updated_project["updated_at"]
    )
