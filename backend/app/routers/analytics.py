from fastapi import APIRouter, HTTPException, Depends, status
from typing import Dict, Any, List
from datetime import datetime, timedelta
from bson import ObjectId
from ..database import get_database
from ..auth.dependencies import get_current_user
from ..models.user import UserResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_analytics(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get dashboard analytics (Admin, Manager)"""
    if current_user.role not in ["Admin", "Manager", "Python Developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin, Manager, or Python Developer can view analytics"
        )
    
    projects_collection = db.projects
    users_collection = db.users
    tasks_collection = db.tasks
    
    # Total counts
    total_projects = await projects_collection.count_documents({})
    total_users = await users_collection.count_documents({})
    total_tasks = await tasks_collection.count_documents({})
    
    # Project status breakdown
    projects_by_status = {}
    all_projects = await projects_collection.find().to_list(length=None)
    
    for project in all_projects:
        stage = project.get("current_stage", "unknown")
        projects_by_status[stage] = projects_by_status.get(stage, 0) + 1
    
    # Projects by status
    completed_projects = projects_by_status.get("completed", 0)
    active_projects = total_projects - completed_projects
    
    # Posted projects
    posted_projects = await projects_collection.count_documents({"is_posted": True})
    
    # Recent projects (last 7 days)
    seven_days_ago = datetime.now() - timedelta(days=7)
    recent_projects = await projects_collection.count_documents({
        "created_at": {"$gte": seven_days_ago}
    })
    
    # Tasks statistics
    pending_tasks = await tasks_collection.count_documents({"status": "pending"})
    in_progress_tasks = await tasks_collection.count_documents({"status": "in_progress"})
    completed_tasks = await tasks_collection.count_documents({"status": "completed"})
    overdue_tasks = await tasks_collection.count_documents({
        "status": {"$in": ["pending", "in_progress"]},
        "due_date": {"$lt": datetime.now()}
    })
    
    # User role distribution
    users_by_role = {}
    all_users = await users_collection.find().to_list(length=None)
    for user in all_users:
        role = user.get("role", "Unknown")
        users_by_role[role] = users_by_role.get(role, 0) + 1
    
    # Projects by design type
    projects_by_type = {}
    for project in all_projects:
        design_type = project.get("design_type", "Not specified")
        if design_type and design_type != "Not specified":
            projects_by_type[design_type] = projects_by_type.get(design_type, 0) + 1
    
    # Average approval time (days from creation to completion)
    completed = [p for p in all_projects if p.get("current_stage") == "completed"]
    avg_approval_time = 0
    if completed:
        total_days = 0
        for project in completed:
            if project.get("created_at") and project.get("updated_at"):
                delta = project["updated_at"] - project["created_at"]
                total_days += delta.days
        avg_approval_time = round(total_days / len(completed), 1) if completed else 0
    
    return {
        "overview": {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
            "posted_projects": posted_projects,
            "total_users": total_users,
            "total_tasks": total_tasks,
            "recent_projects_7days": recent_projects
        },
        "projects": {
            "by_status": projects_by_status,
            "by_type": projects_by_type,
            "average_approval_days": avg_approval_time
        },
        "tasks": {
            "pending": pending_tasks,
            "in_progress": in_progress_tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks
        },
        "users": {
            "by_role": users_by_role
        }
    }


@router.get("/projects/timeline")
async def get_projects_timeline(
    current_user: UserResponse = Depends(get_current_user),
    days: int = 30,
    db=Depends(get_database)
):
    """Get project creation timeline for charts"""
    if current_user.role not in ["Admin", "Manager", "Python Developer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin, Manager, or Python Developer can view analytics"
        )
    
    projects_collection = db.projects
    
    # Get projects from last N days
    start_date = datetime.now() - timedelta(days=days)
    projects = await projects_collection.find({
        "created_at": {"$gte": start_date}
    }).to_list(length=None)
    
    # Group by date
    timeline = {}
    for project in projects:
        date_str = project["created_at"].strftime("%Y-%m-%d")
        timeline[date_str] = timeline.get(date_str, 0) + 1
    
    # Fill missing dates with 0
    current = start_date
    result = []
    while current <= datetime.now():
        date_str = current.strftime("%Y-%m-%d")
        result.append({
            "date": date_str,
            "count": timeline.get(date_str, 0)
        })
        current += timedelta(days=1)
    
    return result


@router.get("/performance/user/{user_id}")
async def get_user_performance(
    user_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get individual user performance metrics"""
    if current_user.role not in ["Admin", "Manager"]:
        # Users can view their own performance
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own performance"
            )
    
    tasks_collection = db.tasks
    projects_collection = db.projects
    
    # Tasks assigned to user
    user_tasks = await tasks_collection.find({"assigned_to": user_id}).to_list(length=None)
    
    tasks_stats = {
        "total": len(user_tasks),
        "completed": len([t for t in user_tasks if t["status"] == "completed"]),
        "pending": len([t for t in user_tasks if t["status"] == "pending"]),
        "in_progress": len([t for t in user_tasks if t["status"] == "in_progress"]),
        "overdue": len([t for t in user_tasks if t["status"] in ["pending", "in_progress"] and t["due_date"] < datetime.now()])
    }
    
    # Projects created by user (if Digital Marketer)
    projects_created = await projects_collection.count_documents({"created_by": user_id})
    
    return {
        "user_id": user_id,
        "tasks": tasks_stats,
        "projects_created": projects_created
    }
