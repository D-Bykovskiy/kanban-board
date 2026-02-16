"""Task routes with full CRUD operations."""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.models.task import TaskStatus, TaskPriority
from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    TaskMove,
)
from app.services.task_service import TaskService

router = APIRouter()
task_service = TaskService()


@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    status: Optional[TaskStatus] = Query(None, description="Filter by status"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    assignee: Optional[str] = Query(None, description="Filter by assignee"),
    tags: Optional[List[str]] = Query(None, description="Filter by tags"),
    search: Optional[str] = Query(None, description="Search in title/description"),
):
    """Get all tasks with optional filtering.

    Args:
        status: Filter by task status
        priority: Filter by priority level
        assignee: Filter by assignee email
        tags: Filter by tags (OR logic)
        search: Search query for title/description

    Returns:
        List of tasks matching filters
    """
    tasks = await task_service.get_tasks(
        status=status,
        priority=priority,
        assignee=assignee,
        tags=tags,
        search=search,
    )
    return TaskListResponse(
        tasks=[TaskResponse(**task.model_dump()) for task in tasks],
        total=len(tasks),
    )


@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(task_data: TaskCreate):
    """Create a new task.

    Args:
        task_data: Task creation data

    Returns:
        Created task
    """
    task = await task_service.create_task(task_data.model_dump())
    return TaskResponse(**task.model_dump())


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """Get task by ID.

    Args:
        task_id: Task identifier

    Returns:
        Task details

    Raises:
        HTTPException: If task not found
    """
    task = await task_service.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return TaskResponse(**task.model_dump())


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, update_data: TaskUpdate):
    """Update existing task.

    Args:
        task_id: Task identifier
        update_data: Fields to update

    Returns:
        Updated task

    Raises:
        HTTPException: If task not found
    """
    # Filter out None values
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}

    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    task = await task_service.update_task(task_id, update_dict)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return TaskResponse(**task.model_dump())


@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: str):
    """Delete task by ID.

    Args:
        task_id: Task identifier

    Raises:
        HTTPException: If task not found
    """
    deleted = await task_service.delete_task(task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return None


@router.post("/{task_id}/move", response_model=TaskResponse)
async def move_task(task_id: str, move_data: TaskMove):
    """Move task to different status/position.

    Args:
        task_id: Task identifier
        move_data: New status and position

    Returns:
        Updated task

    Raises:
        HTTPException: If task not found
    """
    task = await task_service.move_task(task_id, move_data.status, move_data.position)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return TaskResponse(**task.model_dump())


@router.post("/reorder/{status}")
async def reorder_tasks(
    status: TaskStatus,
    task_ids: List[str],
):
    """Reorder tasks within a status column.

    Args:
        status: Status column to reorder
        task_ids: Ordered list of task IDs

    Returns:
        Success message
    """
    success = await task_service.reorder_tasks(status, task_ids)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to reorder tasks")
    return {"message": "Tasks reordered successfully"}
