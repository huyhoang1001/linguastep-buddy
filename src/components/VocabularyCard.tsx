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
    <div className="bg-slate-900/90 border border-indigo-900/40 rounded-2xl p-5 shadow-lg backdrop-blur mb-6 text-slate-100">
      {/* Top row: Word, Part of speech, IPA & Play audio button */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <h3 className="text-2xl font-bold tracking-tight text-white">
            {vocab.word}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {vocab.part_of_speech}
          </span>
          <span className="text-sm font-mono text-slate-400">
            {vocab.ipa}
          </span>
          <button
            onClick={handlePronounce}
            title="Listen to pronunciation (browser synthesizer)"
            className={`p-2 rounded-xl transition flex items-center justify-center ${
              isPlaying
                ? 'bg-indigo-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-white border border-slate-700'
            }`}
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Saved to Notebook</span>
            </>
          ) : (
            <>
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
              <span>Save to Memory</span>
            </>
          )}
        </button>
      </div>

      {/* Pronunciation & Stress tip */}
      {vocab.pronunciation_tip && (
        <div className="mt-3.5 text-xs text-sky-300/90 bg-sky-950/40 border border-sky-800/30 px-3 py-2 rounded-xl flex items-start space-x-2">
          <span className="font-semibold text-sky-400 shrink-0">Stress / IPA Tip:</span>
          <span>{vocab.pronunciation_tip}</span>
        </div>
      )}

      {/* Meaning in Vietnamese */}
      <div className="mt-4">
        <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Meaning</span>
        <p className="text-base font-medium text-emerald-300 mt-0.5">
          {vocab.meaning}
        </p>
      </div>

      {/* Collocation Pattern */}
      {vocab.collocation_pattern && (
        <div className="mt-4 bg-slate-800/60 border border-slate-700/60 rounded-xl p-3">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-1">
            Common Collocation Pattern
          </span>
          <code className="text-sm font-semibold text-amber-300 font-mono">
            {vocab.collocation_pattern}
          </code>
        </div>
      )}

      {/* Examples: General & Workplace */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {vocab.example_general && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Everyday Example
            </span>
            <p className="text-sm text-slate-200 italic">
              "{vocab.example_general}"
            </p>
          </div>
        )}

        {vocab.example_workplace && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3">
            <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
              Workplace / Tech Example
            </span>
            <p className="text-sm text-slate-200 italic">
              "{vocab.example_workplace}"
            </p>
          </div>
        )}
      </div>

      {/* Comparison with similar word */}
      {vocab.similar_word_comparison && (
        <div className="mt-4 bg-amber-950/30 border border-amber-800/30 rounded-xl p-3 text-xs text-amber-200/90">
          <div className="flex items-center space-x-1.5 font-bold text-amber-400 mb-1">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Comparison: {vocab.word} vs {vocab.similar_word_comparison.word}</span>
          </div>
          <p className="text-slate-300">
            {vocab.similar_word_comparison.difference}
          </p>
        </div>
      )}
    </div>
  );
};
