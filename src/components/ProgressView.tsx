import React, { useState } from 'react';
import {
  Compass,
  Layers,
  Sparkles,
  Trophy,
  TrendingUp
} from 'lucide-react';
import {
  UserProfile,
  LearnerSkillState,
  DailySummary,
  Attempt,
  CurriculumRoadmap
} from '../types/learning.ts';
import { MilestoneBadge } from '../types/milestone.ts';
import { WeeklyProgressChart } from './WeeklyProgressChart.tsx';
import { AppButton, InfoCard, FilterChip, StatusBadge, InteractiveCard } from './ui/index.ts';
import { getCurriculumRoadmap, advanceRoadmapMilestone } from '../services/api.ts';

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
  const [roadmap, setRoadmap] = useState<CurriculumRoadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);

  React.useEffect(() => {
    loadRoadmap();
  }, [profile.id, skills.length]);

  const loadRoadmap = async () => {
    try {
      setIsLoadingRoadmap(true);
      const rm = await getCurriculumRoadmap();
      setRoadmap(rm);
    } catch (err) {
      console.warn('[ProgressView] Failed to load roadmap:', err);
    } finally {
      setIsLoadingRoadmap(false);
    }
  };

  const handleAdvanceMilestone = async (milestoneId: string) => {
    try {
      const updated = await advanceRoadmapMilestone(milestoneId);
      if (updated) setRoadmap(updated);
    } catch (err) {
      console.warn('[ProgressView] Failed to advance milestone:', err);
    }
  };

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* 1. Header with Verified CEFR Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C]">
            <span>Your learning path</span>
            <span aria-hidden="true">&middot;</span>
            <span>Skill breakdown</span>
            <span aria-hidden="true">&middot;</span>
            <span>Milestones</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight mt-1">
            Your progress
          </h1>
          <p className="text-xs sm:text-sm text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
            Track your skill retention, active learning path, and milestone badges over time.
          </p>
        </div>

        <AppButton
          variant="primary"
          onClick={onStartNewLesson}
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          className="self-start sm:self-auto"
        >
          Launch Today&apos;s Session
        </AppButton>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <InfoCard className="p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-xs font-semibold text-[#8A938C] block">Target level</span>
          <div className="text-xl font-bold text-[#1B4332] dark:text-[#F4F2EC]">
            {profile.current_level} &rarr; {profile.target_level || 'C1'}
          </div>
          <span className="text-[10px] text-[#52796F] dark:text-[#84A98C]">CEFR progression</span>
        </InfoCard>

        <InfoCard className="p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-xs font-semibold text-[#8A938C] block">Skills retained</span>
          <div className="text-xl font-bold text-[#2D6A4F] dark:text-[#52B788]">
            {masteredSkills.length}
          </div>
          <span className="text-[10px] text-[#8A938C]">Verified in practice</span>
        </InfoCard>

        <InfoCard className="p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-xs font-semibold text-[#8A938C] block">Reviews due</span>
          <div className="text-xl font-bold text-[#E07A5F]">
            {overdueSkills.length}
          </div>
          <span className="text-[10px] text-[#8A938C]">Ready for review</span>
        </InfoCard>

        <InfoCard className="p-4 text-center space-y-0.5 shadow-xs">
          <span className="text-xs font-semibold text-[#8A938C] block">Milestone badges</span>
          <div className="text-xl font-bold text-[#B25E00] dark:text-[#E9A825]">
            {unlockedBadges.length} / {allBadges.length || 10}
          </div>
          <span className="text-[10px] text-[#8A938C]">Achievements</span>
        </InfoCard>
      </div>

      {/* 3. Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/70 dark:bg-[#1A1F1B] rounded-2xl border border-[#EBE4D7] dark:border-[#2C332E] self-start overflow-x-auto text-xs">
        <FilterChip
          selected={activeTab === 'roadmap'}
          onClick={() => setActiveTab('roadmap')}
        >
          <Compass className="w-3.5 h-3.5 inline mr-1" />
          Curriculum Roadmap
        </FilterChip>

        <FilterChip
          selected={activeTab === 'skills'}
          onClick={() => setActiveTab('skills')}
          count={skills.length}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1" />
          Skills Matrix
        </FilterChip>

        <FilterChip
          selected={activeTab === 'charts'}
          onClick={() => setActiveTab('charts')}
        >
          <TrendingUp className="w-3.5 h-3.5 inline mr-1" />
          Weekly Trends
        </FilterChip>

        <FilterChip
          selected={activeTab === 'badges'}
          onClick={() => setActiveTab('badges')}
          count={unlockedBadges.length}
        >
          <Trophy className="w-3.5 h-3.5 inline mr-1" />
          Badges
        </FilterChip>
      </div>

      {/* 4. Tab 1: Curriculum Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4">
          <InfoCard className="p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F4EFEB] dark:border-[#2B332D] pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                    {isVi ? 'Lộ trình học cá nhân hóa' : 'Personalized Curriculum Roadmap'}
                  </h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/25 text-[#2D6A4F] dark:text-[#74A892] font-semibold border border-[#2D6A4F]/20">
                    {profile.primary_goal === 'conversation' ? (isVi ? 'Giao tiếp & Đời sống' : 'Social & Conversation') :
                     profile.primary_goal === 'workplace_tech' ? (isVi ? 'Kỹ thuật & Công việc' : 'Tech & Workplace') :
                     profile.primary_goal === 'exam' ? (isVi ? 'Luyện thi & Đọc viết' : 'Exam & Academic') : (isVi ? 'Toàn diện' : 'Balanced')}
                  </span>
                </div>
                <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                  <strong>{isVi ? 'Mục tiêu của bạn:' : 'Your Goal:'}</strong> {roadmap?.goal_summary || profile.goal_summary || 'Authentic communicative fluency'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge variant="info">
                  {profile.assessed_overall_level ? (isVi ? `Đã chuẩn đoán: ${profile.assessed_overall_level}` : `Assessed: ${profile.assessed_overall_level}`) : `Level ${profile.current_level}`} → {profile.target_level || 'C1'}
                </StatusBadge>
              </div>
            </div>

            {/* Milestones List */}
            <div className="space-y-3">
              {roadmap && roadmap.milestones && roadmap.milestones.length > 0 ? (
                roadmap.milestones.map((m) => {
                  const isActive = m.status === 'in_progress' || m.milestone_id === roadmap.current_milestone_id;
                  const isCompleted = m.status === 'completed';
                  const allSkillsMastered = m.required_skills && m.required_skills.length > 0 &&
                    m.required_skills.every(s => s.is_mastered);

                  return (
                    <div
                      key={m.milestone_id}
                      className={`p-4 rounded-2xl border transition ${
                        isCompleted
                          ? 'bg-[#EFF6F1] dark:bg-[#202B24] border-[#CDE1D4] dark:border-[#334237]'
                          : isActive
                          ? 'bg-white dark:bg-[#242C26] border-2 border-[#2D6A4F] dark:border-[#52B788] shadow-xs'
                          : 'bg-[#FAF7F2] dark:bg-[#1A1F1B] border-[#EBE4D7] dark:border-[#2C332E] opacity-75'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isCompleted
                              ? 'bg-[#2D6A4F] text-white'
                              : isActive
                              ? 'bg-[#52B788] text-[#0F291E]'
                              : 'bg-[#EAE4D7] dark:bg-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
                          }`}>
                            {isCompleted ? '✓' : m.order}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                                {isVi ? `Chặng ${m.order}: ${m.title}` : `Milestone ${m.order}: ${m.title}`}
                              </h4>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#EBE4D7]/50 dark:bg-[#2C332E] text-[#52796F] dark:text-[#84A98C]">
                                Target: {m.target_cefr}
                              </span>
                            </div>
                            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                              {m.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <StatusBadge variant={isCompleted ? 'success' : isActive ? 'info' : 'neutral'}>
                            {isCompleted ? (isVi ? '✓ Hoàn thành' : '✓ Completed') : isActive ? (isVi ? 'Đang học' : 'Active Focus') : (isVi ? 'Đang khóa' : 'Locked')}
                          </StatusBadge>
                          {isActive && (
                            <AppButton
                              size="sm"
                              variant="primary"
                              onClick={onStartNewLesson}
                              leftIcon={<Sparkles className="w-3 h-3" />}
                            >
                              {isVi ? 'Học chặng này' : 'Practice Now'}
                            </AppButton>
                          )}
                          {isActive && allSkillsMastered && (
                            <AppButton
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAdvanceMilestone(m.milestone_id)}
                            >
                              {isVi ? 'Mở khóa chặng sau' : 'Unlock Next'}
                            </AppButton>
                          )}
                        </div>
                      </div>

                      {/* Real-world communicative outcome */}
                      {m.real_world_task && (
                        <div className="mt-3 p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1E2420] border border-[#EBE4D7]/70 dark:border-[#2C332E] text-xs text-[#1B4332] dark:text-[#E8F0EA]">
                          <strong className="text-[#2D6A4F] dark:text-[#52B788]">{isVi ? '🎯 Kết quả thực tế đạt được: ' : '🎯 Real-World Outcome: '}</strong>
                          {m.real_world_task}
                        </div>
                      )}

                      {/* Required skills breakdown */}
                      <div className="mt-3 pt-2.5 border-t border-[#EBE4D7]/60 dark:border-[#2C332E] space-y-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8A938C] block">
                          {isVi ? 'Kỹ năng cần đạt được:' : 'Target Skills Required:'}
                        </span>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {m.required_skills.map((skill) => (
                            <span
                              key={skill.skill_id}
                              className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 ${
                                skill.is_mastered
                                  ? 'bg-[#EFF6F1] dark:bg-[#202B24] border-[#A3D9B5] text-[#2D6A4F] dark:text-[#74A892] font-semibold'
                                  : 'bg-white/70 dark:bg-[#161A17] border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4]'
                              }`}
                            >
                              <span>{skill.is_mastered ? '✓' : '○'}</span>
                              <span>{skill.name}</span>
                              <span className="text-[10px] opacity-75 font-mono">
                                ({skill.mastery_requirement})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-[#8A938C]">
                  {isLoadingRoadmap ? 'Loading personalized roadmap...' : 'No roadmap generated yet. Complete discovery or diagnostic to build your pathway.'}
                </div>
              )}
            </div>
          </InfoCard>
        </div>
      )}

      {/* 5. Tab 2: Skills Matrix */}
      {activeTab === 'skills' && (
        <div className="space-y-4">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {categories.map(cat => (
              <FilterChip
                key={cat}
                selected={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </FilterChip>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map(s => {
              const isOverdue = s.next_review_at && new Date(s.next_review_at).getTime() <= now;
              const stage = s.mastery_stage || 'exposure';

              return (
                <InfoCard key={s.skill_id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                        {s.skill_name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#52796F] dark:text-[#84A98C] uppercase">
                        {s.category}
                      </span>
                    </div>

                    <StatusBadge variant={isOverdue ? 'accent' : stage === 'retained_mastery' ? 'success' : 'neutral'}>
                      {isOverdue ? 'Review Due' : stage}
                    </StatusBadge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">
                      <span>Mastery Score</span>
                      <span className="font-bold">{s.mastery_score || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EAE4D7] dark:bg-[#2C332E] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2D6A4F] dark:bg-[#52B788] transition-all duration-300"
                        style={{ width: `${s.mastery_score || 0}%` }}
                      />
                    </div>
                  </div>

                  {s.recurring_errors && s.recurring_errors.length > 0 && (
                    <div className="text-[11px] text-[#E07A5F] bg-[#FDF0ED] dark:bg-[#2E2421] p-2 rounded-xl border border-[#F5D5CC] dark:border-[#4B342E]">
                      ⚠️ Note: {s.recurring_errors[0]}
                    </div>
                  )}
                </InfoCard>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Weekly Trends Chart */}
      {activeTab === 'charts' && (
        <InfoCard className="p-6 shadow-sm space-y-4">
          <div className="border-b border-[#F4EFEB] dark:border-[#2B332D] pb-3">
            <h3 className="text-base font-bold text-[#1B4332] dark:text-[#F4F2EC]">
              7-Day Performance Window
            </h3>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
              Daily study duration, accuracy trends, and exercise completion metrics.
            </p>
          </div>

          <WeeklyProgressChart summaries={summaries} attempts={attempts} />
        </InfoCard>
      )}

      {/* 7. Tab 4: Milestone Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {allBadges.map(badge => {
            const isUnlocked = unlockedBadges.some(b => b.id === badge.id);

            return (
              <InteractiveCard
                key={badge.id}
                className={`p-4 space-y-2 ${!isUnlocked ? 'opacity-60 grayscale' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#354539] flex items-center justify-center text-xl shrink-0">
                    {badge.icon || '🏅'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                      {badge.title}
                    </h4>
                    <StatusBadge variant={isUnlocked ? 'success' : 'neutral'}>
                      {isUnlocked ? 'Unlocked' : 'Locked'}
                    </StatusBadge>
                  </div>
                </div>
                <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                  {badge.description}
                </p>
              </InteractiveCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
