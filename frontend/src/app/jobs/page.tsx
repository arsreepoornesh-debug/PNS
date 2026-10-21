'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Plus,
  Search,
  Trash2,
  ArrowRight,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  MapPin,
  Clock,
  Building2,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Job } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const departments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => {
      if (j.department) set.add(j.department);
    });
    return Array.from(set);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      const matchesSearch =
        !search.trim() ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        (j.department || '').toLowerCase().includes(search.toLowerCase()) ||
        (j.location || '').toLowerCase().includes(search.toLowerCase());

      const matchesDept = selectedDept === 'ALL' || j.department === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [jobs, search, selectedDept]);

  const totalResumes = useMemo(() => {
    return jobs.reduce((acc, j) => acc + (j.total_resumes || 0), 0);
  }, [jobs]);

  const totalShortlisted = useMemo(() => {
    return jobs.reduce((acc, j) => acc + (j.shortlisted_count || 0), 0);
  }, [jobs]);

  const handleDeleteJob = async (e: React.MouseEvent, jobId: string, jobTitle: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm(`Are you sure you want to delete "${jobTitle}" and all its candidate evaluations? This action cannot be undone.`)) {
      try {
        await api.deleteJob(jobId);
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      } catch (err) {
        console.error('Error deleting job:', err);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-yellow-400 selection:text-black">
      <Navbar onOpenCreateJob={() => setIsCreateJobOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-500/30 text-zinc-900 text-xs font-bold">
                <Briefcase className="w-3.5 h-3.5 text-yellow-600" />
                <span>Job Openings & Requirements</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Active Job Openings
              </h1>
              <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                Configure job requirements, customize scoring criteria, and evaluate candidate resumes with zero-hallucination AI matching.
              </p>
            </div>

            <button
              onClick={() => setIsCreateJobOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm shadow-md shadow-yellow-400/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Create New Job</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-zinc-100">
            <div className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
              <span className="text-xs font-bold text-zinc-500 block">Total Positions</span>
              <span className="text-xl font-black text-zinc-900">{jobs.length}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
              <span className="text-xs font-bold text-zinc-500 block">Total Resumes</span>
              <span className="text-xl font-black text-zinc-900">{totalResumes}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
              <span className="text-xs font-bold text-zinc-500 block">Shortlisted</span>
              <span className="text-xl font-black text-yellow-600">{totalShortlisted}</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50/70 border border-zinc-200/60">
              <span className="text-xs font-bold text-zinc-500 block">Departments</span>
              <span className="text-xl font-black text-zinc-900">{departments.length || 1}</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, department, or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all shadow-2xs"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-700 p-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Department Filter Pills */}
          {departments.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedDept('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDept === 'ALL'
                    ? 'bg-zinc-900 text-white shadow-2xs'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                All Departments ({jobs.length})
              </button>
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedDept === dept
                      ? 'bg-zinc-900 text-white shadow-2xs'
                      : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="p-16 rounded-3xl bg-white border border-zinc-200/90 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-zinc-600">Loading your job openings...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-3xl bg-white border border-zinc-200/90 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto shadow-2xs">
              <Briefcase className="w-7 h-7 text-yellow-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-950">
                {search || selectedDept !== 'ALL' ? 'No matching jobs found' : 'No job openings yet'}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                {search || selectedDept !== 'ALL'
                  ? 'Try adjusting your search terms or filters to see matching job openings.'
                  : 'Get started by creating your first job opening to start ingesting resumes and running transparent AI evaluations.'}
              </p>
            </div>
            {search || selectedDept !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedDept('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs shadow-md shadow-yellow-400/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create Your First Job</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredJobs.map((job) => {
              const matchedPct = job.total_resumes > 0 ? (job.matched_count / job.total_resumes) * 100 : 0;
              const partialPct = job.total_resumes > 0 ? (job.partial_count / job.total_resumes) * 100 : 0;
              const notMatchedPct = job.total_resumes > 0 ? (job.not_matched_count / job.total_resumes) * 100 : 0;

              return (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-yellow-400/80 hover:shadow-lg hover:shadow-yellow-400/10 transition-all flex flex-col justify-between group shadow-xs"
                >
                  <div className="space-y-3.5">
                    {/* Header + Delete */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200/80 text-[10px] font-bold uppercase tracking-wider">
                          {job.department || 'General'}
                        </span>
                        <h3 className="font-bold text-base text-zinc-950 group-hover:text-yellow-600 transition-colors line-clamp-1">
                          {job.title}
                        </h3>
                        <p className="text-xs text-zinc-500 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-400" />
                            {job.location || 'Remote'}
                          </span>
                          <span>•</span>
                          <span>{job.employment_type || 'Full-time'}</span>
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleDeleteJob(e, job.id, job.title)}
                        title="Delete job opening"
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Requirements Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-semibold border border-zinc-200">
                        Exp: {job.experience_required || `${job.experience_min_years || 2}+ yrs`}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-[11px] font-semibold border border-zinc-200">
                        {job.requirements?.length || 0} Criteria
                      </span>
                      {job.requirements?.slice(0, 2).map((r, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-800 text-[11px] font-semibold border border-yellow-200/60 truncate max-w-[120px]"
                        >
                          {r.name}
                        </span>
                      ))}
                    </div>

                    {/* Match Stats Distribution */}
                    <div className="pt-3 border-t border-zinc-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-600 font-medium">
                          Total Resumes: <strong className="text-zinc-950 font-bold">{job.total_resumes}</strong>
                        </span>
                        <span className="text-yellow-700 font-bold bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200/70 text-[11px]">
                          {job.shortlisted_count} Shortlisted
                        </span>
                      </div>

                      {/* Multi-segment progress bar */}
                      <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden flex">
                        {job.total_resumes > 0 ? (
                          <>
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${matchedPct}%` }}
                              title={`${job.matched_count} Matched (${matchedPct.toFixed(0)}%)`}
                            />
                            <div
                              className="bg-amber-400 h-full"
                              style={{ width: `${partialPct}%` }}
                              title={`${job.partial_count} Partial (${partialPct.toFixed(0)}%)`}
                            />
                            <div
                              className="bg-rose-400 h-full"
                              style={{ width: `${notMatchedPct}%` }}
                              title={`${job.not_matched_count} Not Matched (${notMatchedPct.toFixed(0)}%)`}
                            />
                          </>
                        ) : (
                          <div className="bg-zinc-200 h-full w-full" />
                        )}
                      </div>

                      <div className="flex justify-between text-[11px] text-zinc-500 pt-0.5">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {job.matched_count} Matched
                        </span>
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                          {job.partial_count} Partial
                        </span>
                        <span className="text-rose-700 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                          {job.not_matched_count} Unmatched
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-[11px] text-zinc-400">
                      Created {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs shadow-xs transition-all active:scale-95 group-hover:shadow-md group-hover:shadow-yellow-400/20"
                    >
                      <span>Analyze Candidates</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
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
