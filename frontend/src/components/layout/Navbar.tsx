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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-black font-black shadow-md shadow-yellow-400/25 group-hover:scale-105 group-hover:bg-yellow-300 transition-all">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-zinc-950 group-hover:text-yellow-600 transition-colors">
                TalentMatch <span className="text-yellow-500 font-black">AI</span>
              </span>
              <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase -mt-0.5">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-yellow-400/20 text-zinc-950 border border-yellow-500/40 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-yellow-600' : 'text-zinc-400'}`} />
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
            className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-yellow-400/60 bg-yellow-50 text-zinc-800 hover:bg-yellow-100/70 transition-all shadow-xs"
            title={aiStatus?.health.message || 'AI Engine status'}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse shadow-xs" />
            <Cpu className="w-3.5 h-3.5 text-yellow-600" />
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs sm:text-sm font-black shadow-md shadow-yellow-400/20 hover:shadow-yellow-400/30 transition-all active:scale-95 cursor-pointer"
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
