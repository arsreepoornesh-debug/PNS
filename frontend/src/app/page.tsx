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
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dashStats, jobList] = await Promise.all([
        api.getDashboardStats(),
        api.getJobs(),
      ]);
      setStats(dashStats);
      setJobs(jobList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar onOpenCreateJob={() => setIsCreateJobOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & Primary Action Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Evidence-Based AI Resume Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Recruiter Job Matching & Shortlisting
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Automated multi-resume analysis against Job Descriptions with transparent scoring formulas, verified quote evidence, and zero hallucination.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Job</span>
              </button>
              <Link
                href="/shortlisted"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-colors"
              >
                <Award className="w-4 h-4 text-indigo-400" />
                <span>View Shortlisted</span>
              </Link>
            </div>
          </div>

          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Top Section KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Active Jobs */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Active Jobs</span>
              <Briefcase className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-2xl font-black text-white">
              {stats?.active_jobs || jobs.length || 0}
            </span>
          </div>

          {/* Resumes Analyzed */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold">Resumes Analyzed</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-2xl font-black text-white">
              {stats?.resumes_analyzed || 0}
            </span>
          </div>

          {/* Matched */}
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400 mb-2">
              <span className="text-xs font-semibold">Matched</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-2xl font-black text-emerald-400">
              {stats?.matched_candidates || 0}
            </span>
          </div>

          {/* Partially Matched */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-900/40 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-400 mb-2">
              <span className="text-xs font-semibold">Partial Match</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-2xl font-black text-amber-400">
              {stats?.partial_matches || 0}
            </span>
          </div>

          {/* Not Matched */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400 mb-2">
              <span className="text-xs font-semibold">Not Matched</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-2xl font-black text-rose-400">
              {stats?.not_matched_candidates || 0}
            </span>
          </div>

          {/* Shortlisted */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-900/40 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-indigo-400 mb-2">
              <span className="text-xs font-semibold">Shortlisted</span>
              <Award className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="text-2xl font-black text-indigo-400">
              {stats?.shortlisted_candidates || 0}
            </span>
          </div>
        </div>

        {/* Active Jobs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-400" />
                <span>Active Job Openings</span>
              </h2>
              <p className="text-xs text-slate-400">Select a job to view candidates or upload new resumes</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Jobs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-300">No active job descriptions found.</p>
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
              >
                Create First Job
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-sm group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {job.department || 'Engineering'} • {job.location || 'Remote'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        ACTIVE
                      </span>
                    </div>

                    {/* Match distribution bar */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Resumes: <strong className="text-white">{job.total_resumes}</strong></span>
                        <span>Matched: <strong className="text-emerald-400">{job.matched_count}</strong></span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                        {job.total_resumes > 0 ? (
                          <>
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${(job.matched_count / job.total_resumes) * 100}%` }}
                              title={`${job.matched_count} Matched`}
                            />
                            <div
                              className="bg-amber-500 h-full"
                              style={{ width: `${(job.partial_count / job.total_resumes) * 100}%` }}
                              title={`${job.partial_count} Partial`}
                            />
                            <div
                              className="bg-rose-500 h-full"
                              style={{ width: `${(job.not_matched_count / job.total_resumes) * 100}%` }}
                              title={`${job.not_matched_count} Not Matched`}
                            />
                          </>
                        ) : (
                          <div className="bg-slate-700 h-full w-full" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Reqs: {job.requirements?.length || 0}
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white font-bold text-xs transition-all"
                    >
                      <span>Shortlist Candidates</span>
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
                  <Users className="w-5 h-5 text-purple-400" />
                  <span>Recently Analyzed Candidates</span>
                </h2>
                <p className="text-xs text-slate-400">Real-time candidate matches across all jobs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.recent_candidates.map((cand) => (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white hover:text-indigo-400 transition-colors">
                        {cand.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {cand.experience_years.toFixed(1)} yrs exp • {cand.email || 'No email'}
                      </p>
                    </div>
                    <ScoreGauge score={cand.match_score} size="sm" />
                  </div>

                  <div className="flex items-center justify-between">
                    <StatusBadge status={cand.classification} />
                    <span className="text-[10px] text-slate-400 font-medium">Stage: {cand.stage}</span>
                  </div>

                  {cand.ai_summary && (
                    <p className="text-[11px] text-slate-400 truncate bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
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
