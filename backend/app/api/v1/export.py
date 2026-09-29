import io
import pandas as pd
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.all_models import Candidate, ResumeAnalysis, RecruiterNote, CandidateRequirementMatch, Job

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/candidates")
async def export_candidates(
    job_id: Optional[str] = Query(None),
    stage: Optional[str] = Query(None, description="e.g. SHORTLISTED, ALL"),
    format: str = Query("csv", description="csv or excel"),
    candidate_ids: Optional[str] = Query(None, description="Comma-separated candidate IDs for bulk export"),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Candidate)
        .options(
            selectinload(Candidate.analysis),
            selectinload(Candidate.matches),
            selectinload(Candidate.notes),
            selectinload(Candidate.job)
        )
    )
    
    if candidate_ids:
        cids = [c.strip() for c in candidate_ids.split(",") if c.strip()]
        stmt = stmt.where(Candidate.id.in_(cids))
    else:
        if job_id:
            stmt = stmt.where(Candidate.job_id == job_id)
        if stage and stage.upper() != "ALL":
            stmt = stmt.where(Candidate.stage == stage.upper())
            
    res = await db.execute(stmt)
    candidates = res.scalars().all()
    
    data = []
    for cand in candidates:
        analysis = cand.analysis
        
        # Skills matched vs missing
        matched_skills = [m.requirement_name for m in cand.matches if m.status == "MATCH"]
        missing_skills = [m.requirement_name for m in cand.matches if m.status == "NOT_FOUND"]
        
        # Notes combined
        notes_text = " | ".join([f"{n.author_name}: {n.note_text}" for n in cand.notes])
        
        data.append({
            "Candidate Name": cand.name,
            "Email": cand.email or "N/A",
            "Phone": cand.phone or "N/A",
            "Location": cand.location or "N/A",
            "Job Title": cand.job.title if cand.job else "N/A",
            "Match Score (%)": analysis.match_score if analysis else 0,
            "Match Status": analysis.classification if analysis else "NOT MATCHED",
            "Pipeline Stage": cand.stage,
            "Required Skills Matched": ", ".join(matched_skills) if matched_skills else "None",
            "Missing Skills": ", ".join(missing_skills) if missing_skills else "None",
            "Experience (Years)": f"{cand.experience_years:.1f}",
            "Education": cand.education_summary or "N/A",
            "AI Summary": analysis.ai_summary if analysis else "",
            "Recruiter Notes": notes_text if notes_text else "None"
        })
        
    df = pd.DataFrame(data)
    
    if format.lower() == "excel" or format.lower() == "xlsx":
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Shortlisted Candidates')
        output.seek(0)
        
        filename = f"candidates_export_{job_id or 'all'}.xlsx"
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    else:
        # Default CSV
        output = io.StringIO()
        df.to_csv(output, index=False)
        output.seek(0)
        
        filename = f"candidates_export_{job_id or 'all'}.csv"
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
