import asyncio
import logging
import time
import uuid
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.models.all_models import (
    Job,
    Resume,
    Candidate,
    ResumeAnalysis,
    CandidateRequirementMatch,
    Requirement,
)
from app.parsers.factory import parse_resume_file
from app.ai.service import get_ai_service

logger = logging.getLogger(__name__)

# Active background job progress tracker
# job_id -> {"total": int, "completed": int, "failed": int, "in_progress": bool, "current_file": str}
JOB_PROGRESS: Dict[str, Dict[str, Any]] = {}

def get_job_progress(job_id: str) -> Dict[str, Any]:
    return JOB_PROGRESS.get(job_id, {
        "total": 0,
        "completed": 0,
        "failed": 0,
        "pending": 0,
        "in_progress": False,
        "current_file": None
    })

async def process_single_resume(
    db: AsyncSession,
    resume_id: str,
    job: Job,
    requirements: List[Requirement]
) -> bool:
    """
    Parses a single resume file, runs AI analysis, creates candidate and matches.
    """
    resume = await db.get(Resume, resume_id)
    if not resume:
        return False
        
    start_time = time.time()
    try:
        resume.upload_status = "processing"
        await db.commit()
        
        # 1. Parse Document
        parsed_doc = parse_resume_file(resume.file_path)
        resume.page_count = parsed_doc.page_count
        
        # 2. Prepare Requirements List for AI
        req_dicts = [
            {"name": r.name, "type": r.type, "is_mandatory": r.is_mandatory}
            for r in requirements
        ]
        
        weights = {
            "weight_required_skills": job.weight_required_skills,
            "weight_experience": job.weight_experience,
            "weight_projects": job.weight_projects,
            "weight_education": job.weight_education,
            "weight_preferred_skills": job.weight_preferred_skills,
            "experience_min_years": job.experience_min_years,
        }
        
        thresholds = {
            "threshold_matched": job.threshold_matched,
            "threshold_partial": job.threshold_partial,
        }
        
        # 3. Run AI Service
        ai = get_ai_service()
        analysis_result = await ai.analyze_resume(
            job_title=job.title,
            job_description=job.description,
            requirements=req_dicts,
            parsed_doc=parsed_doc,
            weights=weights,
            thresholds=thresholds,
            mandatory_rule=job.mandatory_rule
        )
        
        # 4. Create or Update Candidate
        candidate_info = analysis_result.candidate
        candidate_name = candidate_info.name
        if candidate_name == "Unknown Candidate" or not candidate_name:
            # Derive clean name from filename
            candidate_name = resume.filename.rsplit('.', 1)[0].replace('_', ' ').replace('-', ' ').title()
            
        candidate = Candidate(
            id=str(uuid.uuid4()),
            job_id=job.id,
            name=candidate_name,
            email=candidate_info.email,
            phone=candidate_info.phone,
            location=candidate_info.location,
            experience_years=candidate_info.experience_years,
            education_summary=candidate_info.education_summary,
            current_title=candidate_info.current_title,
            skills=candidate_info.skills,
            projects=candidate_info.projects,
            education=candidate_info.education,
            certifications=candidate_info.certifications,
            raw_text=parsed_doc.raw_text,
            stage="MATCHED" if analysis_result.classification == "MATCHED" else "ANALYZING"
        )
        db.add(candidate)
        await db.flush()
        
        # Link resume to candidate
        resume.candidate_id = candidate.id
        
        # 5. Create ResumeAnalysis
        elapsed_ms = int((time.time() - start_time) * 1000)
        analysis = ResumeAnalysis(
            id=str(uuid.uuid4()),
            resume_id=resume.id,
            candidate_id=candidate.id,
            job_id=job.id,
            match_score=analysis_result.score.total,
            required_skills_score=analysis_result.score.required_skills,
            experience_score=analysis_result.score.experience,
            projects_score=analysis_result.score.projects,
            education_score=analysis_result.score.education,
            preferred_skills_score=analysis_result.score.preferred_skills,
            classification=analysis_result.classification,
            missing_mandatory_skills=analysis_result.missing_mandatory_skills,
            missing_skills=analysis_result.missing_skills,
            ai_summary=analysis_result.summary,
            processing_time_ms=elapsed_ms
        )
        db.add(analysis)
        await db.flush()
        
        # 6. Create Matches
        for req_ev in analysis_result.requirements:
            # Find matching requirement id
            matched_req_obj = next((r for r in requirements if r.name.lower() == req_ev.requirement.lower()), None)
            
            match_row = CandidateRequirementMatch(
                id=str(uuid.uuid4()),
                analysis_id=analysis.id,
                candidate_id=candidate.id,
                requirement_id=matched_req_obj.id if matched_req_obj else None,
                requirement_name=req_ev.requirement,
                requirement_type=req_ev.type,
                status=req_ev.status,
                evidence=req_ev.evidence,
                page_number=req_ev.page_number,
                section_name=req_ev.section_name,
                confidence=1.0
            )
            db.add(match_row)
            
        resume.upload_status = "completed"
        resume.error_message = None
        await db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Error processing resume {resume_id} ({resume.filename}): {e}", exc_info=True)
        await db.rollback()
        try:
            resume.upload_status = "failed"
            resume.error_message = str(e)
            await db.commit()
        except Exception:
            pass
        return False

async def process_job_resumes_task(job_id: str):
    """
    Background batch processor for all pending resumes for a given job.
    """
    JOB_PROGRESS[job_id] = {
        "total": 0,
        "completed": 0,
        "failed": 0,
        "pending": 0,
        "in_progress": True,
        "current_file": None
    }
    
    async with AsyncSessionLocal() as db:
        try:
            # Fetch job and requirements
            job = await db.get(Job, job_id)
            if not job:
                logger.error(f"Job {job_id} not found for batch processing.")
                JOB_PROGRESS[job_id]["in_progress"] = False
                return
                
            # Fetch requirements
            req_stmt = select(Requirement).where(Requirement.job_id == job_id)
            req_res = await db.execute(req_stmt)
            requirements = list(req_res.scalars().all())
            
            # Fetch pending resumes
            res_stmt = select(Resume).where(
                Resume.job_id == job_id,
                Resume.upload_status.in_(["pending", "failed"])
            )
            res_result = await db.execute(res_stmt)
            resumes = list(res_result.scalars().all())
            
            JOB_PROGRESS[job_id]["total"] = len(resumes)
            JOB_PROGRESS[job_id]["pending"] = len(resumes)
            
            for resume in resumes:
                JOB_PROGRESS[job_id]["current_file"] = resume.filename
                success = await process_single_resume(db, resume.id, job, requirements)
                
                if success:
                    JOB_PROGRESS[job_id]["completed"] += 1
                else:
                    JOB_PROGRESS[job_id]["failed"] += 1
                JOB_PROGRESS[job_id]["pending"] = max(0, JOB_PROGRESS[job_id]["pending"] - 1)
                
                # Small pause to yield loop for UI polling
                await asyncio.sleep(0.05)
                
        except Exception as e:
            logger.error(f"Fatal error in batch job processor for job {job_id}: {e}", exc_info=True)
        finally:
            JOB_PROGRESS[job_id]["in_progress"] = False
            JOB_PROGRESS[job_id]["current_file"] = None

def start_batch_processing(job_id: str):
    """Schedules background task in event loop."""
    asyncio.create_task(process_job_resumes_task(job_id))
