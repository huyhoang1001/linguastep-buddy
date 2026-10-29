import React, { useState } from 'react';
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
  const [isBuilding, setIsBuilding] = useState(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#161A17]/70 backdrop-blur-sm">
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl text-[#2D312E] dark:text-[#F4F2EC] max-h-[90vh] overflow-y-auto space-y-6 relative font-sans">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white dark:bg-[#272E29] border border-[#EBE4D7] dark:border-[#364038] text-[#8A938C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] transition cursor-pointer"
          title="Close Roadmap"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-[#EBE4D7] dark:border-[#2C332E]">
          <div className="w-12 h-12 rounded-2xl bg-[#2D6A4F] flex items-center justify-center text-[#FAF7F2] shadow-sm shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-2">
              <span>{isVi ? 'Lộ Trình Học & Kế Hoạch Tiếp Theo' : 'Learning Roadmap & Next Plan'}</span>
            </h2>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
              {isVi ? 'Được cá nhân hóa theo mục tiêu và kết quả thực hành' : 'Evidence-based mastery progression and spaced retention schedule'}
            </p>
          </div>
        </div>

        {/* Tomorrow's Session Preview Card */}
        <div className="bg-[#EFF6F1] dark:bg-[#242E27] border border-[#CDE1D4] dark:border-[#334237] rounded-2xl p-4 md:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#CDE1D4] dark:border-[#334237] pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2D6A4F] dark:text-[#84A98C] flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#52B788]" />
              <span>{isVi ? 'Nội Dung Cho Phiên Tiếp Theo' : 'Next Session Plan'}</span>
            </span>
            <span className="text-xs font-bold text-[#2D6A4F] dark:text-[#84A98C] bg-white/80 dark:bg-[#1C231F] border border-[#CDE1D4] dark:border-[#334237] px-2.5 py-0.5 rounded-full">
              ~{tomorrowPlan.estimated_minutes} {isVi ? 'phút' : 'mins'}
            </span>
          </div>

          <div>
            <h3 className="text-base font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] flex items-center space-x-2">
              <Target className="w-4 h-4 text-[#E07A5F] shrink-0" />
              <span>{tomorrowPlan.focus_title}</span>
            </h3>
            <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] mt-1 leading-relaxed">
              {tomorrowPlan.preview_summary}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Review Section */}
            <div className="bg-[#FDF0ED] dark:bg-[#2D2320] border border-[#F5D5CC] dark:border-[#4B342E] rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-[#E07A5F] uppercase tracking-wider flex items-center space-x-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
                <span>{isVi ? 'Cần Ôn Tập Lại' : 'What We\'ll Review'}</span>
              </span>
              <ul className="space-y-1 text-xs text-[#5C645E] dark:text-[#D1ABA2]">
                {tomorrowPlan.review_topics.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[#E07A5F] font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* New Skills Section */}
            <div className="bg-white/80 dark:bg-[#1D2620] border border-[#CDE1D4] dark:border-[#304033] rounded-xl p-3 space-y-2">
              <span className="text-[11px] font-bold text-[#2D6A4F] dark:text-[#84A98C] uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                <span>{isVi ? 'Kiến Thức Mới Tiếp Theo' : 'New Concepts & Skills'}</span>
              </span>
              <ul className="space-y-1 text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                {tomorrowPlan.new_skills.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-1.5">
                    <span className="text-[#52B788] font-bold">+</span>
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-[#2D6A4F] dark:text-[#84A98C]" />
              <span>{isVi ? 'Khung Lộ Trình 5 Ngày' : '5-Day Curriculum Roadmap'}</span>
            </span>
            <span className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4]">
              {isVi ? 'Cấp độ:' : 'Target:'} <strong className="text-[#1B4332] dark:text-[#F4F2EC]">{profile.current_level} → {profile.target_level}</strong>
            </span>
          </div>

          <div className="space-y-2.5">
            {roadmapDays.map(item => (
              <div
                key={item.day}
                className={`p-3.5 rounded-2xl border transition ${
                  item.status === 'completed'
                    ? 'bg-white/80 dark:bg-[#252C26] border-[#CDE1D4] dark:border-[#323D34] text-[#5C645E] dark:text-[#A7ABA4]'
                    : item.status === 'current'
                    ? 'bg-[#EFF6F1] dark:bg-[#27352B] border-[#74A892] dark:border-[#52B788] text-[#1B4332] dark:text-[#F4F2EC] ring-1 ring-[#52B788]/30 shadow-sm'
                    : 'bg-white/40 dark:bg-[#1C211D] border-[#EBE4D7] dark:border-[#2C332E] text-[#8A938C]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    {item.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-[#52B788] shrink-0" />
                    ) : item.status === 'current' ? (
                      <div className="w-4 h-4 rounded-full bg-[#2D6A4F] flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {item.day}
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-[#C5BFB3] dark:border-[#4B554D] flex items-center justify-center text-[10px] text-[#8A938C] shrink-0">
                        {item.day}
                      </div>
                    )}
                    <span className="text-xs font-bold">
                      {isVi ? `Ngày ${item.day}: ${item.title}` : `Day ${item.day}: ${item.title}`}
                    </span>
                  </div>

                  {item.status === 'current' && (
                    <span className="text-[10px] font-bold bg-[#2D6A4F] text-white px-2 py-0.5 rounded-full uppercase">
                      {isVi ? 'Hiện tại' : 'Active'}
                    </span>
                  )}
                  {item.day === 5 && (
                    <Award className="w-4 h-4 text-[#E9A825] shrink-0" />
                  )}
                </div>

                <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-1 pl-7 leading-relaxed">
                  {item.focus}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Start Next Lesson Action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#EBE4D7] dark:border-[#2C332E]">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] bg-white dark:bg-[#272E29] text-xs font-semibold border border-[#EBE4D7] dark:border-[#364038] transition cursor-pointer"
          >
            {isVi ? 'Đóng Lộ Trình' : 'Close Roadmap'}
          </button>

          <button
            disabled={isBuilding}
            onClick={async () => {
              setIsBuilding(true);
              try {
                await onStartNewLesson(targetMins);
                onClose();
              } catch (e) {
                setIsBuilding(false);
              }
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-50 text-white text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isBuilding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isVi ? 'Đang Xây Dựng Phiên Học...' : 'Building AI Session...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#FAF7F2]" />
                <span>{isVi ? `Bắt Đầu Phiên Học (${targetMins} phút)` : `Build Next AI Session (${targetMins} mins)`}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
