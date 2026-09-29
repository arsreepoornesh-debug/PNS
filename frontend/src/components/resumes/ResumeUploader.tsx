'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Loader2,
  FileCode,
} from 'lucide-react';
import { api } from '@/lib/api';
import { BatchProgress } from '@/lib/types';

interface ResumeUploaderProps {
  jobId: string;
  onAnalysisCompleted: () => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  jobId,
  onAnalysisCompleted,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll progress if in_progress is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isAnalyzing || progress?.in_progress) {
      interval = setInterval(async () => {
        try {
          const prog = await api.getProgress(jobId);
          setProgress(prog);
          if (!prog.in_progress && isAnalyzing) {
            setIsAnalyzing(false);
            onAnalysisCompleted();
          }
        } catch (err) {
          console.error('Error fetching progress:', err);
        }
      }, 1500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAnalyzing, progress?.in_progress, jobId, onAnalysisCompleted]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => {
      const ext = f.name.toLowerCase();
      return ext.endsWith('.pdf') || ext.endsWith('.docx') || ext.endsWith('.doc');
    });

    if (valid.length < newFiles.length) {
      setError('Some files were ignored because only PDF and DOCX files are supported.');
    } else {
      setError(null);
    }

    // Merge and deduplicate by name
    const merged = [...files];
    valid.forEach((vf) => {
      if (!merged.some((m) => m.name === vf.name)) {
        merged.push(vf);
      }
    });
    setFiles(merged);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUploadAndAnalyze = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload files
      await api.uploadResumes(jobId, files);
      setIsUploading(false);
      setFiles([]);

      // 2. Trigger asynchronous batch analysis
      setIsAnalyzing(true);
      await api.triggerAnalysis(jobId);
    } catch (err: any) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setError(err.message || 'Upload or analysis failed.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <UploadCloud className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Batch Resume Ingestion & AI Matching</h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Supports PDF & DOCX (up to 100+ files)</span>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Drag & Drop Zone */}
      {!isAnalyzing && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc"
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Drag and drop candidate resumes here, or <span className="text-indigo-600 dark:text-indigo-400 underline">browse files</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Bulk upload 10, 50, or 100+ PDF / DOCX resumes at once</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected Files Queue Preview */}
      {files.length > 0 && !isAnalyzing && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {files.length} resumes ready to upload
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-slate-400 hover:text-rose-500 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span className="truncate font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
                  <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="p-1 hover:text-rose-500 text-slate-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleUploadAndAnalyze}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading files...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upload & Analyze {files.length} Resumes</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Batch Processing Progress Bar */}
      {(isAnalyzing || progress?.in_progress) && (
        <div className="mt-4 p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              <div>
                <h4 className="text-sm font-bold tracking-tight text-white">
                  Analyzing {progress?.completed || 0} / {progress?.total_resumes || files.length} resumes...
                </h4>
                {progress?.current_file && (
                  <p className="text-[11px] text-indigo-300 truncate max-w-sm">
                    Processing: {progress.current_file}
                  </p>
                )}
              </div>
            </div>
            <span className="text-base font-mono font-black text-indigo-400">
              {progress?.percent || 0}%
            </span>
          </div>

          {/* Progress track */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress?.percent || 5}%` }}
            />
          </div>

          {/* Detailed status counts */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
            <div className="bg-slate-800/50 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Completed</span>
              <span className="font-bold text-emerald-400">{progress?.completed || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Pending</span>
              <span className="font-bold text-amber-400">{progress?.pending || 0}</span>
            </div>
            <div className="bg-slate-800/50 p-1.5 rounded-lg">
              <span className="text-slate-400 block text-[10px]">Failed</span>
              <span className="font-bold text-rose-400">{progress?.failed || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
