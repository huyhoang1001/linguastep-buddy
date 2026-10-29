import React, { useState, useMemo } from 'react';
import {
  Volume2,
  Search,
  Sparkles,
  Download,
  Upload,
  ArrowRight
} from 'lucide-react';
import { VocabularyItem } from '../types/learning.ts';
import { playEnglishSpeech, exportMemory, importMemory, validateImportData } from '../services/api.ts';
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';
import { AppButton, InfoCard, FilterChip, StatusBadge, IconButton, ActionChip, InteractiveCard } from './ui/index.ts';

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

  const filteredVocab: VocabularyItem[] = useMemo(() => {
    const list = vocabulary.filter(v => {
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

    const seenKeys = new Set<string>();
    return list.filter(v => {
      const key = (v.id || v.word || '').toLowerCase();
      if (!key || seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
  }, [vocabulary, searchQuery, vocabFilter]);

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
          <div className="flex items-center gap-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C]">
            <span>Vocabulary Deck</span>
            <span aria-hidden="true">&middot;</span>
            <span>Spaced review</span>
            <span aria-hidden="true">&middot;</span>
            <span>Word families</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight mt-1">
            Word Stash
          </h1>
          <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
            Your personal vocabulary collection, organized by spaced repetition intervals and derivational forms.
          </p>
        </div>

        {/* Quick Ledger Actions */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <AppButton
            variant="outline"
            size="sm"
            onClick={handleExport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export
          </AppButton>

          <label className="inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] text-xs px-3 py-1.5 min-h-[36px] gap-1.5 bg-transparent text-[#2D312E] dark:text-[#F4F2EC] border border-[#D8CFBF] dark:border-[#3C443E] hover:bg-[#FAF7F2] dark:hover:bg-[#262F28]">
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
      <InfoCard className="p-5 shadow-sm space-y-3">
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
      </InfoCard>

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
            <FilterChip
              selected={vocabFilter === 'all'}
              onClick={() => setVocabFilter('all')}
              count={vocabulary.length}
            >
              All
            </FilterChip>

            <FilterChip
              selected={vocabFilter === 'due'}
              onClick={() => setVocabFilter('due')}
              count={overdueCount}
            >
              Due for Recall
            </FilterChip>

            <FilterChip
              selected={vocabFilter === 'solid'}
              onClick={() => setVocabFilter('solid')}
              count={solidCount}
            >
              Solidified
            </FilterChip>

            <FilterChip
              selected={vocabFilter === 'families'}
              onClick={() => setVocabFilter('families')}
              count={familiesCount}
            >
              Word Families
            </FilterChip>
          </div>
        </div>

        {/* 4. Word Cards Grid */}
        {vocabulary.length === 0 ? (
          <InfoCard className="text-center py-16 px-4 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6F1] dark:bg-[#28352C] flex items-center justify-center text-3xl mx-auto">
              🧺
            </div>
            <h3 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
              Your word stash is looking empty
            </h3>
            <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] max-w-md mx-auto leading-relaxed">
              Words you explore in the search box above or encounter during your daily lessons will automatically gather here with spaced-retention schedules.
            </p>
          </InfoCard>
        ) : filteredVocab.length === 0 ? (
          <InfoCard className="text-center py-12 px-4 space-y-2">
            <p className="text-sm font-semibold text-[#1B4332] dark:text-[#F4F2EC]">
              No words match that filter
            </p>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
              You&apos;re either all caught up on scheduled reviews or no saved words match your search.
            </p>
          </InfoCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVocab.map((v: VocabularyItem, idx: number) => {
              const overdue = isOverdue(v);

              return (
                <InteractiveCard
                  key={v.id ? `${v.id}-${idx}` : `${v.word}-${idx}`}
                  onClick={() => onPracticeWord(v.word)}
                  className="p-5 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                            {v.word}
                          </span>

                          <StatusBadge variant="neutral">
                            {v.part_of_speech}
                          </StatusBadge>

                          <span className="text-xs font-mono text-[#5C645E] dark:text-[#A7ABA4]">
                            {v.ipa}
                          </span>

                          <IconButton
                            icon={<Volume2 className="w-3.5 h-3.5" />}
                            ariaLabel={`Pronounce ${v.word}`}
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              playEnglishSpeech(v.word);
                            }}
                          />
                        </div>

                        <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#95D5B2] mt-0.5">
                          {v.meaning}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <StatusBadge variant={overdue ? 'accent' : 'success'}>
                          {overdue ? '⚠️ Due for recall' : `Stage ${v.review_stage}d`}
                        </StatusBadge>
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
                          {v.word_family.members.map((m: any, idx: number) => (
                            <ActionChip
                              key={idx}
                              variant="subtle"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPracticeWord(m.form);
                              }}
                            >
                              <span className="font-semibold">{m.form}</span>
                              <span className="text-[9px] opacity-75">({m.part_of_speech.slice(0, 4)})</span>
                            </ActionChip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#2B332D] flex items-center justify-between text-xs text-[#52796F] dark:text-[#84A98C]">
                    <span className="font-medium">Practice Micro-Exam</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </InteractiveCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
