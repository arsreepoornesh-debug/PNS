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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-black/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-black font-black shadow-lg shadow-yellow-400/25 group-hover:scale-105 group-hover:bg-yellow-300 transition-all">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                TalentMatch <span className="text-yellow-400">AI</span>
              </span>
              <span className="text-[10px] font-semibold text-zinc-400 tracking-wider uppercase -mt-0.5">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-yellow-400/15 text-yellow-400 border border-yellow-400/30 shadow-sm shadow-yellow-400/10'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-400' : 'text-zinc-500'}`} />
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
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/15 transition-all shadow-sm"
            title={aiStatus?.health.message || 'AI Engine status'}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-sm shadow-yellow-400" />
            <Cpu className="w-3.5 h-3.5 text-yellow-400" />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs sm:text-sm font-black shadow-md shadow-yellow-400/25 hover:shadow-yellow-400/40 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black stroke-[3]" />
              <span>Create Job</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
