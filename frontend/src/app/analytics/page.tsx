'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  Sparkles,
  PieChart,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';

export default function AnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .finally(() => setIsLoading(false));
  }, []);

  const total = stats?.resumes_analyzed || 0;
  const matched = stats?.matched_candidates || 0;
  const partial = stats?.partial_matches || 0;
  const notMatched = stats?.not_matched_candidates || 0;

  const matchedPct = total > 0 ? ((matched / total) * 100).toFixed(1) : 0;
  const partialPct = total > 0 ? ((partial / total) * 100).toFixed(1) : 0;
  const notMatchedPct = total > 0 ? ((notMatched / total) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>AI Shortlisting & Match Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual breakdown of candidate qualification distributions and pipeline conversion
          </p>
        </div>

        {/* Analytics KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-400">Total Analyzed</span>
            <div className="text-3xl font-black text-white">{total}</div>
            <p className="text-[11px] text-slate-500">Resumes processed across all jobs</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-emerald-400">Match Rate</span>
            <div className="text-3xl font-black text-emerald-400">{matchedPct}%</div>
            <p className="text-[11px] text-slate-500">{matched} candidates met all required criteria</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-amber-400">Partial Match Rate</span>
            <div className="text-3xl font-black text-amber-400">{partialPct}%</div>
            <p className="text-[11px] text-slate-500">{partial} candidates with partial overlap</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-400">Average Match Score</span>
            <div className="text-3xl font-black text-indigo-400">{stats?.average_match_score || 0}%</div>
            <p className="text-[11px] text-slate-500">Across all evaluated resumes</p>
          </div>
        </div>

        {/* Match Distribution Breakdown Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="font-bold text-base text-white">Qualification Classification Distribution</h3>
              <p className="text-xs text-slate-400">Proportional breakdown of parsed applicant talent pool</p>
            </div>
          </div>

          {/* Graphical Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  MATCHED Candidates ({matched})
                </span>
                <span className="font-mono text-emerald-400">{matchedPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-700" style={{ width: `${matchedPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  PARTIALLY MATCHED ({partial})
                </span>
                <span className="font-mono text-amber-400">{partialPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-700" style={{ width: `${partialPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  NOT MATCHED ({notMatched})
                </span>
                <span className="font-mono text-rose-400">{notMatchedPct}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full transition-all duration-700" style={{ width: `${notMatchedPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Compliance & Fairness Audit Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>AI Safety & Fairness Verification</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The AI scoring engine is strictly constrained to job-related qualifications, skills, verified experience, and documented project work. All protected characteristics (gender, race, ethnicity, age, religion, disability, and marital status) are ignored during ranking and evidence extraction.
          </p>
        </div>
      </main>
    </div>
  );
}
