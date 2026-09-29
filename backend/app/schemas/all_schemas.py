from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str = "Recruiter"
    role: str = "recruiter"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ----------------- Requirement Schemas -----------------
class RequirementBase(BaseModel):
    name: str
    type: str = "required" # required, preferred, education, certification
    is_mandatory: bool = True
    weight_multiplier: float = 1.0

class RequirementCreate(RequirementBase):
    pass

class RequirementResponse(RequirementBase):
    id: str
    job_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Job Schemas -----------------
class JobBase(BaseModel):
    title: str
    department: Optional[str] = None
    experience_required: Optional[str] = None
    experience_min_years: float = 0.0
    location: Optional[str] = None
    employment_type: str = "Full-time"
    description: str
    
    # Configurable weights
    weight_required_skills: float = 40.0
    weight_experience: float = 25.0
    weight_projects: float = 15.0
    weight_education: float = 10.0
    weight_preferred_skills: float = 10.0
    
    # Configurable thresholds
    threshold_matched: float = 75.0
    threshold_partial: float = 50.0
    mandatory_rule: str = "downgrade_to_partial" # "strict", "downgrade_to_partial", "downgrade_to_not_matched", "none"

class JobCreate(JobBase):
    requirements: Optional[List[RequirementCreate]] = None

class JobUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    experience_required: Optional[str] = None
    experience_min_years: Optional[float] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    weight_required_skills: Optional[float] = None
    weight_experience: Optional[float] = None
    weight_projects: Optional[float] = None
    weight_education: Optional[float] = None
    weight_preferred_skills: Optional[float] = None
    threshold_matched: Optional[float] = None
    threshold_partial: Optional[float] = None
    mandatory_rule: Optional[str] = None

class JobResponse(JobBase):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    requirements: List[RequirementResponse] = []
    total_resumes: int = 0
    matched_count: int = 0
    partial_count: int = 0
    not_matched_count: int = 0
    shortlisted_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Requirement Match & Evidence Schemas -----------------
class MatchItem(BaseModel):
    requirement_name: str
    requirement_type: str = "required" # required, preferred, education, certification
    status: str # MATCH, PARTIAL, NOT_FOUND
    evidence: Optional[str] = None
    page_number: Optional[int] = None
    section_name: Optional[str] = None
    confidence: float = 1.0

class CandidateRequirementMatchResponse(MatchItem):
    id: str
    candidate_id: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Resume & Analysis Schemas -----------------
class ResumeAnalysisResponse(BaseModel):
    id: str
    resume_id: str
    candidate_id: str
    job_id: str
    match_score: float
    required_skills_score: float
    experience_score: float
    projects_score: float
    education_score: float
    preferred_skills_score: float
    classification: str # MATCHED, PARTIALLY MATCHED, NOT MATCHED
    missing_mandatory_skills: List[str] = []
    missing_skills: List[str] = []
    ai_summary: str
    processing_time_ms: int
    
    # AI Content Detection & Authenticity
    ai_generated_score: float = 0.0
    ai_generated_label: str = "Human Written"
    ai_detection_details: Optional[Dict[str, Any]] = None
    
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ResumeResponse(BaseModel):
    id: str
    job_id: str
    candidate_id: Optional[str] = None
    filename: str
    file_size_bytes: int
    file_type: str
    upload_status: str # pending, processing, completed, failed
    error_message: Optional[str] = None
    page_count: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# ----------------- Recruiter Notes & Shortlist Schemas -----------------
class NoteCreate(BaseModel):
    note_text: str
    author_name: Optional[str] = "Recruiter"

