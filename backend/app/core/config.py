import os
from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Resume Analyzer & Job Matcher"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "supersecret_ai_resume_analyzer_key_change_in_prod"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database (Default to SQLite for instant out-of-the-box local operation, easily switch to PostgreSQL)
    DATABASE_URL: str = "sqlite+aiosqlite:///./resume_analyzer.db"
    
    # Storage
    STORAGE_TYPE: str = "local" # "local" or "s3"
    STORAGE_DIR: str = os.path.join(os.getcwd(), "uploaded_resumes")
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".docx"]
    
    # AI Provider configuration
    DEFAULT_AI_PROVIDER: str = "ollama" # "ollama" or "rule_based"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5:3b" # also works with qwen:3b, llama3.2, etc.
    AI_TIMEOUT_SECONDS: int = 90
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
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
        "extra": "ignore"
    }

settings = Settings()

# Ensure storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
