from typing import Optional, List
import uuid
from sqlalchemy import String, Text, Float, Boolean, ForeignKey, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), default="Recruiter")
    role: Mapped[str] = mapped_column(String(50), default="recruiter")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class Job(Base):
    __tablename__ = "jobs"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    department: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    experience_required: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "2+ years" or "2"
    experience_min_years: Mapped[float] = mapped_column(Float, default=0.0)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    employment_type: Mapped[str] = mapped_column(String(50), default="Full-time") # Full-time, Contract, Remote, etc.
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", index=True) # active, closed, draft
    
    # Configurable scoring weights
    weight_required_skills: Mapped[float] = mapped_column(Float, default=40.0)
    weight_experience: Mapped[float] = mapped_column(Float, default=25.0)
    weight_projects: Mapped[float] = mapped_column(Float, default=15.0)
    weight_education: Mapped[float] = mapped_column(Float, default=10.0)
    weight_preferred_skills: Mapped[float] = mapped_column(Float, default=10.0)
    
    # Configurable match thresholds
    threshold_matched: Mapped[float] = mapped_column(Float, default=75.0)
    threshold_partial: Mapped[float] = mapped_column(Float, default=50.0)
    
    # Mandatory requirement rule: "strict" (missing mandatory skill -> max PARTIAL/NOT MATCHED), "downgrade_to_partial", "downgrade_to_not_matched", "none"
    mandatory_rule: Mapped[str] = mapped_column(String(50), default="downgrade_to_partial")
    
    # Relationships
    requirements: Mapped[List["Requirement"]] = relationship("Requirement", back_populates="job", cascade="all, delete-orphan", lazy="selectin")
    candidates: Mapped[List["Candidate"]] = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="job", cascade="all, delete-orphan")

class Requirement(Base):
    __tablename__ = "requirements"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False) # "required", "preferred", "education", "certification"
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True) # If True and type="required", triggers mandatory rule
    weight_multiplier: Mapped[float] = mapped_column(Float, default=1.0)
    
    job: Mapped["Job"] = relationship("Job", back_populates="requirements")

class Candidate(Base):
    __tablename__ = "candidates"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, default="Unknown Candidate")
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    experience_years: Mapped[float] = mapped_column(Float, default=0.0)
    education_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Structured extracted details stored as JSON
    skills: Mapped[List[str]] = mapped_column(JSON, default=list)
    projects: Mapped[List[dict]] = mapped_column(JSON, default=list)
    education: Mapped[List[dict]] = mapped_column(JSON, default=list)
    certifications: Mapped[List[str]] = mapped_column(JSON, default=list)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Recruiter Pipeline Stage: NEW, ANALYZING, MATCHED, SHORTLISTED, INTERVIEW, REJECTED, HIRED
    stage: Mapped[str] = mapped_column(String(50), default="NEW", index=True)
    
    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="candidates")
    resumes: Mapped[List["Resume"]] = relationship("Resume", back_populates="candidate", cascade="all, delete-orphan", lazy="selectin")
    analysis: Mapped[Optional["ResumeAnalysis"]] = relationship("ResumeAnalysis", back_populates="candidate", uselist=False, cascade="all, delete-orphan", lazy="selectin")
    matches: Mapped[List["CandidateRequirementMatch"]] = relationship("CandidateRequirementMatch", back_populates="candidate", cascade="all, delete-orphan", lazy="selectin")
    notes: Mapped[List["RecruiterNote"]] = relationship("RecruiterNote", back_populates="candidate", cascade="all, delete-orphan", lazy="selectin")

class Resume(Base):
    __tablename__ = "resumes"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=True, index=True)
    
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    file_type: Mapped[str] = mapped_column(String(50), default="pdf") # pdf, docx
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    
    # Processing state
    upload_status: Mapped[str] = mapped_column(String(50), default="pending", index=True) # pending, processing, completed, failed
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_count: Mapped[int] = mapped_column(Integer, default=1)
    
    # Relationships
    job: Mapped["Job"] = relationship("Job", back_populates="resumes")
    candidate: Mapped[Optional["Candidate"]] = relationship("Candidate", back_populates="resumes")
    analysis: Mapped[Optional["ResumeAnalysis"]] = relationship("ResumeAnalysis", back_populates="resume", uselist=False, cascade="all, delete-orphan")

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id", ondelete="CASCADE"), unique=True, nullable=False)
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), unique=True, nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Scores (0 to 100)
    match_score: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    required_skills_score: Mapped[float] = mapped_column(Float, default=0.0)
    experience_score: Mapped[float] = mapped_column(Float, default=0.0)
    projects_score: Mapped[float] = mapped_column(Float, default=0.0)
    education_score: Mapped[float] = mapped_column(Float, default=0.0)
    preferred_skills_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Classification: MATCHED, PARTIALLY MATCHED, NOT MATCHED
    classification: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    missing_mandatory_skills: Mapped[List[str]] = mapped_column(JSON, default=list)
    missing_skills: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    # Recruiter-oriented evidence summary (No subjective bias)
    ai_summary: Mapped[str] = mapped_column(Text, default="")
    processing_time_ms: Mapped[int] = mapped_column(Integer, default=0)
    
    # AI Content Detection & Authenticity
    ai_generated_score: Mapped[float] = mapped_column(Float, default=0.0) # 0 to 100% likelihood of AI content
    ai_generated_label: Mapped[str] = mapped_column(String(50), default="Human Written") # Human Written, AI-Assisted / Mixed, Likely AI-Generated
    ai_detection_details: Mapped[dict] = mapped_column(JSON, default=dict) # Flagged phrases, burstiness, metrics
    
    # Relationships
    resume: Mapped["Resume"] = relationship("Resume", back_populates="analysis")
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="analysis")

class CandidateRequirementMatch(Base):
    __tablename__ = "candidate_requirement_matches"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("resume_analyses.id", ondelete="CASCADE"), nullable=True)
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    requirement_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("requirements.id", ondelete="SET NULL"), nullable=True)
    
    requirement_name: Mapped[str] = mapped_column(String(255), nullable=False)
    requirement_type: Mapped[str] = mapped_column(String(50), default="required") # required, preferred, education, certification
    status: Mapped[str] = mapped_column(String(50), nullable=False) # MATCH, PARTIAL, NOT_FOUND
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True) # Exact snippet quote
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Resume page where found
    section_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g. "Experience", "Projects", "Skills"
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="matches")

class Shortlist(Base):
    __tablename__ = "shortlists"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    stage: Mapped[str] = mapped_column(String(50), default="SHORTLISTED")
    decision: Mapped[str] = mapped_column(String(50), default="shortlist") # shortlist, maybe, reject
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class RecruiterNote(Base):
    __tablename__ = "recruiter_notes"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    author_name: Mapped[str] = mapped_column(String(255), default="Recruiter")
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    
    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="notes")
