import os
import hashlib
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.all_models import Job, Resume
from app.schemas.all_schemas import ResumeResponse
from app.storage.factory import get_storage_provider
from app.core.config import settings
from app.tasks.processor import start_batch_processing, get_job_progress

router = APIRouter(prefix="/jobs/{job_id}/resumes", tags=["resumes"])

@router.post("/upload", response_model=List[ResumeResponse])
async def upload_resumes(
    job_id: str,
    files: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db)
):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    storage = get_storage_provider()
    created_resumes = []
    
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    
    for file in files:
        filename = file.filename or "resume.pdf"
        ext = os.path.splitext(filename)[1].lower()
        
        if ext not in settings.ALLOWED_EXTENSIONS:
            continue # Skip unsupported
            
        content = await file.read()
        if len(content) > max_bytes:
            continue # Skip oversized
            
        file_hash = hashlib.sha256(content).hexdigest()
        
        # Check if identical file already exists for this job
        stmt = select(Resume).where(Resume.job_id == job_id, Resume.file_hash == file_hash)
        res = await db.execute(stmt)
        existing = res.scalar_one_or_none()
        if existing:
            created_resumes.append(existing)
            continue
            
        unique_filename = f"{job_id}_{uuid.uuid4().hex[:8]}_{filename}"
        saved_path = await storage.save_file(content, unique_filename)
        
        resume_record = Resume(
            id=str(uuid.uuid4()),
            job_id=job_id,
            filename=filename,
            file_path=saved_path,
            file_size_bytes=len(content),
            file_type=ext.replace('.', ''),
            file_hash=file_hash,
            upload_status="pending",
            page_count=1
        )
        db.add(resume_record)
        created_resumes.append(resume_record)
        
    await db.commit()
    for r in created_resumes:
        await db.refresh(r)
        
    return created_resumes

@router.post("/analyze")
async def trigger_analysis(job_id: str, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Check pending resumes count
    stmt = select(func.count(Resume.id)).where(
        Resume.job_id == job_id,
        Resume.upload_status.in_(["pending", "failed"])
    )
    count = (await db.execute(stmt)).scalar() or 0
    
    if count == 0:
        return {"message": "No pending resumes to analyze.", "resumes_queued": 0}
        
    start_batch_processing(job_id)
    return {"message": f"Analysis started for {count} resumes.", "resumes_queued": count}

@router.get("/progress")
async def get_progress(job_id: str, db: AsyncSession = Depends(get_db)):
    prog = get_job_progress(job_id)
    
    # Also fetch database counts
    total_stmt = select(func.count(Resume.id)).where(Resume.job_id == job_id)
    total = (await db.execute(total_stmt)).scalar() or 0
    
    completed_stmt = select(func.count(Resume.id)).where(Resume.job_id == job_id, Resume.upload_status == "completed")
    completed = (await db.execute(completed_stmt)).scalar() or 0
    
    failed_stmt = select(func.count(Resume.id)).where(Resume.job_id == job_id, Resume.upload_status == "failed")
    failed = (await db.execute(failed_stmt)).scalar() or 0
    
    pending_stmt = select(func.count(Resume.id)).where(Resume.job_id == job_id, Resume.upload_status == "pending")
    pending = (await db.execute(pending_stmt)).scalar() or 0
    
    return {
        "job_id": job_id,
        "total_resumes": total,
        "completed": completed,
        "failed": failed,
        "pending": pending,
        "in_progress": prog.get("in_progress", False),
        "current_file": prog.get("current_file", None),
        "percent": round((completed / total * 100), 1) if total > 0 else 0
    }

@router.get("", response_model=List[ResumeResponse])
async def list_resumes(job_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Resume).where(Resume.job_id == job_id).order_by(Resume.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()
