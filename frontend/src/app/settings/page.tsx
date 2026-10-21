'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Save,
  Server,
  Zap,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { AIStatus } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';

export default function SettingsPage() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState('http://localhost:11434');
  const [model, setModel] = useState('qwen2.5:3b');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAIStatus();
      setAiStatus(data);
      if (data.config?.base_url) setBaseUrl(data.config.base_url);
      if (data.config?.model) setModel(data.config.model);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveAIConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await api.updateAIConfig(baseUrl, model);
      setMessage('AI configuration updated and connection tested successfully!');
      fetchStatus();
    } catch (err: any) {
      setMessage(`Error updating configuration: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isOnline = aiStatus?.health.status === 'online';

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col selection:bg-yellow-400 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-white p-6 sm:p-8 border border-zinc-200/90 shadow-xs">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-500/30 text-zinc-900 text-xs font-bold">
              <SettingsIcon className="w-3.5 h-3.5 text-yellow-600" />
              <span>Platform Settings</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              AI Engine & Matching Configuration
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed font-medium">
              Manage Ollama AI model endpoints, verify inference health, and review deterministic scoring criteria.
            </p>
          </div>
        </div>

        {message && (
          <div className="p-4 rounded-2xl bg-yellow-50 border border-yellow-200 text-yellow-950 text-xs font-semibold flex items-center gap-2 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Ollama Connection Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/90 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center font-bold shadow-2xs">
                <Cpu className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <h3 className="font-black text-base text-zinc-950">AI Inference Engine (Ollama)</h3>
                <p className="text-xs text-zinc-500 font-medium">Local open-weights language model runner</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOnline
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {isOnline ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                {isOnline ? 'Ollama Online' : 'Rule-Based Fallback Active'}
              </span>

              <button
                onClick={fetchStatus}
                title="Refresh Status"
                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-1">
            <span className="font-bold text-zinc-900 block">Engine Status:</span>
            <span className="font-medium">{aiStatus?.health.message || 'Checking local AI endpoint...'}</span>
          </div>

          <form onSubmit={handleSaveAIConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen2.5:3b or llama3.2:3b"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs shadow-md shadow-yellow-400/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{isSaving ? 'Testing Connection...' : 'Save & Test Connection'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Scoring Weights Default Matrix */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200/90 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <Sliders className="w-4 h-4 text-yellow-600" />
            <h3 className="font-black text-base text-zinc-950">Default Scoring Weights Matrix</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <span className="text-zinc-500 font-bold block text-[10px] uppercase">Required Skills</span>
              <span className="text-xl font-black text-zinc-950">40%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <span className="text-zinc-500 font-bold block text-[10px] uppercase">Experience</span>
              <span className="text-xl font-black text-zinc-950">25%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <span className="text-zinc-500 font-bold block text-[10px] uppercase">Projects</span>
              <span className="text-xl font-black text-zinc-950">15%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <span className="text-zinc-500 font-bold block text-[10px] uppercase">Education</span>
              <span className="text-xl font-black text-zinc-950">10%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-center">
              <span className="text-zinc-500 font-bold block text-[10px] uppercase">Preferred Skills</span>
              <span className="text-xl font-black text-zinc-950">10%</span>
            </div>
          </div>
        </div>

        {/* AI Fairness & Ethical Compliance Guidelines */}
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span>AI Fairness & Ethical Compliance Standard</span>
          </div>

          <ul className="space-y-2 text-xs text-emerald-950 font-medium list-disc list-inside leading-relaxed">
            <li>Strict evidence grounding: Skills and experiences not found in the candidate resume are marked as &ldquo;Not Found&rdquo; without hallucination.</li>
            <li>Zero demographic bias: Gender, race, age, religion, disability, and marital status are strictly isolated from scoring logic.</li>
            <li>Recruiter oversight: The platform is designed as an assistive tool where recruiters retain complete control over shortlisting decisions.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
