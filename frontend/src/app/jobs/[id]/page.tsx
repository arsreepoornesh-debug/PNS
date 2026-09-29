'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Award,
  Sparkles,
  Layers,
  Settings as SettingsIcon,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Job, CandidateListItem } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { ResumeUploader } from '@/components/resumes/ResumeUploader';
import { CandidateTable } from '@/components/candidates/CandidateTable';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [jobData, candidateList] = await Promise.all([
        api.getJob(jobId),
        api.getCandidatesForJob(jobId, { sort_by: 'highest_match' }),
      ]);
      setJob(jobData);
      setCandidates(candidateList);
    } catch (err) {
      console.error('Failed to load job details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [jobId]);

  if (isLoading && !job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <Sparkles className="w-6 h-6 text-indigo-500 animate-spin mr-2" />
          <span>Loading job workspace & candidate analysis...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
          <p>Job not found.</p>
          <Link href="/jobs" className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const requiredReqs = job.requirements.filter((r) => r.type === 'required');
  const preferredReqs = job.requirements.filter((r) => r.type === 'preferred');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenCreateJob={() => setIsCreateJobOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/jobs" className="hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Jobs</span>
          </Link>
          <span>/</span>
          <span className="text-white font-medium truncate">{job.title}</span>
        </div>

        {/* Recruiter Dashboard Top Section */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {job.department || 'Engineering'}
                </span>
                <span className="text-xs text-slate-400">
                  {job.location || 'Remote'} • {job.employment_type} • Min {job.experience_required || `${job.experience_min_years}+ yrs`}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {job.title}
              </h1>
            </div>

            {/* Quick Summary Pill Counters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 text-center">
                <span className="block text-[10px] text-slate-400 uppercase font-bold">Resumes</span>
                <span className="text-lg font-black text-white">{job.total_resumes}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-center">
                <span className="block text-[10px] text-emerald-400 uppercase font-bold">Matched</span>
                <span className="text-lg font-black text-emerald-400">{job.matched_count}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-900/60 text-center">
                <span className="block text-[10px] text-amber-400 uppercase font-bold">Partial</span>
                <span className="text-lg font-black text-amber-400">{job.partial_count}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-900/60 text-center">
                <span className="block text-[10px] text-rose-400 uppercase font-bold">Not Matched</span>
                <span className="text-lg font-black text-rose-400">{job.not_matched_count}</span>
              </div>
            </div>
          </div>

          {/* Job Requirements Chips */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-400">Required Skills:</span>
              {requiredReqs.map((req, rIdx) => (
                <span
                  key={rIdx}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-xs"
                >
                  ✓ {req.name}
                </span>
              ))}
            </div>

            {preferredReqs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-slate-400">Preferred Skills:</span>
                {preferredReqs.map((req, rIdx) => (
                  <span
                    key={rIdx}
                    className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold text-xs"
                  >
                    + {req.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ingestion & Batch Uploader */}
        <ResumeUploader jobId={job.id} onAnalysisCompleted={loadData} />

        {/* Candidate Shortlisting & Match Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Ranked Candidate Shortlist</span>
              </h2>
              <p className="text-xs text-slate-400">
                MATCHED candidates highlighted at the top, followed by PARTIAL and NOT MATCHED
              </p>
            </div>
          </div>

          <CandidateTable
            jobId={job.id}
            candidates={candidates}
            onSelectCandidate={(id) => setSelectedCandidateId(id)}
            onRefresh={loadData}
          />
        </div>
      </main>

      {/* Candidate Inspector Modal */}
      <CandidateDetailModal
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onUpdated={loadData}
      />

      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onJobCreated={() => loadData()}
      />
    </div>
  );
}
