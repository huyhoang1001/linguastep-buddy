import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Sparkles,
  BookOpen,
  AlertCircle,
  ArrowRight,
  Volume2,
  ThumbsUp,
  Smile,
  Frown,
  RotateCcw,
  Compass,
  Calendar
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

  const durationOptions = [
    { mins: 10, label: '10m', sub: '8 Qs' },
    { mins: 15, label: '15m', sub: '12 Qs' },
    { mins: 20, label: '20m', sub: '15 Qs' },
    { mins: 25, label: '25m', sub: '19 Qs' },
    { mins: 30, label: '30m', sub: '23 Qs' },
    { mins: 35, label: '35m', sub: '27 Qs' },
    { mins: 45, label: '45m', sub: '34 Qs' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Celebration Header */}
        <div className="text-center pb-4 border-b border-slate-800 space-y-2">
          <div className="flex justify-center items-center space-x-3 mb-1">
            <CatChibiAvatar
              companionId={catConfig.companionId}
              accessoryId={catConfig.accessoryId}
              mood="happy"
              size="md"
            />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-3 py-0.5 rounded-full border border-amber-400/40">
            🐾 {catConfig.catName} Chúc Mừng Bạn Đã Hoàn Thành! 🐟
          </span>
          <h2 className="text-2xl font-black text-white">Daily Session Complete! 🏆</h2>
          <p className="text-xs text-slate-400">
            Lesson #{summary.lesson_number} • {new Date(summary.completed_at).toLocaleDateString()} • {summary.time_spent_minutes || summary.target_duration_minutes || 20}m đã học hôm nay
          </p>
        </div>

        {/* Primary Objective */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            Today's Focus
          </span>
          <p className="text-sm font-semibold text-white">
            {summary.primary_objective}
          </p>
        </div>

        {/* Session Pace Badge */}
        <div className="flex items-center justify-center">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
            summary.session_pace_mode === 'quick_10' || summary.target_duration_minutes === 10
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : summary.session_pace_mode === 'deep_30' || summary.target_duration_minutes === 30
              ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
          }`}>
            {summary.session_pace_mode === 'quick_10' || summary.target_duration_minutes === 10
              ? '⚡ Quick Practice Session (10 Mins)'
              : summary.session_pace_mode === 'deep_30' || summary.target_duration_minutes === 30
              ? '🔬 Deep Practice Session (30 Mins)'
              : '🎯 Standard Practice Session (20 Mins)'}
          </span>
        </div>

        {/* Score & Time & Questions */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Time Spent</span>
            <strong className="text-base font-bold text-amber-300">
              {summary.time_spent_minutes || summary.target_duration_minutes || 20}m
            </strong>
            <span className="text-[10px] text-slate-500 block">/ {summary.target_duration_minutes || 20}m target</span>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Questions</span>
            <strong className="text-base font-bold text-emerald-400">
              {summary.questions_answered}
            </strong>
            <span className="text-[10px] text-slate-500 block">
              / {summary.total_planned_questions || summary.questions_answered} planned
            </span>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-[11px] text-slate-400 block mb-0.5">Accuracy</span>
            <strong className="text-base font-bold text-sky-400">
              {Math.round(summary.accuracy_rate * 100)}%
            </strong>
            <span className="text-[10px] text-slate-500 block">first attempt</span>
          </div>
        </div>

        {/* Key Takeaways */}
        {summary.key_takeaways && summary.key_takeaways.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Key Patterns & Takeaways</span>
            </span>
            <ul className="space-y-2">
              {summary.key_takeaways.map((point, i) => (
                <li key={i} className="text-xs md:text-sm text-slate-200 flex items-start space-x-2.5 bg-slate-800/30 p-2.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Vocabulary learned with IPA & audio */}
        {summary.vocabulary_learned && summary.vocabulary_learned.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vocabulary Practiced Today</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {summary.vocabulary_learned.map((wordStr, i) => {
                const cleanWord = wordStr.split(' ')[0];
                return (
                  <div
                    key={i}
                    className="flex items-center space-x-2 bg-indigo-950/40 border border-indigo-800/40 px-3 py-1.5 rounded-xl text-xs font-medium text-indigo-200"
                  >
                    <span>{wordStr}</span>
                    <button
                      onClick={() => playEnglishSpeech(cleanWord)}
                      title="Pronounce word"
                      className="p-1 rounded-md hover:bg-indigo-800/50 text-indigo-400 hover:text-white"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recurring mistakes flagged */}
        {summary.recurring_mistakes_flagged && summary.recurring_mistakes_flagged.length > 0 && (
          <div className="bg-rose-950/20 border border-rose-800/30 rounded-2xl p-4 text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4" />
              <span>Keep In Mind for Next Sessions:</span>
            </div>
            {summary.recurring_mistakes_flagged.map((err, i) => (
              <p key={i} className="text-slate-300">
                • {err}
              </p>
            ))}
          </div>
        )}

        {/* Tomorrow's Plan & Preview Section */}
        {summary.tomorrow_plan && (
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-700/50 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-indigo-800/40 pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                <span>Plan for Tomorrow's Session</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-900/60 border border-indigo-700/50 px-2.5 py-0.5 rounded-full">
                ~{summary.tomorrow_plan.estimated_minutes || 20} mins
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{summary.tomorrow_plan.focus_title}</span>
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {summary.tomorrow_plan.preview_summary}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Review Topics */}
              {summary.tomorrow_plan.review_topics && summary.tomorrow_plan.review_topics.length > 0 && (
                <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-3 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>What We'll Review Tomorrow</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {summary.tomorrow_plan.review_topics.map((rev, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{rev}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New Skills */}
              {summary.tomorrow_plan.new_skills && summary.tomorrow_plan.new_skills.length > 0 && (
                <div className="bg-slate-900/80 border border-emerald-900/40 rounded-xl p-3 space-y-1.5">
                  <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>New Concepts & Skills</span>
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {summary.tomorrow_plan.new_skills.map((nsk, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-emerald-400 font-bold">+</span>
                        <span>{nsk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Difficulty Feedback Rating */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
            How was today's difficulty?
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'too_easy', label: 'Too Easy', icon: Smile },
              { id: 'about_right', label: 'About Right', icon: ThumbsUp },
              { id: 'too_difficult', label: 'Too Difficult', icon: Frown }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = rating === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setRating(item.id as any)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
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
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Set Next Session Duration
            </span>
            <span className="text-xs font-bold text-white bg-indigo-600/80 px-2 py-0.5 rounded-lg border border-indigo-500/40">
              {nextMinutes} mins
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {durationOptions.map(opt => (
              <button
                key={opt.mins}
                type="button"
                onClick={() => setNextMinutes(opt.mins)}
                className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center ${
                  nextMinutes === opt.mins
                    ? 'bg-indigo-600 border-indigo-400 text-white font-bold shadow-md'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-xs">{opt.label}</span>
                <span className={`text-[10px] ${nextMinutes === opt.mins ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {opt.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons: Take a Break vs Continue Studying */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 py-3 px-4 rounded-2xl text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 text-xs font-bold border border-slate-700 transition flex items-center justify-center space-x-2 shadow-sm"
          >
            <span className="text-base">😴</span>
            <span>Nghỉ Ngơi & Mai Tiếp Tục 🐾</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartNewLesson(nextMinutes);
            }}
            className="w-full sm:w-1/2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Học Tiếp Session Mới ({nextMinutes}m) 🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
};
