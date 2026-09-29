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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-400" />
            <span>AI Engine & Matching Configuration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure Ollama provider settings, model parameters, and transparent scoring weights
          </p>
        </div>

        {message && (
          <div className="p-4 rounded-xl bg-indigo-950/70 border border-indigo-800 text-indigo-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Ollama Connection Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">AI Provider Settings (Ollama)</h3>
                <p className="text-xs text-slate-400">Open-weight local model inference</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isOnline ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {isOnline ? 'Ollama Online' : 'Rule-Based Fallback Active'}
              </span>

              <button
                onClick={fetchStatus}
                title="Refresh Status"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300">
            <span className="font-bold text-slate-400 block mb-0.5">Engine Status Message:</span>
            <span>{aiStatus?.health.message || 'Checking AI status...'}</span>
          </div>

          <form onSubmit={handleSaveAIConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="qwen2.5:3b or llama3.2:3b"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Testing & Saving...' : 'Save & Test Connection'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Scoring Weights Default Matrix */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-base text-white">Default Scoring Weights Matrix</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Required Skills</span>
              <span className="text-lg font-black text-indigo-400">40%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Experience</span>
              <span className="text-lg font-black text-indigo-400">25%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Projects</span>
              <span className="text-lg font-black text-indigo-400">15%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Education</span>
              <span className="text-lg font-black text-indigo-400">10%</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Preferred Skills</span>
              <span className="text-lg font-black text-indigo-400">10%</span>
            </div>
          </div>
        </div>

        {/* AI Fairness & Ethical Compliance Guidelines */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>AI Fairness & Ethical Compliance Checklist</span>
          </div>

          <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside leading-relaxed">
            <li>Strict evidence grounding: Skills and experiences not found in the resume are marked as &ldquo;Not Found&rdquo;.</li>
            <li>Zero bias against protected demographics (gender, race, age, religion, disability, marital status).</li>
            <li>Final hiring decisions remain 100% with the human recruiter (decision-support tool).</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
