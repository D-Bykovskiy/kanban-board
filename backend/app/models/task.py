"""Task domain model."""

from datetime import datetime
from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    """Task status enum."""

    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(str, Enum):
    """Task priority enum."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Task(BaseModel):
    """Task model for Kanban board."""

    id: str = Field(..., description="Unique task identifier")
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, description="Brief description")
    status: TaskStatus = Field(default=TaskStatus.TODO, description="Task status")
    priority: TaskPriority = Field(
        default=TaskPriority.MEDIUM, description="Task priority"
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow, description="Creation date"
    )
    updated_at: Optional[datetime] = Field(None, description="Last update date")
    due_date: Optional[datetime] = Field(None, description="Due date")
    tags: List[str] = Field(default_factory=list, description="Task tags")
    assignee: Optional[str] = Field(None, description="Assignee email")
    estimated_hours: Optional[float] = Field(None, ge=0, description="Estimated hours")
    actual_hours: Optional[float] = Field(None, ge=0, description="Actual hours spent")
    parent_id: Optional[str] = Field(None, description="Parent task ID")
    position: int = Field(default=0, ge=0, description="Position in column")
    calendar_event_id: Optional[str] = Field(
        None, description="Google Calendar event ID"
    )
    telegram_message_id: Optional[str] = Field(None, description="Telegram message ID")
    content: Optional[str] = Field(
        None, description="Markdown content (excluding frontmatter)"
    )

    class Config:
        """Pydantic config."""

        json_encoders = {datetime: lambda v: v.isoformat()}

    def get_status_dir(self) -> str:
        """Get directory name for current status."""
        return self.status.value

    def to_frontmatter(self) -> dict:
        """Convert task to frontmatter dictionary."""
        data = self.model_dump(exclude={"content"}, exclude_none=True)
        # Convert datetime to ISO format
        for key in ["created_at", "updated_at", "due_date"]:
            if data.get(key) and isinstance(data[key], datetime):
                data[key] = data[key].isoformat()
        # Convert enums to strings
        for key in ["status", "priority"]:
            if data.get(key) and hasattr(data[key], "value"):
                data[key] = data[key].value
        return data

    @classmethod
    def from_frontmatter(cls, metadata: dict, content: str = "") -> "Task":
        """Create task from frontmatter metadata and content."""
        data = {**metadata, "content": content}

        # Parse datetime strings
        for key in ["created_at", "updated_at", "due_date"]:
            if data.get(key) and isinstance(data[key], str):
                data[key] = datetime.fromisoformat(data[key].replace("Z", "+00:00"))

        return cls(**data)
