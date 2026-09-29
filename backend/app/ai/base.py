from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.schemas.all_schemas import AIAnalysisResult, JDExtractedRequirements
from app.parsers.base import ParsedDocument

class AIProvider(ABC):
    @abstractmethod
    async def analyze_resume(
        self,
        job_title: str,
        job_description: str,
        requirements: list, # list of dicts: {'name': str, 'type': str, 'is_mandatory': bool}
        parsed_doc: ParsedDocument,
        weights: dict,
        thresholds: dict,
        mandatory_rule: str
    ) -> AIAnalysisResult:
        """Analyzes a resume against job requirements and returns structured output."""
        pass
        
    @abstractmethod
    async def extract_job_requirements(self, job_title: str, job_description: str) -> JDExtractedRequirements:
        """Extracts structured requirements from JD text."""
        pass
        
    @abstractmethod
    async def check_health(self) -> Dict[str, Any]:
        """Checks provider availability, model status and latency."""
        pass
