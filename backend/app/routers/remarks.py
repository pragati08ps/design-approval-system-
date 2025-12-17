"""
Remarks and feedback routes.
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from bson import ObjectId
from app.models.user import UserResponse
from app.models.remark import RemarkCreate, RemarkResponse
from app.auth.dependencies import get_current_user
from app.database import get_database

router = APIRouter(prefix="/remarks", tags=["Remarks"])


@router.post("", response_model=RemarkResponse, status_code=status.HTTP_201_CREATED)
async def add_remark(
    remark_data: RemarkCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Add a remark to a project.

    Args:
        remark_data: Remark data
        current_user: Current authenticated user

    Returns:
        Created remark

    Raises:
        HTTPException: If project not found
    """
    db = get_database()

    try:
        project_id = ObjectId(remark_data.project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Verify project exists
    project = await db.projects.find_one({"_id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # Get current design version
    latest_upload = await db.uploads.find_one(
        {"project_id": project_id, "is_current": True}
    )
    upload_version = latest_upload["version"] if latest_upload else 0

    # Create remark document
    remark_doc = {
        "project_id": project_id,
        "user_id": ObjectId(current_user.id),
        "stage": project["current_stage"],
        "remark_text": remark_data.remark_text,
        "upload_version": upload_version,
        "created_at": datetime.utcnow()
    }

    result = await db.remarks.insert_one(remark_doc)

    return RemarkResponse(
        id=str(result.inserted_id),
        project_id=str(project_id),
        user_id=current_user.id,
        user_name=current_user.name,
        user_role=current_user.role,
        stage=project["current_stage"],
        remark_text=remark_data.remark_text,
        upload_version=upload_version,
        created_at=remark_doc["created_at"]
    )


@router.get("/project/{project_id}", response_model=List[RemarkResponse])
async def get_project_remarks(
    project_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all remarks for a project.

    Args:
        project_id: Project ID
        current_user: Current authenticated user

    Returns:
        List of remarks
    """
    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Get all remarks for this project
    remarks = await db.remarks.find(
        {"project_id": obj_id}
    ).sort("created_at", 1).to_list(length=1000)

    # Populate user details
    result = []
    for remark in remarks:
        user = await db.users.find_one({"_id": remark["user_id"]})
        result.append(
            RemarkResponse(
                id=str(remark["_id"]),
                project_id=str(remark["project_id"]),
                user_id=str(remark["user_id"]),
                user_name=user["name"] if user else "Unknown",
                user_role=user["role"] if user else "Unknown",
                stage=remark["stage"],
                remark_text=remark["remark_text"],
                upload_version=remark["upload_version"],
                created_at=remark["created_at"]
            )
        )

    return result
