export type ClassificationType = 'MATCHED' | 'PARTIALLY MATCHED' | 'NOT MATCHED';

export type PipelineStage = 
  | 'NEW' 
  | 'ANALYZING' 
  | 'MATCHED' 
  | 'SHORTLISTED' 
  | 'INTERVIEW' 
  | 'REJECTED' 
  | 'HIRED';

export interface Requirement {
  id?: string;
  job_id?: string;
  name: string;
  type: 'required' | 'preferred' | 'education' | 'certification';
  is_mandatory: boolean;
  weight_multiplier?: number;
}

export interface Job {
  id: string;
  title: string;
  department?: string | null;
  experience_required?: string | null;
  experience_min_years: number;
  location?: string | null;
  employment_type: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  weight_required_skills: number;
  weight_experience: number;
  weight_projects: number;
  weight_education: number;
  weight_preferred_skills: number;
  threshold_matched: number;
  threshold_partial: number;
  mandatory_rule: 'strict' | 'downgrade_to_partial' | 'downgrade_to_not_matched' | 'none';
  created_at: string;
  updated_at: string;
  requirements: Requirement[];
  total_resumes: number;
  matched_count: number;
  partial_count: number;
  not_matched_count: number;
  shortlisted_count: number;
}

export interface CandidateRequirementMatch {
  id: string;
  requirement_name: string;
  requirement_type: 'required' | 'preferred' | 'education' | 'certification';
  status: 'MATCH' | 'PARTIAL' | 'NOT_FOUND';
  evidence?: string | null;
  page_number?: number | null;
  section_name?: string | null;
  confidence: number;
}

export interface ResumeAnalysis {
  id: string;
  resume_id: string;
  candidate_id: string;
  job_id: string;
  match_score: number;
  required_skills_score: number;
  experience_score: number;
  projects_score: number;
  education_score: number;
  preferred_skills_score: number;
  classification: ClassificationType;
  missing_mandatory_skills: string[];
  missing_skills: string[];
  ai_summary: string;
  processing_time_ms: number;
  created_at: string;
}

export interface RecruiterNote {
  id: string;
  candidate_id: string;
  job_id: string;
  author_name: string;
  note_text: string;
  created_at: string;
}

export interface CandidateListItem {
  id: string;
  job_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  experience_years: number;
  current_title?: string | null;
  key_skills: string[];
  stage: PipelineStage;
  match_score: number;
  classification: ClassificationType;
  missing_mandatory: string[];
  ai_summary?: string | null;
  resume_id?: string | null;
  filename?: string | null;
  created_at: string;
}

export interface CandidateDetail extends CandidateListItem {
  education_summary?: string | null;
  skills: string[];
  projects: any[];
  education: any[];
  certifications: string[];
  analysis?: ResumeAnalysis | null;
  matches: CandidateRequirementMatch[];
  notes: RecruiterNote[];
}

export interface DashboardStats {
  active_jobs: number;
  resumes_analyzed: number;
  matched_candidates: number;
  partial_matches: number;
  not_matched_candidates: number;
  shortlisted_candidates: number;
  average_match_score: number;
  recent_jobs: Job[];
  recent_candidates: CandidateListItem[];
}

export interface BatchProgress {
  job_id: string;
  total_resumes: number;
  completed: number;
  failed: number;
  pending: number;
  in_progress: boolean;
  current_file?: string | null;
  percent: number;
}

export interface AIStatus {
  provider: string;
  health: {
    status: 'online' | 'offline' | 'error';
    base_url: string;
    current_model: string;
    model_available?: boolean;
    available_models?: string[];
    message: string;
  };
  config: {
    base_url: string;
    model: string;
    timeout_seconds: number;
    scoring_weights: Record<string, number>;
    thresholds: Record<string, number>;
  };
}
