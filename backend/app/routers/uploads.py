"""
File upload and download routes using GridFS.
"""
from datetime import datetime
from typing import List
from fastapi import APIRouter, File, UploadFile, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
from bson import ObjectId
from app.models.user import UserResponse
from app.models.upload import UploadResponse
from app.auth.dependencies import get_current_user
from app.database import get_database
from app.utils.gridfs_handler import (
    upload_file_to_gridfs,
    download_file_from_gridfs,
    get_file_metadata
)
import io

router = APIRouter(prefix="/uploads", tags=["Uploads"])


@router.get("/{file_id}")
async def download_file(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Download a file from GridFS.

    Args:
        file_id: File ID in GridFS
        current_user: Current authenticated user

    Returns:
        File stream

    Raises:
        HTTPException: If file not found
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID"
        )

    # Get file metadata
    metadata = await get_file_metadata(obj_id)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Download file
    file_data = await download_file_from_gridfs(obj_id)

    # Return as streaming response with download
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=metadata["content_type"],
        headers={
            "Content-Disposition": f'attachment; filename="{metadata["filename"]}"'
        }
    )


@router.get("/preview/{file_id}")
async def preview_file(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Preview a file in browser (inline).

    Args:
        file_id: File ID in GridFS
        current_user: Current authenticated user

    Returns:
        File stream for preview

    Raises:
        HTTPException: If file not found
    """
    try:
        obj_id = ObjectId(file_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file ID"
        )

    # Get file metadata
    metadata = await get_file_metadata(obj_id)
    if not metadata:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Download file
    file_data = await download_file_from_gridfs(obj_id)

    # Return as streaming response with inline display
    return StreamingResponse(
        io.BytesIO(file_data),
        media_type=metadata["content_type"],
        headers={
            "Content-Disposition": f'inline; filename="{metadata["filename"]}"'
        }
    )


@router.get("/project/{project_id}/versions", response_model=List[UploadResponse])
async def get_project_versions(
    project_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Get all file versions for a project.

    Args:
        project_id: Project ID
        current_user: Current authenticated user

    Returns:
        List of upload records
    """
    db = get_database()

    try:
        obj_id = ObjectId(project_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid project ID"
        )

    # Get all uploads for this project, sorted by version descending
    uploads = await db.uploads.find(
        {"project_id": obj_id}
    ).sort("version", -1).to_list(length=100)

    # Populate uploader names
    result = []
    for upload in uploads:
        uploader = await db.users.find_one({"_id": upload["uploaded_by"]})
        result.append(
            UploadResponse(
                id=str(upload["_id"]),
                project_id=str(upload["project_id"]),
                uploaded_by=str(upload["uploaded_by"]),
                uploader_name=uploader["name"] if uploader else "Unknown",
                file_id=str(upload["file_id"]),
                filename=upload["filename"],
                content_type=upload["content_type"],
                file_size=upload["file_size"],
                version=upload["version"],
                upload_type=upload["upload_type"],
                design_type=upload.get("design_type"),
                uploaded_at=upload["uploaded_at"],
                is_current=upload["is_current"]
            )
        )

    return result
