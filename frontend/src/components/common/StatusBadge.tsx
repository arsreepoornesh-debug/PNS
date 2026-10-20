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
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-yellow-100 text-yellow-900 border border-yellow-300 shadow-2xs ${className}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-yellow-600 stroke-[2.5]" />}
        ✓ MATCHED
      </span>
    );
  }

  if (norm === 'PARTIALLY MATCHED' || norm === 'PARTIAL' || norm === 'PARTIAL MATCH') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-zinc-100 text-zinc-800 border border-zinc-300 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-zinc-600" />}
        ⚠ PARTIAL MATCH
      </span>
    );
  }

  if (norm === 'NOT MATCHED' || norm === 'NOT_MATCHED' || norm === 'REJECTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-zinc-100 text-zinc-500 border border-zinc-200 ${className}`}>
        {showIcon && <XCircle className="w-3.5 h-3.5 text-zinc-400" />}
        ✕ NOT MATCHED
      </span>
    );
  }

  // Pipeline Stages
  if (norm === 'SHORTLISTED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-yellow-400 text-black shadow-2xs ${className}`}>
        <Award className="w-3.5 h-3.5 text-black stroke-[2.5]" />
        SHORTLISTED
      </span>
    );
  }

  if (norm === 'INTERVIEW') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-zinc-100 text-zinc-900 border border-zinc-300 ${className}`}>
        <Clock className="w-3.5 h-3.5 text-yellow-600 stroke-[2.5]" />
        INTERVIEW
      </span>
    );
  }

  if (norm === 'HIRED') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-black text-white shadow-2xs ${className}`}>
        <UserCheck className="w-3.5 h-3.5 text-yellow-400 stroke-[2.5]" />
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
