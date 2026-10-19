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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 md:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Your Evidence-Grounded Study Plan</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Personalized
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calibrated to your goals and adaptive assessment results
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Objective & Diagnostic Rationale */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
            Primary Learning Objective
          </span>
          <p className="text-base font-bold text-white leading-relaxed">
            {plan.overallObjective}
          </p>
          {plan.diagnosticSummary && (
            <p className="text-xs text-slate-300 pt-1 border-t border-slate-800 leading-relaxed">
              <strong>Assessment Context: </strong>
              {plan.diagnosticSummary}
            </p>
          )}
        </div>

        {/* Prioritized Skills with Rationale */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Prioritized Skills & Pedagogical Rationale</span>
          </h4>

          <div className="space-y-2.5">
            {plan.prioritizedSkills.map((sk, idx) => (
              <div
                key={idx}
                className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">{sk.skillName}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-full bg-slate-700 text-slate-300">
                      {sk.category}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                      {sk.priority} Priority
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    <strong className="text-indigo-300">Why selected: </strong>
                    {sk.rationale}
                  </p>
                </div>

                <div className="text-xs text-slate-400 shrink-0 text-right">
                  <span>Current: <strong>{sk.currentLevel}</strong></span>
                  <span className="block mt-0.5">Target: <strong className="text-emerald-400">{sk.targetLevel}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Daily Lesson Routine Structure */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>
                {selectedMinutes <= 12
                  ? 'Quick Practice Daily Structure (10 Mins • 4 Questions)'
                  : selectedMinutes >= 25
                  ? 'Deep Practice Daily Structure (30 Mins • 12 Questions)'
                  : 'Standard Practice Daily Structure (20 Mins • 7 Questions)'}
              </span>
            </h4>
            <span className="text-xs text-indigo-300 font-bold">
              ~{currentRoutine.reduce((sum, item) => sum + item.minutes, 0)} minutes total
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            {currentRoutine.map((sec, idx) => (
              <div
                key={idx}
                className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 flex items-start space-x-3"
              >
                <span className="w-6 h-6 rounded-lg bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center font-bold text-[11px] text-indigo-300 shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <h5 className="font-bold text-white">{sec.title}</h5>
                  <p className="text-slate-400 text-[11px] mt-0.5">{sec.target}</p>
                  <span className="text-[10px] text-indigo-400 font-semibold block mt-1">~{sec.minutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones & Spaced Review Strategy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <Award className="w-4 h-4" />
              <span>Short-Term Milestones</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-200">
              {plan.shortTermMilestones.map((ms, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{ms}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4" />
              <span>Retention & Review Strategy</span>
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {plan.spacedReviewStrategy}
            </p>
            <span className="block text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
              Progress re-assessment checkpoint every <strong>{plan.progressCheckIntervalDays} days</strong>.
            </span>
          </div>
        </div>

        {/* Pace Adjustments */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-300">Choose Daily Learning Pace:</span>
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
                className={`px-3 py-2 rounded-xl text-center border transition flex flex-col items-center justify-center ${
                  selectedMinutes === item.m
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <span className="text-xs font-bold">{item.label}</span>
                <span className={`text-[10px] ${selectedMinutes === item.m ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            You can adjust preferences or review past reports in Settings anytime.
          </p>

          <button
            disabled={isApproving}
            onClick={handleApprove}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2"
          >
            <span>{isApproving ? 'Activating Plan...' : 'Approve Plan & Begin Day 1'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
