'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Sliders,
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Layers,
  FileText,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '@/lib/api';
import { Job, Requirement } from '@/lib/types';

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated: (newJob: Job) => void;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  isOpen,
  onClose,
  onJobCreated,
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [experienceRequired, setExperienceRequired] = useState('2+ years');
  const [experienceMinYears, setExperienceMinYears] = useState(2.0);
  const [location, setLocation] = useState('Remote');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [description, setDescription] = useState('');

  // Skills & Requirements
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Python', 'FastAPI', 'REST API', 'PostgreSQL', 'Git']);
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'AWS', 'Redis']);
  const [educationRequirements, setEducationRequirements] = useState<string[]>(["Bachelor's degree in Computer Science or related field"]);

  const [newSkillInput, setNewSkillInput] = useState('');
  const [newPrefSkillInput, setNewPrefSkillInput] = useState('');

  // Configurable weights
  const [weightRequired, setWeightRequired] = useState(40);
  const [weightExp, setWeightExp] = useState(25);
  const [weightProjects, setWeightProjects] = useState(15);
  const [weightEdu, setWeightEdu] = useState(10);
  const [weightPref, setWeightPref] = useState(10);

  // Thresholds & Mandatory rules
  const [thresholdMatched, setThresholdMatched] = useState(75);
  const [thresholdPartial, setThresholdPartial] = useState(50);
  const [mandatoryRule, setMandatoryRule] = useState<'strict' | 'downgrade_to_partial' | 'downgrade_to_not_matched'>('downgrade_to_partial');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalWeight = weightRequired + weightExp + weightProjects + weightEdu + weightPref;

  const handleExtractFromJD = async () => {
    if (!description.trim()) {
      setError('Please paste a Job Description first to auto-extract requirements.');
      return;
    }
    setIsExtracting(true);
    setError(null);
    try {
      const extracted = await api.extractJobRequirements(title, description);
      if (extracted.title && !title) setTitle(extracted.title);
      if (extracted.experience_required) setExperienceRequired(extracted.experience_required);
      if (extracted.experience_min_years) setExperienceMinYears(extracted.experience_min_years);
      if (extracted.required_skills && extracted.required_skills.length > 0) {
        setRequiredSkills(extracted.required_skills);
      }
      if (extracted.preferred_skills && extracted.preferred_skills.length > 0) {
        setPreferredSkills(extracted.preferred_skills);
      }
      if (extracted.education && extracted.education.length > 0) {
        setEducationRequirements(extracted.education);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-extract requirements.');
    } finally {
      setIsExtracting(false);
    }
  };

  const addRequiredSkill = () => {
    if (newSkillInput.trim() && !requiredSkills.includes(newSkillInput.trim())) {
      setRequiredSkills([...requiredSkills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeRequiredSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const addPreferredSkill = () => {
    if (newPrefSkillInput.trim() && !preferredSkills.includes(newPrefSkillInput.trim())) {
      setPreferredSkills([...preferredSkills, newPrefSkillInput.trim()]);
      setNewPrefSkillInput('');
    }
  };

  const removePreferredSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Job Title and Job Description are required.');
      return;
    }

    if (totalWeight !== 100) {
      setError(`Scoring weights must sum to 100% (Current total: ${totalWeight}%).`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const requirements: Requirement[] = [
      ...requiredSkills.map((s) => ({
        name: s,
        type: 'required' as const,
        is_mandatory: true,
        weight_multiplier: 1.0,
      })),
      ...preferredSkills.map((s) => ({
        name: s,
        type: 'preferred' as const,
        is_mandatory: false,
        weight_multiplier: 1.0,
      })),
      ...educationRequirements.map((e) => ({
        name: e,
        type: 'education' as const,
        is_mandatory: false,
        weight_multiplier: 1.0,
      })),
    ];

    try {
      const created = await api.createJob({
        title,
        department,
        experience_required: experienceRequired,
        experience_min_years: experienceMinYears,
        location,
        employment_type: employmentType,
        description,
        weight_required_skills: weightRequired,
        weight_experience: weightExp,
        weight_projects: weightProjects,
        weight_education: weightEdu,
        weight_preferred_skills: weightPref,
        threshold_matched: thresholdMatched,
        threshold_partial: thresholdPartial,
        mandatory_rule: mandatoryRule,
        requirements,
      });

      onJobCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create job.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400/10 text-yellow-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create New Job Description</h2>
              <p className="text-xs text-slate-500">Define requirements, skills, and transparent scoring weights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Python Backend Developer"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Experience Required
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  placeholder="e.g. 2+ years"
                  className="w-2/3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={experienceMinYears}
                  onChange={(e) => setExperienceMinYears(parseFloat(e.target.value) || 0)}
                  title="Min years (numeric)"
                  className="w-1/3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Location & Type
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco / Remote"
                  className="w-2/3 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm"
                />
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-1/3 px-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>
          </div>

          {/* Job Description with Auto-Extract */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Description Text *
              </label>
              <button
                type="button"
                onClick={handleExtractFromJD}
                disabled={isExtracting || !description.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 disabled:opacity-50 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 text-yellow-400 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Extracting with AI...' : 'Auto-Extract Requirements'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste complete Job Description here..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"
              required
            />
          </div>

          {/* Required Skills (Mandatory for MATCHED) */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Required Mandatory Skills ({requiredSkills.length})
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Missing these flags candidate missing mandatory</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-xs font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeRequiredSkill(skill)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addRequiredSkill(); } }}
                placeholder="Add required skill (e.g. FastAPI, PostgreSQL) and press Enter"
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="button"
                onClick={addRequiredSkill}
                className="px-3 py-1.5 rounded-lg bg-yellow-400 text-black text-xs font-black hover:bg-yellow-300"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Preferred / Nice-to-Have Skills ({preferredSkills.length})
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Boosts score but not strictly mandatory</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {preferredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-xs font-semibold"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removePreferredSkill(skill)}
                    className="hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newPrefSkillInput}
                onChange={(e) => setNewPrefSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPreferredSkill(); } }}
                placeholder="Add preferred skill (e.g. Docker, AWS, Redis)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
              />
              <button
                type="button"
                onClick={addPreferredSkill}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 text-yellow-300 border border-yellow-400/30 text-xs font-bold hover:bg-zinc-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Toggle Advanced Algorithm & Weight Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{showAdvanced ? 'Hide Advanced Scoring Weights & Thresholds' : 'Configure Scoring Weights & Mandatory Rules'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-slate-900 text-white space-y-4 text-xs border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold">Transparent Scoring Weight Matrix</span>
                  <span className={`font-mono font-bold ${totalWeight === 100 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Total: {totalWeight}% (Must be 100%)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Required Skills: {weightRequired}%</label>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      value={weightRequired}
                      onChange={(e) => setWeightRequired(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Experience: {weightExp}%</label>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={weightExp}
                      onChange={(e) => setWeightExp(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Projects: {weightProjects}%</label>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={weightProjects}
                      onChange={(e) => setWeightProjects(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Education: {weightEdu}%</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={weightEdu}
                      onChange={(e) => setWeightEdu(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Preferred Skills: {weightPref}%</label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={weightPref}
                      onChange={(e) => setWeightPref(parseInt(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Mandatory Rule Selector */}
                <div className="pt-2 border-t border-slate-800">
                  <label className="font-bold text-slate-300 block mb-1">Missing Mandatory Skill Policy</label>
                  <select
                    value={mandatoryRule}
                    onChange={(e: any) => setMandatoryRule(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white"
                  >
                    <option value="downgrade_to_partial">Downgrade MATCHED to PARTIALLY MATCHED if missing mandatory skill</option>
                    <option value="downgrade_to_not_matched">Strict: Downgrade directly to NOT MATCHED if missing mandatory skill</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalWeight !== 100}
              className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-black text-xs sm:text-sm font-black shadow-md shadow-yellow-400/20 transition-all active:scale-95 cursor-pointer"
            >
              {isSubmitting ? 'Creating Job...' : 'Save & Publish Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
