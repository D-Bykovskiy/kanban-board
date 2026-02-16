"""
Kanban Board Backend
FastAPI application for task management with AI integration.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import tasks, ai, calendar, telegram
from app.routers.drive import router as drive_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("Starting Kanban Board API...")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Kanban Board API",
    description="Task management with AI integration",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(tasks, prefix="/api/tasks", tags=["tasks"])
app.include_router(ai, prefix="/api/ai", tags=["ai"])
app.include_router(drive_router, prefix="/api/drive", tags=["drive"])
app.include_router(calendar, prefix="/api/calendar", tags=["calendar"])
app.include_router(telegram, prefix="/api/telegram", tags=["telegram"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Kanban Board API", "version": "0.1.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
