'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Award,
  MoreHorizontal,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { CandidateListItem, ClassificationType, PipelineStage } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreGauge } from '@/components/common/ScoreGauge';
import { api } from '@/lib/api';

interface CandidateTableProps {
  jobId: string;
  candidates: CandidateListItem[];
  onSelectCandidate: (candidateId: string) => void;
  onRefresh: () => void;
}

export const CandidateTable: React.FC<CandidateTableProps> = ({
  jobId,
  candidates,
  onSelectCandidate,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MATCHED' | 'PARTIAL' | 'NOT_MATCHED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('highest_match');
  const [minExperience, setMinExperience] = useState<number | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Filtered & Sorted candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Tab filter
      if (activeTab === 'MATCHED' && c.classification !== 'MATCHED') return false;
      if (activeTab === 'PARTIAL' && c.classification !== 'PARTIALLY MATCHED') return false;
      if (activeTab === 'NOT_MATCHED' && c.classification !== 'NOT MATCHED') return false;

      // Min exp
      if (minExperience !== '' && c.experience_years < Number(minExperience)) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = (c.email || '').toLowerCase().includes(q);
        const matchesSkills = (c.key_skills || []).some((s) => s.toLowerCase().includes(q));
        const matchesSummary = (c.ai_summary || '').toLowerCase().includes(q);
        return matchesName || matchesEmail || matchesSkills || matchesSummary;
      }

      return true;
    });
  }, [candidates, activeTab, minExperience, searchQuery]);

  // Bulk selection helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkShortlist = async (decision: 'shortlist' | 'maybe' | 'reject') => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await api.bulkShortlist(selectedIds, decision);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      console.error('Bulk shortlist failed:', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkStage = async (stage: PipelineStage) => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await api.bulkUpdateStage(selectedIds, stage);
      setSelectedIds([]);
      onRefresh();
    } catch (err) {
      console.error('Bulk stage update failed:', err);
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleExport = (format: 'csv' | 'excel') => {
    const url = api.getExportUrl({
      jobId,
      format,
      candidateIds: selectedIds.length > 0 ? selectedIds : undefined,
    });
    window.open(url, '_blank');
  };

  const matchedCount = candidates.filter((c) => c.classification === 'MATCHED').length;
  const partialCount = candidates.filter((c) => c.classification === 'PARTIALLY MATCHED').length;
  const notMatchedCount = candidates.filter((c) => c.classification === 'NOT MATCHED').length;

  return (
    <div className="space-y-4">
      {/* Filter Tabs & Search Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        {/* Classification Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setActiveTab('MATCHED')}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'MATCHED'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Matched ({matchedCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('PARTIAL')}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'PARTIAL'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Partial ({partialCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('NOT_MATCHED')}
              className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'NOT_MATCHED'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Not Matched ({notMatchedCount})</span>
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by candidate name, skill, email, or keywords..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Min Experience filter */}
          <div className="sm:col-span-3">
            <select
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="">All Experience Levels</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="1">1+ years experience</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="2">2+ years experience</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="3">3+ years experience</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="5">5+ years experience</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="highest_match">Highest Match First (Default)</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="lowest_match">Lowest Match First</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="most_experience">Most Experience</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="name">Candidate Name (A-Z)</option>
              <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white" value="recent">Recently Analyzed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when candidates are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-indigo-950 text-white border border-indigo-800 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold">candidates selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkShortlist('shortlist')}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
            >
              ✓ Shortlist Selected
            </button>
            <button
              onClick={() => handleBulkShortlist('maybe')}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all"
            >
              ⚠ Mark as Maybe
            </button>
            <button
              onClick={() => handleBulkShortlist('reject')}
              disabled={isBulkProcessing}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all"
            >
              ✕ Reject Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Candidate Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === filteredCandidates.length}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-4 px-3">Candidate</th>
                <th className="py-4 px-3">Match Score</th>
                <th className="py-4 px-3">Classification</th>
                <th className="py-4 px-3">Experience</th>
                <th className="py-4 px-3">Key Skills & Evidence</th>
                <th className="py-4 px-3">Pipeline Stage</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <p className="text-sm font-semibold">No candidates found matching your filter criteria.</p>
                    <p className="text-xs mt-1">Upload resumes above or broaden your filter settings.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const isSelected = selectedIds.includes(candidate.id);
                  const isMatched = candidate.classification === 'MATCHED';
                  const isPartial = candidate.classification === 'PARTIALLY MATCHED';

                  return (
                    <tr
                      key={candidate.id}
                      onClick={() => onSelectCandidate(candidate.id)}
                      className={`group cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                          : isMatched
                          ? 'hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10'
                          : isPartial
                          ? 'hover:bg-amber-50/40 dark:hover:bg-amber-950/10'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(candidate.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Candidate Name & Info */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 transition-colors">
                          {candidate.name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          {candidate.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {candidate.email}
                            </span>
                          )}
                          {candidate.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {candidate.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Match Score */}
                      <td className="py-3 px-3">
                        <ScoreGauge score={candidate.match_score} size="md" />
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <StatusBadge status={candidate.classification} />
                          {candidate.missing_mandatory && candidate.missing_mandatory.length > 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold leading-tight">
                              Missing: {candidate.missing_mandatory.join(', ')}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Experience */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {candidate.experience_years.toFixed(1)} yrs
                        </span>
                      </td>

                      {/* Key Skills */}
                      <td className="py-3 px-3 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {(candidate.key_skills || []).slice(0, 4).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[10px]"
                            >
                              {skill}
                            </span>
                          ))}
                          {(candidate.key_skills || []).length > 4 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{(candidate.key_skills || []).length - 4} more
                            </span>
                          )}
                        </div>
                        {candidate.ai_summary && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1 max-w-xs">
                            {candidate.ai_summary}
                          </p>
                        )}
                      </td>

                      {/* Pipeline Stage */}
                      <td className="py-3 px-3">
                        <StatusBadge status={candidate.stage} showIcon={false} />
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectCandidate(candidate.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white font-semibold text-xs transition-all shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
