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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-indigo-400" />
              <span>Shortlisted Candidates & Hiring Pipeline</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Review recruiter shortlisted talent, manage hiring stages, and export candidate records
            </p>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Stage Filter Tabs & Search */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950">
              {['ALL', 'SHORTLISTED', 'INTERVIEW', 'HIRED', 'REJECTED'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeStage === stage
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name or skill..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading shortlisted candidates...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-300">No candidates found in this stage.</p>
            <p className="text-xs text-slate-500">Go to your active jobs to shortlist promising candidates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((cand) => (
              <div
                key={cand.id}
                onClick={() => setSelectedCandidateId(cand.id)}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between shadow-sm space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors">
                        {cand.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{cand.experience_years.toFixed(1)} yrs exp</span>
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
                  <div className="flex flex-wrap gap-1">
                    {(cand.key_skills || []).slice(0, 5).map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {cand.ai_summary && (
                    <p className="text-[11px] text-slate-400 truncate bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      {cand.ai_summary}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-500">
                    Analyzed {new Date(cand.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    <span>Inspect</span>
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
