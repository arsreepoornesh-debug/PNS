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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center shadow-sm">
              <FileText className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create New Job Opening</h2>
              <p className="text-xs text-gray-500">Define requirements, skills, and scoring weights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-white">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Full Stack Engineer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Experience Required
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={experienceRequired}
                  onChange={(e) => setExperienceRequired(e.target.value)}
                  placeholder="e.g. 2+ years"
                  className="w-2/3 px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
                />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="20"
                  value={experienceMinYears}
                  onChange={(e) => setExperienceMinYears(parseFloat(e.target.value) || 0)}
                  title="Min years (numeric)"
                  className="w-1/3 px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Location & Type
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote / Hybrid"
                  className="w-2/3 px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
                />
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-1/3 px-2.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
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
              <label className="block text-xs font-bold text-zinc-800">
                Job Description *
              </label>
              <button
                type="button"
                onClick={handleExtractFromJD}
                disabled={isExtracting || !description.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-700 hover:text-yellow-600 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>{isExtracting ? 'Extracting…' : '✨ Auto-Extract Skills'}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Paste the full job description here. The AI will auto-extract required and preferred skills from it."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-zinc-300 text-sm text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 leading-relaxed shadow-2xs"
              required
            />
          </div>

          {/* Required Skills (Mandatory for MATCHED) */}
          <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Required Skills ({requiredSkills.length})
              </label>
              <span className="text-[10px] text-indigo-500 font-medium">Missing these = candidate flagged</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {requiredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-indigo-700 border border-indigo-200 text-xs font-semibold shadow-xs"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeRequiredSkill(skill)}
                    className="hover:text-red-500 transition-colors ml-0.5"
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
                placeholder="Type a skill and press Enter or Add…"
                className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-zinc-300 text-xs text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
              />
              <button
                type="button"
                onClick={addRequiredSkill}
                className="px-4 py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Preferred Skills */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Preferred Skills ({preferredSkills.length})
              </label>
              <span className="text-[10px] text-purple-600 font-medium">Boosts score, not mandatory</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {preferredSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-purple-700 border border-purple-200 text-xs font-semibold shadow-xs"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removePreferredSkill(skill)}
                    className="hover:text-red-500 transition-colors ml-0.5"
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
                placeholder="Type a preferred skill and press Enter or Add…"
                className="flex-1 px-3.5 py-2 rounded-lg bg-white border border-zinc-300 text-xs text-zinc-950 font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 shadow-2xs"
              />
              <button
                type="button"
                onClick={addPreferredSkill}
                className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Toggle Advanced Algorithm & Weight Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors group"
            >
              <SlidersHorizontal className="w-4 h-4 group-hover:text-indigo-500 transition-colors" />
              <span>{showAdvanced ? '▲ Hide Scoring Weights' : '▼ Advanced: Configure Scoring Weights'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-4 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <span className="font-bold text-gray-700">Scoring Weight Matrix</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${totalWeight === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {totalWeight}% / 100%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-600 font-semibold block mb-1">Required Skills: <strong>{weightRequired}%</strong></label>
                    <input type="range" min="0" max="60" value={weightRequired} onChange={(e) => setWeightRequired(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 font-semibold block mb-1">Experience: <strong>{weightExp}%</strong></label>
                    <input type="range" min="0" max="50" value={weightExp} onChange={(e) => setWeightExp(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 font-semibold block mb-1">Projects: <strong>{weightProjects}%</strong></label>
                    <input type="range" min="0" max="40" value={weightProjects} onChange={(e) => setWeightProjects(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 font-semibold block mb-1">Education: <strong>{weightEdu}%</strong></label>
                    <input type="range" min="0" max="30" value={weightEdu} onChange={(e) => setWeightEdu(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 font-semibold block mb-1">Preferred Skills: <strong>{weightPref}%</strong></label>
                    <input type="range" min="0" max="30" value={weightPref} onChange={(e) => setWeightPref(parseInt(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <label className="font-bold text-gray-700 block mb-1.5">When mandatory skill is missing:</label>
                  <select
                    value={mandatoryRule}
                    onChange={(e: any) => setMandatoryRule(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900"
                  >
                    <option value="downgrade_to_partial">Downgrade to PARTIAL MATCH (lenient)</option>
                    <option value="downgrade_to_not_matched">Downgrade to NOT MATCHED (strict)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalWeight !== 100}
              className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-black shadow-sm transition-all active:scale-95"
            >
              {isSubmitting ? 'Creating…' : '✓ Create Job Opening'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
