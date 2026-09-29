import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, asc
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.all_models import Candidate, ResumeAnalysis, CandidateRequirementMatch, RecruiterNote, Resume
from app.schemas.all_schemas import (
    CandidateListItem,
    CandidateResponse,
    NoteCreate,
    NoteResponse,
    ResumeAnalysisResponse,
    CandidateRequirementMatchResponse,
    ResumeResponse,
)

router = APIRouter(tags=["candidates"])

@router.get("/jobs/{job_id}/candidates", response_model=List[CandidateListItem])
async def list_candidates_for_job(
    job_id: str,
    classification: Optional[str] = Query(None, description="All, MATCHED, PARTIALLY MATCHED, NOT MATCHED"),
    search: Optional[str] = Query(None, description="Search name, email, skills"),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None),
    min_exp: Optional[float] = Query(None),
    sort_by: str = Query("highest_match", description="highest_match, lowest_match, most_experience, name, recent"),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Candidate, ResumeAnalysis, Resume)
        .outerjoin(ResumeAnalysis, Candidate.id == ResumeAnalysis.candidate_id)
        .outerjoin(Resume, Candidate.id == Resume.candidate_id)
        .where(Candidate.job_id == job_id)
    )
    
    # Classification filter
    if classification and classification.lower() != "all":
        cls_clean = classification.upper()
        if cls_clean in ["MATCHED", "PARTIALLY MATCHED", "NOT MATCHED"]:
            stmt = stmt.where(ResumeAnalysis.classification == cls_clean)
        elif cls_clean == "PARTIAL":
            stmt = stmt.where(ResumeAnalysis.classification == "PARTIALLY MATCHED")
            
    # Search filter
    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Candidate.name.ilike(search_term),
                Candidate.email.ilike(search_term),
                Candidate.raw_text.ilike(search_term)
            )
        )
        
    # Score filter
    if min_score is not None:
        stmt = stmt.where(ResumeAnalysis.match_score >= min_score)
    if max_score is not None:
        stmt = stmt.where(ResumeAnalysis.match_score <= max_score)
        
    # Experience filter
    if min_exp is not None:
        stmt = stmt.where(Candidate.experience_years >= min_exp)
        
    # Sorting logic
    if sort_by == "lowest_match":
        stmt = stmt.order_by(ResumeAnalysis.match_score.asc())
    elif sort_by == "most_experience":
        stmt = stmt.order_by(Candidate.experience_years.desc())
    elif sort_by == "name":
        stmt = stmt.order_by(Candidate.name.asc())
    elif sort_by == "recent":
        stmt = stmt.order_by(Candidate.created_at.desc())
    else: # Default: MATCHED first, then PARTIAL, then NOT MATCHED, sorted by score desc
        # Custom classification ordering
        stmt = stmt.order_by(
            ResumeAnalysis.classification.desc(), # MATCHED, PARTIALLY MATCHED, NOT MATCHED alphabetical works well or by score
            ResumeAnalysis.match_score.desc()
        )
        
    res = await db.execute(stmt)
    rows = res.all()
    
    # In-memory primary sorting ensuring MATCHED -> PARTIALLY MATCHED -> NOT MATCHED -> Score desc
    def sort_key(row):
        cand, analysis, _ = row
        score = analysis.match_score if analysis else 0.0
        cls = analysis.classification if analysis else "NOT MATCHED"
        tier = 3
        if cls == "MATCHED":
            tier = 1
        elif cls == "PARTIALLY MATCHED":
            tier = 2
        return (tier, -score)
        
    if sort_by == "highest_match":
        rows = sorted(rows, key=sort_key)
        
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

@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Candidate)
        .options(
            selectinload(Candidate.analysis),
            selectinload(Candidate.matches),
            selectinload(Candidate.notes),
            selectinload(Candidate.resumes)
        )
        .where(Candidate.id == candidate_id)
    )
    res = await db.execute(stmt)
    cand = res.scalar_one_or_none()
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # Build CandidateResponse
    analysis_resp = ResumeAnalysisResponse.model_validate(cand.analysis) if cand.analysis else None
    matches_resp = [CandidateRequirementMatchResponse.model_validate(m) for m in cand.matches]
    notes_resp = [NoteResponse.model_validate(n) for n in cand.notes]
    resume_resp = ResumeResponse.model_validate(cand.resumes[0]) if cand.resumes else None
    
    return CandidateResponse(
        id=cand.id,
        job_id=cand.job_id,
        name=cand.name,
        email=cand.email,
        phone=cand.phone,
        location=cand.location,
        experience_years=cand.experience_years,
        education_summary=cand.education_summary,
        current_title=cand.current_title,
        skills=cand.skills or [],
        projects=cand.projects or [],
        education=cand.education or [],
        certifications=cand.certifications or [],
        stage=cand.stage,
        created_at=cand.created_at,
        analysis=analysis_resp,
        matches=matches_resp,
        notes=notes_resp,
        resume=resume_resp
    )

@router.post("/candidates/{candidate_id}/notes", response_model=NoteResponse)
async def add_candidate_note(
    candidate_id: str,
    note_in: NoteCreate,
    db: AsyncSession = Depends(get_db)
):
    cand = await db.get(Candidate, candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    note = RecruiterNote(
        id=str(uuid.uuid4()),
        candidate_id=candidate_id,
        job_id=cand.job_id,
        author_name=note_in.author_name or "Recruiter",
        note_text=note_in.note_text
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note

@router.put("/candidates/{candidate_id}/stage")
async def update_candidate_stage(
    candidate_id: str,
    stage: str = Query(..., description="NEW, ANALYZING, MATCHED, SHORTLISTED, INTERVIEW, REJECTED, HIRED"),
    db: AsyncSession = Depends(get_db)
):
    cand = await db.get(Candidate, candidate_id)
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    cand.stage = stage.upper()
    await db.commit()
    return {"message": f"Stage updated to {cand.stage}", "candidate_id": cand.id, "stage": cand.stage}
