
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def final_clean_tasks():
    # Connect to DB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.design_approval_system  # Correct DB Name
    
    # Get all tasks
    tasks = await db.tasks.find().to_list(length=1000)
    
    print(f"Connected to 'design_approval_system'. Found {len(tasks)} tasks.")
    bad_task_ids = []
    
    for task in tasks:
        # Check for absolutely critical fields
        missing = []
        if 'status' not in task:
            missing.append('status')
        if 'title' not in task:
            missing.append('title')
        
        if missing:
            print(f"  [BAD DATA] ID: {task.get('_id')}, Missing: {missing}")
            bad_task_ids.append(task.get('_id'))
    
    if bad_task_ids:
        print(f"\nFound {len(bad_task_ids)} bad tasks. Deleting...")
        result = await db.tasks.delete_many({"_id": {"$in": bad_task_ids}})
        print(f"Deleted {result.deleted_count} tasks.")
    else:
        print("\nNo bad tasks found.")

if __name__ == "__main__":
    asyncio.run(final_clean_tasks())
