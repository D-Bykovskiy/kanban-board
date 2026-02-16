"""Telegram routes."""

from fastapi import APIRouter

router = APIRouter()


@router.post("/webhook")
async def telegram_webhook():
    """Telegram bot webhook."""
    return {"message": "Telegram webhook - Phase 2 implementation pending"}


@router.get("/status")
async def telegram_status():
    """Check Telegram bot status."""
    return {"message": "Telegram status - Phase 2 implementation pending"}
