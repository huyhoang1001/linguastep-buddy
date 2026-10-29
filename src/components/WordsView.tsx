import React, { useState } from 'react';
import {
  BookMarked,
  Volume2,
  Search,
  Sparkles,
  ArrowRight,
  Download,
  Upload,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';
import { VocabularyItem } from '../types/learning.ts';
import { playEnglishSpeech, exportMemory, importMemory, validateImportData } from '../services/api.ts';
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';

interface WordsViewProps {
  vocabulary: VocabularyItem[];
  onPracticeWord: (word: string) => void;
  onRefreshMemory: () => Promise<void>;
  examMajor?: string;
}

export const WordsView: React.FC<WordsViewProps> = ({
  vocabulary,
  onPracticeWord,
  onRefreshMemory,
  examMajor = 'General Professional English'
}) => {
  const [vocabFilter, setVocabFilter] = useState<'all' | 'due' | 'solid' | 'families'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

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
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
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

  const handleExport = async () => {
    try {
      const data = await exportMemory();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meomeo-word-stash-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('Data exported successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage('');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateImportData(parsed);
        if (!validation.valid) {
          setStatusMessage(`Validation failed: ${validation.errors.join('; ')}`);
        } else {
          await importMemory(parsed);
          setStatusMessage('✓ Word stash restored successfully!');
          await onRefreshMemory();
          setTimeout(() => setStatusMessage(''), 3500);
        }
      } catch (err) {
        setStatusMessage('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Header & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C] uppercase tracking-wider">
            <span>Vocabulary Deck</span>
            <span aria-hidden="true">&middot;</span>
            <span>Spaced Review Ledger</span>
            <span aria-hidden="true">&middot;</span>
            <span>Word Families</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight mt-1">
            Word Stash
          </h1>
          <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
            Your personal vocabulary collection, organized by spaced repetition intervals and derivational forms.
          </p>
        </div>

        {/* Quick Ledger Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#252C26] hover:bg-[#FAF7F2] border border-[#EBE4D7] dark:border-[#333D35] text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <label className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#252C26] hover:bg-[#FAF7F2] border border-[#EBE4D7] dark:border-[#333D35] text-xs font-semibold text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] transition flex items-center gap-1.5 cursor-pointer shadow-xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#334237] text-[#2D6A4F] dark:text-[#84A98C] text-xs font-medium">
          {statusMessage}
        </div>
      )}

      {/* 2. Look Up & Add New Word Box */}
      <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#1B4332] dark:text-[#F4F2EC]">
              Cambridge Dictionary Look Up &amp; Save
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#8A938C]">Type any English word</span>
        </div>

        <CambridgeDictionarySearch
          onSelectWord={(w) => onPracticeWord(w)}
          placeholder="Look up a word to explore its word family forms and add to your stash..."
        />
      </div>

      {/* 3. Filter Bar & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A938C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your stash by root, meaning, or collocation..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-xl text-xs text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:border-[#74A892]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A938C] hover:text-[#2D312E] text-xs cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setVocabFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                vocabFilter === 'all'
                  ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
              }`}
            >
              All ({vocabulary.length})
            </button>

            <button
              type="button"
              onClick={() => setVocabFilter('due')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer flex items-center gap-1.5 ${
                vocabFilter === 'due'
                  ? 'bg-[#E07A5F] text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
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
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                vocabFilter === 'solid'
                  ? 'bg-[#2D6A4F] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
              }`}
            >
              Solidified ({solidCount})
            </button>

            <button
              type="button"
              onClick={() => setVocabFilter('families')}
              className={`px-3 py-1.5 rounded-xl font-medium transition cursor-pointer ${
                vocabFilter === 'families'
                  ? 'bg-[#52796F] text-white dark:bg-[#84A98C] dark:text-[#0F291E] font-bold shadow-xs'
                  : 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
              }`}
            >
              Word Families ({familiesCount})
            </button>
          </div>
        </div>

        {/* 4. Word Cards Grid */}
        {vocabulary.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6F1] dark:bg-[#28352C] flex items-center justify-center text-3xl mx-auto">
              🧺
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
              Your word stash is looking empty
            </h3>
            <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] max-w-md mx-auto leading-relaxed">
              Words you explore in the search box above or encounter during your daily lessons will automatically gather here with spaced-retention schedules.
            </p>
          </div>
        ) : filteredVocab.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl space-y-2">
            <p className="text-sm font-semibold text-[#1B4332] dark:text-[#F4F2EC]">
              No words match that filter
            </p>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
              You&apos;re either all caught up on scheduled reviews or no saved words match your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVocab.map(v => {
              const overdue = isOverdue(v);
              const nextDate = v.next_review_at ? new Date(v.next_review_at).toLocaleDateString() : 'Tomorrow';

              return (
                <div
                  key={v.id}
                  className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-5 shadow-xs hover:border-[#74A892] dark:hover:border-[#52B788] transition duration-150 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onPracticeWord(v.word)}
                            className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] hover:text-[#2D6A4F] dark:hover:text-[#52B788] transition text-left cursor-pointer underline decoration-dotted decoration-[#C5BFB3] hover:decoration-[#2D6A4F]"
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

                        <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#95D5B2] mt-0.5">
                          {v.meaning}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block ${
                          overdue
                            ? 'bg-[#FDF0ED] dark:bg-[#342421] text-[#E07A5F] border-[#F5D5CC] dark:border-[#4E342D]'
                            : 'bg-[#EFF6F1] dark:bg-[#242E27] text-[#2D6A4F] dark:text-[#84A98C] border-[#CDE1D4] dark:border-[#334237]'
                        }`}>
                          {overdue ? '⚠️ Due for recall' : `Stage ${v.review_stage}d`}
                        </span>
                        <span className="block text-[10px] text-[#8A938C] mt-1 font-mono">
                          ✓ {v.times_correct} / ✗ {v.times_incorrect}
                        </span>
                      </div>
                    </div>

                    {v.collocation_pattern && (
                      <div className="text-xs text-[#B25E00] dark:text-[#E9A825] bg-[#FAF7F2] dark:bg-[#161A17] p-2.5 rounded-xl font-mono border border-[#EBE4D7] dark:border-[#2C332E]">
                        {v.collocation_pattern}
                      </div>
                    )}

                    {v.example_workplace && (
                      <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic leading-relaxed line-clamp-2">
                        &ldquo;{v.example_workplace}&rdquo;
                      </p>
                    )}

                    {/* Word Family Form Pills */}
                    {v.word_family && v.word_family.members && v.word_family.members.length > 0 && (
                      <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2B332D] space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] block">
                          Word Family Forms:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {v.word_family.members.map((m, idx) => {
                            const formKey = m.form.toLowerCase().trim();
                            const mastery = v.word_form_mastery?.[formKey];
                            const status = mastery?.status || 'untested';

                            let badgeColor = 'bg-[#FAF7F2] text-[#5C645E] border-[#EBE4D7] dark:bg-[#161A17] dark:text-[#8A938C] dark:border-[#2C332E]';
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
                                onClick={() => onPracticeWord(m.form)}
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

                  <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2B332D] flex items-center justify-between">
                    <span className="text-[11px] text-[#8A938C]">
                      Next review: {nextDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => onPracticeWord(v.word)}
                      className="text-xs font-semibold text-[#2D6A4F] dark:text-[#52B788] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Practice forms</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
