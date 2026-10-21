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
  Percent,
  Layers,
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
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-yellow-400 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/90 shadow-xs">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-500/30 text-zinc-900 text-xs font-bold">
              <BarChart3 className="w-3.5 h-3.5 text-yellow-600" />
              <span>Hiring Analytics & Distribution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              Recruiter Analytics & Match Metrics
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed font-medium">
              Transparent breakdown of candidate qualification distributions, qualification rates, and evaluation fairness.
            </p>
          </div>
        </div>

        {/* Analytics KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500">Total Analyzed</span>
              <Users className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="text-3xl font-black text-zinc-950">{total}</div>
            <p className="text-[11px] text-zinc-500 font-medium">Resumes processed across all jobs</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">Match Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-700">{matchedPct}%</div>
            <p className="text-[11px] text-zinc-500 font-medium">{matched} candidates met all required criteria</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">Partial Match Rate</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-3xl font-black text-amber-700">{partialPct}%</div>
            <p className="text-[11px] text-zinc-500 font-medium">{partial} candidates with partial overlap</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-zinc-200/90 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-700">Average Match Score</span>
              <TrendingUp className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="text-3xl font-black text-yellow-700">{stats?.average_match_score || 0}%</div>
            <p className="text-[11px] text-zinc-500 font-medium">Mean weighted score across candidates</p>
          </div>
        </div>

        {/* Match Distribution Breakdown Card */}
        <div className="p-6 rounded-3xl bg-white border border-zinc-200/90 space-y-6 shadow-xs">
          <div className="pb-4 border-b border-zinc-100">
            <h3 className="font-black text-lg text-zinc-950">Qualification Classification Breakdown</h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Proportional breakdown of parsed applicant talent pool</p>
          </div>

          {/* Graphical Bars */}
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  MATCHED Candidates ({matched})
                </span>
                <span className="font-mono text-emerald-800 font-bold">{matchedPct}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-700 rounded-full" style={{ width: `${matchedPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-amber-700 flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  PARTIALLY MATCHED ({partial})
                </span>
                <span className="font-mono text-amber-800 font-bold">{partialPct}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full transition-all duration-700 rounded-full" style={{ width: `${partialPct}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-rose-700 flex items-center gap-1.5 font-bold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  NOT MATCHED ({notMatched})
                </span>
                <span className="font-mono text-rose-800 font-bold">{notMatchedPct}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <div className="bg-rose-400 h-full transition-all duration-700 rounded-full" style={{ width: `${notMatchedPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* AI Compliance & Fairness Audit Card */}
        <div className="p-6 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>AI Safety & Objective Fairness Verification</span>
          </div>
          <p className="text-xs text-emerald-950 leading-relaxed font-medium">
            The AI scoring engine is strictly constrained to job-related qualifications, skills, verified experience, and documented project work. All protected characteristics (gender, race, ethnicity, age, religion, disability, and marital status) are ignored during ranking and evidence extraction to ensure fair, audit-ready evaluations.
          </p>
        </div>
      </main>
    </div>
  );
}
