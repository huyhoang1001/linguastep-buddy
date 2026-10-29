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
  RotateCcw,
  Search,
  Filter,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import {
  UserProfile,
  LearnerSkillState,
  VocabularyItem,
  Attempt,
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
  const [activeTab, setActiveTab] = useState<'vocab' | 'skills' | 'plan' | 'mistakes'>('vocab');
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

  // Word Stash filtering and search
  const [vocabFilter, setVocabFilter] = useState<'all' | 'due' | 'solid' | 'families'>('all');
  const [vocabSearch, setVocabSearch] = useState<string>('');

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
      a.download = `linguastep-word-stash-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Data exported to notebook backup!');
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
      setStatusMessage('✓ Word stash & memory restored successfully!');
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

  // Retention helpers
  const now = Date.now();
  const isOverdue = (v: VocabularyItem) =>
    v.next_review_at && new Date(v.next_review_at).getTime() <= now;

  const isSolid = (v: VocabularyItem) =>
    v.review_stage >= 14 || v.mastery_stage === 'applied' || v.mastery_stage === 'mastered';

  const hasFamily = (v: VocabularyItem) =>
    Boolean(v.word_family && v.word_family.members && v.word_family.members.length > 0);

  const overdueCount = vocabulary.filter(isOverdue).length;
  const solidCount = vocabulary.filter(isSolid).length;
  const familiesCount = vocabulary.filter(hasFamily).length;

  const filteredVocab = vocabulary.filter(v => {
    if (vocabSearch.trim()) {
      const q = vocabSearch.toLowerCase().trim();
      const matchWord = v.word.toLowerCase().includes(q);
      const matchMeaning = v.meaning.toLowerCase().includes(q);
      const matchColloc = v.collocation_pattern?.toLowerCase().includes(q);
      const matchFamily = v.word_family?.family_root?.toLowerCase().includes(q);
      if (!matchWord && !matchMeaning && !matchColloc && !matchFamily) return false;
    }
    if (vocabFilter === 'due') return isOverdue(v);
    if (vocabFilter === 'solid') return isSolid(v);
    if (vocabFilter === 'families') return hasFamily(v);
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#161A17]/70 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] dark:bg-[#1A1F1B] border-l border-[#EBE4D7] dark:border-[#2C332E] w-full max-w-2xl h-full flex flex-col text-[#2D312E] dark:text-[#F4F2EC] shadow-2xl font-sans">
        {/* Header */}
        <div className="p-5 border-b border-[#EBE4D7] dark:border-[#2C332E] flex items-center justify-between bg-white/70 dark:bg-[#202722]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-[#FAF7F2] shadow-sm">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                Learner Memory &amp; Stash
              </h2>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                Spaced retention ledger, word families, and curriculum diagnostic
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#8A938C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] hover:bg-white dark:hover:bg-[#272E29] transition cursor-pointer border border-transparent hover:border-[#EBE4D7] dark:hover:border-[#38423A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation (Clean Indie Zine styling) */}
        <div className="flex border-b border-[#EBE4D7] dark:border-[#2C332E] px-5 text-xs font-semibold gap-2 overflow-x-auto bg-[#F4EFEB] dark:bg-[#181D19]">
          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`py-3 px-2 border-b-2 flex items-center space-x-2 shrink-0 transition cursor-pointer ${
              activeTab === 'vocab'
                ? 'border-[#2D6A4F] text-[#1B4332] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#8E978F] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <BookMarked className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            <span>Word Stash ({vocabulary.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className={`py-3 px-2 border-b-2 flex items-center space-x-2 shrink-0 transition cursor-pointer ${
              activeTab === 'skills'
                ? 'border-[#2D6A4F] text-[#1B4332] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#8E978F] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-[#52796F] dark:text-[#84A98C]" />
            <span>Skills Matrix ({skills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mistakes')}
            className={`py-3 px-2 border-b-2 flex items-center space-x-2 shrink-0 transition cursor-pointer ${
              activeTab === 'mistakes'
                ? 'border-[#2D6A4F] text-[#1B4332] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#8E978F] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-[#E07A5F]" />
            <span>Recurring Errors ({skills.flatMap(s => s.recurring_errors).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('plan')}
            className={`py-3 px-2 border-b-2 flex items-center space-x-2 shrink-0 transition cursor-pointer ${
              activeTab === 'plan'
                ? 'border-[#2D6A4F] text-[#1B4332] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#8E978F] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <Compass className="w-4 h-4 text-[#74A892]" />
            <span>Diagnostic &amp; Plan</span>
          </button>
        </div>

        {statusMessage && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#334237] text-[#2D6A4F] dark:text-[#84A98C] text-xs font-medium">
            {statusMessage}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-[#8A938C] text-sm">
              <div className="w-8 h-8 border-2 border-[#2D6A4F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Fetching memory items from local ledger...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: WORD STASH */}
              {activeTab === 'vocab' && (
                <div className="space-y-4">
                  {/* Cambridge Dictionary Quick Search */}
                  <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
                        <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                          Look Up &amp; Save to Stash
                        </span>
                      </div>
                      <span className="text-[10px] text-[#8A938C] font-mono">Cambridge API Grounded</span>
                    </div>
                    <CambridgeDictionarySearch
                      onSelectWord={(word) => setActiveModalWord(word)}
                      placeholder="Type a word to explore word family & practice..."
                    />
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A938C]" />
                      <input
                        type="text"
                        value={vocabSearch}
                        onChange={(e) => setVocabSearch(e.target.value)}
                        placeholder="Search your stash by root, meaning, or collocation..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-xl text-xs text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:border-[#74A892]"
                      />
                      {vocabSearch && (
                        <button
                          type="button"
                          onClick={() => setVocabSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A938C] hover:text-[#2D312E] text-xs cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setVocabFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          vocabFilter === 'all'
                            ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-sm'
                            : 'bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] text-[#5C645E] dark:text-[#A7ABA4]'
                        }`}
                      >
                        All ({vocabulary.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setVocabFilter('due')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 ${
                          vocabFilter === 'due'
                            ? 'bg-[#E07A5F] text-white font-bold shadow-sm'
                            : 'bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] text-[#5C645E] dark:text-[#A7ABA4]'
                        }`}
                      >
                        <span>Due for Recall</span>
                        {overdueCount > 0 && (
                          <span className="px-1.5 py-0.2 bg-white/30 text-white rounded text-[10px] font-bold">
                            {overdueCount}
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setVocabFilter('solid')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          vocabFilter === 'solid'
                            ? 'bg-[#2D6A4F] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-sm'
                            : 'bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] text-[#5C645E] dark:text-[#A7ABA4]'
                        }`}
                      >
                        Solidified ({solidCount})
                      </button>

                      <button
                        type="button"
                        onClick={() => setVocabFilter('families')}
                        className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                          vocabFilter === 'families'
                            ? 'bg-[#52796F] text-white dark:bg-[#84A98C] dark:text-[#0F291E] font-bold shadow-sm'
                            : 'bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] text-[#5C645E] dark:text-[#A7ABA4]'
                        }`}
                      >
                        Word Families ({familiesCount})
                      </button>
                    </div>
                  </div>

                  {/* Empty State */}
                  {vocabulary.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white/60 dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-3xl space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#EFF6F1] dark:bg-[#28352C] flex items-center justify-center text-2xl mx-auto">
                        🧺
                      </div>
                      <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                        Your word stash is looking empty
                      </h3>
                      <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] max-w-sm mx-auto leading-relaxed">
                        Words you look up in the search box above or encounter in daily lessons will collect here with spaced repetition reminders.
                      </p>
                    </div>
                  ) : filteredVocab.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-white/60 dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-3xl space-y-2">
                      <p className="text-sm font-medium text-[#1B4332] dark:text-[#F4F2EC]">
                        No words match that filter right now
                      </p>
                      <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                        You&apos;re either all caught up on scheduled reviews or no saved words match your search.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredVocab.map(v => {
                        const overdue = isOverdue(v);
                        const nextDate = v.next_review_at ? new Date(v.next_review_at).toLocaleDateString() : 'Tomorrow';

                        return (
                          <div
                            key={v.id}
                            className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 space-y-3 shadow-sm hover:border-[#74A892] dark:hover:border-[#52B788] transition duration-150"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveModalWord(v.word)}
                                    className="text-base sm:text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] hover:text-[#2D6A4F] dark:hover:text-[#52B788] transition text-left cursor-pointer underline decoration-dotted decoration-[#C5BFB3] hover:decoration-[#2D6A4F]"
                                    title="Open Cambridge dictionary details & micro-exam"
                                  >
                                    {v.word}
                                  </button>

                                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-[#EFF6F1] dark:bg-[#28352C] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#344439]">
                                    {v.part_of_speech}
                                  </span>

                                  <span className="text-xs font-mono text-[#5C645E] dark:text-[#A7ABA4]">
                                    {v.ipa}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => playEnglishSpeech(v.word)}
                                    className="p-1 rounded-md text-[#74A892] hover:text-[#1B4332] dark:hover:text-white transition cursor-pointer"
                                    title="Listen to pronunciation"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#95D5B2]">
                                  {v.meaning}
                                </p>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block ${
                                  overdue
                                    ? 'bg-[#FDF0ED] dark:bg-[#342421] text-[#E07A5F] border-[#F5D5CC] dark:border-[#4E342D]'
                                    : 'bg-[#EFF6F1] dark:bg-[#242E27] text-[#2D6A4F] dark:text-[#84A98C] border-[#CDE1D4] dark:border-[#334237]'
                                }`}>
                                  {overdue ? '⚠️ Due for recall' : `Stage ${v.review_stage}d · ${nextDate}`}
                                </span>
                                <span className="block text-[10px] text-[#8A938C] mt-1 font-mono">
                                  ✓ {v.times_correct} / ✗ {v.times_incorrect}
                                </span>
                              </div>
                            </div>

                            {v.collocation_pattern && (
                              <div className="text-xs text-[#B25E00] dark:text-[#E9A825] bg-[#FAF7F2] dark:bg-[#1E231F] p-2 rounded-xl font-mono border border-[#EBE4D7] dark:border-[#2C332E]">
                                {v.collocation_pattern}
                              </div>
                            )}

                            {v.example_workplace && (
                              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic leading-relaxed">
                                &ldquo;{v.example_workplace}&rdquo;
                              </p>
                            )}

                            {/* Word Family Forms */}
                            {v.word_family && v.word_family.members && v.word_family.members.length > 0 && (
                              <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2B332D] space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] block">
                                  Word Family Forms:
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {v.word_family.members.map((m, idx) => {
                                    const formKey = m.form.toLowerCase().trim();
                                    const mastery = v.word_form_mastery?.[formKey];
                                    const status = mastery?.status || 'untested';

                                    let badgeColor = 'bg-[#FAF7F2] text-[#5C645E] border-[#EBE4D7] dark:bg-[#1E231F] dark:text-[#8A938C] dark:border-[#2C332E]';
                                    if (status === 'mastered') {
                                      badgeColor = 'bg-[#EFF6F1] text-[#2D6A4F] border-[#CDE1D4] dark:bg-[#252F28] dark:text-[#84A98C] dark:border-[#334237]';
                                    } else if (status === 'understood') {
                                      badgeColor = 'bg-[#EFF6F1] text-[#52796F] border-[#CDE1D4] dark:bg-[#252F28] dark:text-[#84A98C] dark:border-[#334237]';
                                    } else if (status === 'needs_practice') {
                                      badgeColor = 'bg-[#FDF0ED] text-[#E07A5F] border-[#F5D5CC] dark:bg-[#2E2421] dark:text-[#D1ABA2] dark:border-[#4B342E]';
                                    }

                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveModalWord(m.form)}
                                        className={`text-[11px] px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer hover:border-[#74A892] transition ${badgeColor}`}
                                        title={`Practice ${m.form} (${m.part_of_speech})`}
                                      >
                                        <span className="font-semibold">{m.form}</span>
                                        <span className="text-[9px] opacity-75">({m.part_of_speech.slice(0, 4)})</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SKILLS MATRIX */}
              {activeTab === 'skills' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#5C645E] dark:text-[#A7ABA4] pb-1">
                    <span>Mastery evidence &amp; Spaced review ledger</span>
                    <span>Total: {skills.length} skills tracked</span>
                  </div>

                  {skills.length === 0 ? (
                    <div className="text-center py-12 text-[#8A938C] text-xs">
                      No skills recorded yet. Complete diagnostic or daily exercises to populate your skills matrix.
                    </div>
                  ) : (
                    skills.map(s => {
                      const stage = s.mastery_stage || 'recognition';
                      let statusColor = 'text-[#5C645E] bg-white dark:bg-[#222924] border-[#EBE4D7] dark:border-[#303B33]';
                      let stageLabel = 'Recognition';

                      if (s.status === 'regressed') {
                        statusColor = 'text-[#E07A5F] bg-[#FDF0ED] dark:bg-[#342421] border-[#F5D5CC] dark:border-[#4E342D]';
                        stageLabel = 'Needs review';
                      } else if (stage === 'retained_mastery') {
                        statusColor = 'text-[#2D6A4F] bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237]';
                        stageLabel = 'Retained';
                      } else if (stage === 'application') {
                        statusColor = 'text-[#52796F] bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237]';
                        stageLabel = 'Application';
                      } else if (stage === 'active_recall') {
                        statusColor = 'text-[#2D6A4F] bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237]';
                        stageLabel = 'Active recall';
                      } else if (stage === 'recognition') {
                        statusColor = 'text-[#B25E00] bg-[#FAF7F2] dark:bg-[#242A25] border-[#EBE4D7] dark:border-[#313B33]';
                        stageLabel = 'Recognition';
                      }

                      const nextReviewDate = s.next_review_at ? new Date(s.next_review_at).toLocaleDateString() : 'Tomorrow';
                      const isSkillOverdue = s.next_review_at && new Date(s.next_review_at).getTime() <= Date.now();

                      return (
                        <div
                          key={s.skill_id}
                          className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-semibold text-[#1B4332] dark:text-[#F4F2EC]">{s.skill_name}</h4>
                              <span className="text-[10px] uppercase font-bold text-[#5C645E] dark:text-[#A7ABA4] bg-[#F4EFEB] dark:bg-[#181D19] px-2 py-0.5 rounded">
                                {s.category}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                              <span>Accuracy: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{Math.round(s.accuracy_rate * 100)}%</strong> ({s.total_attempts} attempts)</span>
                              {s.mastery_score !== undefined && (
                                <span>&bull; Evidence: <strong className="text-[#2D6A4F] dark:text-[#84A98C]">{s.mastery_score}/100</strong></span>
                              )}
                              <span className={isSkillOverdue ? 'text-[#E07A5F] font-bold' : ''}>
                                &bull; Review: {isSkillOverdue ? 'Overdue' : nextReviewDate}
                              </span>
                            </div>
                            {s.recurring_errors && s.recurring_errors.length > 0 && (
                              <div className="text-[11px] text-[#E07A5F] pt-0.5">
                                <span>Clinic note: {s.recurring_errors[s.recurring_errors.length - 1]}</span>
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
                    })
                  )}
                </div>
              )}

              {/* TAB 3: RECURRING ERRORS */}
              {activeTab === 'mistakes' && (
                <div className="space-y-3">
                  <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                    The stuff that tripped you up across recent sessions. Upcoming lessons schedule targeted clinics for these exact patterns.
                  </p>

                  {skills.flatMap(s => s.recurring_errors).length === 0 ? (
                    <div className="text-center py-12 text-[#8A938C] text-xs">
                      No recurring mistakes recorded. Clean record!
                    </div>
                  ) : (
                    skills.filter(s => s.recurring_errors.length > 0).map(s => (
                      <div
                        key={s.skill_id}
                        className="bg-[#FDF0ED] dark:bg-[#2D2320] border border-[#F5D5CC] dark:border-[#4B342E] rounded-2xl p-4 space-y-2"
                      >
                        <h4 className="text-xs font-bold text-[#E07A5F] uppercase tracking-wider">
                          {s.skill_name}
                        </h4>
                        <ul className="space-y-1">
                          {s.recurring_errors.map((err, idx) => (
                            <li key={idx} className="text-xs text-[#2D312E] dark:text-[#EAE6DF] flex items-start space-x-2">
                              <span className="text-[#E07A5F] font-bold">&bull;</span>
                              <span>{err}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 4: DIAGNOSTICS & STUDY PLAN */}
              {activeTab === 'plan' && (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
                    <div>
                      <h4 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Adaptive Diagnostic Placement</h4>
                      <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                        {diagnosticReports.length > 0
                          ? `Last calibrated: ${new Date(diagnosticReports[diagnosticReports.length - 1].completedAt).toLocaleDateString()} (${diagnosticReports[diagnosticReports.length - 1].overallCEFR})`
                          : 'No completed diagnostic assessment yet.'}
                      </p>
                    </div>

                    {onRetakeDiagnostic && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onRetakeDiagnostic();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition shrink-0 flex items-center space-x-1.5 cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{diagnosticReports.length > 0 ? 'Retake Diagnostic' : 'Take Diagnostic'}</span>
                      </button>
                    )}
                  </div>

                  {studyPlan ? (
                    <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788]">
                          Active Study Plan
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#EFF6F1] dark:bg-[#252F28] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#334237]">
                          {studyPlan.learnerApprovalStatus}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-[#1B4332] dark:text-[#F4F2EC] leading-relaxed">
                        {studyPlan.overallObjective}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-[#F4EFEB] dark:border-[#2B332D]">
                        <span className="text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] block">Prioritized Focus Skills:</span>
                        {studyPlan.prioritizedSkills.map((sk, i) => (
                          <div key={i} className="text-xs bg-[#FAF7F2] dark:bg-[#1E231F] p-2.5 rounded-xl border border-[#EBE4D7] dark:border-[#2C332E] flex justify-between items-center">
                            <div>
                              <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{sk.skillName}</strong>
                              <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">{sk.rationale}</p>
                            </div>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#FDF0ED] dark:bg-[#2E2421] text-[#E07A5F] shrink-0 ml-2 border border-[#F5D5CC] dark:border-[#4B342E]">
                              {sk.priority}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-[#222924] border border-[#EBE4D7] dark:border-[#303B33] rounded-2xl p-6 text-center space-y-3 shadow-sm">
                      <div className="w-10 h-10 rounded-xl bg-[#EFF6F1] dark:bg-[#252F28] flex items-center justify-center text-[#2D6A4F] dark:text-[#52B788] mx-auto">
                        <Compass className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">No Diagnostic Assessment Taken Yet</h4>
                      <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed max-w-md mx-auto">
                        Complete your Adaptive Diagnostic to let the system calibrate your actual skill levels and schedule high-priority workplace concepts.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Backup & Ledger Management */}
        <div className="p-4 border-t border-[#EBE4D7] dark:border-[#2C332E] bg-white/70 dark:bg-[#202722] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#272E29] hover:bg-[#EFF6F1] border border-[#EBE4D7] dark:border-[#364038] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
            </button>

            <label className="px-3 py-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#272E29] hover:bg-[#EFF6F1] border border-[#EBE4D7] dark:border-[#364038] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore Backup</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>

          {!showResetConfirm ? (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="text-[11px] text-[#8A938C] hover:text-[#E07A5F] transition cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Ledger Data</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#E07A5F] font-bold">Wipe all records?</span>
              <button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="px-2.5 py-1 rounded-lg bg-[#E07A5F] text-white font-bold text-[11px] cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-2 py-1 rounded-lg bg-white dark:bg-[#272E29] text-[#5C645E] text-[11px] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Word Details & Micro-Exam Modal */}
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
