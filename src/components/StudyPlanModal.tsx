import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  BookOpen,
  ArrowRight,
  Sliders,
  Layers,
  X,
  Award
} from 'lucide-react';
import { PersonalizedStudyPlan, UserProfile } from '../types/learning.ts';
import { approveStudyPlan } from '../services/api.ts';

interface StudyPlanModalProps {
  plan: PersonalizedStudyPlan;
  profile: UserProfile;
  onPlanApproved: (updatedProfile: UserProfile) => void;
  onClose?: () => void;
}

export const StudyPlanModal: React.FC<StudyPlanModalProps> = ({
  plan,
  profile,
  onPlanApproved,
  onClose
}) => {
  const [selectedMinutes, setSelectedMinutes] = useState<number>(profile.daily_minutes || 20);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const result = await approveStudyPlan(selectedMinutes);
      onPlanApproved(result.profile);
    } catch (err) {
      console.error('Failed to approve study plan:', err);
    } finally {
      setIsApproving(false);
    }
  };

  // Dynamically calculate routine template based on selected duration
  const isVi = profile.explanation_language === 'vi';
  const getRoutineForMinutes = (mins: number) => {
    if (mins <= 12) {
      return [
        {
          section: 'grammar',
          title: isVi ? 'Khởi động & Ôn tập nhanh' : 'Warm-up & Retrieval Check',
          minutes: 2,
          target: isVi ? '1 câu hỏi kích hoạt trí nhớ điểm ngữ pháp then chốt' : '1 quick retrieval check'
        },
        {
          section: 'vocabulary',
          title: isVi ? 'Quy tắc trọng tâm & Luyện tập' : 'Core Concept & Focused Drill',
          minutes: 5,
          target: isVi ? '1 quy tắc/từ vựng + 2 câu hỏi thực hành tập trung' : '1 core rule + 2 focused practice items'
        },
        {
          section: 'writing',
          title: isVi ? 'Ứng dụng & Kiểm tra thoát bài' : 'Practical Exit Check',
          minutes: 3,
          target: isVi ? '1 câu hỏi tổng kết & phản hồi tức thì' : '1 exit check & immediate feedback'
        }
      ];
    } else if (mins >= 25) {
      return [
        {
          section: 'grammar',
          title: isVi ? 'Xử lý lỗi sai cũ & Khởi động' : 'Error Clinic & Warm-up',
          minutes: 4,
          target: isVi ? '2 câu hỏi khắc phục lỗi sai hay lặp lại' : '2 review questions targeting past tricky areas'
        },
        {
          section: 'grammar',
          title: isVi ? 'Ngữ pháp chuyên sâu & Biến đổi câu' : 'In-Depth Grammar & Nuance',
          minutes: 7,
          target: isVi ? '3 câu hỏi: trắc nghiệm, điền từ, viết lại câu' : '3 practice rounds across diverse question types'
        },
        {
          section: 'vocabulary',
          title: isVi ? 'Từ vựng cốt lõi & Collocations tự nhiên' : 'Active Vocabulary & Collocations',
          minutes: 7,
          target: isVi ? 'Thẻ từ vựng IPA chi tiết + 3 câu hỏi ứng dụng thực tế' : 'Full IPA vocab card + 3 contextual application items'
        },
        {
          section: 'reading',
          title: isVi ? 'Đọc hiểu chuyên sâu & Phân tích tác giả' : 'Contextual Reading & Inference',
          minutes: 6,
          target: isVi ? 'Đoạn văn thực tế 150 từ + 2 câu hỏi ý chính & suy luận' : '150-word scenario passage + 2 analytical questions'
        },
        {
          section: 'writing',
          title: isVi ? 'Diễn đạt công việc thực chiến & Tổng kết' : 'Authentic Workplace Production',
          minutes: 6,
          target: isVi ? '2 bài tập viết thực tế kèm rubric sửa lỗi chi tiết' : '2 writing tasks with native rubric feedback'
        }
      ];
    } else {
      return [
        {
          section: 'grammar',
          title: isVi ? 'Khởi động & Ôn tập củng cố' : 'Warm-up & Pattern Review',
          minutes: 3,
          target: isVi ? '1 câu hỏi ôn lại cấu trúc đã học' : '1 warm-up question on key patterns'
        },
        {
          section: 'grammar',
          title: isVi ? 'Ngữ pháp theo ngữ cảnh' : 'Grammar in Context',
          minutes: 6,
          target: isVi ? '1 quy tắc trọng tâm + 2 câu hỏi luyện tập' : '1 key concept + 2 practice questions'
        },
        {
          section: 'vocabulary',
          title: isVi ? 'Từ vựng & Collocations' : 'Vocabulary & Collocations',
          minutes: 5,
          target: isVi ? 'Thẻ từ vựng IPA + 2 câu hỏi chọn cặp từ tự nhiên' : 'IPA card + 2 collocation practice questions'
        },
        {
          section: 'reading',
          title: isVi ? 'Đọc hiểu & Ứng dụng thực tế' : 'Contextual Reading & Expression',
          minutes: 6,
          target: isVi ? '1 bài đọc ngắn 120 từ + 1 câu hỏi suy luận + 1 bài viết' : '1 reading passage + 1 comprehension + 1 writing prompt'
        }
      ];
    }
  };

  const currentRoutine = getRoutineForMinutes(selectedMinutes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161A17]/70 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC]">Your Study Plan Notebook</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 text-[#2D6A4F] dark:text-[#74A892] border border-[#2D6A4F]/25 uppercase font-mono">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                Calibrated to your goals and adaptive assessment results
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white hover:bg-white dark:hover:bg-[#262F28] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Objective & Diagnostic Rationale */}
        <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-5 space-y-2 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#74A892] block">
            Primary Learning Objective
          </span>
          <p className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] leading-relaxed">
            {plan.overallObjective}
          </p>
          {plan.diagnosticSummary && (
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] pt-2 border-t border-[#EBE4D7] dark:border-[#3C443E] leading-relaxed">
              <strong className="text-[#2D312E] dark:text-[#E0DDD5]">Assessment Context: </strong>
              {plan.diagnosticSummary}
            </p>
          )}
        </div>

        {/* Prioritized Skills with Rationale */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-[#2D6A4F]" />
            <span>Prioritized Skills & Pedagogical Rationale</span>
          </h4>

          <div className="space-y-2.5">
            {plan.prioritizedSkills.map((sk, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">{sk.skillName}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-md bg-[#FAF7F2] dark:bg-[#1E231F] text-[#5C645E] dark:text-[#A7ABA4] border border-[#EBE4D7] dark:border-[#2C332E]">
                      {sk.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-md bg-[#E07A5F]/15 text-[#E07A5F] border border-[#E07A5F]/30 uppercase font-mono">
                      {sk.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] leading-relaxed">
                    <strong className="text-[#2D6A4F] dark:text-[#74A892]">Why selected: </strong>
                    {sk.rationale}
                  </p>
                </div>

                <div className="text-xs text-[#5C645E] dark:text-[#A7ABA4] shrink-0 text-right font-mono">
                  <span>Current: <strong className="text-[#2D312E] dark:text-[#F4F2EC]">{sk.currentLevel}</strong></span>
                  <span className="block mt-0.5">Target: <strong className="text-[#2D6A4F] dark:text-[#74A892]">{sk.targetLevel}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Daily Lesson Routine Structure */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-[#52796F]" />
              <span>
                {selectedMinutes <= 12
                  ? 'Quick Practice Daily Structure (10 Mins • 4 Questions)'
                  : selectedMinutes >= 25
                  ? 'Deep Practice Daily Structure (30 Mins • 12 Questions)'
                  : 'Standard Practice Daily Structure (20 Mins • 7 Questions)'}
              </span>
            </h4>
            <span className="text-xs text-[#2D6A4F] dark:text-[#74A892] font-mono font-bold">
              ~{currentRoutine.reduce((sum, item) => sum + item.minutes, 0)} mins total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {currentRoutine.map((sec, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-xl p-3 flex items-start space-x-3 shadow-2xs"
              >
                <span className="w-6 h-6 rounded-lg bg-[#2D6A4F]/10 border border-[#2D6A4F]/30 flex items-center justify-center font-bold text-[11px] text-[#2D6A4F] dark:text-[#74A892] shrink-0 font-mono">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="font-bold text-[#1B4332] dark:text-[#F4F2EC]">{sec.title}</h5>
                  <p className="text-[#5C645E] dark:text-[#A7ABA4] text-[11px] mt-0.5">{sec.target}</p>
                  <span className="text-[10px] text-[#52796F] dark:text-[#84A98C] font-semibold block mt-1 font-mono">~{sec.minutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones & Spaced Review Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20 border border-[#2D6A4F]/30 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#74A892] flex items-center space-x-1.5">
              <Award className="w-4 h-4" />
              <span>Short-Term Milestones</span>
            </span>
            <ul className="space-y-1.5 text-xs text-[#2D312E] dark:text-[#E0DDD5]">
              {plan.shortTermMilestones.map((ms, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#74A892] shrink-0 mt-0.5" />
                  <span>{ms}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#D4A373]/15 dark:bg-[#D4A373]/20 border border-[#D4A373]/35 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9C6D38] dark:text-[#E6B87E] flex items-center space-x-1.5">
              <Clock className="w-4 h-4" />
              <span>Retention & Review Strategy</span>
            </span>
            <p className="text-xs text-[#2D312E] dark:text-[#E0DDD5] leading-relaxed">
              {plan.spacedReviewStrategy}
            </p>
            <span className="block text-[11px] text-[#5C645E] dark:text-[#A7ABA4] pt-1 border-t border-[#D4A373]/30">
              Progress re-assessment checkpoint every <strong>{plan.progressCheckIntervalDays} days</strong>.
            </span>
          </div>
        </div>

        {/* Pace Adjustments */}
        <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#2D6A4F]" />
            <span className="text-xs font-semibold text-[#1B4332] dark:text-[#F4F2EC]">Choose Daily Learning Pace:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { m: 10, label: '10 mins/day', sub: '⚡ Quick (4 Qs)' },
              { m: 20, label: '20 mins/day', sub: '🎯 Standard (7 Qs)' },
              { m: 30, label: '30 mins/day', sub: '🔬 Deep (12 Qs)' }
            ].map(item => (
              <button
                key={item.m}
                onClick={() => setSelectedMinutes(item.m)}
                className={`px-3 py-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer ${
                  selectedMinutes === item.m
                    ? 'bg-[#2D6A4F] border-[#2D6A4F] text-white shadow-xs'
                    : 'bg-[#FAF7F2] dark:bg-[#1E231F] border-[#EBE4D7] dark:border-[#2C332E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[10px] ${selectedMinutes === item.m ? 'text-[#D8E2DC]' : 'text-[#8C938D]'}`}>
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EBE4D7] dark:border-[#2C332E]">
          <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
            You can adjust preferences or review past reports in Settings anytime.
          </p>

          <button
            disabled={isApproving}
            onClick={handleApprove}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>{isApproving ? 'Activating Plan...' : 'Approve Plan & Begin Day 1'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
