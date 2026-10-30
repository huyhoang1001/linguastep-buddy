import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Sliders,
  Check,
  HardDrive,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import {
  UserProfile,
  EnglishLevel,
  ExplanationLanguage,
  FeedbackStyle
} from '../types/learning.ts';
import {
  updateProfile,
  exportMemory,
  clearMemory,
  validateImportData,
  getStorageStatus,
  verifyCustomApiKey,
  saveCustomApiKey,
  clearCustomApiKey,
  getCustomApiKeyMasked
} from '../services/api.ts';

interface SettingsModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: UserProfile) => void;
  onRetakeOnboarding: () => void;
  onDataReset?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  profile,
  isOpen,
  onClose,
  onUpdated,
  onRetakeOnboarding,
  onDataReset
}) => {
  const [activeTab, setActiveTab] = useState<'preferences' | 'data' | 'apikey'>('preferences');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isVerifyingKey, setIsVerifyingKey] = useState<boolean>(false);
  const [keyStatusMessage, setKeyStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [activeKeyMasked, setActiveKeyMasked] = useState<{ hasKey: boolean; masked: string }>({ hasKey: false, masked: '' });

  useEffect(() => {
    if (isOpen) {
      setActiveKeyMasked(getCustomApiKeyMasked());
      setKeyStatusMessage(null);
      setApiKeyInput('');
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSaveAndVerifyApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setKeyStatusMessage({ text: 'Please paste a valid Gemini API key first.', isError: true });
      return;
    }
    setIsVerifyingKey(true);
    setKeyStatusMessage(null);
    try {
      const result = await verifyCustomApiKey(trimmed);
      if (result.valid) {
        saveCustomApiKey(trimmed);
        setActiveKeyMasked(getCustomApiKeyMasked());
        setApiKeyInput(''); // Clear raw key input immediately so it is NEVER shown on the UI!
        setKeyStatusMessage({ text: 'API key successfully verified and activated! All tutoring requests now use your new key.', isError: false });
      } else {
        setKeyStatusMessage({ text: result.error || 'Failed to validate API key. Please check your key and try again.', isError: true });
      }
    } catch (err: any) {
      setKeyStatusMessage({ text: err.message || 'Error validating API key', isError: true });
    } finally {
      setIsVerifyingKey(false);
    }
  };

  const handleClearApiKey = () => {
    clearCustomApiKey();
    setActiveKeyMasked({ hasKey: false, masked: '' });
    setApiKeyInput('');
    setKeyStatusMessage({ text: 'Custom key removed. System reverted to default environment key.', isError: false });
  };

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
    }
  }, [isOpen, profile]);

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
        } else {
          // Success case
        }
      } catch (err: any) {
        setImportErrorMessage('Selected file is not valid JSON.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161A17]/70 backdrop-blur-sm"
    >
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-xl w-full p-6 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header with Title and Close */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Settings & Study Preferences</h2>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">Personalize your daily pace & manage local-first data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-white dark:bg-[#262F28] p-1 rounded-2xl border border-[#EBE4D7] dark:border-[#3C443E] shadow-2xs">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
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
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === 'data'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Data & Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('apikey')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
              activeTab === 'apikey'
                ? 'bg-[#2D6A4F] text-white shadow-xs'
                : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Connection</span>
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
                <label className="text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider block mb-1.5">
                  Current Level
                </label>
                <select
                  value={level}
                  onChange={e => setLevel(e.target.value as EnglishLevel)}
                  className="w-full bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-xl px-3 py-2 text-[#2D312E] dark:text-[#F4F2EC] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                >
                  <option value="A2">A2 Elementary</option>
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider block mb-1.5">
                  Target Level
                </label>
                <select
                  value={targetLevel}
                  onChange={e => setTargetLevel(e.target.value as EnglishLevel)}
                  className="w-full bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-xl px-3 py-2 text-[#2D312E] dark:text-[#F4F2EC] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                >
                  <option value="B1">B1 Intermediate</option>
                  <option value="B2">B2 Upper-Intermediate</option>
                  <option value="C1">C1 Advanced</option>
                </select>
              </div>
            </div>

            {/* Explanation Language */}
            <div>
              <label className="text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider block mb-1.5">
                Tutor Explanation Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('vi')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition cursor-pointer ${
                    language === 'vi'
                      ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white font-bold'
                      : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
                  }`}
                >
                  Tiếng Việt (Default)
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-center transition cursor-pointer ${
                    language === 'en'
                      ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white font-bold'
                      : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
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
                  <span className="font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider">Session Length</span>
                  <strong className="text-[#2D6A4F] dark:text-[#74A892]">{dailyMinutes} minutes / day</strong>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { mins: 10, label: '10 mins', sub: <span>Quick (4 <span translate="no" className="notranslate">Qs</span>)</span> },
                    { mins: 20, label: '20 mins', sub: <span>Standard (7 <span translate="no" className="notranslate">Qs</span>)</span> },
                    { mins: 30, label: '30 mins', sub: <span>Deep (12 <span translate="no" className="notranslate">Qs</span>)</span> }
                  ].map(opt => (
                    <button
                      key={opt.mins}
                      onClick={() => setDailyMinutes(opt.mins)}
                      className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                        dailyMinutes === opt.mins
                          ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white shadow-md'
                          : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:border-[#2D6A4F]'
                      }`}
                    >
                      <span className="text-xs font-bold">{opt.label}</span>
                      <span className={`text-[10px] ${dailyMinutes === opt.mins ? 'text-[#EFF6F1]' : 'text-[#8A938C]'}`}>
                        {opt.sub}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider">Topic Ratio</span>
                  <strong className="text-[#2D6A4F] dark:text-[#74A892]">
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
                  className="w-full h-2 bg-[#EBE4D7] dark:bg-[#3C443E] rounded-lg appearance-none cursor-pointer accent-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Goal summary text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] uppercase tracking-wider">
                  Learner Goal Summary
                </label>
                {(!goalSummary || goalSummary.trim() === '') && (
                  <span className="text-[10px] text-[#E07A5F] font-bold bg-[#FDF0ED] dark:bg-[#32201C] px-2 py-0.5 rounded border border-[#E07A5F]/40 flex items-center space-x-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Not Configured</span>
                  </span>
                )}
              </div>
              {(!goalSummary || goalSummary.trim() === '') && (
                <div className="mb-2 bg-[#FDF0ED] dark:bg-[#32201C] border border-[#E07A5F]/40 rounded-xl p-2.5 text-[11px] text-[#B84728] dark:text-[#F28482] leading-relaxed flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#E07A5F] shrink-0 mt-0.5" />
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
                className="w-full bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-xl p-3 text-[#2D312E] dark:text-[#F4F2EC] text-xs focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
            </div>

            {/* Retake Diagnostic link */}
            <div className="pt-1">
              <button
                onClick={() => {
                  onClose();
                  onRetakeOnboarding();
                }}
                className="text-xs text-[#2D6A4F] dark:text-[#74A892] hover:underline cursor-pointer"
              >
                Retake conversational discovery & diagnostic test
              </button>
            </div>

            {/* Action buttons */}
            <div className="pt-3 flex justify-end space-x-2 border-t border-[#EBE4D7] dark:border-[#2C332E]">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white text-xs font-medium bg-white dark:bg-[#262F28] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#3C443E] cursor-pointer"
              >
                Cancel
              </button>

              <button
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
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
            <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] uppercase tracking-wider">Local Storage Status</span>
                </div>
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6F1] dark:bg-[#1E2E24] text-[#2D6A4F] dark:text-[#74A892] border border-[#CDE1D4] dark:border-[#2C4438]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#52B788] animate-pulse mr-1" />
                  {storageStatus?.type === 'indexeddb' ? 'IndexedDB (Browser)' : 'Memory Store'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-[#FAF7F2] dark:bg-[#1E231F] rounded-xl p-2.5 border border-[#EBE4D7] dark:border-[#2C332E]">
                  <span className="text-[#5C645E] dark:text-[#A7ABA4] block text-[10px] uppercase">Last Saved</span>
                  <strong className="text-[#2D312E] dark:text-[#F4F2EC]">{formatTimestamp(storageStatus?.lastSavedAt)}</strong>
                </div>
                <div className="bg-[#FAF7F2] dark:bg-[#1E231F] rounded-xl p-2.5 border border-[#EBE4D7] dark:border-[#2C332E]">
                  <span className="text-[#5C645E] dark:text-[#A7ABA4] block text-[10px] uppercase">Persistence Errors</span>
                  <strong className={storageStatus?.error ? 'text-[#E07A5F]' : 'text-[#2D6A4F] dark:text-[#52B788]'}>
                    {storageStatus?.error || 'None (Healthy)'}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed pt-1">
                🔒 <strong>User-Owned Progress:</strong> All learning goals, vocabulary, study plans, and diagnostic reports reside securely inside your browser's IndexedDB. The backend is stateless and never saves your personal learning state.
              </p>
            </div>

            {/* Notification messages */}
            {dataMessage && (
              <div className="p-3 rounded-xl bg-[#EFF6F1] dark:bg-[#1E2E24] border border-[#CDE1D4] dark:border-[#2C4438] text-[#2D6A4F] dark:text-[#84A98C] text-xs font-medium flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D6A4F] dark:text-[#52B788]" />
                <span>{dataMessage}</span>
              </div>
            )}

            {importErrorMessage && (
              <div className="p-3 rounded-xl bg-[#FDF0ED] dark:bg-[#32201C] border border-[#E07A5F]/40 text-[#E07A5F] text-xs font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-[#E07A5F]" />
                <span>{importErrorMessage}</span>
              </div>
            )}

            {/* Export and Import Actions */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-1.5 mb-1">
                    <Download className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#74A892]" />
                    <span>Export Progress</span>
                  </h4>
                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-normal">
                    Download complete learning history, vocabulary, and active state as versioned JSON.
                  </p>
                </div>
                <button
                  onClick={handleExportData}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 space-y-2 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-1.5 mb-1">
                    <Upload className="w-3.5 h-3.5 text-[#52796F] dark:text-[#84A98C]" />
                    <span>Import Backup</span>
                  </h4>
                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-normal">
                    Restore previously exported JSON data with validation pre-flight inspection.
                  </p>
                </div>
                <label className="w-full mt-2 py-2 px-3 rounded-xl bg-white dark:bg-[#1E231F] hover:bg-[#FAF7F2] dark:hover:bg-[#262F28] text-[#2D312E] dark:text-[#F4F2EC] text-xs font-bold border border-[#EBE4D7] dark:border-[#3C443E] transition flex items-center justify-center space-x-1.5 cursor-pointer">
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
            <div className="bg-[#FDF0ED] dark:bg-[#32201C] border border-[#E07A5F]/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-[#E07A5F] text-xs font-bold uppercase tracking-wider">
                <Trash2 className="w-4 h-4 text-[#E07A5F]" />
                <span>Reset Learning Progress</span>
              </div>
              <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                Clear all vocabulary cards, skill mastery ratings, recorded attempts, and lesson plans from browser storage. Resets your tutor back to fresh Day 1 state.
              </p>

              {!showResetConfirm ? (
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="px-4 py-2 rounded-xl bg-[#E07A5F] hover:bg-[#B84728] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset All Progress</span>
                </button>
              ) : (
                <div className="p-3 bg-white dark:bg-[#262F28] border border-[#E07A5F]/50 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-[#E07A5F]">
                    Are you sure? This action is permanent and cannot be undone.
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] dark:bg-[#1E231F] text-[#5C645E] dark:text-[#A7ABA4] text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isResetting}
                      onClick={handleConfirmReset}
                      className="px-4 py-1.5 rounded-lg bg-[#E07A5F] hover:bg-[#B84728] text-white text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
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
        {/* TAB 3: GEMINI API KEY CONFIGURATION (SECURE & MASKED) */}
        {/* ============================================================== */}
        {activeTab === 'apikey' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-[#2D6A4F] dark:text-[#74A892] text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
                  <span>Custom Gemini API Key</span>
                </div>
                {activeKeyMasked.hasKey && (
                  <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-[#74A892] bg-[#EFF6F1] dark:bg-[#1E2E24] px-2 py-0.5 rounded-full border border-[#CDE1D4] dark:border-[#2C4438] flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#2D6A4F] dark:text-[#52B788]" />
                    <span>Custom Key Active</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                Connect your personal Google Gemini API key to power all interactive tutoring, adaptive diagnostic exams, and personalized lesson plans without community quota restrictions.
              </p>

              {/* Masked Active Key Display */}
              {activeKeyMasked.hasKey ? (
                <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#CDE1D4] dark:border-[#2C4438] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#5C645E] dark:text-[#A7ABA4] block tracking-wider">Active Key Status</span>
                    <span className="text-xs font-mono text-[#2D6A4F] dark:text-[#74A892] font-medium">
                      Connected ({activeKeyMasked.masked})
                    </span>
                  </div>
                  <button
                    onClick={handleClearApiKey}
                    className="text-xs text-[#E07A5F] hover:underline font-medium cursor-pointer"
                  >
                    Remove & Use System Key
                  </button>
                </div>
              ) : (
                <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">Currently using default system environment key.</span>
                </div>
              )}

              {/* Password-masked Input Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#2D312E] dark:text-[#F4F2EC] block">
                  {activeKeyMasked.hasKey ? 'Enter new API key to replace current key:' : 'Enter your Gemini API key:'}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key here (masked)..."
                  className="w-full bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#3C443E] rounded-xl px-3 py-2.5 text-[#2D312E] dark:text-[#F4F2EC] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] placeholder-[#8A938C]"
                />
              </div>

              {keyStatusMessage && (
                <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
                  keyStatusMessage.isError
                    ? 'bg-[#FDF0ED] dark:bg-[#32201C] border-[#E07A5F]/40 text-[#E07A5F]'
                    : 'bg-[#EFF6F1] dark:bg-[#1E2E24] border-[#CDE1D4] dark:border-[#2C4438] text-[#2D6A4F] dark:text-[#74A892]'
                }`}>
                  {keyStatusMessage.isError ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-[#E07A5F]" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2D6A4F] dark:text-[#52B788]" />
                  )}
                  <span>{keyStatusMessage.text}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  disabled={isVerifyingKey || !apiKeyInput.trim()}
                  onClick={handleSaveAndVerifyApiKey}
                  className="px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer"
                >
                  {isVerifyingKey ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Activating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Verify & Activate Key</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
