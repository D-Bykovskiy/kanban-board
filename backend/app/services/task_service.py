"""Task service for markdown file operations."""

import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional, Dict, Any

import frontmatter

from app.config import settings
from app.models.task import Task, TaskStatus


class TaskService:
    """Service for managing tasks stored as markdown files."""

    def __init__(self, tasks_dir: Optional[str] = None):
        """Initialize task service.

        Args:
            tasks_dir: Directory for task storage. Defaults to settings.TASKS_DIR.
        """
        self.tasks_dir = Path(tasks_dir or settings.TASKS_DIR)
        self._ensure_directories()

    def _ensure_directories(self) -> None:
        """Create task directories if they don't exist."""
        for status in TaskStatus:
            status_dir = self.tasks_dir / status.value
            status_dir.mkdir(parents=True, exist_ok=True)

    def _get_task_path(self, task_id: str, status: TaskStatus) -> Path:
        """Get file path for a task.

        Args:
            task_id: Task identifier
            status: Task status

        Returns:
            Path to task file
        """
        return self.tasks_dir / status.value / f"{task_id}.md"

    def _find_task_file(self, task_id: str) -> Optional[Path]:
        """Find task file across all status directories.

        Args:
            task_id: Task identifier

        Returns:
            Path to task file if found, None otherwise
        """
        for status in TaskStatus:
            task_path = self._get_task_path(task_id, status)
            if task_path.exists():
                return task_path
        return None

    def _generate_task_id(self) -> str:
        """Generate unique task ID.

        Returns:
            Unique task identifier (e.g., "task-abc123")
        """
        short_uuid = uuid.uuid4().hex[:8]
        return f"task-{short_uuid}"

    def _parse_content(self, content: str) -> Dict[str, Any]:
        """Parse markdown content into sections.

        Args:
            content: Raw markdown content

        Returns:
            Dictionary with content sections
        """
        sections = {
            "full_content": content,
            "description": "",
            "requirements": [],
            "notes": "",
            "ai_analysis": "",
        }

        if not content:
            return sections

        # Extract description
        desc_match = re.search(
            r"## Описание\s*\n\n(.*?)(?=\n##|\Z)", content, re.DOTALL
        )
        if desc_match:
            sections["description"] = desc_match.group(1).strip()

        # Extract requirements/checklist
        req_match = re.search(
            r"## (?:Требования|Выполненные задачи)\s*\n\n(.*?)(?=\n##|\Z)",
            content,
            re.DOTALL,
        )
        if req_match:
            req_section = req_match.group(1)
            sections["requirements"] = [
                line.strip()
                for line in req_section.split("\n")
                if line.strip().startswith("- [")
            ]

        # Extract notes
        notes_match = re.search(
            r"## Примечания\s*\n\n(.*?)(?=\n##|\Z)", content, re.DOTALL
        )
        if notes_match:
            sections["notes"] = notes_match.group(1).strip()

        # Extract AI analysis
        ai_match = re.search(r"## AI-анализ\s*\n\n(.*?)(?=\n##|\Z)", content, re.DOTALL)
        if ai_match:
            sections["ai_analysis"] = ai_match.group(1).strip()

        return sections

    def _generate_default_content(self, task: Task) -> str:
        """Generate default markdown content for task.

        Args:
            task: Task model

        Returns:
            Default markdown content
        """
        content = f"# {task.title}\n\n"
        content += "## Описание\n\n"
        content += f"{task.description or 'Описание задачи...'}\n\n"
        content += "## Требования\n\n"
        content += "- [ ] Требование 1\n"
        content += "- [ ] Требование 2\n\n"
        content += "## Примечания\n\n"
        content += "Дополнительные заметки...\n\n"
        return content

    async def create_task(self, task_data: Dict[str, Any]) -> Task:
        """Create a new task.

        Args:
            task_data: Task data dictionary

        Returns:
            Created task
        """
        # Generate task ID
        task_id = self._generate_task_id()

        # Prepare task data
        now = datetime.now(timezone.utc)
        task_dict = {"id": task_id, "created_at": now, "updated_at": now, **task_data}

        # Handle status
        status = task_dict.get("status", TaskStatus.TODO)
        if isinstance(status, str):
            status = TaskStatus(status)
        task_dict["status"] = status

        # Get or generate content
        content = task_dict.pop("content", None)

        # Create task model
        task = Task(**task_dict)

        # Generate content if not provided
        if not content:
            content = self._generate_default_content(task)

        # Save to file
        task_path = self._get_task_path(task_id, status)
        post = frontmatter.Post(content, **task.to_frontmatter())
        frontmatter.dump(post, str(task_path))

        task.content = content
        return task

    async def get_task(self, task_id: str) -> Optional[Task]:
        """Get task by ID.

        Args:
            task_id: Task identifier

        Returns:
            Task if found, None otherwise
        """
        task_path = self._find_task_file(task_id)
        if not task_path:
            return None

        post = frontmatter.load(str(task_path))
        task = Task.from_frontmatter(post.metadata, post.content)
        return task

    async def get_tasks(
        self,
        status: Optional[TaskStatus] = None,
        priority: Optional[str] = None,
        assignee: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
    ) -> List[Task]:
        """Get tasks with optional filtering.

        Args:
            status: Filter by status
            priority: Filter by priority
            assignee: Filter by assignee
            tags: Filter by tags (any match)
            search: Search in title and description

        Returns:
            List of tasks
        """
        tasks = []

        # Determine which directories to scan
        if status:
            statuses = [status]
        else:
            statuses = list(TaskStatus)

        for s in statuses:
            status_dir = self.tasks_dir / s.value
            if not status_dir.exists():
                continue

            for task_file in status_dir.glob("*.md"):
                try:
                    post = frontmatter.load(str(task_file))
                    task = Task.from_frontmatter(post.metadata, post.content)

                    # Apply filters
                    if priority and task.priority.value != priority:
                        continue
                    if assignee and task.assignee != assignee:
                        continue
                    if tags and not any(tag in task.tags for tag in tags):
                        continue
                    if search:
                        search_lower = search.lower()
                        if search_lower not in task.title.lower() and (
                            not task.description
                            or search_lower not in task.description.lower()
                        ):
                            continue

                    tasks.append(task)
                except Exception as e:
                    # Log error but continue processing other tasks
                    print(f"Error loading task {task_file}: {e}")
                    continue

        # Sort by position within status
        tasks.sort(key=lambda t: (t.status.value, t.position))
        return tasks

    async def update_task(
        self, task_id: str, update_data: Dict[str, Any]
    ) -> Optional[Task]:
        """Update existing task.

        Args:
            task_id: Task identifier
            update_data: Data to update

        Returns:
            Updated task if found, None otherwise
        """
        # Find existing task
        task_path = self._find_task_file(task_id)
        if not task_path:
            return None

        # Load current task
        post = frontmatter.load(str(task_path))
        current_task = Task.from_frontmatter(post.metadata, post.content)

        # Check if status changed
        new_status = update_data.get("status")
        if isinstance(new_status, str):
            new_status = TaskStatus(new_status)
        elif not isinstance(new_status, TaskStatus):
            new_status = None

        status_changed = new_status is not None and new_status != current_task.status

        # Update fields
        task_dict = current_task.model_dump()
        task_dict.update(update_data)
        task_dict["updated_at"] = datetime.now(timezone.utc)

        # Handle content update
        new_content = update_data.get("content")
        if new_content is not None:
            content = new_content
        else:
            content = current_task.content

        # Create updated task
        updated_task = Task(**task_dict)

        # Save to file
        if status_changed and new_status is not None:
            # Remove old file
            task_path.unlink()
            # Save to new location
            new_path = self._get_task_path(task_id, new_status)
        else:
            new_path = task_path

        # Ensure content is a string
        content = content or ""
        post = frontmatter.Post(content, **updated_task.to_frontmatter())
        frontmatter.dump(post, str(new_path))

        updated_task.content = content
        return updated_task

    async def delete_task(self, task_id: str) -> bool:
        """Delete task by ID.

        Args:
            task_id: Task identifier

        Returns:
            True if deleted, False if not found
        """
        task_path = self._find_task_file(task_id)
        if not task_path:
            return False

        task_path.unlink()
        return True

    async def move_task(
        self, task_id: str, new_status: TaskStatus, new_position: int = 0
    ) -> Optional[Task]:
        """Move task to different status and/or position.

        Args:
            task_id: Task identifier
            new_status: New status
            new_position: New position in column

        Returns:
            Updated task if found, None otherwise
        """
        return await self.update_task(
            task_id, {"status": new_status, "position": new_position}
        )

    async def reorder_tasks(self, status: TaskStatus, task_ids: List[str]) -> bool:
        """Reorder tasks within a status column.

        Args:
            status: Status column
            task_ids: Ordered list of task IDs

        Returns:
            True if successful
        """
        status_dir = self.tasks_dir / status.value
        if not status_dir.exists():
            return False

        for position, task_id in enumerate(task_ids):
            task_path = self._get_task_path(task_id, status)
            if not task_path.exists():
                continue

            try:
                post = frontmatter.load(str(task_path))
                task = Task.from_frontmatter(post.metadata, post.content)
                task.position = position
                task.updated_at = datetime.now(timezone.utc)

                new_post = frontmatter.Post(task.content or "", **task.to_frontmatter())
                frontmatter.dump(new_post, str(task_path))
            except Exception as e:
                print(f"Error reordering task {task_id}: {e}")
                continue

        return True
