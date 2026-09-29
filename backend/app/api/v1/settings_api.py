from typing import Dict, Any, List
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings
from app.ai.service import get_ai_service
from app.ai.ollama_provider import OllamaProvider

router = APIRouter(prefix="/settings", tags=["settings"])

class AIConfigUpdate(BaseModel):
    base_url: str
    model: str

@router.get("/ai-status")
async def get_ai_status():
    ai = get_ai_service()
    health = await ai.check_health()
    return {
        "provider": "ollama",
        "health": health,
        "config": {
            "base_url": settings.OLLAMA_BASE_URL,
            "model": settings.OLLAMA_MODEL,
            "timeout_seconds": settings.AI_TIMEOUT_SECONDS,
            "scoring_weights": {
                "required_skills": settings.DEFAULT_WEIGHT_REQUIRED_SKILLS,
                "experience": settings.DEFAULT_WEIGHT_EXPERIENCE,
                "projects": settings.DEFAULT_WEIGHT_PROJECTS,
                "education": settings.DEFAULT_WEIGHT_EDUCATION,
                "preferred_skills": settings.DEFAULT_WEIGHT_PREFERRED_SKILLS,
            },
            "thresholds": {
                "matched": settings.DEFAULT_THRESHOLD_MATCHED,
                "partial": settings.DEFAULT_THRESHOLD_PARTIAL,
            }
        }
    }

@router.post("/update-ai-config")
async def update_ai_config(payload: AIConfigUpdate):
    settings.OLLAMA_BASE_URL = payload.base_url
    settings.OLLAMA_MODEL = payload.model
    
    # Update AI service singleton
    ai = get_ai_service()
    ai.set_provider(OllamaProvider(base_url=payload.base_url, model=payload.model))
    
    health = await ai.check_health()
    return {"message": "AI settings updated successfully", "health": health}
