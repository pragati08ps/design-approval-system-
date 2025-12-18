"""
Design Approval Workflow System - Main FastAPI Application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routers import auth, projects, uploads, remarks, users, tasks, analytics

# Create FastAPI application
app = FastAPI(
    title=settings.app_title,
    version=settings.app_version,
    description="Multi-stage design approval workflow system with file uploads and role-based permissions",
    debug=settings.debug
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Event handlers
@app.on_event("startup")
async def startup_event():
    """Connect to MongoDB on startup."""
    await connect_to_mongo()
    print(f"🚀 {settings.app_title} v{settings.app_version} started successfully!")


@app.on_event("shutdown")
async def shutdown_event():
    """Close MongoDB connection on shutdown."""
    await close_mongo_connection()


# Health check endpoint
@app.get("/", tags=["Health"])
async def root():
    """API health check endpoint."""
    return {
        "message": "Design Approval Workflow System API",
        "version": settings.app_version,
        "status": "running"
    }


# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(uploads.router)
app.include_router(remarks.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(analytics.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
