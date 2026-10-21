'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Download,
  Search,
  Filter,
  Users,
  Briefcase,
  Mail,
  Phone,
  Eye,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CandidateListItem, PipelineStage } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreGauge } from '@/components/common/ScoreGauge';
import { CandidateDetailModal } from '@/components/candidates/CandidateDetailModal';

export default function ShortlistedPage() {
  const [candidates, setCandidates] = useState<CandidateListItem[]>([]);
  const [activeStage, setActiveStage] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const fetchShortlist = async () => {
    setIsLoading(true);
    try {
      const data = await api.getShortlistedCandidates(undefined, activeStage);
      setCandidates(data);
    } catch (err) {
      console.error('Failed to fetch shortlisted candidates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShortlist();
  }, [activeStage]);

  const filtered = candidates.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.key_skills || []).some((s) => s.toLowerCase().includes(q))
    );
  });

  const handleExport = (format: 'csv' | 'excel') => {
    const url = api.getExportUrl({
      stage: activeStage !== 'ALL' ? activeStage : undefined,
      format,
    });
    window.open(url, '_blank');
  };

  const stages = ['ALL', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-yellow-400 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-500/30 text-zinc-900 text-xs font-bold">
                <Award className="w-3.5 h-3.5 text-yellow-600" />
                <span>Candidate Pipeline</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
                Shortlisted Candidates
              </h1>
              <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                Review qualified applicants across recruitment stages, inspect evidence quotes, and export candidate dossiers.
              </p>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-xs font-bold text-zinc-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-xs font-black text-black transition-colors shadow-xs cursor-pointer active:scale-95"
              >
                <Download className="w-3.5 h-3.5 text-black" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stage Filter Tabs & Search */}
        <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-zinc-100">
              {stages.map((stage) => {
                const isActive = activeStage === stage;
                return (
                  <button
                    key={stage}
                    onClick={() => setActiveStage(stage)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-yellow-400 text-black shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    {stage}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, or skill..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        {isLoading ? (
          <div className="p-16 rounded-3xl bg-white border border-zinc-200/90 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-yellow-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-zinc-600">Loading shortlisted candidates...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 sm:p-16 rounded-3xl bg-white border border-zinc-200/90 text-center space-y-4 max-w-xl mx-auto shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mx-auto shadow-2xs">
              <Award className="w-7 h-7 text-yellow-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-zinc-950">No candidates in this stage</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                {search
                  ? 'No shortlisted candidates match your search query.'
                  : 'Open your job openings to evaluate candidate resumes and shortlist top talent.'}
              </p>
            </div>
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs shadow-md shadow-yellow-400/20 active:scale-95 transition-all"
            >
              <span>Explore Active Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-yellow-400/80 hover:shadow-lg hover:shadow-yellow-400/10 transition-all cursor-pointer flex flex-col justify-between shadow-xs space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-zinc-950 group-hover:text-yellow-600 transition-colors">
                        {cand.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                        <span className="font-semibold text-zinc-700">{cand.experience_years.toFixed(1)} yrs exp</span>
                        {cand.email && <span>• {cand.email}</span>}
                      </div>
                    </div>
                    <ScoreGauge score={cand.match_score} size="md" />
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={cand.classification} />
                    <StatusBadge status={cand.stage} showIcon={false} />
                  </div>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(cand.key_skills || []).slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {cand.ai_summary && (
                    <p className="text-[11px] text-zinc-600 line-clamp-2 bg-yellow-50/50 p-2.5 rounded-xl border border-yellow-200/60 leading-relaxed font-medium">
                      {cand.ai_summary}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-400">
                    Analyzed {new Date(cand.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-yellow-700 font-black group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Inspect Profile</span>
                    <Eye className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CandidateDetailModal
        candidateId={selectedCandidateId}
        onClose={() => setSelectedCandidateId(null)}
        onUpdated={fetchShortlist}
      />
    </div>
  );
}
