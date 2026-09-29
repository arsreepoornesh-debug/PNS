'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Job } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((j) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      (j.department || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );
  });

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('Are you sure you want to delete this job and all associated candidate matches?')) {
      try {
        await api.deleteJob(jobId);
        fetchJobs();
      } catch (err) {
        console.error('Error deleting job:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar onOpenCreateJob={() => setIsCreateJobOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-400" />
              <span>Job Openings & Requirements</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage your job openings, customize transparent scoring criteria, and evaluate resumes
            </p>
          </div>

          <button
            onClick={() => setIsCreateJobOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Job</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search job title, department, location..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-300">No job openings found.</p>
            <button
              onClick={() => setIsCreateJobOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Create New Job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => (
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
                        {job.department || 'Engineering'} • {job.location || 'Remote'} • {job.employment_type}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteJob(e, job.id)}
                      title="Delete job"
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Requirements count pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 text-[10px] font-semibold border border-indigo-800/50">
                      Exp: {job.experience_required || `${job.experience_min_years}+ yrs`}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
                      Reqs: {job.requirements?.length || 0}
                    </span>
                  </div>

                  {/* Match Stats Distribution */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Total Resumes: <strong className="text-white">{job.total_resumes}</strong></span>
                      <span>Shortlisted: <strong className="text-indigo-400">{job.shortlisted_count}</strong></span>
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

                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span className="text-emerald-400 font-semibold">{job.matched_count} Matched</span>
                      <span className="text-amber-400 font-semibold">{job.partial_count} Partial</span>
                      <span className="text-rose-400 font-semibold">{job.not_matched_count} Unmatched</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Created {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <Link
                    href={`/jobs/${job.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs"
                  >
                    <span>Analyze & Shortlist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onJobCreated={(newJob) => {
          setJobs([newJob, ...jobs]);
        }}
      />
    </div>
  );
}
