import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score = 0,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const rounded = Math.round(score);
  
  let colorClass = 'text-zinc-600 stroke-zinc-600';
  let bgClass = 'bg-zinc-900 text-zinc-400 border-zinc-800';
  
  if (rounded >= 75) {
    colorClass = 'text-yellow-400 stroke-yellow-400';
    bgClass = 'bg-yellow-400/15 text-yellow-300 border-yellow-400/35';
  } else if (rounded >= 50) {
    colorClass = 'text-zinc-300 stroke-zinc-300';
    bgClass = 'bg-zinc-800 text-zinc-200 border-zinc-700';
  }

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1.5 font-bold px-2 py-0.5 rounded-md border text-xs ${bgClass} ${className}`}>
        <span>{rounded}%</span>
      </div>
    );
  }

  if (size === 'lg') {
    const strokeWidth = 8;
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (rounded / 100) * circumference;

    return (
      <div className={`relative inline-flex items-center justify-center ${className}`}>
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={`${colorClass} transition-all duration-700 ease-out`}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
            {rounded}%
          </span>
          {showLabel && <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Match</span>}
        </div>
      </div>
    );
  }

  // Medium (Default)
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-bold shadow-xs ${bgClass} ${className}`}>
      <span className="text-base tracking-tight">{rounded}%</span>
      {showLabel && <span className="text-xs opacity-75 font-medium">Match</span>}
    </div>
  );
};
