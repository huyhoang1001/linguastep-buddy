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
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';
import { WordPracticeModal } from './WordPracticeModal.tsx';

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
  const [activeModalWord, setActiveModalWord] = useState<string | null>(null);

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
                <div className="space-y-4">
                  {/* Cambridge Dictionary Search Box to type & add word */}
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-xs font-bold text-slate-200">Look Up & Add to Memory</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Cambridge Dictionary</span>
                    </div>
                    <CambridgeDictionarySearch
                      onSelectWord={(word) => setActiveModalWord(word)}
                      placeholder="Type a word to look up, practice, or add to memory..."
                    />
                  </div>

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
                              <button
                                onClick={() => setActiveModalWord(v.word)}
                                className="text-base font-bold text-white hover:text-indigo-300 transition text-left cursor-pointer underline decoration-dotted decoration-slate-600 hover:decoration-indigo-400"
                                title="Open Cambridge dictionary details & micro-exam"
                              >
                                {v.word}
                              </button>
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

                        {/* Word Family & Form Mastery Summary */}
                        {v.word_family && v.word_family.members && v.word_family.members.length > 0 && (
                          <div className="pt-2 border-t border-slate-700/60 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
                              Word Family Forms:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {v.word_family.members.map((m, idx) => {
                                const formKey = m.form.toLowerCase().trim();
                                const mastery = v.word_form_mastery?.[formKey];
                                const status = mastery?.status || 'untested';

                                let badgeColor = 'bg-slate-900/80 text-slate-400 border-slate-700';
                                if (status === 'mastered') {
                                  badgeColor = 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40';
                                } else if (status === 'understood') {
                                  badgeColor = 'bg-sky-950/60 text-sky-300 border-sky-500/40';
                                } else if (status === 'needs_practice') {
                                  badgeColor = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
                                }

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => setActiveModalWord(m.form)}
                                    title={`Click to practice ${m.form} (${m.part_of_speech})`}
                                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-mono transition flex items-center space-x-1 hover:border-indigo-400 ${badgeColor}`}
                                  >
                                    <span className="font-bold">{m.form}</span>
                                    <span className="text-[9px] opacity-70">({m.part_of_speech.slice(0, 3)})</span>
                                    {status !== 'untested' && (
                                      <span className="text-[8px] uppercase font-bold opacity-90 pl-0.5">
                                        • {status === 'needs_practice' ? 'Review' : status}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
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
                    const stage = s.mastery_stage || (s.status === 'mastered' ? 'retained_mastery' : s.status === 'mostly_mastered' ? 'application' : 'recognition');
                    const isRegressed = s.status === 'regressed';

                    let statusColor = 'text-amber-300 bg-amber-950/40 border-amber-800/40';
                    let stageLabel = 'Exposure';

                    if (isRegressed) {
                      statusColor = 'text-rose-300 bg-rose-950/50 border-rose-500/40 animate-pulse';
                      stageLabel = '⚠️ Regressed';
                    } else if (stage === 'retained_mastery') {
                      statusColor = 'text-emerald-300 bg-emerald-950/50 border-emerald-500/50';
                      stageLabel = 'Retained Mastery 🏆';
                    } else if (stage === 'application') {
                      statusColor = 'text-indigo-300 bg-indigo-950/50 border-indigo-500/50';
                      stageLabel = 'Application ✨';
                    } else if (stage === 'active_recall') {
                      statusColor = 'text-sky-300 bg-sky-950/50 border-sky-500/50';
                      stageLabel = 'Active Recall';
                    } else if (stage === 'recognition') {
                      statusColor = 'text-amber-300 bg-amber-950/50 border-amber-600/40';
                      stageLabel = 'Recognition';
                    }

                    const nextReviewDate = s.next_review_at ? new Date(s.next_review_at).toLocaleDateString() : 'Tomorrow';
                    const isOverdue = s.next_review_at && new Date(s.next_review_at).getTime() <= Date.now();

                    return (
                      <div
                        key={s.skill_id}
                        className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-white">{s.skill_name}</h4>
                            <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-700/80 px-1.5 py-0.5 rounded">
                              {s.category}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span>Accuracy: <strong className="text-slate-200">{Math.round(s.accuracy_rate * 100)}%</strong> ({s.total_attempts} attempts)</span>
                            {s.mastery_score !== undefined && (
                              <span>• Evidence Score: <strong className="text-indigo-300">{s.mastery_score}/100</strong></span>
                            )}
                            <span className={isOverdue ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                              • Spaced Review: {isOverdue ? 'Overdue' : nextReviewDate}
                            </span>
                          </div>
                          {s.recurring_errors && s.recurring_errors.length > 0 && (
                            <div className="text-[11px] text-rose-300/90 pt-0.5">
                              <span>Clinic Note: {s.recurring_errors[s.recurring_errors.length - 1]}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border capitalize ${statusColor}`}>
                            {stageLabel}
                          </span>
                        </div>
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

      {activeModalWord && (
        <WordPracticeModal
          word={activeModalWord}
          examMajor="General Professional English"
          onClose={() => setActiveModalWord(null)}
          onSavedToMemory={() => {
            loadMemoryData();
            onResetComplete();
          }}
        />
      )}
    </div>
  );
};
