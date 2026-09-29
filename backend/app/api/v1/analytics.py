from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.all_models import Job, Resume, Candidate, ResumeAnalysis
from app.schemas.all_schemas import DashboardStats, JobResponse, CandidateListItem

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # 1. Total active jobs
    jobs_stmt = select(func.count(Job.id)).where(Job.status == "active")
    active_jobs = (await db.execute(jobs_stmt)).scalar() or 0
    
    # 2. Resumes analyzed (completed)
    res_stmt = select(func.count(Resume.id)).where(Resume.upload_status == "completed")
    resumes_analyzed = (await db.execute(res_stmt)).scalar() or 0
    
    # 3. Matched candidates
    matched_stmt = select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.classification == "MATCHED")
    matched_candidates = (await db.execute(matched_stmt)).scalar() or 0
    
    # 4. Partial matches
    partial_stmt = select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.classification == "PARTIALLY MATCHED")
    partial_matches = (await db.execute(partial_stmt)).scalar() or 0
    
    # 5. Not matched candidates
    not_matched_stmt = select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.classification == "NOT MATCHED")
    not_matched_candidates = (await db.execute(not_matched_stmt)).scalar() or 0
    
    # 6. Shortlisted candidates
    shortlisted_stmt = select(func.count(Candidate.id)).where(Candidate.stage.in_(["SHORTLISTED", "INTERVIEW", "HIRED"]))
    shortlisted_candidates = (await db.execute(shortlisted_stmt)).scalar() or 0
    
    # 7. Average score
    avg_score_stmt = select(func.avg(ResumeAnalysis.match_score))
    avg_score = (await db.execute(avg_score_stmt)).scalar() or 0.0
    
    # Recent jobs
    recent_jobs_stmt = select(Job).options(selectinload(Job.requirements)).order_by(Job.created_at.desc()).limit(5)
    recent_jobs_res = await db.execute(recent_jobs_stmt)
    jobs_objs = recent_jobs_res.scalars().all()
    
    recent_jobs = []
    for j in jobs_objs:
        total_res = (await db.execute(select(func.count(Resume.id)).where(Resume.job_id == j.id))).scalar() or 0
        matched = (await db.execute(select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.job_id == j.id, ResumeAnalysis.classification == "MATCHED"))).scalar() or 0
        partial = (await db.execute(select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.job_id == j.id, ResumeAnalysis.classification == "PARTIALLY MATCHED"))).scalar() or 0
        not_matched = (await db.execute(select(func.count(ResumeAnalysis.id)).where(ResumeAnalysis.job_id == j.id, ResumeAnalysis.classification == "NOT MATCHED"))).scalar() or 0
        shortlisted = (await db.execute(select(func.count(Candidate.id)).where(Candidate.job_id == j.id, Candidate.stage.in_(["SHORTLISTED", "INTERVIEW", "HIRED"])))).scalar() or 0
        
        j_resp = JobResponse.model_validate(j)
        j_resp.total_resumes = total_res
        j_resp.matched_count = matched
        j_resp.partial_count = partial
        j_resp.not_matched_count = not_matched
        j_resp.shortlisted_count = shortlisted
        recent_jobs.append(j_resp)
        
    # Recent candidates
    cand_stmt = (
        select(Candidate, ResumeAnalysis, Resume)
        .outerjoin(ResumeAnalysis, Candidate.id == ResumeAnalysis.candidate_id)
        .outerjoin(Resume, Candidate.id == Resume.candidate_id)
        .order_by(Candidate.created_at.desc())
        .limit(6)
    )
    cand_res = await db.execute(cand_stmt)
    recent_cands = []
    for cand, analysis, resume in cand_res.all():
        recent_cands.append(CandidateListItem(
            id=cand.id,
            job_id=cand.job_id,
            name=cand.name,
            email=cand.email,
            phone=cand.phone,
            location=cand.location,
            experience_years=cand.experience_years,
            current_title=cand.current_title,
            key_skills=cand.skills or [],
            stage=cand.stage,
            match_score=analysis.match_score if analysis else 0.0,
            classification=analysis.classification if analysis else "NOT MATCHED",
            missing_mandatory=analysis.missing_mandatory_skills if analysis else [],
            ai_summary=analysis.ai_summary if analysis else None,
            resume_id=resume.id if resume else None,
            filename=resume.filename if resume else None,
            created_at=cand.created_at
        ))
        
    return DashboardStats(
        active_jobs=active_jobs,
        resumes_analyzed=resumes_analyzed,
        matched_candidates=matched_candidates,
        partial_matches=partial_matches,
        not_matched_candidates=not_matched_candidates,
        shortlisted_candidates=shortlisted_candidates,
        average_match_score=round(avg_score, 1),
        recent_jobs=recent_jobs,
        recent_candidates=recent_cands
    )
