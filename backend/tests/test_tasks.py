"""Tests for task API endpoints."""

import pytest
import pytest_asyncio
from datetime import datetime
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from app.main import app
from app.services.task_service import TaskService


@pytest_asyncio.fixture
async def async_client():
    """Create async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client


@pytest_asyncio.fixture
async def test_task():
    """Create a test task and yield it, then cleanup."""
    service = TaskService()
    task_data = {
        "title": "Test Task",
        "description": "Test description",
        "status": "todo",
        "priority": "medium",
        "tags": ["test", "api"],
    }
    task = await service.create_task(task_data)
    yield task
    # Cleanup
    await service.delete_task(task.id)


class TestTaskAPI:
    """Test suite for task API endpoints."""

    @pytest.mark.asyncio
    async def test_get_tasks_empty(self, async_client):
        """Test getting tasks when empty."""
        response = await async_client.get("/api/tasks/")
        assert response.status_code == 200
        data = response.json()
        assert "tasks" in data
        assert data["total"] >= 0

    @pytest.mark.asyncio
    async def test_create_task(self, async_client):
        """Test creating a new task."""
        task_data = {
            "title": "New Test Task",
            "description": "Created via API test",
            "priority": "high",
            "tags": ["api", "test"],
            "estimated_hours": 5.5,
        }
        response = await async_client.post("/api/tasks/", json=task_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == task_data["title"]
        assert data["description"] == task_data["description"]
        assert data["status"] == "todo"
        assert data["priority"] == "high"
        assert data["tags"] == task_data["tags"]
        assert "id" in data
        assert "created_at" in data

        # Cleanup
        await async_client.delete(f"/api/tasks/{data['id']}")

    @pytest.mark.asyncio
    async def test_get_task_by_id(self, async_client, test_task):
        """Test getting a specific task."""
        response = await async_client.get(f"/api/tasks/{test_task.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_task.id
        assert data["title"] == test_task.title

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, async_client):
        """Test getting non-existent task."""
        response = await async_client.get("/api/tasks/non-existent-id")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_update_task(self, async_client, test_task):
        """Test updating a task."""
        update_data = {
            "title": "Updated Title",
            "priority": "critical",
        }
        response = await async_client.patch(
            f"/api/tasks/{test_task.id}", json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == update_data["title"]
        assert data["priority"] == update_data["priority"]
        # Other fields should remain unchanged
        assert data["status"] == test_task.status.value

    @pytest.mark.asyncio
    async def test_update_task_not_found(self, async_client):
        """Test updating non-existent task."""
        update_data = {"title": "New Title"}
        response = await async_client.patch(
            "/api/tasks/non-existent-id", json=update_data
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task(self, async_client):
        """Test deleting a task."""
        # Create a task first
        service = TaskService()
        task = await service.create_task({"title": "To Delete"})

        response = await async_client.delete(f"/api/tasks/{task.id}")
        assert response.status_code == 204

        # Verify deletion
        get_response = await async_client.get(f"/api/tasks/{task.id}")
        assert get_response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_task_not_found(self, async_client):
        """Test deleting non-existent task."""
        response = await async_client.delete("/api/tasks/non-existent-id")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_move_task(self, async_client, test_task):
        """Test moving task to different status."""
        move_data = {
            "status": "in_progress",
            "position": 0,
        }
        response = await async_client.post(
            f"/api/tasks/{test_task.id}/move", json=move_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "in_progress"
        assert data["position"] == 0

    @pytest.mark.asyncio
    async def test_filter_tasks_by_status(self, async_client):
        """Test filtering tasks by status."""
        # Create tasks in different statuses
        service = TaskService()
        todo_task = await service.create_task({"title": "Todo Task", "status": "todo"})
        done_task = await service.create_task({"title": "Done Task", "status": "done"})

        # Filter by todo
        response = await async_client.get("/api/tasks/?status=todo")
        assert response.status_code == 200
        data = response.json()
        assert all(t["status"] == "todo" for t in data["tasks"])

        # Cleanup
        await service.delete_task(todo_task.id)
        await service.delete_task(done_task.id)

    @pytest.mark.asyncio
    async def test_search_tasks(self, async_client):
        """Test searching tasks."""
        service = TaskService()
        task = await service.create_task(
            {
                "title": "Unique Searchable Title",
                "description": "Special description text",
            }
        )

        # Search in title
        response = await async_client.get("/api/tasks/?search=Unique")
        assert response.status_code == 200
        data = response.json()
        assert any("Unique" in t["title"] for t in data["tasks"])

        # Search in description
        response = await async_client.get("/api/tasks/?search=Special")
        assert response.status_code == 200
        data = response.json()
        assert any("Special" in (t.get("description") or "") for t in data["tasks"])

        # Cleanup
        await service.delete_task(task.id)

    @pytest.mark.asyncio
    async def test_filter_by_tags(self, async_client):
        """Test filtering tasks by tags."""
        service = TaskService()
        task = await service.create_task(
            {"title": "Tagged Task", "tags": ["backend", "api"]}
        )

        response = await async_client.get("/api/tasks/?tags=backend")
        assert response.status_code == 200
        data = response.json()
        # Should include tasks with any of the specified tags

        # Cleanup
        await service.delete_task(task.id)

    @pytest.mark.asyncio
    async def test_reorder_tasks(self, async_client):
        """Test reordering tasks."""
        service = TaskService()
        task1 = await service.create_task(
            {"title": "Task 1", "status": "todo", "position": 0}
        )
        task2 = await service.create_task(
            {"title": "Task 2", "status": "todo", "position": 1}
        )
        task3 = await service.create_task(
            {"title": "Task 3", "status": "todo", "position": 2}
        )

        # Reorder: Task 3, Task 1, Task 2
        reorder_data = [task3.id, task1.id, task2.id]
        response = await async_client.post("/api/tasks/reorder/todo", json=reorder_data)
        assert response.status_code == 200

        # Verify new order
        task1_updated = await service.get_task(task1.id)
        task2_updated = await service.get_task(task2.id)
        task3_updated = await service.get_task(task3.id)

        assert task3_updated is not None
        assert task1_updated is not None
        assert task2_updated is not None
        assert task3_updated.position == 0
        assert task1_updated.position == 1
        assert task2_updated.position == 2

        # Cleanup
        for t in [task1, task2, task3]:
            await service.delete_task(t.id)


class TestTaskValidation:
    """Test suite for task validation."""

    @pytest.mark.asyncio
    async def test_create_task_empty_title(self, async_client):
        """Test creating task with empty title."""
        task_data = {"title": ""}
        response = await async_client.post("/api/tasks/", json=task_data)
        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_create_task_long_title(self, async_client):
        """Test creating task with title too long."""
        task_data = {"title": "x" * 201}  # Max 200 chars
        response = await async_client.post("/api/tasks/", json=task_data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_task_invalid_priority(self, async_client):
        """Test creating task with invalid priority."""
        task_data = {"title": "Test", "priority": "invalid"}
        response = await async_client.post("/api/tasks/", json=task_data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_task_negative_hours(self, async_client):
        """Test creating task with negative estimated hours."""
        task_data = {"title": "Test", "estimated_hours": -5}
        response = await async_client.post("/api/tasks/", json=task_data)
        assert response.status_code == 422
