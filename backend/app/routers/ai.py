"""AI routes."""

from typing import Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])


class TaskAnalysisRequest(BaseModel):
    """Request for task analysis."""

    title: str
    description: str = ""
    priority: str = "medium"
    status: str = "todo"
    tags: List[str] = []
    due_date: Optional[str] = None
    estimated_hours: Optional[int] = None


class TaskAnalysisResponse(BaseModel):
    """Response with task analysis."""

    analysis: str
    success: bool


class TaskReportResponse(BaseModel):
    """Response with full markdown report."""

    report: str
    filename: str
    success: bool


@router.post("/analyze", response_model=TaskAnalysisResponse)
async def analyze_task(request: TaskAnalysisRequest):
    """Analyze task with AI and return analysis text."""
    try:
        # Convert request to Task-like object for analysis
        task_data = {
            "title": request.title,
            "description": request.description,
            "priority": request.priority,
            "status": request.status,
            "tags": request.tags,
        }

        # Create a simple object with required attributes
        class TaskProxy:
            def __init__(self, data):
                self.title = data.get("title", "")
                self.description = data.get("description", "")
                self.priority = data.get("priority", "medium")
                self.status = data.get("status", "todo")
                self.tags = data.get("tags", [])
                self.due_date = None
                self.estimated_hours = data.get("estimated_hours")
                self.created_at = __import__("datetime").datetime.now()

        task_proxy = TaskProxy(task_data)
        analysis = await ai_service.analyze_task(task_proxy)

        return TaskAnalysisResponse(analysis=analysis, success=True)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/generate-report", response_model=TaskReportResponse)
async def generate_report(request: TaskAnalysisRequest):
    """Generate full markdown report for task."""
    try:
        # Create task proxy
        class TaskProxy:
            def __init__(self, data):
                self.title = data.get("title", "")
                self.description = data.get("description", "")
                self.priority = data.get("priority", "medium")
                self.status = data.get("status", "todo")
                self.tags = data.get("tags", [])
                self.due_date = None
                self.estimated_hours = data.get("estimated_hours")
                from datetime import datetime

                self.created_at = datetime.now()

        task_proxy = TaskProxy(request.dict())
        report = await ai_service.generate_task_report(task_proxy)

        # Generate filename
        safe_title = "".join(
            c if c.isalnum() or c in (" ", "-", "_") else "_" for c in request.title
        )
        safe_title = safe_title.replace(" ", "_")[:50]
        filename = f"task_analysis_{safe_title}.md"

        return TaskReportResponse(report=report, filename=filename, success=True)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Report generation failed: {str(e)}"
        )


@router.post("/generate-description")
async def generate_description():
    """Generate task description."""
    return {"message": "Generate description - Phase 3 implementation pending"}


@router.post("/breakdown")
async def breakdown_task():
    """Break down task into subtasks."""
    return {"message": "Breakdown task - Phase 3 implementation pending"}
