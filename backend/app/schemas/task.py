"""Task Pydantic schemas."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from app.models.task import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    """Base task schema with common fields."""

    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    tags: List[str] = Field(default_factory=list)
    assignee: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    parent_id: Optional[str] = None
    position: int = Field(default=0, ge=0)


class TaskCreate(TaskBase):
    """Schema for creating a new task."""

    status: TaskStatus = TaskStatus.TODO
    content: Optional[str] = None


class TaskUpdate(BaseModel):
    """Schema for updating an existing task."""

    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    tags: Optional[List[str]] = None
    assignee: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0)
    actual_hours: Optional[float] = Field(None, ge=0)
    parent_id: Optional[str] = None
    position: Optional[int] = Field(None, ge=0)
    content: Optional[str] = None


class TaskMove(BaseModel):
    """Schema for moving task to different status."""

    status: TaskStatus
    position: int = Field(default=0, ge=0)


class TaskResponse(TaskBase):
    """Schema for task response."""

    id: str
    status: TaskStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    actual_hours: Optional[float] = None
    calendar_event_id: Optional[str] = None
    telegram_message_id: Optional[str] = None
    content: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    """Schema for list of tasks response."""

    tasks: List[TaskResponse]
    total: int


class TaskFilter(BaseModel):
    """Schema for filtering tasks."""

    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assignee: Optional[str] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None
