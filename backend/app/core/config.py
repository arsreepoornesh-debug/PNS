import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Resume Analyzer & Job Matcher"
    API_V1_STR: str = "/api/v1"

    # Security
    SECRET_KEY: str = "supersecret_ai_resume_analyzer_key_change_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    # - Local:      sqlite+aiosqlite:///./resume_analyzer.db   (default)
    # - Supabase:   postgresql+asyncpg://user:pass@host:5432/postgres
    # Override by setting DATABASE_URL env var in Render / Railway dashboard.
    DATABASE_URL: str = "sqlite+aiosqlite:///./resume_analyzer.db"

    # Storage
    STORAGE_TYPE: str = "local"  # "local" or "s3"
    STORAGE_DIR: str = os.path.join(os.getcwd(), "uploaded_resumes")
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]

    # AI Provider
    # Options: "groq" | "ollama" | "rule_based"
    # "groq"  → Free Groq API (recommended for cloud deployment)
    # "ollama"→ Local Ollama (recommended for local dev)
    DEFAULT_AI_PROVIDER: str = "groq"

    # Groq settings (free tier — get key at https://console.groq.com)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Ollama settings (local dev only)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b"

    AI_TIMEOUT_SECONDS: int = 30

    # CORS — add your Vercel deployment URL here or via env var
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Default Scoring Weights (%)
    DEFAULT_WEIGHT_REQUIRED_SKILLS: float = 40.0
    DEFAULT_WEIGHT_EXPERIENCE: float = 25.0
    DEFAULT_WEIGHT_PROJECTS: float = 15.0
    DEFAULT_WEIGHT_EDUCATION: float = 10.0
    DEFAULT_WEIGHT_PREFERRED_SKILLS: float = 10.0

    # Default Thresholds (%)
    DEFAULT_THRESHOLD_MATCHED: float = 75.0
    DEFAULT_THRESHOLD_PARTIAL: float = 50.0

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()

# Ensure local storage directory exists (no-op on cloud with ephemeral fs)
os.makedirs(settings.STORAGE_DIR, exist_ok=True)

