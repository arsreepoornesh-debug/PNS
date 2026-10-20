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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-all">
              <div className="w-full h-full rounded-[11px] bg-slate-950 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
                TalentMatch AI
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase -mt-0.5">
                Resume Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
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
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/20 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/15 transition-all"
            title={aiStatus?.health.message || 'AI Engine status'}
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="tracking-wide">
              {aiStatus?.provider === 'groq'
                ? `Groq AI (${aiStatus?.config?.model || 'LLaMA 3.1'})`
                : aiStatus?.health?.status === 'online'
                ? `Ollama AI (${aiStatus?.config?.model || 'Qwen'})`
                : 'Deterministic AI Engine'}
            </span>
          </Link>

          {/* Create Job Button */}
          {onOpenCreateJob && (
            <button
              onClick={onOpenCreateJob}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/30 hover:shadow-indigo-500/40 transition-all active:scale-95"
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
