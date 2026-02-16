"""API routers."""

from fastapi import APIRouter

from .tasks import router as tasks
from .ai import router as ai
from .calendar import router as calendar
from .telegram import router as telegram

__all__ = ["tasks", "ai", "calendar", "telegram"]
