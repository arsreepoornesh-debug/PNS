import {
  Job,
  CandidateListItem,
  CandidateDetail,
  DashboardStats,
  BatchProgress,
  AIStatus,
  PipelineStage,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let errMsg = `Request failed: ${res.status} ${res.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.detail) errMsg = parsed.detail;
      } catch {
        if (errText) errMsg = errText;
      }
      throw new Error(errMsg);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Jobs
  async getJobs(): Promise<Job[]> {
    return fetchJson<Job[]>('/jobs');
  },

  async getJob(id: string): Promise<Job> {
    return fetchJson<Job>(`/jobs/${id}`);
  },

  async createJob(payload: Partial<Job> & { requirements: any[] }): Promise<Job> {
    return fetchJson<Job>('/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateJob(id: string, payload: Partial<Job>): Promise<Job> {
    return fetchJson<Job>(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteJob(id: string): Promise<{ message: string }> {
    return fetchJson<{ message: string }>(`/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  async extractJobRequirements(title: string, description: string) {
    return fetchJson<{
      title?: string;
      experience_required?: string;
      experience_min_years: number;
      required_skills: string[];
      preferred_skills: string[];
      education: string[];
      certifications: string[];
      department?: string;
    }>('/jobs/extract-requirements', {
      method: 'POST',
      body: JSON.stringify({ job_title: title, job_description: description }),
    });
  },

  // Resumes & Processing
  async uploadResumes(jobId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));

    const res = await fetch(`${API_BASE}/jobs/${jobId}/resumes/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || 'Upload failed');
    }
    return await res.json();
  },

  async triggerAnalysis(jobId: string) {
    return fetchJson<{ message: string; resumes_queued: number }>(`/jobs/${jobId}/resumes/analyze`, {
      method: 'POST',
    });
  },

  async getProgress(jobId: string): Promise<BatchProgress> {
    return fetchJson<BatchProgress>(`/jobs/${jobId}/resumes/progress`);
  },

  // Candidates
  async getCandidatesForJob(
    jobId: string,
    params?: {
      classification?: string;
      search?: string;
      min_score?: number;
      max_score?: number;
      min_exp?: number;
      sort_by?: string;
    }
  ): Promise<CandidateListItem[]> {
    const query = new URLSearchParams();
    if (params?.classification) query.append('classification', params.classification);
    if (params?.search) query.append('search', params.search);
    if (params?.min_score !== undefined) query.append('min_score', params.min_score.toString());
    if (params?.max_score !== undefined) query.append('max_score', params.max_score.toString());
    if (params?.min_exp !== undefined) query.append('min_exp', params.min_exp.toString());
    if (params?.sort_by) query.append('sort_by', params.sort_by);

    return fetchJson<CandidateListItem[]>(`/jobs/${jobId}/candidates?${query.toString()}`);
  },

  async getCandidate(candidateId: string): Promise<CandidateDetail> {
    return fetchJson<CandidateDetail>(`/candidates/${candidateId}`);
  },

  async addNote(candidateId: string, noteText: string, authorName = 'Recruiter') {
    return fetchJson(`/candidates/${candidateId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note_text: noteText, author_name: authorName }),
    });
  },

  async updateCandidateStage(candidateId: string, stage: PipelineStage) {
    return fetchJson(`/candidates/${candidateId}/stage?stage=${stage}`, {
      method: 'PUT',
    });
  },

  // Shortlisting
  async shortlistCandidate(candidateId: string, decision: 'shortlist' | 'maybe' | 'reject', notes?: string) {
    return fetchJson(`/candidates/${candidateId}/shortlist`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    });
  },

  async bulkShortlist(candidateIds: string[], decision: 'shortlist' | 'maybe' | 'reject') {
    return fetchJson<{ message: string; updated_count: number }>(`/shortlists/bulk`, {
      method: 'POST',
      body: JSON.stringify({ candidate_ids: candidateIds, decision }),
    });
  },

  async bulkUpdateStage(candidateIds: string[], stage: PipelineStage) {
    return fetchJson<{ message: string }>(`/shortlists/bulk-stage`, {
      method: 'PUT',
      body: JSON.stringify({ candidate_ids: candidateIds, stage }),
    });
  },

  async getShortlistedCandidates(jobId?: string, stage = 'SHORTLISTED'): Promise<CandidateListItem[]> {
    const query = new URLSearchParams();
    if (jobId) query.append('job_id', jobId);
    if (stage) query.append('stage', stage);
    return fetchJson<CandidateListItem[]>(`/shortlists?${query.toString()}`);
  },

  // Export URL helper
  getExportUrl(params: { jobId?: string; stage?: string; format?: 'csv' | 'excel'; candidateIds?: string[] }): string {
    const query = new URLSearchParams();
    if (params.jobId) query.append('job_id', params.jobId);
    if (params.stage) query.append('stage', params.stage);
    query.append('format', params.format || 'csv');
    if (params.candidateIds && params.candidateIds.length > 0) {
      query.append('candidate_ids', params.candidateIds.join(','));
    }
    return `${API_BASE}/export/candidates?${query.toString()}`;
  },

  // Dashboard Analytics
  async getDashboardStats(): Promise<DashboardStats> {
    return fetchJson<DashboardStats>('/analytics/dashboard');
  },

  // Settings
  async getAIStatus(): Promise<AIStatus> {
    return fetchJson<AIStatus>('/settings/ai-status');
  },

  async updateAIConfig(baseUrl: string, model: string) {
    return fetchJson('/settings/update-ai-config', {
      method: 'POST',
      body: JSON.stringify({ base_url: baseUrl, model: model }),
    });
  },
};
