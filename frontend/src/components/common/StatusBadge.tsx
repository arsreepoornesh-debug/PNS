import React from 'react';
import { ClassificationType, PipelineStage } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, Award, Clock, UserCheck, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: ClassificationType | string;
  className?: string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showIcon = true }) => {
  const norm = (status || '').toUpperCase();

  if (norm === 'MATCHED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ${className}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        ✓ MATCHED
      </span>
    );
  }

  if (norm === 'PARTIALLY MATCHED' || norm === 'PARTIAL' || norm === 'PARTIAL MATCH') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
        ⚠ PARTIAL MATCH
      </span>
    );
  }

  if (norm === 'NOT MATCHED' || norm === 'NOT_MATCHED' || norm === 'REJECTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 ${className}`}>
        {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
        ✕ NOT MATCHED
      </span>
    );
  }

  // Pipeline Stages
  if (norm === 'SHORTLISTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 ${className}`}>
        <Award className="w-3.5 h-3.5 text-indigo-500" />
        SHORTLISTED
      </span>
    );
  }

  if (norm === 'INTERVIEW') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-purple-500" />
        INTERVIEW
      </span>
    );
  }

  if (norm === 'HIRED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-emerald-600 text-white shadow-sm ${className}`}>
        <UserCheck className="w-3.5 h-3.5" />
        HIRED
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ${className}`}>
      {status}
    </span>
  );
};
