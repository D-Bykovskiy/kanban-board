"""Calendar routes."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/auth")
async def auth_calendar():
    """Authenticate with Google Calendar."""
    return {"message": "Calendar auth - Phase 2 implementation pending"}


@router.post("/sync/{task_id}")
async def sync_task(task_id: str):
    """Sync task with Google Calendar."""
    return {"message": f"Sync task {task_id} - Phase 2 implementation pending"}
