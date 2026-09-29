import json
import logging
import re
import httpx
from typing import Dict, Any, List, Optional
from app.ai.base import AIProvider
from app.core.config import settings
from app.parsers.base import ParsedDocument
from app.schemas.all_schemas import (
    AIAnalysisResult,
    CandidateInfoExtract,
    RequirementEvidence,
    AIScoringBreakdown,
    JDExtractedRequirements
)
from app.ai.rule_matcher import (
    extract_candidate_basics,
    find_evidence_for_requirement,
    calculate_transparent_score
)

logger = logging.getLogger(__name__)

class OllamaProvider(AIProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model
        
    async def check_health(self) -> Dict[str, Any]:
        """Checks if Ollama is running and lists available models."""
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    model_found = any(self.model in m or m in self.model for m in models)
                    return {
                        "status": "online",
                        "base_url": self.base_url,
                        "current_model": self.model,
                        "model_available": model_found,
                        "available_models": models,
                        "message": f"Ollama is connected. Model '{self.model}' {'is ready' if model_found else 'needs to be pulled'}."
                    }
                return {
                    "status": "error",
                    "base_url": self.base_url,
                    "message": f"Ollama returned HTTP status {res.status_code}"
                }
        except Exception as e:
            return {
                "status": "offline",
                "base_url": self.base_url,
                "current_model": self.model,
                "message": f"Cannot connect to Ollama at {self.base_url}. Ensure Ollama is running (`ollama serve`). Rule-based transparent matching is active."
            }

    async def analyze_resume(
        self,
        job_title: str,
        job_description: str,
        requirements: list,
        parsed_doc: ParsedDocument,
        weights: dict,
        thresholds: dict,
        mandatory_rule: str
    ) -> AIAnalysisResult:
        """
        Analyzes resume using Ollama LLM with structured JSON parsing, backed by deterministic evidence verification.
        """
        # Baseline deterministic extraction
        candidate_basics = extract_candidate_basics(parsed_doc.raw_text)
        
        # Build evidence for every requirement
        req_evidence_list: List[RequirementEvidence] = []
        for req in requirements:
            r_name = req.get("name", "")
            r_type = req.get("type", "required")
            status, snippet, page_no, sec = find_evidence_for_requirement(r_name, parsed_doc)
            req_evidence_list.append(RequirementEvidence(
                requirement=r_name,
                type=r_type,
                status=status,
                evidence=snippet,
                page_number=page_no,
                section_name=sec
            ))
            
        # If Ollama is available, enhance with LLM extraction and summary
        candidate_name = candidate_basics["name"]
        candidate_email = candidate_basics["email"]
        candidate_phone = candidate_basics["phone"]
        exp_years = candidate_basics["experience_years"]
        job_exp_years = float(weights.get("experience_min_years", 2.0))
        
        # Try Ollama prompt if server is reachable
        prompt = f"""You are an expert, unbiased AI resume analyzer. You must analyze this candidate resume against the Job Description.
STRICT RULES:
1. NEVER invent candidate experience, skills, education, or achievements.
2. If a skill or requirement is not present in the resume, mark it as NOT_FOUND.
3. Ignore all personal protected characteristics (gender, race, age, religion, disability).
4. Return ONLY a valid JSON object matching the exact structure below.

Job Title: {job_title}
Job Requirements: {json.dumps([r.get('name') for r in requirements])}

Resume Text:
{parsed_doc.raw_text[:4000]}

Respond ONLY with valid JSON:
{{
  "candidate_name": "Full Name",
  "candidate_email": "email or null",
  "candidate_phone": "phone or null",
  "experience_years": 3.0,
  "skills_found": ["Python", "FastAPI"],
  "summary": "Concise 2-sentence recruiter summary highlighting concrete evidence only."
}}
"""
        try:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT_SECONDS) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False,
                        "options": {"temperature": 0.1}
                    }
                )
                if response.status_code == 200:
                    resp_json = response.json()
                    response_text = resp_json.get("response", "{}")
                    parsed_llm = json.loads(response_text)
                    if parsed_llm.get("candidate_name") and parsed_llm["candidate_name"] != "Full Name":
                        candidate_name = parsed_llm["candidate_name"]
                    if parsed_llm.get("candidate_email"):
                        candidate_email = parsed_llm["candidate_email"]
                    if parsed_llm.get("candidate_phone"):
                        candidate_phone = parsed_llm["candidate_phone"]
                    if isinstance(parsed_llm.get("experience_years"), (int, float)) and parsed_llm["experience_years"] > 0:
                        exp_years = float(parsed_llm["experience_years"])
        except Exception as e:
            logger.warning(f"Ollama call skipped or failed ({e}), continuing with deterministic engine.")
            
        # Calculate transparent scores & enforce mandatory rules
        score_breakdown, classification, missing_mand, missing_skills, ai_summary = calculate_transparent_score(
            requirements=requirements,
            req_evidence_list=req_evidence_list,
            candidate_exp_years=exp_years,
            job_required_exp_years=job_exp_years,
            weights=weights,
            thresholds=thresholds,
            mandatory_rule=mandatory_rule,
            parsed_doc=parsed_doc
        )
        
        candidate_info = CandidateInfoExtract(
            name=candidate_name,
            email=candidate_email,
            phone=candidate_phone,
            location=candidate_basics.get("location"),
            experience_years=exp_years,
            education_summary=candidate_basics.get("education_summary"),
            skills=[r.requirement for r in req_evidence_list if r.status == "MATCH"],
            projects=[],
            education=[],
            certifications=[]
        )
        
        return AIAnalysisResult(
            candidate=candidate_info,
            requirements=req_evidence_list,
            score=score_breakdown,
            classification=classification,
            missing_mandatory_skills=missing_mand,
            missing_skills=missing_skills,
            summary=ai_summary
        )

    async def extract_job_requirements(self, job_title: str, job_description: str) -> JDExtractedRequirements:
        """
        Extracts structured required/preferred skills and experience from JD text.
        """
        # First fallback / fast pattern matcher
        text = f"{job_title}\n{job_description}"
        
        # Skill extraction heuristic
        common_tech_skills = [
            "Python", "FastAPI", "Django", "Flask", "PostgreSQL", "MySQL", "MongoDB", "Redis",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "REST API", "GraphQL", "Git", "CI/CD",
            "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Express", "Tailwind CSS",
            "Java", "Spring Boot", "C++", "C#", ".NET", "Golang", "Rust", "Kafka", "Elasticsearch",
            "Microservices", "Linux", "SQL", "NoSQL", "Celery", "Pandas", "PyTorch", "TensorFlow"
        ]
        
        found_skills = []
        for skill in common_tech_skills:
            if re.search(rf'\b{re.escape(skill)}\b', text, re.IGNORECASE):
                found_skills.append(skill)
                
        # Split into required vs preferred
        required = found_skills[:5] if found_skills else ["Python", "FastAPI", "REST API", "PostgreSQL"]
        preferred = found_skills[5:8] if len(found_skills) > 5 else ["Docker", "AWS", "Redis"]
        
        # Extract exp
        exp_years = 2.0
        exp_match = re.search(r'(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)', text, re.IGNORECASE)
        if exp_match:
            try:
                exp_years = float(exp_match.group(1))
            except ValueError:
                pass
                
        # Try Ollama extraction if online
        try:
            prompt = f"""Extract structured job requirements from the following Job Description.
Job Title: {job_title}
Job Description:
{job_description}

Respond ONLY with valid JSON in this format:
{{
  "title": "{job_title}",
  "experience_min_years": {exp_years},
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill3", "skill4"],
  "education": ["Bachelor's in Computer Science or related field"],
  "certifications": []
}}"""
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "format": "json",
                        "stream": False
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    parsed = json.loads(data.get("response", "{}"))
                    return JDExtractedRequirements(
                        title=parsed.get("title", job_title),
                        experience_required=f"{parsed.get('experience_min_years', exp_years)}+ years",
                        experience_min_years=float(parsed.get('experience_min_years', exp_years)),
                        required_skills=parsed.get("required_skills", required),
                        preferred_skills=parsed.get("preferred_skills", preferred),
                        education=parsed.get("education", ["Bachelor's degree in Computer Science or related field"]),
                        certifications=parsed.get("certifications", []),
                        department="Engineering"
                    )
        except Exception:
            pass
            
        return JDExtractedRequirements(
            title=job_title or "Software Engineer",
            experience_required=f"{int(exp_years)}+ years",
            experience_min_years=exp_years,
            required_skills=required,
            preferred_skills=preferred,
            education=["Bachelor's degree in Computer Science, Engineering, or related technical field"],
            certifications=[],
            department="Engineering"
        )
