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
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 ${className}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-400" />}
        ✓ MATCHED
      </span>
    );
  }

  if (norm === 'PARTIALLY MATCHED' || norm === 'PARTIAL' || norm === 'PARTIAL MATCH') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-zinc-800/80 text-zinc-300 border border-zinc-700 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />}
        ⚠ PARTIAL MATCH
      </span>
    );
  }

  if (norm === 'NOT MATCHED' || norm === 'NOT_MATCHED' || norm === 'REJECTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-zinc-900 text-zinc-500 border border-zinc-800 ${className}`}>
        {showIcon && <XCircle className="w-3.5 h-3.5 text-zinc-500" />}
        ✕ NOT MATCHED
      </span>
    );
  }

  // Pipeline Stages
  if (norm === 'SHORTLISTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-yellow-400 text-black shadow-sm ${className}`}>
        <Award className="w-3.5 h-3.5 text-black stroke-[2.5]" />
        SHORTLISTED
      </span>
    );
  }

  if (norm === 'INTERVIEW') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-zinc-800 text-white border border-zinc-700 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-yellow-400" />
        INTERVIEW
      </span>
    );
  }

  if (norm === 'HIRED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-white text-black shadow-sm ${className}`}>
        <UserCheck className="w-3.5 h-3.5 text-black stroke-[2.5]" />
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
