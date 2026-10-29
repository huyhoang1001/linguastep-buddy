import React, { useState } from 'react';
import { Volume2, CheckCircle2, Bookmark, ArrowRightLeft } from 'lucide-react';
import { VocabularyItem } from '../types/learning.ts';
import { playEnglishSpeech } from '../services/api.ts';

interface VocabularyCardProps {
  vocab: Omit<VocabularyItem, 'id' | 'review_stage' | 'next_review_at' | 'first_seen_at' | 'last_reviewed_at' | 'times_correct' | 'times_incorrect'>;
  onSavedToNotebook?: () => void;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({ vocab, onSavedToNotebook }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [saved, setSaved] = useState(false);

  const handlePronounce = () => {
    setIsPlaying(true);
    playEnglishSpeech(vocab.word);
    setTimeout(() => setIsPlaying(false), 1200);
  };

  const handleSave = () => {
    setSaved(true);
    if (onSavedToNotebook) onSavedToNotebook();
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-2xl p-5 shadow-sm mb-6 text-[#2D312E] dark:text-[#F4F2EC] font-sans">
      {/* Top row: Word, Part of speech, IPA & Play audio button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#EBE4D7] dark:border-[#2C332E]">
        <div className="flex items-center flex-wrap gap-2.5">
          <h3 className="text-2xl font-serif font-bold tracking-tight text-[#1B4332] dark:text-[#F4F2EC]">
            {vocab.word}
          </h3>
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase bg-[#EFF6F1] dark:bg-[#252F28] text-[#2D6A4F] dark:text-[#84A98C] border border-[#CDE1D4] dark:border-[#334237]">
            {vocab.part_of_speech}
          </span>
          <span className="text-xs font-mono text-[#5C645E] dark:text-[#A7ABA4]">
            {vocab.ipa}
          </span>
          <button
            type="button"
            onClick={handlePronounce}
            title="Listen to pronunciation"
            className={`p-1.5 rounded-xl transition flex items-center justify-center cursor-pointer ${
              isPlaying
                ? 'bg-[#2D6A4F] text-white animate-pulse'
                : 'bg-white dark:bg-[#272E29] hover:bg-[#EFF6F1] dark:hover:bg-[#2F3831] text-[#2D6A4F] dark:text-[#84A98C] border border-[#EBE4D7] dark:border-[#38423A]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="flex items-center space-x-1.5 text-xs text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] bg-white dark:bg-[#272E29] hover:bg-[#EFF6F1] dark:hover:bg-[#2F3831] px-3 py-1.5 rounded-xl border border-[#EBE4D7] dark:border-[#38423A] transition cursor-pointer"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />
              <span className="text-[#2D6A4F] dark:text-[#52B788] font-semibold">Saved to Stash</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-[#8A938C]" />
              <span>Save to Word Stash</span>
            </>
          )}
        </button>
      </div>

      {/* Pronunciation & Stress tip */}
      {vocab.pronunciation_tip && (
        <div className="mt-3 text-xs text-[#2D6A4F] dark:text-[#84A98C] bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#334237] px-3 py-2 rounded-xl flex items-start space-x-2">
          <span className="font-semibold shrink-0">Stress note:</span>
          <span>{vocab.pronunciation_tip}</span>
        </div>
      )}

      {/* Meaning */}
      <div className="mt-3.5">
        <span className="text-[11px] uppercase font-bold tracking-wider text-[#8A938C] dark:text-[#8E978F]">Meaning</span>
        <p className="text-sm font-medium text-[#1B4332] dark:text-[#95D5B2] mt-0.5">
          {vocab.meaning}
        </p>
      </div>

      {/* Collocation Pattern */}
      {vocab.collocation_pattern && (
        <div className="mt-3.5 bg-white/80 dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#303B32] rounded-xl p-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A938C] dark:text-[#8E978F] block mb-1">
            Common Collocation
          </span>
          <code className="text-xs font-semibold text-[#B25E00] dark:text-[#E9A825] font-mono">
            {vocab.collocation_pattern}
          </code>
        </div>
      )}

      {/* Examples: General & Workplace */}
      <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 gap-3">
        {vocab.example_general && (
          <div className="bg-white/60 dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#303932] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[#8A938C] uppercase tracking-wider block mb-1">
              Everyday Usage
            </span>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic leading-relaxed">
              &ldquo;{vocab.example_general}&rdquo;
            </p>
          </div>
        )}

        {vocab.example_workplace && (
          <div className="bg-white/60 dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#303932] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[#2D6A4F] dark:text-[#84A98C] uppercase tracking-wider block mb-1">
              Workplace Context
            </span>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic leading-relaxed">
              &ldquo;{vocab.example_workplace}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Comparison with similar word */}
      {vocab.similar_word_comparison && (
        <div className="mt-3.5 bg-[#FDF0ED] dark:bg-[#2E2421] border border-[#F5D5CC] dark:border-[#4B342E] rounded-xl p-3 text-xs text-[#5C645E] dark:text-[#D1ABA2]">
          <div className="flex items-center space-x-1.5 font-bold text-[#E07A5F] mb-1">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Nuance: {vocab.word} vs {vocab.similar_word_comparison.word}</span>
          </div>
          <p className="leading-relaxed">
            {vocab.similar_word_comparison.difference}
          </p>
        </div>
      )}
    </div>
  );
};
