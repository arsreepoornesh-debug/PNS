import logging
from typing import Dict, Any, List
from app.ai.base import AIProvider
from app.ai.ollama_provider import OllamaProvider
from app.core.config import settings
from app.parsers.base import ParsedDocument
from app.schemas.all_schemas import AIAnalysisResult, JDExtractedRequirements

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, provider: AIProvider = None):
        self.provider = provider or OllamaProvider(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL
        )
        
    def set_provider(self, provider: AIProvider):
        self.provider = provider
        
    async def check_health(self) -> Dict[str, Any]:
        return await self.provider.check_health()
        
    async def extract_job_requirements(self, job_title: str, job_description: str) -> JDExtractedRequirements:
        return await self.provider.extract_job_requirements(job_title, job_description)
        
    async def analyze_resume(
        self,
        job_title: str,
        job_description: str,
        requirements: List[Dict[str, Any]],
        parsed_doc: ParsedDocument,
        weights: Dict[str, float],
        thresholds: Dict[str, float],
        mandatory_rule: str
    ) -> AIAnalysisResult:
        return await self.provider.analyze_resume(
            job_title=job_title,
            job_description=job_description,
            requirements=requirements,
            parsed_doc=parsed_doc,
            weights=weights,
            thresholds=thresholds,
            mandatory_rule=mandatory_rule
        )

# Global singleton
ai_service = AIService()

def get_ai_service() -> AIService:
    return ai_service
