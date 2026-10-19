import React, { useState, useEffect } from 'react';
import {
  Brain,
  BookMarked,
  AlertOctagon,
  Download,
  Upload,
  Trash2,
  X,
  Volume2,
  Calendar,
  Sparkles,
  CheckCircle,
  Clock,
  Layers,
  Compass,
  FileText,
  RotateCcw
} from 'lucide-react';
import {
  UserProfile,
  LearnerSkillState,
  VocabularyItem,
  Attempt,
  LessonPlan,
  DailySummary,
  DiagnosticReport,
  PersonalizedStudyPlan
} from '../types/learning.ts';
import {
  getMemory,
  clearMemory,
  exportMemory,
  importMemory,
  validateImportData,
  getStorageStatus,
  playEnglishSpeech
} from '../services/api.ts';

interface MemoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onResetComplete: () => void;
  onRetakeDiagnostic?: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  isOpen,
  onClose,
  onResetComplete,
  onRetakeDiagnostic
}) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'skills' | 'plan' | 'mistakes'>('plan');
  const [skills, setSkills] = useState<LearnerSkillState[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [diagnosticReports, setDiagnosticReports] = useState<DiagnosticReport[]>([]);
  const [studyPlan, setStudyPlan] = useState<PersonalizedStudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      loadMemoryData();
    }
  }, [isOpen]);

  const loadMemoryData = async () => {
    setIsLoading(true);
    try {
      const data = await getMemory();
      setSkills(data.skills || []);
      setVocabulary(data.vocabulary || []);
      setAttempts(data.attempts || []);
      setSummaries(data.summaries || []);
      setDiagnosticReports(data.diagnosticReports || []);
      setStudyPlan(data.studyPlan || null);
    } catch (err) {
      console.error('Failed to load memory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportMemory();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `linguastep-memory-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Data exported successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const [importPending, setImportPending] = useState<any>(null);
  const [importValidation, setImportValidation] = useState<any>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateImportData(parsed);
        if (!validation.valid) {
          setStatusMessage(`Validation failed: ${validation.errors.join('; ')}`);
          setImportPending(null);
          setImportValidation(null);
        } else {
          setImportPending(parsed);
          setImportValidation(validation);
        }
      } catch (err) {
        setStatusMessage('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPending) return;
    try {
      await importMemory(importPending);
      setImportPending(null);
      setImportValidation(null);
      setStatusMessage('✓ Learning history imported successfully!');
      loadMemoryData();
      onResetComplete();
      setTimeout(() => setStatusMessage(''), 3500);
    } catch (err: any) {
      setStatusMessage(`Import failed: ${err?.message || 'Error'}`);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await clearMemory();
      setShowResetConfirm(false);
      onResetComplete();
      onClose();
      window.location.reload();
    } catch (err: any) {
      setStatusMessage(`Reset error: ${err?.message || 'Failed to reset'}`);
    } finally {
      setIsResetting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-slate-900 border-l border-slate-800 w-full max-w-2xl h-full flex flex-col text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Learner Memory & Retention</h2>
              <p className="text-xs text-slate-400">Adaptive diagnosis, evidence-based study plan, and spaced review</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-800 px-5 text-xs font-semibold gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('plan')}
            className={`py-3 border-b-2 flex items-center space-x-2 shrink-0 transition ${
              activeTab === 'plan'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Diagnostics & Plan</span>
          </button>

          <button
            onClick={() => setActiveTab('vocab')}
            className={`py-3 border-b-2 flex items-center space-x-2 shrink-0 transition ${
              activeTab === 'vocab'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4 text-indigo-400" />
            <span>Vocabulary ({vocabulary.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('skills')}
            className={`py-3 border-b-2 flex items-center space-x-2 shrink-0 transition ${
              activeTab === 'skills'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Skills Matrix ({skills.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`py-3 border-b-2 flex items-center space-x-2 shrink-0 transition ${
              activeTab === 'mistakes'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Recurring Errors ({skills.flatMap(s => s.recurring_errors).length})</span>
          </button>


        </div>

        {statusMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs">
            {statusMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              Loading memory items...
            </div>
          ) : (
            <>
              {/* TAB: DIAGNOSTICS & STUDY PLAN */}
              {activeTab === 'plan' && (
                <div className="space-y-4">
                  {/* Action banner to retake diagnostic */}
                  <div className="bg-gradient-to-r from-indigo-950/60 to-slate-800/80 border border-indigo-500/40 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Adaptive Diagnostic Placement</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {diagnosticReports.length > 0
                          ? `Last calibrated: ${new Date(diagnosticReports[diagnosticReports.length - 1].completedAt).toLocaleDateString()} (${diagnosticReports[diagnosticReports.length - 1].overallCEFR})`
                          : 'No completed diagnostic assessment yet.'}
                      </p>
                    </div>

                    {onRetakeDiagnostic && (
                      <button
                        onClick={() => {
                          onClose();
                          onRetakeDiagnostic();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shrink-0 flex items-center space-x-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{diagnosticReports.length > 0 ? 'Retake Assessment' : 'Take Diagnostic'}</span>
                      </button>
                    )}
                  </div>

                  {/* Active Study Plan summary */}
                  {studyPlan ? (
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                          Active Personalized Study Plan
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {studyPlan.learnerApprovalStatus}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-white leading-relaxed">
                        {studyPlan.overallObjective}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-slate-700/60">
                        <span className="text-xs font-semibold text-slate-400 block">Prioritized Focus Skills:</span>
                        {studyPlan.prioritizedSkills.map((sk, i) => (
                          <div key={i} className="text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                            <div>
                              <strong className="text-slate-200">{sk.skillName}</strong>
                              <p className="text-[11px] text-slate-400 mt-0.5">{sk.rationale}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 shrink-0 ml-2">
                              {sk.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 text-center space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mx-auto">
                        <Compass className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No Diagnostic Assessment Taken Yet</h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                        Complete your Adaptive Diagnostic Assessment to let the AI analyze your actual grammar, vocabulary, reading, and writing skills and generate a 100% personalized study plan tailored to your exact needs.
                      </p>
                      {onRetakeDiagnostic && (
                        <button
                          onClick={() => {
                            onClose();
                            onRetakeDiagnostic();
                          }}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/30 inline-flex items-center space-x-1.5"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Start Diagnostic Assessment Now</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Past Diagnostic Reports History */}
                  {diagnosticReports.length > 0 && (
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Diagnostic Assessment History ({diagnosticReports.length})
                      </span>

                      {diagnosticReports.map(rep => (
                        <div
                          key={rep.id}
                          className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white text-sm">{rep.overallCEFR}</span>
                              <span className="text-[10px] uppercase font-semibold px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300">
                                {rep.mode}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {new Date(rep.completedAt).toLocaleDateString()} • {rep.totalQuestionsAnswered} items • {Math.round(rep.accuracyRate * 100)}% accuracy
                            </span>
                          </div>

                          <div className="text-right text-[11px] text-slate-400">
                            <span>Grammar: <strong className="text-slate-200">{rep.skillEstimates.grammar.cefrRange}</strong></span>
                            <span className="block">Writing: <strong className="text-slate-200">{rep.skillEstimates.writing.cefrRange}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB: VOCABULARY NOTEBOOK */}
              {activeTab === 'vocab' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span>Organized by Spaced Repetition (Days 1, 3, 7, 14, 30)</span>
                    <span>Total: {vocabulary.length} words</span>
                  </div>

                  {vocabulary.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No vocabulary saved yet. Vocabulary cards will appear here automatically!
                    </div>
                  ) : (
                    vocabulary.map(v => (
                      <div
                        key={v.id}
                        className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-base font-bold text-white">{v.word}</h4>
                              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                                {v.part_of_speech}
                              </span>
                              <span className="text-xs font-mono text-slate-400">{v.ipa}</span>
                              <button
                                onClick={() => playEnglishSpeech(v.word)}
                                className="p-1 rounded-md text-indigo-400 hover:text-white"
                                title="Listen to pronunciation"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <p className="text-xs font-medium text-emerald-300 mt-1">{v.meaning}</p>
                          </div>

                          <div className="text-right">
                            <span className="px-2 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-[10px] font-bold text-indigo-300">
                              Stage {v.review_stage}d
                            </span>
                            <span className="block text-[10px] text-slate-500 mt-1">
                              ✓ {v.times_correct} / ✗ {v.times_incorrect}
                            </span>
                          </div>
                        </div>

                        {v.collocation_pattern && (
                          <div className="text-xs text-amber-300 bg-slate-900/60 p-2 rounded-lg font-mono">
                            {v.collocation_pattern}
                          </div>
                        )}

                        {v.example_workplace && (
                          <p className="text-xs text-slate-300 italic">
                            "{v.example_workplace}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB: SKILLS MATRIX */}
              {activeTab === 'skills' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                    <span>Learner Skill Progression</span>
                  </div>

                  {skills.map(s => {
                    const statusColor =
                      s.status === 'mastered'
                        ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
                        : s.status === 'mostly_mastered'
                        ? 'text-sky-400 bg-sky-950/40 border-sky-800/40'
                        : 'text-amber-400 bg-amber-950/40 border-amber-800/40';

                    return (
                      <div
                        key={s.skill_id}
                        className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white">{s.skill_name}</h4>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">
                              {s.category}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400 block mt-1">
                            Accuracy: {Math.round(s.accuracy_rate * 100)}% ({s.total_attempts} attempts)
                          </span>
                        </div>

                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${statusColor}`}>
                          {s.status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB: RECURRING ERRORS */}
              {activeTab === 'mistakes' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    The tutor tracks recurring mistakes across your sessions so upcoming lessons can address them with fresh examples.
                  </p>

                  {skills.flatMap(s => s.recurring_errors).length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No recurring mistakes recorded. Great job!
                    </div>
                  ) : (
                    skills.filter(s => s.recurring_errors.length > 0).map(s => (
                      <div
                        key={s.skill_id}
                        className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-4 space-y-2"
                      >
                        <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                          {s.skill_name}
                        </h4>
                        <ul className="space-y-1">
                          {s.recurring_errors.map((err, idx) => (
                            <li key={idx} className="text-xs text-slate-200 flex items-start space-x-2">
                              <span className="text-rose-400">•</span>
                              <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}

              </>
          )}
        </div>
      </div>
    </div>
  );
};
