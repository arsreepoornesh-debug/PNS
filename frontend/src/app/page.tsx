'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  ShieldCheck,
  Zap,
  Target,
  FileSearch,
  Check
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardStats, Job } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreGauge } from '@/components/common/ScoreGauge';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashStats, jobList] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getJobs().catch(() => []),
      ]);
      if (dashStats) setStats(dashStats);
      if (jobList) setJobs(jobList);
    } catch (err) {
      console.warn('Dashboard note:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSampleJob = async () => {
    setIsSeeding(true);
    try {
      await api.createJob({
        title: "Senior Full Stack AI Engineer",
        department: "AI & Platform Engineering",
        experience_required: "3+ years",
        location: "Remote / Hybrid",
        employment_type: "Full-time",
        description: "We are seeking a high-velocity Senior Software Engineer skilled in Python, FastAPI, React/Next.js, and PostgreSQL to design scalable microservices and build intelligent resume evaluation agents.",
        requirements: [
          { name: "Python", type: "required", is_mandatory: true, weight_multiplier: 1.2 },
          { name: "FastAPI", type: "required", is_mandatory: true, weight_multiplier: 1.0 },
          { name: "PostgreSQL", type: "required", is_mandatory: true, weight_multiplier: 1.0 },
          { name: "Docker", type: "preferred", is_mandatory: false, weight_multiplier: 0.8 },
          { name: "React / Next.js", type: "preferred", is_mandatory: false, weight_multiplier: 0.8 },
        ]
      });
      await loadData();
    } catch (err) {
      console.error("Failed to create sample job:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-yellow-400 selection:text-black">
      <Navbar onOpenCreateJob={() => setIsCreateJobOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Primary AI Hero Banner - Yellow / Black / White */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 sm:p-9 border border-yellow-400/25 shadow-2xl backdrop-blur-xl">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                <span>Zero-Hallucination AI Resume Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Intelligent Resume Matching <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-white bg-clip-text text-transparent">
                  & Recruiter Shortlisting
                </span>
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed max-w-xl">
                Match resumes against custom Job Descriptions with transparent scoring, deterministic evidence quotes, and AI authenticity verification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm shadow-lg shadow-yellow-400/25 hover:shadow-yellow-400/40 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black stroke-[3]" />
                <span>Create New Job</span>
              </button>
              {jobs.length === 0 && (
                <button
                  onClick={handleCreateSampleJob}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-300 hover:text-yellow-200 font-bold text-sm border border-yellow-400/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span>{isSeeding ? "Generating..." : "✨ Load Sample Job"}</span>
                </button>
              )}
              <Link
                href="/shortlisted"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm border border-zinc-700 hover:border-yellow-400/40 transition-all"
              >
                <Award className="w-4 h-4 text-yellow-400" />
                <span>View Shortlist</span>
              </Link>
            </div>
          </div>

          {/* AI Features Capability Ribbon */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="w-5 h-5 rounded-md bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold text-zinc-200">Strict Quote Grounding</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="w-5 h-5 rounded-md bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Target className="w-3 h-3" />
              </div>
              <span className="font-semibold text-zinc-200">Deterministic Scoring</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="w-5 h-5 rounded-md bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <span className="font-semibold text-zinc-200">AI Content Detection</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <div className="w-5 h-5 rounded-md bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                <Zap className="w-3 h-3" />
              </div>
              <span className="font-semibold text-zinc-200">Batch PDF / DOCX</span>
            </div>
          </div>

          {/* Ambient yellow lighting glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Section KPI Counters - Yellow / Black / White */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Active Jobs */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-yellow-400/50 transition-all flex flex-col justify-between shadow-sm group">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Active Jobs</span>
              <Briefcase className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black text-white">
              {stats?.active_jobs || jobs.length || 0}
            </span>
          </div>

          {/* Resumes Analyzed */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-yellow-400/50 transition-all flex flex-col justify-between shadow-sm group">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Resumes</span>
              <FileText className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black text-white">
              {stats?.resumes_analyzed || 0}
            </span>
          </div>

          {/* Matched */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-yellow-400/60 transition-all flex flex-col justify-between shadow-sm group">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold text-yellow-400">Matched</span>
              <CheckCircle2 className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black text-yellow-400">
              {stats?.matched_candidates || 0}
            </span>
          </div>

          {/* Partially Matched */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 transition-all flex flex-col justify-between shadow-sm group">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold">Partial</span>
              <AlertTriangle className="w-4 h-4 text-zinc-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black text-zinc-200">
              {stats?.partial_matches || 0}
            </span>
          </div>

          {/* Not Matched */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between shadow-sm group">
            <div className="flex items-center justify-between text-zinc-500 mb-2">
              <span className="text-xs font-semibold">Not Matched</span>
              <XCircle className="w-4 h-4 text-zinc-500 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black text-zinc-400">
              {stats?.not_matched_candidates || 0}
            </span>
          </div>

          {/* Shortlisted */}
          <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 hover:border-yellow-400/60 transition-all flex flex-col justify-between shadow-sm group">
            <div className="flex items-center justify-between text-yellow-400 mb-2">
              <span className="text-xs font-bold text-yellow-400">Shortlisted</span>
              <Award className="w-4 h-4 text-yellow-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-2xl font-black text-yellow-400">
              {stats?.shortlisted_candidates || 0}
            </span>
          </div>
        </div>

        {/* Active Jobs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-yellow-400" />
                <span>Job Openings</span>
              </h2>
              <p className="text-xs text-zinc-400">Manage jobs, upload candidate resumes, and view AI matches</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-bold text-yellow-400 hover:text-yellow-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {jobs.length === 0 ? (
            /* Clean Yellow/Black/White empty state card */
            <div className="p-8 sm:p-12 rounded-3xl bg-zinc-950 border border-dashed border-zinc-800 text-center space-y-5 max-w-2xl mx-auto shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 mx-auto flex items-center justify-center text-yellow-400 shadow-inner">
                <Briefcase className="w-7 h-7 text-yellow-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">No job openings created yet</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Create your first job description to start uploading candidate resumes and extracting verified skill evidence with AI.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsCreateJobOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-md shadow-yellow-400/25 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 inline mr-1 text-black stroke-[3]" />
                  Create First Job
                </button>
                <button
                  onClick={handleCreateSampleJob}
                  disabled={isSeeding}
                  className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-yellow-300 text-xs font-bold border border-yellow-400/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />
                  {isSeeding ? "Creating sample..." : "✨ Quick Start with Sample Job"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-yellow-400/50 hover:bg-zinc-900/60 transition-all flex flex-col justify-between shadow-sm group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-yellow-400 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {job.department || 'Engineering'} • {job.location || 'Remote'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </div>

                    {/* Requirements Tags Preview */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.requirements.slice(0, 4).map((req) => (
                          <span
                            key={req.id}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${
                              req.type === 'required'
                                ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/30'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-700/60'
                            }`}
                          >
                            {req.name}
                          </span>
                        ))}
                        {job.requirements.length > 4 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md text-zinc-500 font-medium">
                            +{job.requirements.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Match distribution bar */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Resumes: <strong className="text-white">{job.total_resumes}</strong></span>
                        <span>Matched: <strong className="text-yellow-400">{job.matched_count}</strong></span>
                      </div>
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden flex">
                        {job.total_resumes > 0 ? (
                          <>
                            <div
                              className="bg-yellow-400 h-full"
                              style={{ width: `${(job.matched_count / job.total_resumes) * 100}%` }}
                              title={`${job.matched_count} Matched`}
                            />
                            <div
                              className="bg-zinc-500 h-full"
                              style={{ width: `${(job.partial_count / job.total_resumes) * 100}%` }}
                              title={`${job.partial_count} Partial`}
                            />
                            <div
                              className="bg-zinc-700 h-full"
                              style={{ width: `${(job.not_matched_count / job.total_resumes) * 100}%` }}
                              title={`${job.not_matched_count} Not Matched`}
                            />
                          </>
                        ) : (
                          <div className="bg-zinc-800 h-full w-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {job.requirements?.length || 0} Criteria
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-400/15 hover:bg-yellow-400 text-yellow-400 hover:text-black font-bold text-xs transition-all"
                    >
                      <span>Review Candidates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Analyzed Candidates */}
        {stats?.recent_candidates && stats.recent_candidates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <span>Recently Analyzed Candidates</span>
                </h2>
                <p className="text-xs text-zinc-400">Live AI match evaluations across all active openings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recent_candidates.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-yellow-400/50 hover:bg-zinc-900/60 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white hover:text-yellow-400 transition-colors">
                        {cand.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {cand.experience_years.toFixed(1)} yrs exp • {cand.email || 'No email'}
                      </p>
                    </div>
                    <ScoreGauge score={cand.match_score} size="sm" />
                  </div>

                  <div className="flex items-center justify-between">
                    <StatusBadge status={cand.classification} />
                    <span className="text-[10px] text-zinc-400 font-medium">Stage: {cand.stage}</span>
                  </div>

                  {cand.ai_summary && (
                    <p className="text-[11px] text-zinc-300 line-clamp-2 bg-black p-2 rounded-lg border border-zinc-800">
                      {cand.ai_summary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Job Modal */}
      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onJobCreated={(newJob) => {
          setJobs([newJob, ...jobs]);
          loadData();
        }}
      />

      {/* Candidate Inspector Modal */}
      <CandidateDetailModal
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onUpdated={loadData}
      />
    </div>
  );
}
