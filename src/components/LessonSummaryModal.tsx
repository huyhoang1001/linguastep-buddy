import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sparkles,
  BookOpen,
  AlertCircle,
  Volume2,
  ThumbsUp,
  Smile,
  Frown,
  RotateCcw,
  Compass,
  Calendar,
  X,
  Coffee,
  ArrowRight
} from 'lucide-react';
import { DailySummary } from '../types/learning.ts';
import { playEnglishSpeech } from '../services/api.ts';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import { catCustomizationStore } from '../services/catCustomizationStore.ts';

interface LessonSummaryModalProps {
  summary: DailySummary;
  onClose: () => void;
  onStartNewLesson: (minutes?: number) => void;
}

export const LessonSummaryModal: React.FC<LessonSummaryModalProps> = ({
  summary,
  onClose,
  onStartNewLesson
}) => {
  const [catConfig] = useState(catCustomizationStore.getConfig());
  const [rating, setRating] = useState<'too_easy' | 'about_right' | 'too_difficult'>(
    summary.learner_rating || 'about_right'
  );
  const [nextMinutes, setNextMinutes] = useState<number>(summary.target_duration_minutes || 20);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const durationOptions = [
    { mins: 10, label: '10m', sub: 'Quick check' },
    { mins: 15, label: '15m', sub: 'Targeted' },
    { mins: 20, label: '20m', sub: 'Standard' },
    { mins: 30, label: '30m', sub: 'Deep dive' }
  ];

  const accuracyPercent = Math.round(summary.accuracy_rate * 100);
  const isHighAccuracy = accuracyPercent >= 80;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161A17]/70 backdrop-blur-sm"
    >
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] max-h-[90vh] overflow-y-auto space-y-6 relative font-sans">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white dark:bg-[#272E29] border border-[#EBE4D7] dark:border-[#364038] text-[#8A938C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] transition cursor-pointer"
          title="Close summary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Debrief Header */}
        <div className="space-y-3 pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C]">
            <span>Session #{summary.lesson_number} Debrief</span>
            <span aria-hidden="true">&middot;</span>
            <span>{new Date(summary.completed_at).toLocaleDateString()}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{summary.time_spent_minutes || summary.target_duration_minutes || 20}m logged</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight">
                Today&apos;s Field Notes
              </h2>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1 leading-relaxed">
                Objective: <span className="font-medium text-[#1B4332] dark:text-[#EAE6DF]">{summary.primary_objective}</span>
              </p>
            </div>

            {/* Subtle Cat Desk Note */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 p-2 rounded-2xl bg-white/70 dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#333D35]">
              <CatChibiAvatar
                companionId={catConfig.companionId}
                accessoryId={catConfig.accessoryId}
                mood={isHighAccuracy ? 'happy' : 'studying'}
                size="sm"
              />
              <span className="text-[11px] font-medium text-[#5C645E] dark:text-[#A7ABA4] max-w-[120px] leading-tight">
                {isHighAccuracy ? 'Sharp focus today.' : 'Solid effort. Tricky concepts.'}
              </span>
            </div>
          </div>
        </div>

        {/* Real Performance Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/80 dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#333D35] rounded-2xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A938C] dark:text-[#8E978F] block mb-0.5">Time Logged</span>
            <strong className="text-lg font-bold text-[#1B4332] dark:text-[#F4F2EC]">
              {summary.time_spent_minutes || summary.target_duration_minutes || 20}m
            </strong>
            <span className="text-[10px] text-[#8A938C] block">of {summary.target_duration_minutes || 20}m plan</span>
          </div>

          <div className="bg-white/80 dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#333D35] rounded-2xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A938C] dark:text-[#8E978F] block mb-0.5">Exercises</span>
            <strong className="text-lg font-bold text-[#2D6A4F] dark:text-[#52B788]">
              {summary.questions_answered}
            </strong>
            <span className="text-[10px] text-[#8A938C] block">
              of {summary.total_planned_questions || summary.questions_answered} completed
            </span>
          </div>

          <div className="bg-white/80 dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#333D35] rounded-2xl p-3.5 text-center">
            <span className="text-[11px] font-medium text-[#8A938C] dark:text-[#8E978F] block mb-0.5">First-Try Accuracy</span>
            <strong className="text-lg font-bold text-[#E07A5F]">
              {accuracyPercent}%
            </strong>
            <span className="text-[10px] text-[#8A938C] block">verified attempts</span>
          </div>
        </div>

        {/* Key Patterns & Anchor Points */}
        {summary.key_takeaways && summary.key_takeaways.length > 0 && (
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788]" />
              <span>Key Patterns Anchored</span>
            </span>
            <div className="space-y-2">
              {summary.key_takeaways.map((point, i) => (
                <div key={i} className="text-xs text-[#2D312E] dark:text-[#EAE6DF] flex items-start space-x-2.5 bg-white/70 dark:bg-[#242A25] p-3 rounded-2xl border border-[#EBE4D7] dark:border-[#313B33] leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* The stuff that tripped you up */}
        {summary.recurring_mistakes_flagged && summary.recurring_mistakes_flagged.length > 0 && (
          <div className="bg-[#FDF0ED] dark:bg-[#2D2320] border border-[#F5D5CC] dark:border-[#4B342E] rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-[#E07A5F]">
              <AlertCircle className="w-4 h-4" />
              <span>The stuff that tripped you up:</span>
            </div>
            <p className="text-[11px] text-[#8A938C] dark:text-[#BCA39C]">
              We&apos;ve flagged these patterns. They&apos;ll resurface naturally in future warm-ups until they feel effortless.
            </p>
            <div className="space-y-1 pt-1">
              {summary.recurring_mistakes_flagged.map((err, i) => (
                <div key={i} className="text-[#2D312E] dark:text-[#F4F2EC] flex items-start gap-1.5">
                  <span className="text-[#E07A5F] font-bold">&bull;</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Words added to stash */}
        {summary.vocabulary_learned && summary.vocabulary_learned.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#84A98C]" />
              <span>Words Added to Your Stash</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {summary.vocabulary_learned.map((wordStr, i) => {
                const cleanWord = wordStr.split(' ')[0];
                return (
                  <div
                    key={i}
                    className="flex items-center space-x-2 bg-white dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#333D35] px-3 py-1.5 rounded-xl text-xs font-medium text-[#1B4332] dark:text-[#F4F2EC]"
                  >
                    <span>{wordStr}</span>
                    <button
                      type="button"
                      onClick={() => playEnglishSpeech(cleanWord)}
                      title="Pronounce word"
                      className="p-1 rounded-md text-[#74A892] hover:text-[#1B4332] dark:hover:text-white transition cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Session Flight Plan */}
        {summary.tomorrow_plan && (
          <div className="bg-[#EFF6F1] dark:bg-[#242E27] border border-[#CDE1D4] dark:border-[#334237] rounded-2xl p-4 md:p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#CDE1D4] dark:border-[#334237] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#84A98C] flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#52B788]" />
                <span>Next Session Flight Plan</span>
              </span>
              <span className="text-[11px] font-semibold text-[#2D6A4F] dark:text-[#84A98C] bg-white/80 dark:bg-[#1C231F] border border-[#CDE1D4] dark:border-[#334237] px-2.5 py-0.5 rounded-full">
                ~{summary.tomorrow_plan.estimated_minutes || 20} mins
              </span>
            </div>

            <div>
              <h4 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-[#E07A5F] shrink-0" />
                <span>{summary.tomorrow_plan.focus_title}</span>
              </h4>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1 leading-relaxed">
                {summary.tomorrow_plan.preview_summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Review Topics */}
              {summary.tomorrow_plan.review_topics && summary.tomorrow_plan.review_topics.length > 0 && (
                <div className="bg-[#FDF0ED] dark:bg-[#2D2320] border border-[#F5D5CC] dark:border-[#4B342E] rounded-xl p-3 space-y-1.5">
                  <span className="text-[11px] font-bold text-[#E07A5F] uppercase tracking-wider flex items-center space-x-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-[#E07A5F]" />
                    <span>Scheduled Review</span>
                  </span>
                  <ul className="space-y-1 text-xs text-[#5C645E] dark:text-[#D1ABA2]">
                    {summary.tomorrow_plan.review_topics.map((rev, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-[#E07A5F] font-bold">&bull;</span>
                        <span>{rev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New Skills */}
              {summary.tomorrow_plan.new_skills && summary.tomorrow_plan.new_skills.length > 0 && (
                <div className="bg-white/80 dark:bg-[#1D2620] border border-[#CDE1D4] dark:border-[#304033] rounded-xl p-3 space-y-1.5">
                  <span className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#84A98C] uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#52B788]" />
                    <span>New Concepts Ahead</span>
                  </span>
                  <ul className="space-y-1 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                    {summary.tomorrow_plan.new_skills.map((nsk, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-[#52B788] font-bold">+</span>
                        <span>{nsk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Difficulty Calibration */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#8A938C] dark:text-[#8E978F] block mb-2">
            How was today&apos;s pacing?
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'too_easy', label: 'Breeze', icon: Smile },
              { id: 'about_right', label: 'Sweet spot', icon: ThumbsUp },
              { id: 'too_difficult', label: 'Bit of a stretch', icon: Frown }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = rating === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRating(item.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white font-bold shadow-sm'
                      : 'bg-white dark:bg-[#252C26] border-[#EBE4D7] dark:border-[#333D35] text-[#5C645E] dark:text-[#A7ABA4] hover:border-[#74A892]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Session Duration Picker */}
        <div className="bg-white/80 dark:bg-[#252C26] border border-[#EBE4D7] dark:border-[#333D35] rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C]">
              Next Session Time Budget
            </span>
            <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C] bg-[#EFF6F1] dark:bg-[#1E2721] px-2 py-0.5 rounded-lg border border-[#CDE1D4] dark:border-[#334237]">
              {nextMinutes} mins
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {durationOptions.map(opt => (
              <button
                key={opt.mins}
                type="button"
                onClick={() => setNextMinutes(opt.mins)}
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center cursor-pointer ${
                  nextMinutes === opt.mins
                    ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white font-bold shadow-sm'
                    : 'bg-[#FAF7F2] dark:bg-[#1E231F] border-[#EBE4D7] dark:border-[#333D35] text-[#5C645E] dark:text-[#A7ABA4] hover:border-[#74A892]'
                }`}
              >
                <span className="text-xs font-bold">{opt.label}</span>
                <span className={`text-[10px] ${nextMinutes === opt.mins ? 'text-[#EFF6F1]' : 'text-[#8A938C]'}`}>
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Call it a day vs Jump into next session */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EBE4D7] dark:border-[#2C332E]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 py-3 px-4 rounded-2xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] bg-white dark:bg-[#252C26] hover:bg-[#FAF7F2] text-xs font-bold border border-[#EBE4D7] dark:border-[#333D35] transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Coffee className="w-4 h-4 text-[#8A938C]" />
            <span>Call it a day &amp; return Home</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onStartNewLesson(nextMinutes);
            }}
            className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FAF7F2]" />
            <span>Start Next Session ({nextMinutes}m)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
