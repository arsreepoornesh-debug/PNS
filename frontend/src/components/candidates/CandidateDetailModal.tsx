'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  UserCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { CandidateDetail, PipelineStage } from '@/lib/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ScoreGauge } from '@/components/common/ScoreGauge';
import { api } from '@/lib/api';

interface CandidateDetailModalProps {
  candidateId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidateId,
  onClose,
  onUpdated,
}) => {
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'EVIDENCE' | 'SCORING' | 'NOTES'>('EVIDENCE');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) {
      setCandidate(null);
      return;
    }

    setIsLoading(true);
    api.getCandidate(candidateId)
      .then((data) => {
        setCandidate(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch candidate details:', err);
        setIsLoading(false);
      });
  }, [candidateId]);

  if (!candidateId) return null;

  const handleShortlistDecision = async (decision: 'shortlist' | 'maybe' | 'reject') => {
    if (!candidate) return;
    try {
      await api.shortlistCandidate(candidate.id, decision);
      setActionMessage(`Candidate successfully marked as ${decision.toUpperCase()}!`);
      // Refresh candidate
      const updated = await api.getCandidate(candidate.id);
      setCandidate(updated);
      onUpdated();
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      console.error('Error shortlisting:', err);
    }
  };

  const handleStageChange = async (stage: PipelineStage) => {
    if (!candidate) return;
    try {
      await api.updateCandidateStage(candidate.id, stage);
      const updated = await api.getCandidate(candidate.id);
      setCandidate(updated);
      onUpdated();
    } catch (err) {
      console.error('Error updating stage:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate || !noteText.trim()) return;

    setIsAddingNote(true);
    try {
      await api.addNote(candidate.id, noteText.trim());
      setNoteText('');
      const updated = await api.getCandidate(candidate.id);
      setCandidate(updated);
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setIsAddingNote(false);
    }
  };

  const analysis = candidate?.analysis;
  const requiredMatches = candidate?.matches.filter((m) => m.requirement_type === 'required') || [];
  const preferredMatches = candidate?.matches.filter((m) => m.requirement_type === 'preferred') || [];
  const otherMatches = candidate?.matches.filter((m) => m.requirement_type !== 'required' && m.requirement_type !== 'preferred') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
              {candidate?.name ? candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {candidate?.name || 'Candidate Analysis'}
                </h2>
                {candidate && <StatusBadge status={candidate.classification} />}
              </div>
              <p className="text-xs text-slate-500">
                {candidate?.experience_years.toFixed(1)} years verified experience • Stage: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{candidate?.stage}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Flash Message */}
        {actionMessage && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-6 py-2 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Modal Content Body */}
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-sm font-medium">Loading candidate evidence and transparent match scores...</p>
          </div>
        ) : candidate ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Candidate KPI Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              {/* Contact Details */}
              <div className="md:col-span-8 space-y-2">
                <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                  {candidate.email && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                      {candidate.email}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Phone className="w-3.5 h-3.5 text-indigo-500" />
                      {candidate.phone}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                      {candidate.location}
                    </span>
                  )}
                </div>

                {candidate.education_summary && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{candidate.education_summary}</span>
                  </div>
                )}

                {/* AI Recruiter-Oriented Evidence Summary */}
                {analysis?.ai_summary && (
                  <div className="mt-3 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/50 text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>AI Evidence Summary (Objective & Bias-Free)</span>
                    </div>
                    <p>{analysis.ai_summary}</p>
                  </div>
                )}
              </div>

              {/* Match Score Display */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <ScoreGauge score={candidate.analysis?.match_score ?? candidate.match_score ?? 0} size="lg" showLabel={true} />
                <div className="mt-2 text-[11px] font-semibold text-slate-500">
                  Calculated from verified evidence
                </div>
              </div>
            </div>

            {/* Recruiter Action Bar: [Shortlist] [Maybe] [Reject] + Stage selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-semibold">Decision:</span>
                <button
                  onClick={() => handleShortlistDecision('shortlist')}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                >
                  ✓ Shortlist
                </button>
                <button
                  onClick={() => handleShortlistDecision('maybe')}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                >
                  ⚠ Maybe
                </button>
                <button
                  onClick={() => handleShortlistDecision('reject')}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all active:scale-95 shadow-xs"
                >
                  ✕ Reject
                </button>
              </div>

              {/* Stage dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Move Stage:</span>
                <select
                  value={candidate.stage}
                  onChange={(e: any) => handleStageChange(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white font-semibold"
                >
                  <option value="NEW">NEW</option>
                  <option value="MATCHED">MATCHED</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="HIRED">HIRED</option>
                </select>
              </div>
            </div>

            {/* Navigation Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setActiveTab('EVIDENCE')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'EVIDENCE'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Requirement Evidence Inspector
              </button>
              <button
                onClick={() => setActiveTab('SCORING')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'SCORING'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Score Breakdown & Algorithm
              </button>
              <button
                onClick={() => setActiveTab('NOTES')}
                className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'NOTES'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Recruiter Notes ({candidate.notes.length})
              </button>
            </div>

            {/* TAB 1: Evidence Inspector */}
            {activeTab === 'EVIDENCE' && (
              <div className="space-y-6">
                {/* Missing Mandatory Alert if any */}
                {analysis?.missing_mandatory_skills && analysis.missing_mandatory_skills.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Missing Critical Mandatory Skill: </span>
                      <span>{analysis.missing_mandatory_skills.join(', ')}</span>
                      <p className="text-[11px] text-rose-500 dark:text-rose-400 mt-0.5">
                        Candidate match classification was adjusted according to mandatory skill policy.
                      </p>
                    </div>
                  </div>
                )}

                {/* Required Skills Evidence Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      Required Mandatory Skills ({requiredMatches.length})
                    </h4>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {requiredMatches.map((item, idx) => (
                      <div key={idx} className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            {item.status === 'MATCH' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : item.status === 'PARTIAL' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-500" />
                            )}
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {item.requirement_name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {item.page_number && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                Page {item.page_number}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                item.status === 'MATCH'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : item.status === 'PARTIAL'
                                  ? 'bg-amber-500/10 text-amber-600'
                                  : 'bg-rose-500/10 text-rose-600'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* Evidence quote */}
                        {item.evidence ? (
                          <div className="pl-6 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border-l-2 border-indigo-500 font-mono text-[11px] leading-relaxed">
                            <span className="font-semibold text-slate-400 not-italic">Evidence: </span>
                            &ldquo;{item.evidence}&rdquo;
                          </div>
                        ) : (
                          <p className="pl-6 text-[11px] text-slate-400 italic">
                            Not found in candidate resume.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferred Skills Evidence Table */}
                {preferredMatches.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      Preferred Skills ({preferredMatches.length})
                    </h4>

                    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {preferredMatches.map((item, idx) => (
                        <div key={idx} className="p-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              {item.status === 'MATCH' ? (
                                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                              ) : item.status === 'PARTIAL' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="font-bold text-xs text-slate-900 dark:text-white">
                                {item.requirement_name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {item.page_number && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                  Page {item.page_number}
                                </span>
                              )}
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                  item.status === 'MATCH'
                                    ? 'bg-purple-500/10 text-purple-600'
                                    : item.status === 'PARTIAL'
                                    ? 'bg-amber-500/10 text-amber-600'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>

                          {item.evidence ? (
                            <div className="pl-6 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border-l-2 border-purple-500 font-mono text-[11px]">
                              <span className="font-semibold text-slate-400">Evidence: </span>
                              &ldquo;{item.evidence}&rdquo;
                            </div>
                          ) : (
                            <p className="pl-6 text-[11px] text-slate-400 italic">
                              Not found in candidate resume.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Transparent Score Breakdown */}
            {activeTab === 'SCORING' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="font-bold text-sm">Transparent Scoring Formula</h4>
                      <p className="text-[11px] text-slate-400">
                        Total score is computed directly from verifiable evidence across configured categories.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-indigo-400">
                        {analysis?.match_score || 0} / 100
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>Required Skills Match (40% max)</span>
                        <span className="font-mono text-emerald-400">{analysis?.required_skills_score || 0} pts</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${((analysis?.required_skills_score || 0) / 40) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>Relevant Experience (25% max)</span>
                        <span className="font-mono text-indigo-400">{analysis?.experience_score || 0} pts</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full"
                          style={{ width: `${((analysis?.experience_score || 0) / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>Projects / Relevant Work (15% max)</span>
                        <span className="font-mono text-purple-400">{analysis?.projects_score || 0} pts</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-500 h-full"
                          style={{ width: `${((analysis?.projects_score || 0) / 15) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>Education & Degree Match (10% max)</span>
                        <span className="font-mono text-amber-400">{analysis?.education_score || 0} pts</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-full"
                          style={{ width: `${((analysis?.education_score || 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-bold mb-1">
                        <span>Preferred / Nice-to-Have Skills (10% max)</span>
                        <span className="font-mono text-teal-400">{analysis?.preferred_skills_score || 0} pts</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full"
                          style={{ width: `${((analysis?.preferred_skills_score || 0) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>
                    <strong>Fairness Guarantee:</strong> Demographic, gender, racial, or non-job-related attributes were strictly ignored during evaluation.
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: Recruiter Private Notes */}
            {activeTab === 'NOTES' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add private evaluation notes (e.g. 'Strong FastAPI experience. Schedule technical interview.')..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isAddingNote || !noteText.trim()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isAddingNote ? 'Saving...' : 'Add Note'}</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2">
                  {candidate.notes.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No notes added yet for this candidate.</p>
                  ) : (
                    candidate.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span className="font-bold text-slate-700 dark:text-slate-300">{note.author_name}</span>
                          <span>{new Date(note.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200">{note.note_text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
