import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Sliders,
  Globe,
  Clock,
  Target,
  Check,
  HardDrive,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileText
} from 'lucide-react';
import {
  UserProfile,
  EnglishLevel,
  ExplanationLanguage,
  FeedbackStyle,
  LearningDataExport
} from '../types/learning.ts';
import {
  updateProfile,
  exportMemory,
  importMemory,
  clearMemory,
  validateImportData,
  getStorageStatus
} from '../services/api.ts';

interface SettingsModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: UserProfile) => void;
  onRetakeOnboarding: () => void;
  onDataReset?: () => void;
  onDataImported?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdated,
  onRetakeOnboarding,
  onDataReset,
  onDataImported
}) => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'data' | 'apikey'>('preferences');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [apiKeySaved, setApiKeySaved] = useState<boolean>(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<string>('');

  // Preferences Form State
  const [level, setLevel] = useState<EnglishLevel>(profile.current_level);
  const [targetLevel, setTargetLevel] = useState<EnglishLevel>(profile.target_level);
  const [language, setLanguage] = useState<ExplanationLanguage>(profile.explanation_language);
  const [dailyMinutes, setDailyMinutes] = useState<number>(profile.daily_minutes);
  const [generalRatio, setGeneralRatio] = useState<number>(profile.general_vs_work_ratio);
  const [feedbackStyle, setFeedbackStyle] = useState<FeedbackStyle>(profile.feedback_style || 'encouraging');
  const [goalSummary, setGoalSummary] = useState<string>(profile.goal_summary);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Data Management State
  const [storageStatus, setStorageStatus] = useState<ReturnType<typeof getStorageStatus> | null>(null);
  const [dataMessage, setDataMessage] = useState<string>('');
  const [importErrorMessage, setImportErrorMessage] = useState<string>('');
  const [importPendingData, setImportPendingData] = useState<LearningDataExport | null>(null);
  const [importValidation, setImportValidation] = useState<ReturnType<typeof validateImportData> | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setLevel(profile.current_level);
      setTargetLevel(profile.target_level);
      setLanguage(profile.explanation_language);
      setDailyMinutes(profile.daily_minutes);
      setGeneralRatio(profile.general_vs_work_ratio);
      setFeedbackStyle(profile.feedback_style || 'encouraging');
      setGoalSummary(profile.goal_summary);
      setStorageStatus(getStorageStatus());
      setApiKeyInput(localStorage.getItem('lingua_step_gemini_api_key') || '');
    }
  }, [isOpen, profile]);

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('lingua_step_gemini_api_key', trimmed);
      setApiKeyStatus('✓ Custom API key saved and active!');
    } else {
      localStorage.removeItem('lingua_step_gemini_api_key');
      setApiKeyStatus('✓ Custom API key removed. Using default environment configuration.');
    }
    setApiKeySaved(true);
    setTimeout(() => {
      setApiKeySaved(false);
      setApiKeyStatus('');
    }, 3000);
  };

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateProfile({
        current_level: level,
        target_level: targetLevel,
        explanation_language: language,
        daily_minutes: dailyMinutes,
        general_vs_work_ratio: generalRatio,
        feedback_style: feedbackStyle,
        goal_summary: goalSummary
      });
      onUpdated(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportMemory();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `linguastep-learning-data-v1-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setDataMessage('✓ All learning data exported successfully!');
      setTimeout(() => setDataMessage(''), 3500);
    } catch (err: any) {
      setDataMessage(`Export failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportErrorMessage('');
    setDataMessage('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = event.target?.result as string;
        const parsed = JSON.parse(raw);
        const validation = validateImportData(parsed);

        if (!validation.valid) {
          setImportErrorMessage(`Validation error: ${validation.errors.join('; ')}`);
          setImportPendingData(null);
          setImportValidation(null);
        } else {
          setImportPendingData(parsed);
          setImportValidation(validation);
        }
      } catch (err: any) {
        setImportErrorMessage('Selected file is not valid JSON.');
        setImportPendingData(null);
        setImportValidation(null);
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleApplyImport = async () => {
    if (!importPendingData) return;
    setIsImporting(true);
    try {
      await importMemory(importPendingData);
      setImportPendingData(null);
      setImportValidation(null);
      setStorageStatus(getStorageStatus());
      setDataMessage('✓ Learning history imported successfully!');
      if (onDataImported) onDataImported();
      setTimeout(() => {
        setDataMessage('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setImportErrorMessage(`Import error: ${err?.message || 'Failed to import'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = () => {
    setImportPendingData(null);
    setImportValidation(null);
    setImportErrorMessage('');
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await clearMemory();
      setShowResetConfirm(false);
      setStorageStatus(getStorageStatus());
      setDataMessage('✓ Learning progress successfully reset to default state.');
      if (onDataReset) onDataReset();
      setTimeout(() => {
        setDataMessage('');
        onClose();
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setDataMessage(`Reset error: ${err?.message || 'Failed to reset'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const formatTimestamp = (iso?: string) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + d.toLocaleDateString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-100 space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Settings & Data Management</h2>
              <p className="text-xs text-slate-400">Personalize your learning & manage local-first data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
              activeTab === 'preferences'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('data');
              setStorageStatus(getStorageStatus());
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
              activeTab === 'data'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Data & Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('apikey')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition ${
              activeTab === 'apikey'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>API Key & Quota</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: PREFERENCES */}
        {/* ============================================================== */}
        {activeTab === 'preferences' && (
          <div className="space-y-4">
            {/* Levels */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Current Level
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as EnglishLevel)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Target Level
                </label>
                <select
                  value={targetLevel}
                  onChange={e => setTargetLevel(e.target.value as EnglishLevel)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                </select>
              </div>
            </div>

            {/* Explanation Language */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Tutor Explanation Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('vi')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                    language === 'vi'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  Tiếng Việt (Default)
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition ${
                    language === 'en'
                      ? 'bg-indigo-950/60 border-indigo-500 text-white font-bold'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Available Minutes & Topic Ratio */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Session Length</span>
                  <strong className="text-indigo-300">{dailyMinutes} minutes / day</strong>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mins: 10, label: '10 mins', sub: 'Quick (4 Qs)' },
                    { mins: 20, label: '20 mins', sub: 'Standard (7 Qs)' },
                    { mins: 30, label: '30 mins', sub: 'Deep (12 Qs)' }
                  ].map(opt => (
                    <button
                      key={opt.mins}
                      onClick={() => setDailyMinutes(opt.mins)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                        dailyMinutes === opt.mins
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className={`text-[10px] ${dailyMinutes === opt.mins ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-slate-400 uppercase tracking-wider">Topic Ratio</span>
                  <strong className="text-indigo-300">
                    {generalRatio}% General / {100 - generalRatio}% Workplace
                  </strong>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="5"
                  value={generalRatio}
                  onChange={e => setGeneralRatio(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>

            {/* Goal summary text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Learner Goal Summary
                </label>
                {(!goalSummary || goalSummary.trim() === '') && (
                  <span className="text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Not Configured</span>
                  </span>
                )}
              </div>
              {(!goalSummary || goalSummary.trim() === '') && (
                <div className="mb-2 bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 text-[11px] text-amber-200 leading-relaxed flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    <strong>Warning:</strong> You have not set a custom learner goal yet. The AI is currently using default generic context. Please update your goal summary below to ensure 100% personalized AI lessons!
                  </p>
                </div>
              )}
              <textarea
                rows={2}
                value={goalSummary}
                onChange={e => setGoalSummary(e.target.value)}
                placeholder="E.g., Prepare for international tech interviews, master business negotiation vocabulary..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Retake Diagnostic link */}
            <div className="pt-1">
              <button
                onClick={() => {
                  onClose();
                  onRetakeOnboarding();
                }}
                className="text-xs text-sky-400 hover:text-sky-300 underline"
              >
                Retake conversational discovery & diagnostic test
              </button>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-800">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs font-medium bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>

              <button
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Preferences'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DATA MANAGEMENT & STORAGE (LOCAL-FIRST) */}
        {/* ============================================================== */}
        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Storage Status Card */}
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Local Storage Status</span>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1" />
                  {storageStatus?.type === 'indexeddb' ? 'IndexedDB (Browser)' : 'Memory Store'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Last Saved</span>
                  <strong className="text-slate-200">{formatTimestamp(storageStatus?.lastSavedAt)}</strong>
                </div>
                <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
                  <span className="text-slate-400 block text-[10px] uppercase">Persistence Errors</span>
                  <strong className={storageStatus?.error ? 'text-rose-400' : 'text-emerald-400'}>
                    {storageStatus?.error || 'None (Healthy)'}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                🔒 <strong>User-Owned Progress:</strong> All learning goals, vocabulary, study plans, and diagnostic reports reside securely inside your browser's IndexedDB. The backend is stateless and never saves your personal learning state.
              </p>
            </div>

            {/* Notification messages */}
            {dataMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{dataMessage}</span>
              </div>
            )}

            {importErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{importErrorMessage}</span>
              </div>
            )}

            {/* Import Pre-flight Preview Box */}
            {importValidation && importPendingData && (
              <div className="bg-indigo-950/40 border border-indigo-500/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold">
                  <FileText className="w-4 h-4" />
                  <span>Import Preview — Validate Before Applying</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-indigo-900/50">
                    <span className="text-slate-400 block text-[10px]">Learner</span>
                    <strong className="text-white">{importValidation.summary.profileName} ({importValidation.summary.level})</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-indigo-900/50">
                    <span className="text-slate-400 block text-[10px]">Skills Tracked</span>
                    <strong className="text-white">{importValidation.summary.skillsCount} skills</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-indigo-900/50">
                    <span className="text-slate-400 block text-[10px]">Vocabulary Cards</span>
                    <strong className="text-white">{importValidation.summary.vocabCount} words</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg border border-indigo-900/50">
                    <span className="text-slate-400 block text-[10px]">Lesson History</span>
                    <strong className="text-white">{importValidation.summary.lessonsCount} lessons ({importValidation.summary.attemptsCount} attempts)</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                  <span>Applying this backup will overwrite your current browser learning data. Confirm to proceed.</span>
                </div>

                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    onClick={handleCancelImport}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isImporting}
                    onClick={handleApplyImport}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30"
                  >
                    {isImporting ? 'Applying...' : 'Confirm & Apply Import'}
                  </button>
                </div>
              </div>
            )}

            {/* Export and Import Actions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1">
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Export Progress</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Download complete learning history, vocabulary, and active state as versioned JSON.
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5 mb-1">
                    <Upload className="w-3.5 h-3.5 text-sky-400" />
                    <span>Import Backup</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Restore previously exported JSON data with validation pre-flight inspection.
                  </p>
                </div>
                <label className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileSelected}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Danger Zone: Reset Progress */}
            <div className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-rose-300 text-xs font-bold uppercase tracking-wider">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Reset Learning Progress</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Clear all vocabulary cards, skill mastery ratings, recorded attempts, and lesson plans from browser storage. Resets your tutor back to fresh Day 1 state.
              </p>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All Progress</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-900/40 border border-rose-700/50 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-rose-200">
                    Are you sure? This action is permanent and cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isResetting}
                      onClick={handleConfirmReset}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center space-x-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isResetting ? 'Resetting...' : 'Yes, Delete Everything'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: API KEY & QUOTA */}
        {/* ============================================================== */}
        {activeTab === 'apikey' && (
          <div className="space-y-4">
            <div className="bg-slate-850 border border-slate-700/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Bring Your Own Gemini API Key</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If your default AI prepayment credits or quota limits are reached, you can input your personal Gemini API key here (e.g. <code className="text-indigo-300 bg-slate-900 px-1 py-0.5 rounded font-mono">YOUR_GEMINI_API_KEY</code>). Your key is stored securely in your browser&apos;s local storage and used directly for all AI tutoring and generation requests without hitting community quotas.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key here"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {apiKeyStatus && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{apiKeyStatus}</span>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{apiKeySaved ? 'Saved!' : 'Save API Key'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
