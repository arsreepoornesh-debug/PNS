import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
from app.db.session import get_db
from app.models.all_models import Candidate, Shortlist, ResumeAnalysis, Job, Resume
from app.schemas.all_schemas import (
    ShortlistAction,
    BulkShortlistRequest,
    BulkStageUpdateRequest,
    CandidateListItem,
)

router = APIRouter(tags=["shortlists"])

@router.post("/candidates/{candidate_id}/shortlist")
async def shortlist_candidate(
    candidate_id: str,
    action: ShortlistAction,
    db: AsyncSession = Depends(get_db)
):
    cand = await db.get(Candidate, candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Map decision to stage
    stage_map = {
        "shortlist": "SHORTLISTED",
        "maybe": "MATCHED",
        "reject": "REJECTED"
    }
    new_stage = action.stage or stage_map.get(action.decision.lower(), "SHORTLISTED")
    cand.stage = new_stage
    
    # Check if Shortlist record exists
    stmt = select(Shortlist).where(Shortlist.candidate_id == candidate_id)
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    
    if existing:
        existing.decision = action.decision
        existing.stage = new_stage
        existing.notes = action.notes or existing.notes
    else:
        sl = Shortlist(
            id=str(uuid.uuid4()),
            candidate_id=candidate_id,
            job_id=cand.job_id,
            stage=new_stage,
            decision=action.decision,
            notes=action.notes
        )
        db.add(sl)
        
    await db.commit()
    return {"message": f"Candidate marked as {action.decision}", "stage": new_stage}

@router.post("/shortlists/bulk")
async def bulk_shortlist(
    payload: BulkShortlistRequest,
    db: AsyncSession = Depends(get_db)
):
    if not payload.candidate_ids:
        return {"updated_count": 0}
        
    stage_map = {
        "shortlist": "SHORTLISTED",
        "maybe": "MATCHED",
        "reject": "REJECTED"
    }
    new_stage = payload.stage or stage_map.get(payload.decision.lower(), "SHORTLISTED")
    
    stmt = update(Candidate).where(Candidate.id.in_(payload.candidate_ids)).values(stage=new_stage)
    await db.execute(stmt)
    await db.commit()
    
    return {"message": f"Updated {len(payload.candidate_ids)} candidates to {new_stage}", "updated_count": len(payload.candidate_ids)}

@router.put("/shortlists/bulk-stage")
async def bulk_stage_update(
    payload: BulkStageUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    if not payload.candidate_ids:
        return {"updated_count": 0}
        
    stmt = update(Candidate).where(Candidate.id.in_(payload.candidate_ids)).values(stage=payload.stage.upper())
    await db.execute(stmt)
    await db.commit()
    return {"message": f"Moved {len(payload.candidate_ids)} candidates to stage {payload.stage.upper()}"}

@router.get("/shortlists", response_model=List[CandidateListItem])
async def list_shortlisted_candidates(
    job_id: Optional[str] = Query(None),
    stage: Optional[str] = Query("SHORTLISTED", description="SHORTLISTED, INTERVIEW, HIRED, REJECTED, ALL"),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Candidate, ResumeAnalysis, Resume)
        .outerjoin(ResumeAnalysis, Candidate.id == ResumeAnalysis.candidate_id)
        .outerjoin(Resume, Candidate.id == Resume.candidate_id)
    )
    
    if job_id:
        stmt = stmt.where(Candidate.job_id == job_id)
        
    if stage and stage.upper() != "ALL":
        stmt = stmt.where(Candidate.stage == stage.upper())
    else:
        # Default show shortlisted pipeline
        stmt = stmt.where(Candidate.stage.in_(["SHORTLISTED", "INTERVIEW", "HIRED"]))
        
    stmt = stmt.order_by(ResumeAnalysis.match_score.desc())
    res = await db.execute(stmt)
    rows = res.all()
    
    items = []
    for cand, analysis, resume in rows:
        items.append(CandidateListItem(
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
        
    return items