class NoteResponse(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    author_name: str
    note_text: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ShortlistAction(BaseModel):
    decision: str # shortlist, maybe, reject
    stage: Optional[str] = "SHORTLISTED" # NEW, ANALYZING, MATCHED, SHORTLISTED, INTERVIEW, REJECTED, HIRED
    notes: Optional[str] = None

class BulkShortlistRequest(BaseModel):
    candidate_ids: List[str]
    decision: str
    stage: Optional[str] = "SHORTLISTED"
    notes: Optional[str] = None

class BulkStageUpdateRequest(BaseModel):
    candidate_ids: List[str]
    stage: str

# ----------------- Candidate Schemas -----------------
class CandidateResponse(BaseModel):
    id: str
    job_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: float = 0.0
    education_summary: Optional[str] = None
    current_title: Optional[str] = None
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    stage: str
    match_score: float = 0.0
    classification: str = "NOT MATCHED"
    
    # AI Content Detection & Authenticity
    ai_generated_score: float = 0.0
    ai_generated_label: str = "Human Written"
    ai_detection_details: Optional[Dict[str, Any]] = None
    
    created_at: datetime
    
    # Nested matching analysis & notes
    analysis: Optional[ResumeAnalysisResponse] = None
    matches: List[CandidateRequirementMatchResponse] = []
    notes: List[NoteResponse] = []
    resume: Optional[ResumeResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class CandidateListItem(BaseModel):
    id: str
    job_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    experience_years: float
    current_title: Optional[str] = None
    key_skills: List[str] = []
    stage: str
    match_score: Optional[float] = None
    classification: Optional[str] = None # MATCHED, PARTIALLY MATCHED, NOT MATCHED
    missing_mandatory: List[str] = []
    ai_summary: Optional[str] = None
    
    # AI Content Detection & Authenticity
    ai_generated_score: float = 0.0
    ai_generated_label: str = "Human Written"
    ai_detection_details: Optional[Dict[str, Any]] = None
    
    resume_id: Optional[str] = None
    filename: Optional[str] = None
    created_at: datetime

# ----------------- AI Extraction & Matching Structured Output Schemas -----------------
class CandidateInfoExtract(BaseModel):
    name: str = "Unknown Candidate"
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    current_title: Optional[str] = None
    experience_years: float = 0.0
    education_summary: Optional[str] = None
    skills: List[str] = []
    projects: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []

class RequirementEvidence(BaseModel):
    requirement: str
    type: str = "required" # required, preferred, education, certification
    status: str = "NOT_FOUND" # MATCH, PARTIAL, NOT_FOUND
    evidence: Optional[str] = None
    page_number: Optional[int] = None
    section_name: Optional[str] = None

class AIScoringBreakdown(BaseModel):
    required_skills: float
    experience: float
    projects: float
    education: float
    preferred_skills: float
    total: float

class AIDetectionResult(BaseModel):
    ai_score: float = 0.0
    ai_label: str = "Human Written"
    confidence: float = 0.85
    flagged_phrases: List[Dict[str, Any]] = []
    metrics: Dict[str, Any] = {}
    reasoning: str = ""

class AIAnalysisResult(BaseModel):
    candidate: CandidateInfoExtract
    requirements: List[RequirementEvidence]
    score: AIScoringBreakdown
    classification: str # MATCHED, PARTIALLY MATCHED, NOT MATCHED
    missing_mandatory_skills: List[str] = []
    missing_skills: List[str] = []
    summary: str
    ai_detection: Optional[AIDetectionResult] = None

# ----------------- Dashboard & Analytics Schemas -----------------
class DashboardStats(BaseModel):
    active_jobs: int
    resumes_analyzed: int
    matched_candidates: int
    partial_matches: int
    not_matched_candidates: int
    shortlisted_candidates: int
    average_match_score: float
    recent_jobs: List[JobResponse] = []
    recent_candidates: List[CandidateListItem] = []

# ----------------- JD Requirement Extraction Schema -----------------
class JDExtractRequest(BaseModel):
    job_description: str
    job_title: Optional[str] = None

class JDExtractedRequirements(BaseModel):
    title: Optional[str] = None
    experience_required: Optional[str] = None
    experience_min_years: float = 0.0
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    education: List[str] = []
    certifications: List[str] = []
    department: Optional[str] = None
    location: Optional[str] = None
