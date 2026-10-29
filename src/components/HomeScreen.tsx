import React, { useState } from 'react';
import {
  Play,
  Sparkles,
  BookOpen,
  Brain,
  Compass,
  Trophy,
  Volume2,
  Clock,
  Flame,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Sliders,
  Cat
} from 'lucide-react';
import { UserProfile, LessonPlan, DailySummary, VocabularyItem, LearnerSkillState } from '../types/learning.ts';
import { CatCustomizationConfig, CAT_COMPANIONS, CatMood } from '../types/catTheme.ts';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import { playPurrSound } from '../services/catSoundService.ts';
import { playEnglishSpeech } from '../services/api.ts';

interface HomeScreenProps {
  profile: UserProfile;
  activePlan: LessonPlan | null;
  dailySummaries: DailySummary[];
  skills: LearnerSkillState[];
  vocabulary: VocabularyItem[];
  catConfig: CatCustomizationConfig;
  onStartLesson: (minutes?: number) => void;
  onResumeLesson: () => void;
  onOpenRoadmap: () => void;
  onOpenMemory: () => void;
  onOpenMilestones: () => void;
  onOpenCatStudio: () => void;
  onOpenCatalog: () => void;
  onOpenSettings: () => void;
  onPracticeWord?: (word: string) => void;
  isBuildingSession: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  activePlan,
  dailySummaries,
  skills,
  vocabulary,
  catConfig,
  onStartLesson,
  onResumeLesson,
  onOpenRoadmap,
  onOpenMemory,
  onOpenMilestones,
  onOpenCatStudio,
  onOpenCatalog,
  onOpenSettings,
  onPracticeWord,
  isBuildingSession
}) => {
  const [selectedPace, setSelectedPace] = useState<10 | 20 | 30>(
    (profile.daily_minutes === 10 || profile.daily_minutes === 30) ? profile.daily_minutes : 20
  );
  const [catMood, setCatMood] = useState<CatMood>('studying');
  const [catBubble, setCatBubble] = useState<string>('');
  const [isPetting, setIsPetting] = useState<boolean>(false);

  const companion = CAT_COMPANIONS[catConfig.companionId] || CAT_COMPANIONS.mochi;

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Identify overdue skills for quick review highlight
  const nowTime = Date.now();
  const overdueSkills = skills.filter(
    s => s.next_review_at && new Date(s.next_review_at).getTime() <= nowTime
  );

  // High-impact word of the day from vocabulary list or default
  const wordOfTheDay = vocabulary.length > 0 ? vocabulary[0] : null;

  // Solidified skills count
  const masteredSkillsCount = skills.filter(
    s => s.mastery_stage === 'retained_mastery' || s.status === 'mastered'
  ).length;

  const handlePetCompanion = () => {
    setIsPetting(true);
    setCatMood('purring');
    if (catConfig.soundEnabled) {
      playPurrSound();
    }

    const tips = [
      `*Purrrr~* ${catConfig.catName} is curled up ready to study with you! 🐾`,
      'A quiet 15 minutes of spaced recall beats 2 hours of cramming anytime!',
      'Did you know? Reviewing right before sleep boosts memory consolidation!',
      'You are doing great! Let us solidify one grammar pattern today.'
    ];
    setCatBubble(tips[Math.floor(Math.random() * tips.length)]);

    setTimeout(() => {
      setIsPetting(false);
      setCatMood('happy');
    }, 2000);

    setTimeout(() => {
      setCatBubble('');
    }, 6000);
  };

  const handlePlayWordAudio = (word: string) => {
    playEnglishSpeech(word);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* 1. Welcoming Hero Banner with Cozy Study Desk & Cat Companion */}
      <section className="relative overflow-hidden rounded-3xl bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-6 sm:p-8 shadow-sm">
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-[#EAF2ED]/60 dark:bg-[#252F28]/30 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-56 h-56 rounded-full bg-[#FDF0ED]/60 dark:bg-[#32231F]/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left Greeting & Context */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C] uppercase tracking-wider">
              <span>{getGreeting()}, {profile.name || 'Friend'}</span>
              <span aria-hidden="true">&middot;</span>
              <span>Level {profile.current_level}</span>
              <span aria-hidden="true">&middot;</span>
              <span>Day {dailySummaries.length + 1}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight leading-tight">
              Your Daily Study Sanctuary
            </h1>

            <p className="text-sm sm:text-base text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
              Step into today&apos;s curated English practice. We&apos;ve arranged spaced reviews for fading concepts,
              targeted mistake corrections, and high-impact workplace communication.
            </p>

            {/* Quick stats unboxed metadata */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-[#2D312E] dark:text-[#D1D7CE]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E07A5F]" />
                <span>{overdueSkills.length} reviews due</span>
              </div>
              <span className="text-[#DDD4BF] dark:text-[#3E4740]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#52B788]" />
                <span>{masteredSkillsCount} retained skills</span>
              </div>
              <span className="text-[#DDD4BF] dark:text-[#3E4740]">|</span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E9A825]" />
                <span>{vocabulary.length} words in memory</span>
              </div>
            </div>
          </div>

          {/* Right Interactive Cat Study Desk */}
          <div className="w-full lg:w-auto flex flex-col items-center lg:items-end shrink-0">
            <div className="relative flex flex-col items-center">
              {/* Cat Speech Bubble */}
              {catBubble && (
                <div className="absolute -top-16 right-0 max-w-xs bg-white dark:bg-[#272E29] border border-[#EBE4D7] dark:border-[#3A453D] text-[#2D312E] dark:text-[#F4F2EC] text-xs p-2.5 rounded-2xl shadow-md animate-fade-in z-20">
                  <p>{catBubble}</p>
                  <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white dark:bg-[#272E29] border-r border-b border-[#EBE4D7] dark:border-[#3A453D] transform rotate-45" />
                </div>
              )}

              {/* Cat Desk Station */}
              <button
                type="button"
                onClick={handlePetCompanion}
                title={`Pet ${catConfig.catName} for good luck and a study tip!`}
                className="group relative cursor-pointer p-4 rounded-2xl bg-white/70 dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#364038] hover:border-[#74A892] dark:hover:border-[#52B788] transition duration-200 text-center"
              >
                <div className="relative flex justify-center mb-1">
                  <CatChibiAvatar
                    companionId={catConfig.companionId}
                    accessoryId={catConfig.accessoryId}
                    mood={catMood}
                    size="lg"
                    className="transform group-hover:scale-105 transition-transform duration-200"
                  />
                  {isPetting && (
                    <span className="absolute -top-2 right-2 text-base animate-bounce">💖</span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                      {catConfig.catName}
                    </span>
                    <span className="text-[10px] text-[#74A892] font-semibold">&middot; Study Buddy</span>
                  </div>
                  <span className="text-[10px] text-[#8A938C] dark:text-[#8E978F] block">
                    Click to pet &amp; get study tips 🐾
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={onOpenCatStudio}
                className="mt-2 text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] transition flex items-center gap-1 cursor-pointer"
              >
                <span>Customize companion</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Today's Mission & Primary Action Card */}
      <section className="rounded-3xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F4EFEB] dark:border-[#2B332D]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E07A5F]">
                Today&apos;s Curated Mission
              </span>
              <span aria-hidden="true" className="text-xs text-[#8A938C]">&middot;</span>
              <span className="text-xs font-medium text-[#5C645E] dark:text-[#A7ABA4]">
                {activePlan ? 'In Progress' : 'Ready to Start'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] mt-1">
              {activePlan?.primary_objective || (
                overdueSkills.length > 0
                  ? `Spaced Retrieval: ${overdueSkills[0].skill_name} & Core Application`
                  : 'Contextual Workplace Mastery & Active Recall'
              )}
            </h2>
          </div>

          {/* Session Pace Selector */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF7F2] dark:bg-[#161A17] rounded-xl border border-[#EBE4D7] dark:border-[#2C332E] self-start md:self-center">
            {([10, 20, 30] as const).map(mins => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedPace(mins)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedPace === mins
                    ? 'bg-[#1B4332] dark:bg-[#52B788] text-white dark:text-[#0F291E] shadow-sm'
                    : 'text-[#5C645E] dark:text-[#8E978F] hover:text-[#1B4332] dark:hover:text-white'
                }`}
              >
                ⏱️ {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Structure Preview (Airy, clean steps without candy pills) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#52796F] dark:text-[#84A98C] font-semibold">
              <span>01. Warm-Up &amp; Review</span>
              <span>~3-4 mins</span>
            </div>
            <h4 className="text-sm font-bold text-[#2D312E] dark:text-[#F4F2EC]">
              {overdueSkills.length > 0 ? overdueSkills[0].skill_name : 'Foundational Retrieval'}
            </h4>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
              Consolidates past memory traces against the forgetting curve.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#52796F] dark:text-[#84A98C] font-semibold">
              <span>02. Core Focus</span>
              <span>~8-10 mins</span>
            </div>
            <h4 className="text-sm font-bold text-[#2D312E] dark:text-[#F4F2EC]">
              {activePlan?.sections[1]?.skill_target || 'Target Structural Concept'}
            </h4>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
              Active production, open clozes, and contextual sentence transformations.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#242A25] border border-[#EBE4D7] dark:border-[#313B33] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#52796F] dark:text-[#84A98C] font-semibold">
              <span>03. Lexicon &amp; Transfer</span>
              <span>~4-6 mins</span>
            </div>
            <h4 className="text-sm font-bold text-[#2D312E] dark:text-[#F4F2EC]">
              Word Families &amp; Workplace Synthesis
            </h4>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
              Natural collocations and workplace scenario communication.
            </p>
          </div>
        </div>

        {/* Action Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onOpenCatalog}
            className="text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize goals, mistakes, or vocabulary for this session</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activePlan ? (
              <button
                type="button"
                onClick={onResumeLesson}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Resume Active Lesson</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isBuildingSession}
                onClick={() => onStartLesson(selectedPace)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-sm shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBuildingSession ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Preparing Lesson...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Begin Today&apos;s Lesson ({selectedPace}m)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Three Focused Study Anchors */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Anchor 1: Spaced Retention Due */}
        <div className="rounded-3xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C]">
                Spaced Retention
              </span>
              <Brain className="w-4 h-4 text-[#74A892]" />
            </div>

            <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
              {overdueSkills.length > 0 ? `${overdueSkills.length} Skills Due for Review` : 'All Memory Traces Solid'}
            </h3>

            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
              {overdueSkills.length > 0
                ? `Skills like "${overdueSkills[0].skill_name}" have reached their scheduled review date. Review now to anchor long-term retention.`
                : 'Every skill is currently within its optimal retention window. Great job keeping your memory fresh!'}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenMemory}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F2] dark:bg-[#242A25] hover:bg-[#EFF6F1] dark:hover:bg-[#2C342E] border border-[#EBE4D7] dark:border-[#313B33] text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Memory Matrix</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Anchor 2: Word Family of the Day */}
        <div className="rounded-3xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#E07A5F]">
                Word Family Focus
              </span>
              <BookOpen className="w-4 h-4 text-[#E07A5F]" />
            </div>

            {wordOfTheDay ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                    {wordOfTheDay.word}
                  </h3>
                  <button
                    type="button"
                    onClick={() => handlePlayWordAudio(wordOfTheDay.word)}
                    title="Pronounce word"
                    className="p-1 rounded-full text-[#74A892] hover:bg-[#FAF7F2] dark:hover:bg-[#272E29] transition cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] line-clamp-2">
                  {wordOfTheDay.meaning}
                </p>
                <div className="text-[11px] text-[#52796F] dark:text-[#84A98C] font-mono">
                  {wordOfTheDay.part_of_speech} &middot; {wordOfTheDay.review_stage}d spaced interval
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <h3 className="text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                  mitigate
                </h3>
                <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                  To make something less harmful, unpleasant, or bad.
                </p>
                <div className="text-[11px] text-[#52796F] dark:text-[#84A98C] font-mono">
                  verb &middot; B2 Workplace
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (wordOfTheDay && onPracticeWord) {
                onPracticeWord(wordOfTheDay.word);
              } else {
                onOpenMemory();
              }
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F2] dark:bg-[#242A25] hover:bg-[#EFF6F1] dark:hover:bg-[#2C342E] border border-[#EBE4D7] dark:border-[#313B33] text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Practice Word Family</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Anchor 3: Learning Journey Horizon */}
        <div className="rounded-3xl bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#52B788]">
                Mastery Journey
              </span>
              <Compass className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />
            </div>

            <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">
              Target Level: {profile.target_level || 'C1'}
            </h3>

            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
              Curriculum progression verified through delayed retention checks and item-difficulty calibration.
            </p>

            <div className="pt-1 flex items-center gap-3 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#52B788]" />
                <span>{masteredSkillsCount} mastered</span>
              </div>
              <span className="text-[#DDD4BF] dark:text-[#3E4740]">&middot;</span>
              <span>{skills.length} tracked</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoadmap}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FAF7F2] dark:bg-[#242A25] hover:bg-[#EFF6F1] dark:hover:bg-[#2C342E] border border-[#EBE4D7] dark:border-[#313B33] text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C] transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Explore Curriculum Roadmap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* 4. Quick Companion Navigation Bar */}
      <section className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#5C645E] dark:text-[#A7ABA4]">
          <Cat className="w-4 h-4 text-[#E9A825]" />
          <span>MeoMeo Companion Desk</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenMilestones}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:bg-white dark:hover:bg-[#262F28] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Milestones &amp; Badges</span>
          </button>

          <button
            type="button"
            onClick={onOpenMemory}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:bg-white dark:hover:bg-[#262F28] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Memory Matrix</span>
          </button>

          <button
            type="button"
            onClick={onOpenRoadmap}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:bg-white dark:hover:bg-[#262F28] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#52796F] dark:text-[#84A98C] hover:bg-white dark:hover:bg-[#262F28] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </section>
    </div>
  );
};
