"""Application configuration."""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings."""

    # Application
    APP_NAME: str = "Kanban Board API"
    DEBUG: bool = Field(default=False)
    ENVIRONMENT: str = Field(default="development")
    SECRET_KEY: str = Field(default="dev-secret-key")

    # Server
    BACKEND_HOST: str = Field(default="0.0.0.0")
    BACKEND_PORT: int = Field(default=8000)
    BACKEND_URL: str = Field(default="http://localhost:8000")
    FRONTEND_URL: str = Field(default="http://localhost:5173")

    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
    )

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./data/kanban.db")

    # Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # Task storage
    TASKS_DIR: str = Field(default="./data/tasks")

    # AI Configuration
    GROQ_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
    OLLAMA_HOST: str = Field(default="http://localhost:11434")
    OLLAMA_MODEL: str = Field(default="llama3")
    DEFAULT_AI_PROVIDER: str = Field(default="groq")
    AI_TIMEOUT: int = Field(default=30)
    AI_CACHE_ENABLED: bool = Field(default=True)
    AI_CACHE_TTL: int = Field(default=60)

    # Telegram
    TELEGRAM_BOT_TOKEN: str = Field(default="")
    TELEGRAM_WEBHOOK_URL: str = Field(default="")

    # Google Calendar
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:8000/auth/callback")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
