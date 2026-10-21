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
  MapPin,
  Clock,
  ChevronRight,
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
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <Sparkles className="w-8 h-8 text-yellow-500 animate-spin" />
          <span className="text-sm font-semibold">Loading job workspace & candidate analysis...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3">
          <p className="text-base font-bold text-zinc-800">Job opening not found.</p>
          <Link
            href="/jobs"
            className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black transition-all shadow-xs"
          >
            Back to All Jobs
          </Link>
        </div>
      </div>
    );
  }

  const requiredReqs = job.requirements.filter((r) => r.type === 'required');
  const preferredReqs = job.requirements.filter((r) => r.type === 'preferred');

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-yellow-400 selection:text-black">
      <Navbar onOpenCreateJob={() => setIsCreateJobOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <Link href="/jobs" className="hover:text-zinc-900 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Jobs</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-950 font-bold truncate">{job.title}</span>
        </div>

        {/* Recruiter Dashboard Top Section */}
        <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-5 border-b border-zinc-100">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200/80 text-[10px] font-bold uppercase tracking-wider">
                  {job.department || 'Engineering'}
                </span>
                <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-zinc-400" />
                  {job.location || 'Remote'} • {job.employment_type} • Min {job.experience_required || `${job.experience_min_years}+ yrs`}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                {job.title}
              </h1>
              {job.description && (
                <p className="text-xs text-zinc-600 max-w-3xl leading-relaxed">
                  {job.description}
                </p>
              )}
            </div>

            {/* Quick Summary Pill Counters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="px-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center min-w-[76px]">
                <span className="block text-[10px] text-zinc-500 uppercase font-bold">Resumes</span>
                <span className="text-xl font-black text-zinc-950">{job.total_resumes}</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-center min-w-[76px]">
                <span className="block text-[10px] text-emerald-700 uppercase font-bold">Matched</span>
                <span className="text-xl font-black text-emerald-700">{job.matched_count}</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-center min-w-[76px]">
                <span className="block text-[10px] text-amber-700 uppercase font-bold">Partial</span>
                <span className="text-xl font-black text-amber-700">{job.partial_count}</span>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-center min-w-[76px]">
                <span className="block text-[10px] text-rose-700 uppercase font-bold">Unmatched</span>
                <span className="text-xl font-black text-rose-700">{job.not_matched_count}</span>
              </div>
            </div>
          </div>

          {/* Job Requirements Chips */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-zinc-700">Required Skills:</span>
              {requiredReqs.length === 0 ? (
                <span className="text-zinc-400 italic">None specified</span>
              ) : (
                requiredReqs.map((req, rIdx) => (
                  <span
                    key={rIdx}
                    className="px-2.5 py-1 rounded-lg bg-yellow-50 text-yellow-900 border border-yellow-200/80 font-bold text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-yellow-600" />
                    <span>{req.name}</span>
                  </span>
                ))
              )}
            </div>

            {preferredReqs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-zinc-500">Preferred Skills:</span>
                {preferredReqs.map((req, rIdx) => (
                  <span
                    key={rIdx}
                    className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 font-semibold text-xs flex items-center gap-1"
                  >
                    <span className="text-zinc-400 font-bold">+</span>
                    <span>{req.name}</span>
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
              <h2 className="text-lg font-black text-zinc-950 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Ranked Candidate Pipeline</span>
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Candidates evaluated deterministically against job criteria. Click any row for exact resume evidence quotes.
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
