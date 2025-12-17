"""
GridFS file handling utilities.
"""
from typing import BinaryIO, Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from app.database import get_gridfs_bucket


async def upload_file_to_gridfs(
    file_data: BinaryIO,
    filename: str,
    content_type: str,
    metadata: Optional[dict] = None
) -> ObjectId:
    """
    Upload a file to GridFS.

    Args:
        file_data: File binary data
        filename: Original filename
        content_type: MIME content type
        metadata: Optional metadata dictionary

    Returns:
        ObjectId of the uploaded file
    """
    bucket: AsyncIOMotorGridFSBucket = get_gridfs_bucket()

    file_id = await bucket.upload_from_stream(
        filename,
        file_data,
        metadata={
            **(metadata or {}),
            "content_type": content_type
        }
    )

    return file_id


async def download_file_from_gridfs(file_id: ObjectId) -> bytes:
    """
    Download a file from GridFS.

    Args:
        file_id: ObjectId of the file

    Returns:
        File binary data
    """
    bucket: AsyncIOMotorGridFSBucket = get_gridfs_bucket()

    grid_out = await bucket.open_download_stream(file_id)
    file_data = await grid_out.read()

    return file_data


async def get_file_metadata(file_id: ObjectId) -> Optional[dict]:
    """
    Get file metadata from GridFS.

    Args:
        file_id: ObjectId of the file

    Returns:
        File metadata dictionary or None
    """
    bucket: AsyncIOMotorGridFSBucket = get_gridfs_bucket()

    try:
        grid_out = await bucket.open_download_stream(file_id)
        return {
            "filename": grid_out.filename,
            "content_type": grid_out.metadata.get("content_type"),
            "length": grid_out.length,
            "upload_date": grid_out.upload_date
        }
    except Exception:
        return None


async def delete_file_from_gridfs(file_id: ObjectId) -> bool:
    """
    Delete a file from GridFS.

    Args:
        file_id: ObjectId of the file

    Returns:
        True if successful, False otherwise
    """
    bucket: AsyncIOMotorGridFSBucket = get_gridfs_bucket()

    try:
        await bucket.delete(file_id)
        return True
    except Exception:
        return False
