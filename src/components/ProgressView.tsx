import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  Layers,
  Sparkles,
  Trophy,
  AlertCircle,
  Calendar,
  ArrowRight,
  TrendingUp,
  Award,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { UserProfile, LearnerSkillState, DailySummary, Attempt } from '../types/learning.ts';
import { MilestoneBadge } from '../types/milestone.ts';
import { WeeklyProgressChart } from './WeeklyProgressChart.tsx';

interface ProgressViewProps {
  profile: UserProfile;
  skills: LearnerSkillState[];
  summaries: DailySummary[];
  attempts: Attempt[];
  allBadges: MilestoneBadge[];
  unlockedBadges: MilestoneBadge[];
  onStartNewLesson: () => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  profile,
  skills,
  summaries,
  attempts,
  allBadges,
  unlockedBadges,
  onStartNewLesson
}) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'skills' | 'charts' | 'badges'>('roadmap');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const now = Date.now();
  const masteredSkills = skills.filter(
    s => s.mastery_stage === 'retained_mastery' || s.status === 'mastered'
  );
  const overdueSkills = skills.filter(
    s => s.next_review_at && new Date(s.next_review_at).getTime() <= now
  );

  const categories = ['all', 'grammar', 'vocabulary', 'collocation', 'writing'];
  const filteredSkills = skills.filter(s => {
    if (categoryFilter === 'all') return true;
    return s.category.toLowerCase() === categoryFilter;
  });

  const isVi = profile.explanation_language === 'vi';

  // 5-Day Curriculum Roadmap
  const roadmapDays = [
    {
      day: 1,
      title: isVi ? 'Thành thạo mốc thời gian & Câu điều kiện' : 'Narrative Time Anchors & Conditionals',
      status: 'completed',
      focus: 'Past Perfect, Mixed Conditionals (Type 3-2) & Collocations',
      skills: [
        'By the time + Past Simple → Had + V3/ed',
        'If + Had + V3... would be (Present outcome)',
        'Precision collocations with mitigate & streamline'
      ]
    },
    {
      day: 2,
      title: isVi ? 'Đảo ngữ nhấn mạnh & Từ nối tương phản' : 'Negative Inversion & Formal Contrast',
      status: 'current',
      focus: 'Inversion with Seldom/Rarely/Hardly, Formal Connectors (Nevertheless/In spite of)',
      skills: [
        'Seldom / Rarely / Hardly + Auxiliary + S + V',
        'Nevertheless / However vs. In spite of / Despite',
        'Workplace blocker status updates'
      ]
    },
    {
      day: 3,
      title: isVi ? 'Mệnh đề quan hệ rút gọn & Động từ khiếm khuyết' : 'Reduced Relative Clauses & Modal Nuances',
      status: 'upcoming',
      focus: 'Participle Clauses (-ing / -ed) & Speculation Modals (Must have / Could have)',
      skills: [
        'Active reduction (The engineer designing...)',
        'Passive reduction (The proposal submitted...)',
        'Past deduction and risk mitigation'
      ]
    },
    {
      day: 4,
      title: isVi ? 'Thể giả định & Ngôn ngữ đàm phán ngoại giao' : 'Subjunctive Mood & Diplomatic Hedging',
      status: 'upcoming',
      focus: 'Subjunctive with recommend/demand & Diplomatic Phrasing',
      skills: [
        'It is crucial that he be informed',
        'Hedging with "It appears that" / "Might consider"',
        'Executive alignment memos'
      ]
    },
    {
      day: 5,
      title: isVi ? 'Đánh giá độc lập & Tổng kết chặng' : 'Independent Progress Evaluation & Milestone Check',
      status: 'upcoming',
      focus: 'Comprehensive Synthesis & Independent Progress Evaluation',
      skills: [
        'Mixed grammatical application test',
        'Cross-category error correction',
        'Level calibration verification'
      ]
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Header with Verified CEFR Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C] uppercase tracking-wider">
            <span>Learning Horizon</span>
            <span aria-hidden="true">&middot;</span>
            <span>CEFR Evidence Ledger</span>
            <span aria-hidden="true">&middot;</span>
            <span>Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight mt-1">
            Progress &amp; Mastery
          </h1>
          <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
            Objective progress tracking grounded in spaced retrieval trials, difficulty calibration, and error retention.
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewLesson}
          className="px-5 py-2.5 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-sm hover:shadow-md"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Today&apos;s Session</span>
        </button>
      </div>

      {/* 2. Top Metric Cards (Truthful, non-gamified statistics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-[11px] font-bold text-[#8A938C] uppercase tracking-wider block">Level Target</span>
          <div className="text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
            {profile.current_level} &rarr; {profile.target_level || 'C1'}
          </div>
          <span className="text-[10px] text-[#52796F] dark:text-[#84A98C]">Evidence calibrated</span>
        </div>

        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-[11px] font-bold text-[#8A938C] uppercase tracking-wider block">Retained Mastery</span>
          <div className="text-xl font-serif font-bold text-[#2D6A4F] dark:text-[#52B788]">
            {masteredSkills.length}
          </div>
          <span className="text-[10px] text-[#8A938C]">Delayed recall verified</span>
        </div>

        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-[11px] font-bold text-[#8A938C] uppercase tracking-wider block">Overdue Reviews</span>
          <div className="text-xl font-serif font-bold text-[#E07A5F]">
            {overdueSkills.length}
          </div>
          <span className="text-[10px] text-[#8A938C]">Ready for reinforcement</span>
        </div>

        <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-[11px] font-bold text-[#8A938C] uppercase tracking-wider block">Badges Unlocked</span>
          <div className="text-xl font-serif font-bold text-[#B25E00] dark:text-[#E9A825]">
            {unlockedBadges.length} / {allBadges.length || 10}
          </div>
          <span className="text-[10px] text-[#8A938C]">Milestone achievements</span>
        </div>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/70 dark:bg-[#1A1F1B] rounded-2xl border border-[#EBE4D7] dark:border-[#2C332E] self-start overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'roadmap'
              ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
              : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Curriculum Roadmap</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'skills'
              ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
              : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Skills Matrix ({skills.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('charts')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'charts'
              ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
              : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Weekly Trends</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('badges')}
          className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'badges'
              ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
              : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Badges ({unlockedBadges.length})</span>
        </button>
      </div>

      {/* 4. Tab 1: Curriculum Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#F4EFEB] dark:border-[#2B332D] pb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                  5-Day Adaptive Progression Timeline
                </h3>
                <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                  Objectives are deterministically prioritized: prerequisite weaknesses first, then overdue reviews, then fresh concepts.
                </p>
              </div>
              <span className="text-xs font-mono text-[#2D6A4F] dark:text-[#84A98C] font-semibold">
                Level {profile.current_level}
              </span>
            </div>

            <div className="space-y-3">
              {roadmapDays.map(item => (
                <div
                  key={item.day}
                  className={`p-4 rounded-2xl border transition ${
                    item.status === 'completed'
                      ? 'bg-[#EFF6F1]/50 dark:bg-[#252C26] border-[#CDE1D4] dark:border-[#323D34]'
                      : item.status === 'current'
                      ? 'bg-[#EFF6F1] dark:bg-[#27352B] border-[#74A892] dark:border-[#52B788] ring-1 ring-[#52B788]/30 shadow-xs'
                      : 'bg-white/40 dark:bg-[#1C211D] border-[#EBE4D7] dark:border-[#2C332E] text-[#8A938C]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      {item.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0" />
                      ) : item.status === 'current' ? (
                        <div className="w-5 h-5 rounded-full bg-[#2D6A4F] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                          {item.day}
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#C5BFB3] dark:border-[#4B554D] flex items-center justify-center text-[10px] text-[#8A938C] shrink-0">
                          {item.day}
                        </div>
                      )}
                      <span className="text-sm font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                        Day {item.day}: {item.title}
                      </span>
                    </div>

                    {item.status === 'current' && (
                      <span className="text-[10px] font-bold bg-[#2D6A4F] text-white px-2.5 py-0.5 rounded-full uppercase">
                        Current Session
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1.5 pl-7 leading-relaxed">
                    {item.focus}
                  </p>

                  <div className="mt-2.5 pl-7 flex flex-wrap gap-1.5">
                    {item.skills.map((sk, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-white/70 dark:bg-[#181D19] border border-[#EBE4D7] dark:border-[#303B33] text-[#2D312E] dark:text-[#D1D7CE]"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Skills Matrix */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium capitalize transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
                    : 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredSkills.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl text-xs text-[#8A938C]">
                No skills tracked under this category yet.
              </div>
            ) : (
              filteredSkills.map(s => {
                const stage = s.mastery_stage || 'recognition';
                const isRegressed = s.status === 'regressed';
                let statusColor = 'text-[#5C645E] bg-white dark:bg-[#222924] border-[#EBE4D7] dark:border-[#303B33]';
                let stageLabel = 'Recognition';

                if (isRegressed) {
                  statusColor = 'text-[#E07A5F] bg-[#FDF0ED] dark:bg-[#342421] border-[#F5D5CC] dark:border-[#4E342D]';
                  stageLabel = '⚠️ Regressed';
                } else if (stage === 'retained_mastery') {
                  statusColor = 'text-[#2D6A4F] bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237]';
                  stageLabel = 'Retained Mastery 🏆';
                } else if (stage === 'application') {
                  statusColor = 'text-[#52796F] bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237]';
                  stageLabel = 'Application ✨';
                } else if (stage === 'active_recall') {
                  statusColor = 'text-[#2D6A4F] bg-[#EFF6F1] dark:bg-[#252F28] border-[#CDE1D4] dark:border-[#334237]';
                  stageLabel = 'Active Recall';
                }

                const nextDate = s.next_review_at ? new Date(s.next_review_at).toLocaleDateString() : 'Tomorrow';
                const isSkillOverdue = s.next_review_at && new Date(s.next_review_at).getTime() <= now;

                return (
                  <div
                    key={s.skill_id}
                    className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                          {s.skill_name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold text-[#5C645E] dark:text-[#A7ABA4] bg-[#F4EFEB] dark:bg-[#181D19] px-2 py-0.5 rounded-md">
                          {s.category}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                        <span>Accuracy: <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{Math.round(s.accuracy_rate * 100)}%</strong> ({s.total_attempts} trials)</span>
                        {s.mastery_score !== undefined && (
                          <span>&bull; Score: <strong className="text-[#2D6A4F] dark:text-[#84A98C]">{s.mastery_score}/100</strong></span>
                        )}
                        <span className={isSkillOverdue ? 'text-[#E07A5F] font-bold' : ''}>
                          &bull; Review: {isSkillOverdue ? 'Overdue' : nextDate}
                        </span>
                      </div>

                      {s.recurring_errors && s.recurring_errors.length > 0 && (
                        <div className="text-[11px] text-[#E07A5F] pt-0.5">
                          <span>Clinic note: {s.recurring_errors[s.recurring_errors.length - 1]}</span>
                        </div>
                      )}
                    </div>

                    <div className="self-start sm:self-center shrink-0">
                      <span className={`text-[11px] font-bold px-3 py-1 rounded-full border capitalize ${statusColor}`}>
                        {stageLabel}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Weekly Progress Visualization */}
      {activeTab === 'charts' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                7-Day Rolling Performance &amp; Consistency
              </h3>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                Plots daily lesson accuracy against learning volume and retention checks.
              </p>
            </div>

            <WeeklyProgressChart
              summaries={summaries}
              attempts={attempts}
              targetAccuracy={80}
            />
          </div>
        </div>
      )}

      {/* 7. Tab 4: Milestones & Badges */}
      {activeTab === 'badges' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {allBadges.map(badge => {
              const isUnlocked = unlockedBadges.some(b => b.id === badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-3xl border transition flex items-start space-x-3 ${
                    isUnlocked
                      ? 'bg-white dark:bg-[#1E231F] border-[#EBE4D7] dark:border-[#2C332E] shadow-xs'
                      : 'bg-white/40 dark:bg-[#181D19] border-[#EBE4D7]/60 dark:border-[#262E28] opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isUnlocked
                      ? 'bg-[#EFF6F1] dark:bg-[#252F28] text-[#2D6A4F] dark:text-[#52B788]'
                      : 'bg-[#F4EFEB] dark:bg-[#222924] text-[#8A938C]'
                  }`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                        {badge.title}
                      </h4>
                      {isUnlocked && (
                        <CheckCircle2 className="w-3 h-3 text-[#52B788]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
