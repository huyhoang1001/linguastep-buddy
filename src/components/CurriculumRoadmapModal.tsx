import React from 'react';
import {
  Calendar,
  Compass,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  X,
  Target,
  Layers,
  Award
} from 'lucide-react';
import { UserProfile, LessonPlan, DailySummary } from '../types/learning.ts';

interface CurriculumRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  activePlan: LessonPlan | null;
  activeSummary: DailySummary | null;
  onStartNewLesson: (minutes?: number) => void;
}

export const CurriculumRoadmapModal: React.FC<CurriculumRoadmapModalProps> = ({
  isOpen,
  onClose,
  profile,
  activePlan,
  activeSummary,
  onStartNewLesson
}) => {
  if (!isOpen) return null;

  const isVi = profile.explanation_language === 'vi';
  const targetMins = activePlan?.estimated_duration_minutes || profile.daily_minutes || 20;

  // Multi-day curriculum roadmap timeline matching B2/C1 workplace & general English
  const roadmapDays = [
    {
      day: 1,
      title: isVi ? 'Thành thạo mốc thời gian & Câu điều kiện' : 'Narrative Time Anchors & Conditionals',
      status: 'completed',
      focus: isVi ? 'Past Perfect, Mixed Conditionals (Type 3-2) & Mitigate/Streamline' : 'Past Perfect, Mixed Conditionals (Type 3-2) & Collocations',
      skills: [
        'By the time + Past Simple → Had + V3/ed',
        'If + Had + V3... would be (Present outcome)',
        'Collocations with Mitigate & Streamline'
      ]
    },
    {
      day: 2,
      title: isVi ? 'Đảo ngữ nhấn mạnh & Từ nối tương phản' : 'Negative Inversion & Formal Contrast',
      status: 'current',
      focus: isVi ? 'Inversion with Seldom/Rarely/Hardly, Formal Connectors (Nevertheless/In spite of)' : 'Inversion with Seldom/Rarely/Hardly, Formal Connectors (Nevertheless/In spite of)',
      skills: [
        'Seldom / Rarely / Hardly + Auxiliary + S + V',
        'Nevertheless / However vs. In spite of / Despite',
        'Precision Vocabulary: Discrepancy & Contingency'
      ]
    },
    {
      day: 3,
      title: isVi ? 'Câu chẻ nhấn mạnh & Báo cáo điều hành' : 'Cleft Sentences & Executive Status Reports',
      status: 'upcoming',
      focus: isVi ? 'It-clefts & What-clefts, Báo cáo tiến độ ngắn gọn cho C-Level' : 'It-clefts & What-clefts, Executive Status Briefings',
      skills: [
        'It was [X] that caused the bottleneck...',
        'What we need to prioritize is [Y]...',
        'Concise blocker updates preserving tone'
      ]
    },
    {
      day: 4,
      title: isVi ? 'Thể bị động kỹ thuật & Biện luận giả định' : 'Passive Voice in Tech Reports & Subjunctive',
      status: 'upcoming',
      focus: isVi ? 'Passive in incident post-mortems & Subjunctive mood' : 'Passive in incident post-mortems & Subjunctive mood',
      skills: [
        'The system was configured to prevent...',
        'It is crucial that the team deploy...',
        'High-Impact Collocations: Leverage & Optimize'
      ]
    },
    {
      day: 5,
      title: isVi ? 'Kiểm tra cột mốc Milestone & Đánh giá tự động' : 'Milestone Check & Comprehensive Assessment',
      status: 'upcoming',
      focus: isVi ? 'Tổng hợp 4 kỹ năng qua kịch bản thực tế & Nhận chứng chỉ tiến bộ' : 'Full 4-skill integration & Automated level check',
      skills: [
        'Adaptive Diagnostic Verification',
        'Multi-format error clinic & polish',
        'Personalized CEFR level progression report'
      ]
    }
  ];

  const tomorrowPlan = activeSummary?.tomorrow_plan || {
    focus_title: isVi
      ? 'Kế hoạch phiên tiếp theo: Đảo ngữ phủ định & Báo cáo điều hành'
      : "Next Session Focus: Negative Inversion & Executive Status Writing",
    review_topics: isVi
      ? [
          'Thì Quá khứ hoàn thành trong mốc thời gian "By the time"',
          'Câu điều kiện trộn (If + had... would be) chỉ kết quả hiện tại',
          'Từ nối tương phản chính thức (nevertheless, however)'
        ]
      : [
          'Past Perfect narrative time anchors ("By the time")',
          'Mixed Conditionals (If + had... would be) for present impact',
          'Formal Contrast Connectors (nevertheless, however)'
        ],
    new_skills: isVi
      ? [
          'Đảo ngữ với trạng từ phủ định (Seldom / Rarely / Hardly... do we)',
          'Thẻ từ vựng cao cấp: Discrepancy, Bottleneck, Contingency',
          'Viết email cập nhật blocker ngắn gọn cho quản lý'
        ]
      : [
          'Inversion with Negative Adverbials (Seldom / Rarely / Hardly... do we)',
          'Precision Vocabulary: Discrepancy, Bottleneck, Contingency',
          'Executive Blocker Status Email Writing'
        ],
    estimated_minutes: targetMins,
    preview_summary: isVi
      ? 'Phiên học bắt đầu bằng 3 phút ôn tập phản xạ các lỗi hay gặp hôm nay, sau đó đi sâu luyện tập cấu trúc Đảo ngữ nhấn mạnh và viết báo cáo.'
      : 'Session begins with a 3-minute retrieval drill on today\'s focus items, followed by in-depth practice on Negative Inversion and Executive Writing.'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          title="Close Roadmap"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>{isVi ? 'Lộ Trình Học & Kế Hoạch Ngày Mai' : 'Learning Plan & Tomorrow\'s Preview'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isVi ? 'Được cá nhân hóa theo mục tiêu và kết quả thực hành' : 'Personalized based on your goals and performance history'}
            </p>
          </div>
        </div>

        {/* Tomorrow's Session Preview Card */}
        <div className="bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-600/60 rounded-2xl p-4 md:p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-indigo-800/40 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>{isVi ? 'Nội Dung Cho Phiên Tiếp Theo' : 'Tomorrow\'s Session Plan'}</span>
            </span>
            <span className="text-xs font-bold text-indigo-200 bg-indigo-900/80 border border-indigo-700/60 px-2.5 py-0.5 rounded-full">
              ~{tomorrowPlan.estimated_minutes} {isVi ? 'phút' : 'mins'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{tomorrowPlan.focus_title}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-1">
              {tomorrowPlan.preview_summary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Review Section */}
            <div className="bg-slate-900/90 border border-amber-800/40 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isVi ? 'Cần Ôn Tập Lại' : 'What We\'ll Review'}</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {tomorrowPlan.review_topics.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* New Skills Section */}
            <div className="bg-slate-900/90 border border-emerald-800/40 rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{isVi ? 'Kiến Thức Mới Tiếp Theo' : 'New Concepts & Skills'}</span>
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {tomorrowPlan.new_skills.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-emerald-400 font-bold">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Multi-Day Learning Roadmap Timeline */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{isVi ? 'Khung Lộ Trình 5 Ngày' : '5-Day Curriculum Roadmap'}</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {isVi ? 'Cấp độ:' : 'Target:'} <strong className="text-white">{profile.current_level} → {profile.target_level}</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {roadmapDays.map(item => (
              <div
                key={item.day}
                className={`p-3.5 rounded-2xl border transition ${
                  item.status === 'completed'
                    ? 'bg-slate-900/50 border-emerald-800/40 text-slate-300'
                    : item.status === 'current'
                    ? 'bg-indigo-950/40 border-indigo-600/70 text-white ring-1 ring-indigo-500/30'
                    : 'bg-slate-900/30 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : item.status === 'current' ? (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0 animate-pulse">
                        {item.day}
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500 shrink-0">
                        {item.day}
                      </div>
                    )}
                    <span className="text-xs font-bold">
                      {isVi ? `Ngày ${item.day}: ${item.title}` : `Day ${item.day}: ${item.title}`}
                    </span>
                  </div>

                  {item.status === 'current' && (
                    <span className="text-[10px] font-bold bg-indigo-600/80 text-white px-2 py-0.5 rounded-full uppercase border border-indigo-400/40">
                      {isVi ? 'Hiện tại' : 'Active'}
                    </span>
                  )}
                  {item.day === 5 && (
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-1 pl-7">
                  {item.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Start Next Lesson Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 transition"
          >
            {isVi ? 'Đóng Lộ Trình' : 'Close Roadmap'}
          </button>

          <button
            onClick={() => {
              onClose();
              onStartNewLesson(targetMins);
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2"
          >
            <span>{isVi ? `Bắt Đầu Phiên Học Mới (${targetMins} phút)` : `Start Next Session (${targetMins} mins)`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
