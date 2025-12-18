
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def inspect_tasks_for_missing_fields():
    # Connect to DB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.design_approval_db
    
    # Get all tasks
    tasks = await db.tasks.find().to_list(length=100)
    
    print(f"Found {len(tasks)} tasks.")
    bad_task_ids = []
    
    for task in tasks:
        print(f"ID: {task.get('_id')}, Title: {task.get('title')}")
        
        missing = []
        if 'status' not in task:
            missing.append('status')
        if 'title' not in task:
            missing.append('title')
        if 'priority' not in task:
            missing.append('priority')
        if 'created_by' not in task:
            missing.append('created_by')

        if missing:
            print(f"  [BAD DATA] Missing fields: {missing}")
            bad_task_ids.append(task.get('_id'))
    
    if bad_task_ids:
        print(f"\nFound {len(bad_task_ids)} bad tasks with missing fields. Deleting...")
        result = await db.tasks.delete_many({"_id": {"$in": bad_task_ids}})
        print(f"Deleted {result.deleted_count} tasks.")
    else:
        print("\nNo tasks with missing required fields found.")

if __name__ == "__main__":
    asyncio.run(inspect_tasks_for_missing_fields())
