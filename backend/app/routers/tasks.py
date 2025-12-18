from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from ..models.task import TaskCreate, TaskUpdate, TaskResponse
from ..database import get_database
from ..auth.dependencies import get_current_user
from ..models.user import UserResponse
from ..utils.gridfs_handler import upload_file_to_gridfs

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Get all tasks (filtered by role)"""
    tasks_collection = db.tasks
    
    # Admin and Manager can see all tasks
    if current_user.role in ["Admin", "Manager"]:
        tasks = await tasks_collection.find().to_list(length=None)
    else:
        # Others see tasks where they are assigned or tasks they created
        tasks = await tasks_collection.find({
            "$or": [
                {"assigned_to": {"$in": [current_user.id]}},
                {"created_by": current_user.id}
            ]
        }).to_list(length=None)
    
    # Populate user and project names
    result = []
    for task in tasks:
        # Get assigned users' names
        assigned_to_list = task.get("assigned_to", [])
        if isinstance(assigned_to_list, str):
            # Handle legacy single assignment
            assigned_to_list = [assigned_to_list]
        
        assigned_names = []
        for user_id in assigned_to_list:
            try:
                assigned_user = await db.users.find_one({"_id": ObjectId(user_id)})
                if assigned_user:
                    assigned_names.append(assigned_user["name"])
                else:
                    assigned_names.append("Unknown")
            except:
                assigned_names.append("Unknown")
        
        # Get creator name
        try:
            created_user = await db.users.find_one({"_id": ObjectId(task["created_by"])})
            created_name = created_user["name"] if created_user else "Unknown"
        except:
            created_name = "Unknown"
        
        # Get project name if linked
        project_name = None
        if task.get("project_id"):
            try:
                project = await db.projects.find_one({"_id": ObjectId(task["project_id"])})
                project_name = project["project_name"] if project else None
            except:
                project_name = None
        
        result.append(TaskResponse(
            id=str(task["_id"]),
            title=task["title"],
            description=task.get("description"),
            assigned_to=assigned_to_list,
            assigned_to_names=assigned_names,
            project_id=task.get("project_id"),
            project_name=project_name,
            due_date=task["due_date"],
            priority=task["priority"],
            status=task.get("status", "pending"),
            created_by=task["created_by"],
            created_by_name=created_name,
            created_at=task["created_at"],
            updated_at=task.get("updated_at"),
            design_type=task.get("design_type"),
            checkpoints=task.get("checkpoints", []),
            allocated_hours=task.get("allocated_hours"),
            start_time=task.get("start_time"),
            time_spent_ms=task.get("time_spent_ms", 0),
            is_timer_running=task.get("is_timer_running", False),
            file_id=task.get("file_id"),
            filename=task.get("filename"),
            uploaded_at=task.get("uploaded_at")
        ))
    
    return result


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Create a new task
    - All users can create tasks for existing projects
    - Only Admin, Manager, Digital Marketer can create standalone tasks
    """
    # If no project_id, restrict to Admin/Manager/Digital Marketer
    if not task_data.project_id:
        if current_user.role not in ["Admin", "Manager", "Digital Marketer"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Admin, Manager, or Digital Marketer can create standalone tasks. Please link the task to a project."
            )
    
    tasks_collection = db.tasks
    
    # Verify all assigned users exist
    if not task_data.assigned_to or len(task_data.assigned_to) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one user must be assigned to the task"
        )
    
    assigned_names = []
    for user_id in task_data.assigned_to:
        assigned_user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not assigned_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} not found"
            )
        assigned_names.append(assigned_user["name"])
    
    # Verify project exists if provided
    project_name = None
    if task_data.project_id:
        project = await db.projects.find_one({"_id": ObjectId(task_data.project_id)})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        project_name = project.get("project_name")
    
    # Create task document
    task_dict = {
        "title": task_data.title,
        "description": task_data.description,
        "assigned_to": task_data.assigned_to,
        "project_id": task_data.project_id,
        "due_date": task_data.due_date,
        "priority": task_data.priority,
        "status": "pending",
        "created_by": current_user.id,
        "created_at": datetime.now(),
        "updated_at": None,
        "design_type": task_data.design_type,
        "checkpoints": [cp.dict() for cp in task_data.checkpoints] if task_data.checkpoints else [],
        "allocated_hours": task_data.allocated_hours,
        "start_time": None,
        "time_spent_ms": 0,
        "is_timer_running": False,
        "file_id": None,
        "filename": None,
        "uploaded_at": None
    }
    
    result = await tasks_collection.insert_one(task_dict)
    task_dict["_id"] = result.inserted_id
    
    return TaskResponse(
        id=str(task_dict["_id"]),
        title=task_dict["title"],
        description=task_dict["description"],
        assigned_to=task_dict["assigned_to"],
        assigned_to_names=assigned_names,
        project_id=task_dict["project_id"],
        project_name=project_name,
        due_date=task_dict["due_date"],
        priority=task_dict["priority"],
        status=task_dict["status"],
        created_by=task_dict["created_by"],
        created_by_name=current_user.name,
        created_at=task_dict["created_at"],
        updated_at=task_dict["updated_at"],
        design_type=task_dict["design_type"],
        checkpoints=task_dict.get("checkpoints", []),
        allocated_hours=task_dict["allocated_hours"],
        start_time=task_dict["start_time"],
        time_spent_ms=task_dict["time_spent_ms"],
        is_timer_running=task_dict["is_timer_running"],
        file_id=task_dict["file_id"],
        filename=task_dict["filename"],
        uploaded_at=task_dict["uploaded_at"]
    )


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Update a task"""
    tasks_collection = db.tasks
    
    # Get existing task
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check permissions: Admin/Manager can update any, others only their own or assigned
    assigned_to_list = task.get("assigned_to", [])
    if isinstance(assigned_to_list, str):
        assigned_to_list = [assigned_to_list]
    
    if current_user.role not in ["Admin", "Manager"]:
        if current_user.id not in assigned_to_list and task["created_by"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update tasks you created or are assigned to"
            )
    
    # Build update data
    update_data = {"updated_at": datetime.now()}
    if task_data.title:
        update_data["title"] = task_data.title
    if task_data.description is not None:
        update_data["description"] = task_data.description
    if task_data.assigned_to:
        # Verify all users exist
        for user_id in task_data.assigned_to:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with ID {user_id} not found"
                )
        update_data["assigned_to"] = task_data.assigned_to
    if task_data.due_date:
        update_data["due_date"] = task_data.due_date
    if task_data.priority:
        update_data["priority"] = task_data.priority
    if task_data.status:
        update_data["status"] = task_data.status
    if task_data.allocated_hours is not None:
        update_data["allocated_hours"] = task_data.allocated_hours
    if task_data.start_time:
        update_data["start_time"] = task_data.start_time
    if task_data.time_spent_ms is not None:
        update_data["time_spent_ms"] = task_data.time_spent_ms
    if task_data.is_timer_running is not None:
        update_data["is_timer_running"] = task_data.is_timer_running
    if task_data.design_type is not None:
        update_data["design_type"] = task_data.design_type
    if task_data.checkpoints is not None:
        update_data["checkpoints"] = [cp.dict() for cp in task_data.checkpoints]
    
    # Update task
    result = await tasks_collection.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": update_data},
        return_document=True
    )
    
    # Get assigned users' names
    assigned_to_list = result.get("assigned_to", [])
    if isinstance(assigned_to_list, str):
        assigned_to_list = [assigned_to_list]
    
    assigned_names = []
    for user_id in assigned_to_list:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            assigned_names.append(user["name"] if user else "Unknown")
        except:
            assigned_names.append("Unknown")
    
    # Get creator name
    created_user = await db.users.find_one({"_id": ObjectId(result["created_by"])})
    
    # Get project name if linked
    project_name = None
    if result.get("project_id"):
        try:
            project = await db.projects.find_one({"_id": ObjectId(result["project_id"])})
            project_name = project["project_name"] if project else None
        except:
            project_name = None
    
    return TaskResponse(
        id=str(result["_id"]),
        title=result["title"],
        description=result.get("description"),
        assigned_to=assigned_to_list,
        assigned_to_names=assigned_names,
        project_id=result.get("project_id"),
        project_name=project_name,
        due_date=result["due_date"],
        priority=result["priority"],
        status=result["status"],
        created_by=result["created_by"],
        created_by_name=created_user["name"] if created_user else "Unknown",
        created_at=result["created_at"],
        updated_at=result.get("updated_at"),
        allocated_hours=result.get("allocated_hours"),
        start_time=result.get("start_time"),
        file_id=result.get("file_id"),
        filename=result.get("filename"),
        uploaded_at=result.get("uploaded_at")
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Delete a task (Admin, Manager only)"""
    if current_user.role not in ["Admin", "Manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin or Manager can delete tasks"
        )
    
    tasks_collection = db.tasks
    result = await tasks_collection.delete_one({"_id": ObjectId(task_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return None


@router.post("/{task_id}/upload", response_model=TaskResponse)
async def upload_task_file(
    task_id: str,
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Upload completed task file (assigned user or creator)"""
    tasks_collection = db.tasks
    
    # Get task
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    # Check if user is assigned to task or created it or is Admin/Manager
    assigned_to_list = task.get("assigned_to", [])
    if isinstance(assigned_to_list, str):
        assigned_to_list = [assigned_to_list]
    
    if current_user.role not in ["Admin", "Manager"]:
        if current_user.id not in assigned_to_list and task["created_by"] != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only upload files for tasks you are assigned to or created"
            )
    
    # Upload file to GridFS
    file_data = await file.read()
    file_id = await upload_file_to_gridfs(
        file_data,
        file.filename,
        file.content_type or "application/octet-stream"
    )
    
    # Update task with file info
    update_data = {
        "file_id": str(file_id),
        "filename": file.filename,
        "uploaded_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    result = await tasks_collection.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": update_data},
        return_document=True
    )
   
    # Get assigned users' names
    assigned_to_list = result.get("assigned_to", [])
    if isinstance(assigned_to_list, str):
        assigned_to_list = [assigned_to_list]
    
    assigned_names = []
    for user_id in assigned_to_list:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            assigned_names.append(user["name"] if user else "Unknown")
        except:
            assigned_names.append("Unknown")
    
    # Get creator name
    created_user = await db.users.find_one({"_id": ObjectId(result["created_by"])})
    
    # Get project name if linked
    project_name = None
    if result.get("project_id"):
        try:
            project = await db.projects.find_one({"_id": ObjectId(result["project_id"])})
            project_name = project["project_name"] if project else None
        except:
            project_name = None
    
    return TaskResponse(
        id=str(result["_id"]),
        title=result["title"],
        description=result.get("description"),
        assigned_to=assigned_to_list,
        assigned_to_names=assigned_names,
        project_id=result.get("project_id"),
        project_name=project_name,
        due_date=result["due_date"],
        priority=result["priority"],
        status=result["status"],
        created_by=result["created_by"],
        created_by_name=created_user["name"] if created_user else "Unknown",
        created_at=result["created_at"],
        updated_at=result.get("updated_at"),
        design_type=result.get("design_type"),
        checkpoints=result.get("checkpoints", []),
        allocated_hours=result.get("allocated_hours"),
        start_time=result.get("start_time"),
        time_spent_ms=result.get("time_spent_ms", 0),
        is_timer_running=result.get("is_timer_running", False),
        file_id=result.get("file_id"),
        filename=result.get("filename"),
        uploaded_at=result.get("uploaded_at")
    )


@router.post("/{task_id}/timer", response_model=TaskResponse)
async def toggle_task_timer(
    task_id: str,
    action: str,  # "start" or "pause"
    current_user: UserResponse = Depends(get_current_user),
    db=Depends(get_database)
):
    """Start or pause a task timer with exclusivity (no multiple running timers)"""
    tasks_collection = db.tasks
    
    # Get task
    task = await tasks_collection.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    now = datetime.now()
    
    # Check permissions: Admin/Manager can update any, others only their own or assigned
    assigned_to_list = task.get("assigned_to", [])
    if isinstance(assigned_to_list, str):
        assigned_to_list = [assigned_to_list]
    
    if current_user.role not in ["Admin", "Manager"]:
        if current_user.id not in assigned_to_list and task["created_by"] != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="You can only control timers for tasks you created or are assigned to"
            )
    
    if action == "start":
        # 1. Pause any other running timers for this user to ensure exclusivity
        # We find all tasks where is_timer_running is true and the user is one of the assigned users
        # or just globally for simplicity if that's the requirement. 
        # User said "multiple timers must not run at same time", which often means system-wide or user-wide.
        # Let's do it per-user (exclusive per user).
        
        running_tasks = await tasks_collection.find({
            "is_timer_running": True,
            "assigned_to": {"$in": [current_user.id]}
        }).to_list(length=None)
        
        for rt in running_tasks:
            if str(rt["_id"]) == task_id:
                continue
            
            # Calculate elapsed and pause it
            last_start = rt.get("start_time")
            if last_start:
                session_duration = int((now - last_start).total_seconds() * 1000)
                new_total = rt.get("time_spent_ms", 0) + session_duration
                await tasks_collection.update_one(
                    {"_id": rt["_id"]},
                    {"$set": {
                        "is_timer_running": False,
                        "time_spent_ms": new_total,
                        "updated_at": now
                    }}
                )
        
        # 2. Start this task's timer
        update_result = await tasks_collection.find_one_and_update(
            {"_id": ObjectId(task_id)},
            {"$set": {
                "is_timer_running": True,
                "start_time": now,
                "status": "in_progress",
                "updated_at": now
            }},
            return_document=True
        )
        
    elif action == "pause":
        if not task.get("is_timer_running"):
            return await get_task_response(task_id, db)
            
        last_start = task.get("start_time")
        session_duration = 0
        if last_start:
            session_duration = int((now - last_start).total_seconds() * 1000)
            
        new_total = task.get("time_spent_ms", 0) + session_duration
        
        update_result = await tasks_collection.find_one_and_update(
            {"_id": ObjectId(task_id)},
            {"$set": {
                "is_timer_running": False,
                "time_spent_ms": new_total,
                "updated_at": now
            }},
            return_document=True
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'start' or 'pause'")

    return await get_task_response(task_id, db)

async def get_task_response(task_id: str, db):
    """Helper to get a full TaskResponse for a task ID"""
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    
    # Refresh assigned names
    assigned_to_list = task.get("assigned_to", [])
    if isinstance(assigned_to_list, str): assigned_to_list = [assigned_to_list]
    
    assigned_names = []
    for uid in assigned_to_list:
        u = await db.users.find_one({"_id": ObjectId(uid)})
        assigned_names.append(u["name"] if u else "Unknown")
        
    created_user = await db.users.find_one({"_id": ObjectId(task["created_by"])})
    
    project_name = None
    if task.get("project_id"):
        p = await db.projects.find_one({"_id": ObjectId(task["project_id"])})
        project_name = p["project_name"] if p else None
        
    return TaskResponse(
        id=str(task["_id"]),
        title=task["title"],
        description=task.get("description"),
        assigned_to=assigned_to_list,
        assigned_to_names=assigned_names,
        project_id=task.get("project_id"),
        project_name=project_name,
        due_date=task["due_date"],
        priority=task["priority"],
        status=task.get("status", "pending"),
        created_by=task["created_by"],
        created_by_name=created_user["name"] if created_user else "Unknown",
        created_at=task["created_at"],
        updated_at=task.get("updated_at"),
        design_type=task.get("design_type"),
        checkpoints=task.get("checkpoints", []),
        allocated_hours=task.get("allocated_hours"),
        start_time=task.get("start_time"),
        time_spent_ms=task.get("time_spent_ms", 0),
        is_timer_running=task.get("is_timer_running", False),
        file_id=task.get("file_id"),
        filename=task.get("filename"),
        uploaded_at=task.get("uploaded_at")
    )
