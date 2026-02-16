"""Tests for task service."""

import pytest
import pytest_asyncio
from datetime import datetime
from pathlib import Path
import tempfile
import shutil

from app.services.task_service import TaskService
from app.models.task import Task, TaskStatus, TaskPriority


@pytest_asyncio.fixture
async def temp_task_service():
    """Create a task service with temporary directory."""
    temp_dir = tempfile.mkdtemp()
    service = TaskService(tasks_dir=temp_dir)
    yield service
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


class TestTaskService:
    """Test suite for TaskService."""

    @pytest.mark.asyncio
    async def test_create_task(self, temp_task_service):
        """Test creating a task."""
        task_data = {
            "title": "Test Task",
            "description": "Test description",
            "priority": TaskPriority.HIGH,
            "tags": ["test", "service"],
        }

        task = await temp_task_service.create_task(task_data)

        assert task.id.startswith("task-")
        assert task.title == task_data["title"]
        assert task.description == task_data["description"]
        assert task.status == TaskStatus.TODO
        assert task.priority == TaskPriority.HIGH
        assert task.tags == task_data["tags"]
        assert task.created_at is not None
        assert task.updated_at is not None
        assert task.content is not None

    @pytest.mark.asyncio
    async def test_create_task_with_content(self, temp_task_service):
        """Test creating a task with custom content."""
        custom_content = "# Custom Content\n\nThis is custom."
        task_data = {
            "title": "Custom Task",
            "content": custom_content,
        }

        task = await temp_task_service.create_task(task_data)

        # Reload and verify content saved
        task_reloaded = await temp_task_service.get_task(task.id)
        assert custom_content in task_reloaded.content

    @pytest.mark.asyncio
    async def test_get_task(self, temp_task_service):
        """Test retrieving a task."""
        # Create task
        created = await temp_task_service.create_task({"title": "Get Test"})

        # Get task
        retrieved = await temp_task_service.get_task(created.id)

        assert retrieved is not None
        assert retrieved.id == created.id
        assert retrieved.title == created.title

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, temp_task_service):
        """Test retrieving non-existent task."""
        task = await temp_task_service.get_task("non-existent")
        assert task is None

    @pytest.mark.asyncio
    async def test_get_tasks_all(self, temp_task_service):
        """Test retrieving all tasks."""
        # Create multiple tasks
        await temp_task_service.create_task({"title": "Task 1"})
        await temp_task_service.create_task({"title": "Task 2"})
        await temp_task_service.create_task({"title": "Task 3"})

        tasks = await temp_task_service.get_tasks()

        assert len(tasks) >= 3
        assert all(isinstance(t, Task) for t in tasks)

    @pytest.mark.asyncio
    async def test_get_tasks_filter_by_status(self, temp_task_service):
        """Test filtering tasks by status."""
        # Create tasks in different statuses
        todo_task = await temp_task_service.create_task(
            {"title": "Todo Task", "status": TaskStatus.TODO}
        )
        done_task = await temp_task_service.create_task(
            {"title": "Done Task", "status": TaskStatus.DONE}
        )

        todo_tasks = await temp_task_service.get_tasks(status=TaskStatus.TODO)

        assert all(t.status == TaskStatus.TODO for t in todo_tasks)
        assert any(t.id == todo_task.id for t in todo_tasks)
        assert not any(t.id == done_task.id for t in todo_tasks)

    @pytest.mark.asyncio
    async def test_get_tasks_filter_by_priority(self, temp_task_service):
        """Test filtering tasks by priority."""
        await temp_task_service.create_task(
            {"title": "Critical Task", "priority": TaskPriority.CRITICAL}
        )
        await temp_task_service.create_task(
            {"title": "Low Task", "priority": TaskPriority.LOW}
        )

        critical_tasks = await temp_task_service.get_tasks(priority="critical")

        assert all(t.priority == TaskPriority.CRITICAL for t in critical_tasks)

    @pytest.mark.asyncio
    async def test_get_tasks_search(self, temp_task_service):
        """Test searching tasks."""
        await temp_task_service.create_task(
            {"title": "Unique Search Title", "description": "Unique description"}
        )
        await temp_task_service.create_task(
            {"title": "Other Title", "description": "Other description"}
        )

        results = await temp_task_service.get_tasks(search="Unique")

        assert all(
            "Unique" in t.title or (t.description and "Unique" in t.description)
            for t in results
        )

    @pytest.mark.asyncio
    async def test_get_tasks_filter_by_tags(self, temp_task_service):
        """Test filtering tasks by tags."""
        await temp_task_service.create_task(
            {"title": "Backend Task", "tags": ["backend", "api"]}
        )
        await temp_task_service.create_task(
            {"title": "Frontend Task", "tags": ["frontend"]}
        )

        backend_tasks = await temp_task_service.get_tasks(tags=["backend"])

        assert all("backend" in t.tags for t in backend_tasks)

    @pytest.mark.asyncio
    async def test_update_task(self, temp_task_service):
        """Test updating a task."""
        # Create task
        task = await temp_task_service.create_task({"title": "Original Title"})

        # Update
        updated = await temp_task_service.update_task(
            task.id, {"title": "Updated Title", "priority": TaskPriority.HIGH}
        )

        assert updated is not None
        assert updated.title == "Updated Title"
        assert updated.priority == TaskPriority.HIGH
        assert updated.updated_at > task.updated_at

    @pytest.mark.asyncio
    async def test_update_task_status_change(self, temp_task_service):
        """Test updating task status moves file."""
        # Create task in todo
        task = await temp_task_service.create_task(
            {"title": "Move Test", "status": TaskStatus.TODO}
        )

        # Update to done
        updated = await temp_task_service.update_task(
            task.id, {"status": TaskStatus.DONE}
        )

        assert updated.status == TaskStatus.DONE

        # Verify old file is gone
        old_path = temp_task_service._get_task_path(task.id, TaskStatus.TODO)
        assert not old_path.exists()

        # Verify new file exists
        new_path = temp_task_service._get_task_path(task.id, TaskStatus.DONE)
        assert new_path.exists()

    @pytest.mark.asyncio
    async def test_update_task_content(self, temp_task_service):
        """Test updating task content."""
        task = await temp_task_service.create_task({"title": "Content Test"})

        new_content = "# Updated Content\n\nNew description."
        updated = await temp_task_service.update_task(task.id, {"content": new_content})

        # Reload and verify
        reloaded = await temp_task_service.get_task(task.id)
        assert new_content in reloaded.content

    @pytest.mark.asyncio
    async def test_update_task_not_found(self, temp_task_service):
        """Test updating non-existent task."""
        result = await temp_task_service.update_task(
            "non-existent", {"title": "New Title"}
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_task(self, temp_task_service):
        """Test deleting a task."""
        task = await temp_task_service.create_task({"title": "To Delete"})

        deleted = await temp_task_service.delete_task(task.id)

        assert deleted is True

        # Verify task is gone
        retrieved = await temp_task_service.get_task(task.id)
        assert retrieved is None

    @pytest.mark.asyncio
    async def test_delete_task_not_found(self, temp_task_service):
        """Test deleting non-existent task."""
        result = await temp_task_service.delete_task("non-existent")
        assert result is False

    @pytest.mark.asyncio
    async def test_move_task(self, temp_task_service):
        """Test moving task to different status."""
        task = await temp_task_service.create_task(
            {"title": "Move Test", "status": TaskStatus.TODO}
        )

        moved = await temp_task_service.move_task(
            task.id, TaskStatus.IN_PROGRESS, new_position=5
        )

        assert moved is not None
        assert moved.status == TaskStatus.IN_PROGRESS
        assert moved.position == 5

    @pytest.mark.asyncio
    async def test_reorder_tasks(self, temp_task_service):
        """Test reordering tasks."""
        # Create tasks
        task1 = await temp_task_service.create_task(
            {"title": "Task 1", "status": TaskStatus.TODO, "position": 0}
        )
        task2 = await temp_task_service.create_task(
            {"title": "Task 2", "status": TaskStatus.TODO, "position": 1}
        )
        task3 = await temp_task_service.create_task(
            {"title": "Task 3", "status": TaskStatus.TODO, "position": 2}
        )

        # Reorder: Task 3, Task 1, Task 2
        success = await temp_task_service.reorder_tasks(
            TaskStatus.TODO, [task3.id, task1.id, task2.id]
        )

        assert success is True

        # Verify new order
        task1_updated = await temp_task_service.get_task(task1.id)
        task2_updated = await temp_task_service.get_task(task2.id)
        task3_updated = await temp_task_service.get_task(task3.id)

        assert task3_updated.position == 0
        assert task1_updated.position == 1
        assert task2_updated.position == 2
