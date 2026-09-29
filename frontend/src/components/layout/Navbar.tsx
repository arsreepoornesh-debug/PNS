'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Briefcase,
  Users,
  Award,
  BarChart3,
  Settings,
  Plus,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AIStatus } from '@/lib/types';

interface NavbarProps {
  onOpenCreateJob?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateJob }) => {
  const pathname = usePathname();
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    api.getAIStatus()
      .then(setAiStatus)
      .catch(() => null);
  }, []);

  const navItems = [
    { label: 'Dashboard', href: '/', icon: BarChart3 },
    { label: 'Jobs', href: '/jobs', icon: Briefcase },
    { label: 'Shortlisted', href: '/shortlisted', icon: Award },
    { label: 'Analytics', href: '/analytics', icon: Users },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const isAiOnline = aiStatus?.health.status === 'online';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-700 dark:from-white dark:via-indigo-200 dark:to-indigo-400 bg-clip-text text-transparent">
                TalentMatch AI
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-0.5">
                Resume Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* AI Engine Status Pill */}
          <Link
            href="/settings"
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              isAiOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/50'
            }`}
            title={aiStatus?.health.message || 'AI Engine status'}
          >
            <div className={`w-2 h-2 rounded-full ${isAiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <Cpu className="w-3.5 h-3.5 opacity-80" />
            <span>
              {isAiOnline ? `Ollama (${aiStatus?.config.model})` : 'Transparent Rule AI'}
            </span>
          </Link>

          {/* Create Job Button */}
          {onOpenCreateJob && (
            <button
              onClick={onOpenCreateJob}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-indigo-500/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
