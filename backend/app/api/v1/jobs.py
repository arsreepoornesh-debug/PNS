import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.all_models import Job, Requirement, Resume, Candidate, ResumeAnalysis, Shortlist
from app.schemas.all_schemas import (
    JobCreate,
    JobUpdate,
    JobResponse,
    RequirementCreate,
    RequirementResponse,
    JDExtractRequest,
    JDExtractedRequirements
)
from app.ai.service import get_ai_service

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("/extract-requirements", response_model=JDExtractedRequirements)
async def extract_requirements(req: JDExtractRequest):
    ai = get_ai_service()
    return await ai.extract_job_requirements(
        job_title=req.job_title or "",
        job_description=req.job_description
    )

@router.post("", response_model=JobResponse)
async def create_job(job_in: JobCreate, db: AsyncSession = Depends(get_db)):
    job = Job(
        id=str(uuid.uuid4()),
        title=job_in.title,
        department=job_in.department,
        experience_required=job_in.experience_required,
        experience_min_years=job_in.experience_min_years,
        location=job_in.location,
        employment_type=job_in.employment_type,
        description=job_in.description,
        weight_required_skills=job_in.weight_required_skills,
        weight_experience=job_in.weight_experience,
        weight_projects=job_in.weight_projects,
        weight_education=job_in.weight_education,
        weight_preferred_skills=job_in.weight_preferred_skills,
        threshold_matched=job_in.threshold_matched,
        threshold_partial=job_in.threshold_partial,
        mandatory_rule=job_in.mandatory_rule,
        status="active"
    )
    db.add(job)
    await db.flush()
    
    if job_in.requirements:
        for r in job_in.requirements:
            req = Requirement(
                id=str(uuid.uuid4()),
                job_id=job.id,
                name=r.name.strip(),
                type=r.type,
                is_mandatory=r.is_mandatory,
                weight_multiplier=r.weight_multiplier
            )
            db.add(req)
            
    await db.commit()
    
    # Reload with requirements
    stmt = select(Job).options(selectinload(Job.requirements)).where(Job.id == job.id)
    res = await db.execute(stmt)
    created_job = res.scalar_one()
    
    resp = JobResponse.model_validate(created_job)
    return resp

@router.get("", response_model=List[JobResponse])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    stmt = select(Job).options(selectinload(Job.requirements)).order_by(Job.created_at.desc())
    res = await db.execute(stmt)
    jobs = res.scalars().all()
    
    result = []
    for j in jobs:
        # Count stats
        total_resumes_stmt = select(func.count(Resume.id)).where(Resume.job_id == j.id)
        total_res = (await db.execute(total_resumes_stmt)).scalar() or 0
        
        matched_stmt = select(func.count(ResumeAnalysis.id)).where(
            ResumeAnalysis.job_id == j.id,
            ResumeAnalysis.classification == "MATCHED"
        )
        matched_count = (await db.execute(matched_stmt)).scalar() or 0
        
        partial_stmt = select(func.count(ResumeAnalysis.id)).where(
            ResumeAnalysis.job_id == j.id,
            ResumeAnalysis.classification == "PARTIALLY MATCHED"
        )
        partial_count = (await db.execute(partial_stmt)).scalar() or 0
        
        not_matched_stmt = select(func.count(ResumeAnalysis.id)).where(
            ResumeAnalysis.job_id == j.id,
            ResumeAnalysis.classification == "NOT MATCHED"
        )
        not_matched_count = (await db.execute(not_matched_stmt)).scalar() or 0
        
        shortlisted_stmt = select(func.count(Candidate.id)).where(
            Candidate.job_id == j.id,
            Candidate.stage.in_(["SHORTLISTED", "INTERVIEW", "HIRED"])
        )
        shortlisted_count = (await db.execute(shortlisted_stmt)).scalar() or 0
        
        job_data = JobResponse.model_validate(j)
        job_data.total_resumes = total_res
        job_data.matched_count = matched_count
        job_data.partial_count = partial_count
        job_data.not_matched_count = not_matched_count
        job_data.shortlisted_count = shortlisted_count
        result.append(job_data)
        
    return result

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Job).options(selectinload(Job.requirements)).where(Job.id == job_id)
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    total_resumes_stmt = select(func.count(Resume.id)).where(Resume.job_id == job.id)
    total_res = (await db.execute(total_resumes_stmt)).scalar() or 0
    
    matched_stmt = select(func.count(ResumeAnalysis.id)).where(
        ResumeAnalysis.job_id == job.id,
        ResumeAnalysis.classification == "MATCHED"
    )
    matched_count = (await db.execute(matched_stmt)).scalar() or 0
    
    partial_stmt = select(func.count(ResumeAnalysis.id)).where(
        ResumeAnalysis.job_id == job.id,
        ResumeAnalysis.classification == "PARTIALLY MATCHED"
    )
    partial_count = (await db.execute(partial_stmt)).scalar() or 0
    
    not_matched_stmt = select(func.count(ResumeAnalysis.id)).where(
        ResumeAnalysis.job_id == job.id,
        ResumeAnalysis.classification == "NOT MATCHED"
    )
    not_matched_count = (await db.execute(not_matched_stmt)).scalar() or 0
    
    shortlisted_stmt = select(func.count(Candidate.id)).where(
        Candidate.job_id == job.id,
        Candidate.stage.in_(["SHORTLISTED", "INTERVIEW", "HIRED"])
    )
    shortlisted_count = (await db.execute(shortlisted_stmt)).scalar() or 0
    
    job_data = JobResponse.model_validate(job)
    job_data.total_resumes = total_res
    job_data.matched_count = matched_count
    job_data.partial_count = partial_count
    job_data.not_matched_count = not_matched_count
    job_data.shortlisted_count = shortlisted_count
    return job_data

@router.put("/{job_id}", response_model=JobResponse)
async def update_job(job_id: str, job_in: JobUpdate, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    for field, val in job_in.model_dump(exclude_unset=True).items():
        setattr(job, field, val)
        
    await db.commit()
    
    stmt = select(Job).options(selectinload(Job.requirements)).where(Job.id == job_id)
    res = await db.execute(stmt)
    return res.scalar_one()

@router.delete("/{job_id}")
async def delete_job(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    await db.delete(job)
    await db.commit()
    return {"message": f"Job {job_id} deleted successfully"}
