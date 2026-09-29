"""
Groq AI Provider — Free, fast LLM inference via api.groq.com
Supports: llama-3.1-8b-instant (free tier: 30 req/min, 6000 tokens/min)
Get your free API key at: https://console.groq.com
"""
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
    JDExtractedRequirements,
)
from app.ai.rule_matcher import (
    extract_candidate_basics,
    find_evidence_for_requirement,
    calculate_transparent_score,
)

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqProvider(AIProvider):
    """
    AI provider using Groq's free API (OpenAI-compatible endpoint).
    Falls back to deterministic rule-matching if the API key is missing or the
    call fails — the app always works even without a key.
    """

    def __init__(self, api_key: str = "", model: str = ""):
        self.api_key = api_key or getattr(settings, "GROQ_API_KEY", "")
        self.model = model or getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def _chat(self, system_prompt: str, user_prompt: str, timeout: float = 30.0) -> Optional[str]:
        """Send a chat request to Groq; return assistant content or None on failure."""
        if not self.api_key:
            logger.warning("GROQ_API_KEY not set — skipping LLM call, using rule-based engine.")
            return None

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0.1,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                res = await client.post(GROQ_API_URL, headers=self._headers(), json=payload)
                if res.status_code == 200:
                    return res.json()["choices"][0]["message"]["content"]
                logger.warning(f"Groq API error {res.status_code}: {res.text[:200]}")
                return None
        except Exception as e:
            logger.warning(f"Groq call failed ({e}), falling back to rule-based engine.")
            return None

    # ------------------------------------------------------------------
    # AIProvider interface
    # ------------------------------------------------------------------

    async def check_health(self) -> Dict[str, Any]:
        if not self.api_key:
            return {
                "status": "no_key",
                "provider": "groq",
                "model": self.model,
                "message": (
                    "GROQ_API_KEY is not configured. "
                    "Get a free key at https://console.groq.com and set it as an environment variable. "
                    "Rule-based transparent matching is active."
                ),
            }
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(
                    "https://api.groq.com/openai/v1/models",
                    headers=self._headers(),
                )
                if res.status_code == 200:
                    models = [m["id"] for m in res.json().get("data", [])]
                    model_ok = any(self.model in m for m in models)
                    return {
                        "status": "online",
                        "provider": "groq",
                        "model": self.model,
                        "model_available": model_ok,
                        "available_models": models[:10],
                        "message": f"Groq API connected. Model '{self.model}' {'ready' if model_ok else 'not found'}.",
                    }
                return {"status": "error", "provider": "groq", "message": f"Groq returned HTTP {res.status_code}"}
        except Exception as e:
            return {"status": "offline", "provider": "groq", "message": f"Cannot reach Groq API: {e}"}

    async def analyze_resume(
        self,
        job_title: str,
        job_description: str,
        requirements: list,
        parsed_doc: ParsedDocument,
        weights: dict,
        thresholds: dict,
        mandatory_rule: str,
    ) -> AIAnalysisResult:
        # 1. Deterministic baseline
        candidate_basics = extract_candidate_basics(parsed_doc.raw_text)

        # 2. Rule-based evidence (always runs, regardless of LLM)
        req_evidence_list: List[RequirementEvidence] = []
        for req in requirements:
            r_name = req.get("name", "")
            r_type = req.get("type", "required")
            status, snippet, page_no, sec = find_evidence_for_requirement(r_name, parsed_doc)
            req_evidence_list.append(
                RequirementEvidence(
                    requirement=r_name,
                    type=r_type,
                    status=status,
                    evidence=snippet,
                    page_number=page_no,
                    section_name=sec,
                )
            )

        # 3. LLM enhancement via Groq (optional)
        candidate_name = candidate_basics["name"]
        candidate_email = candidate_basics["email"]
        candidate_phone = candidate_basics["phone"]
        exp_years = candidate_basics["experience_years"]
        job_exp_years = float(weights.get("experience_min_years", 2.0))

        system_prompt = (
            "You are an expert, unbiased AI resume analyzer. "
            "Return ONLY valid JSON. Never invent skills or experience not in the resume. "
            "Use null for missing values."
        )
        user_prompt = f"""Analyze this resume against the job requirements.

Job Title: {job_title}
Requirements: {json.dumps([r.get("name") for r in requirements])}

Resume (first 3500 chars):
{parsed_doc.raw_text[:3500]}

Return ONLY this JSON:
{{
  "candidate_name": "Full Name or null",
  "candidate_email": "email or null",
  "candidate_phone": "phone or null",
  "experience_years": 0.0,
  "skills_found": ["skill1"],
  "summary": "2-sentence recruiter summary based only on resume evidence."
}}"""

        llm_raw = await self._chat(system_prompt, user_prompt, timeout=float(getattr(settings, "AI_TIMEOUT_SECONDS", 30)))
        if llm_raw:
            try:
                parsed_llm = json.loads(llm_raw)
                if parsed_llm.get("candidate_name") and parsed_llm["candidate_name"] not in (None, "Full Name or null"):
                    candidate_name = parsed_llm["candidate_name"]
                if parsed_llm.get("candidate_email"):
                    candidate_email = parsed_llm["candidate_email"]
                if parsed_llm.get("candidate_phone"):
                    candidate_phone = parsed_llm["candidate_phone"]
                if isinstance(parsed_llm.get("experience_years"), (int, float)) and parsed_llm["experience_years"] > 0:
                    exp_years = float(parsed_llm["experience_years"])
            except Exception as e:
                logger.warning(f"Failed to parse Groq resume analysis JSON: {e}")

        # 4. Transparent scoring (deterministic)
        score_breakdown, classification, missing_mand, missing_skills, ai_summary = calculate_transparent_score(
            requirements=requirements,
            req_evidence_list=req_evidence_list,
            candidate_exp_years=exp_years,
            job_required_exp_years=job_exp_years,
            weights=weights,
            thresholds=thresholds,
            mandatory_rule=mandatory_rule,
            parsed_doc=parsed_doc,
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
            certifications=[],
        )

        return AIAnalysisResult(
            candidate=candidate_info,
            requirements=req_evidence_list,
            score=score_breakdown,
            classification=classification,
            missing_mandatory_skills=missing_mand,
            missing_skills=missing_skills,
            summary=ai_summary,
        )

    async def extract_job_requirements(self, job_title: str, job_description: str) -> JDExtractedRequirements:
        text = f"{job_title}\n{job_description}"

        # Deterministic skill extraction fallback
        common_tech_skills = [
            "Python", "FastAPI", "Django", "Flask", "PostgreSQL", "MySQL", "MongoDB", "Redis",
            "Docker", "Kubernetes", "AWS", "Azure", "GCP", "REST API", "GraphQL", "Git", "CI/CD",
            "React", "Next.js", "TypeScript", "JavaScript", "Node.js", "Express", "Tailwind CSS",
            "Java", "Spring Boot", "C++", "C#", ".NET", "Golang", "Rust", "Kafka", "Elasticsearch",
            "Microservices", "Linux", "SQL", "NoSQL", "Celery", "Pandas", "PyTorch", "TensorFlow",
        ]
        found_skills = [s for s in common_tech_skills if re.search(rf"\b{re.escape(s)}\b", text, re.IGNORECASE)]
        required = found_skills[:5] if found_skills else ["Python", "FastAPI", "REST API", "PostgreSQL"]
        preferred = found_skills[5:8] if len(found_skills) > 5 else ["Docker", "AWS", "Redis"]

        exp_years = 2.0
        exp_match = re.search(r"(\d+(?:\.\d+)?)\+?\s*(?:years?|yrs?)", text, re.IGNORECASE)
        if exp_match:
            try:
                exp_years = float(exp_match.group(1))
            except ValueError:
                pass

        # LLM extraction
        system_prompt = "You are a job description parser. Return ONLY valid JSON."
        user_prompt = f"""Extract structured requirements from this JD.

Job Title: {job_title}
Job Description:
{job_description[:3000]}

Return ONLY this JSON:
{{
  "title": "{job_title}",
  "experience_min_years": {exp_years},
  "required_skills": ["skill1", "skill2"],
  "preferred_skills": ["skill3"],
  "education": ["Bachelor's in CS or related field"],
  "certifications": []
}}"""

        llm_raw = await self._chat(system_prompt, user_prompt, timeout=15.0)
        if llm_raw:
            try:
                parsed = json.loads(llm_raw)
                return JDExtractedRequirements(
                    title=parsed.get("title", job_title),
                    experience_required=f"{parsed.get('experience_min_years', exp_years)}+ years",
                    experience_min_years=float(parsed.get("experience_min_years", exp_years)),
                    required_skills=parsed.get("required_skills", required),
                    preferred_skills=parsed.get("preferred_skills", preferred),
                    education=parsed.get("education", ["Bachelor's degree in CS or related field"]),
                    certifications=parsed.get("certifications", []),
                    department="Engineering",
                )
            except Exception as e:
                logger.warning(f"Failed to parse Groq JD extraction JSON: {e}")

        return JDExtractedRequirements(
            title=job_title or "Software Engineer",
            experience_required=f"{int(exp_years)}+ years",
            experience_min_years=exp_years,
            required_skills=required,
            preferred_skills=preferred,
            education=["Bachelor's degree in Computer Science, Engineering, or related technical field"],
            certifications=[],
            department="Engineering",
        )
