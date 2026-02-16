"""AI routes."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/analyze")
async def analyze_task():
    """Analyze task with AI."""
    return {"message": "AI analyze - Phase 3 implementation pending"}


@router.post("/generate-description")
async def generate_description():
    """Generate task description."""
    return {"message": "Generate description - Phase 3 implementation pending"}


@router.post("/breakdown")
async def breakdown_task():
    """Break down task into subtasks."""
    return {"message": "Breakdown task - Phase 3 implementation pending"}
