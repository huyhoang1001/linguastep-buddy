import {
  UserProfile,
  DiagnosticReport,
  CurriculumRoadmap,
  RoadmapMilestone,
  EnglishLevel,
  LearnerSkillState
} from '../types/learning.ts';

/**
 * Builds goal-aware curriculum milestones tailored to the learner's authentic intent.
 */
export function generatePersonalizedRoadmap(
  profile: UserProfile,
  report?: DiagnosticReport
): CurriculumRoadmap {
  const goalSummary = profile.structured_goal?.original_free_text || profile.goal_summary || 'Authentic communicative fluency';
  const lowerGoal = (goalSummary + ' ' + (profile.primary_goal || '')).toLowerCase();

  const isDatingOrSocial =
    profile.structured_goal?.preferred_tone === 'playful_cheeky' ||
    lowerGoal.includes('tán') ||
    lowerGoal.includes('gái') ||
    lowerGoal.includes('dating') ||
    lowerGoal.includes('flirt') ||
    lowerGoal.includes('crush') ||
    lowerGoal.includes('hẹn hò') ||
    lowerGoal.includes('tinder') ||
    (profile.primary_goal === 'conversation' && profile.general_vs_work_ratio <= 20);

  const isTechOrWorkplace =
    profile.primary_goal === 'workplace_tech' ||
    lowerGoal.includes('tech') ||
    lowerGoal.includes('software') ||
    lowerGoal.includes('engineer') ||
    lowerGoal.includes('developer') ||
    lowerGoal.includes('code') ||
    lowerGoal.includes('pr review');

  const isExamOrAcademic =
    profile.primary_goal === 'exam' ||
    profile.primary_goal === 'reading_writing' ||
    lowerGoal.includes('ielts') ||
    lowerGoal.includes('toeic') ||
    lowerGoal.includes('du học') ||
    lowerGoal.includes('exam');

  const startingLevel: EnglishLevel =
    profile.assessed_overall_level ||
    (report?.overallCEFR?.includes('C1') ? 'C1' :
     report?.overallCEFR?.includes('B2') ? 'B2' :
     report?.overallCEFR?.includes('B1') ? 'B1' :
     report?.overallCEFR?.includes('A2') ? 'A2' :
     profile.current_level) || 'A1';

  const targetLevel: EnglishLevel = profile.target_level || 'C1';
  const isVi = profile.explanation_language === 'vi';

  let milestones: RoadmapMilestone[];

  if (isDatingOrSocial) {
    milestones = [
      {
        milestone_id: 'ms-social-1',
        order: 1,
        title: isVi ? 'Phá vỡ khoảng cách & Mở đầu tự nhiên' : 'Icebreakers & Natural Banter Openers',
        description: isVi
          ? 'Học cách bắt chuyện dí dỏm, phản xạ nhanh với các tình huống xã hội và dùng từ vựng Gen Z chuẩn tự nhiên thay vì câu từ sách vở gượng gạo.'
          : 'Break the ice playfully, react charismatically in casual social chats, and avoid stiff textbook phrasing.',
        target_cefr: 'B1',
        status: 'in_progress',
        real_world_task: isVi
          ? 'Bắt đầu cuộc trò chuyện 5 phút với người quen mới hoặc trên ứng dụng hẹn hò với giọng điệu tự nhiên, hài hước.'
          : 'Hold a confident 5-minute icebreaker chat with charisma and natural comedic timing.',
        required_skills: [
          {
            skill_id: 'social_icebreakers_banter',
            name: isVi ? 'Mở đầu cuộc trò chuyện & Phản xạ hài hước' : 'Natural Icebreakers & Banter Openers',
            category: 'conversation',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'casual_present_tense_cadence',
            name: isVi ? 'Thì hiện tại trong hội thoại thân mật' : 'Present Simple & Continuous in Casual Remarks',
            category: 'grammar',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'genz_slang_collocations',
            name: isVi ? 'Từ lóng Gen Z & Thành ngữ trò chuyện tự nhiên' : 'Authentic Gen Z Slang & Social Idioms',
            category: 'vocabulary',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'recognition',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-social-2',
        order: 2,
        title: isVi ? 'Kể chuyện lôi cuốn & Tung hứng trêu đùa' : 'Storytelling, Anecdotes & Playful Teasing',
        description: isVi
          ? 'Sử dụng các thì quá khứ một cách mượt mà để kể lại kỷ niệm đáng nhớ, kèm theo các cụm động từ và kỹ thuật trêu đùa push-pull tinh tế.'
          : 'Weave engaging past-narrative stories with seamless phrasal verbs and charismatic push-pull banter.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Kể một câu chuyện vui vẻ dài 2-3 phút về trải nghiệm dở khóc dở cười mà không bị vấp ngữ pháp.'
          : 'Share an amusing 3-minute personal anecdote with smooth narrative tension and playful tease.',
        required_skills: [
          {
            skill_id: 'past_narrative_social',
            name: isVi ? 'Thì quá khứ trong câu chuyện đời thường' : 'Narrative Past Tenses in Personal Anecdotes',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['casual_present_tense_cadence'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'phrasal_verbs_social',
            name: isVi ? 'Cụm động từ tạo sự thân mật' : 'Phrasal Verbs for Casual Chemistry & Banter',
            category: 'vocabulary',
            target_level: 'B2',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'playful_teasing_framing',
            name: isVi ? 'Kỹ thuật trêu đùa dí dỏm (Banter & Wit)' : 'Playful Teasing & Sarcastic Push-Pull',
            category: 'conversation',
            target_level: 'B2',
            prerequisites: ['social_icebreakers_banter'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-social-3',
        order: 3,
        title: isVi ? 'Nhắn tin cuốn hút & Phản xạ tình huống' : 'Witty Texting & Spontaneous Digital Chemistry',
        description: isVi
          ? 'Làm chủ nghệ thuật nhắn tin dí dỏm, điều kiện giả định tán tỉnh và sử dụng nhịp điệu câu ngắn để tạo sức hút.'
          : 'Master witty messaging rhythm, flirty hypotheticals, and rapid spontaneous texting cadence.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Nhắn tin qua lại nhịp nhàng, thông minh trên ứng dụng mạng xã hội mà không bị rơi vào cảnh cụt cuộc trò chuyện.'
          : 'Carry a witty messaging exchange on social apps with effortless rhythm and charismatic humor.',
        required_skills: [
          {
            skill_id: 'social_mixed_conditionals',
            name: isVi ? 'Câu điều kiện giả định dí dỏm (What-if)' : 'Hypothetical Conditionals for Flirty Scenarios',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['past_narrative_social'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'nuanced_compliments',
            name: isVi ? 'Lời khen tinh tế & Tránh sến súa' : 'Nuanced Compliments vs. Cheesy Tropes',
            category: 'vocabulary',
            target_level: 'B2',
            prerequisites: ['phrasal_verbs_social'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-social-4',
        order: 4,
        title: isVi ? 'Kết nối cảm xúc sâu sắc & Tự tin giao tiếp' : 'Deep Emotional Rapport & Charismatic Fluency',
        description: isVi
          ? 'Thảo luận về các chủ đề sâu sắc, thể hiện quan điểm cá nhân, sự đồng cảm và bản sắc riêng một cách lôi cuốn.'
          : 'Express authentic vulnerability, discuss personal values, and sustain effortless charismatic chemistry.',
        target_cefr: 'C1',
        status: 'locked',
        real_world_task: isVi
          ? 'Thực hiện một buổi trò chuyện sâu (deep talk) kéo dài 30 phút một cách tự nhiên và kết nối cảm xúc thực sự.'
          : 'Sustain an engaging 30-minute deep conversation on personal passions and values with zero awkwardness.',
        required_skills: [
          {
            skill_id: 'conversational_clefts',
            name: isVi ? 'Nhấn mạnh cảm xúc & Điểm mấu chốt' : 'Emphatic Clefts for Emotional Resonance',
            category: 'conversation',
            target_level: 'C1',
            prerequisites: ['social_mixed_conditionals'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'humor_sarcasm_cadence',
            name: isVi ? 'Làm chủ sự hài hước tinh tế & Nhịp điệu bản xứ' : 'Mastery of Irony, Subtlety & Push-Pull Cadence',
            category: 'conversation',
            target_level: 'C1',
            prerequisites: ['playful_teasing_framing'],
            mastery_requirement: 'retained_mastery',
            is_mastered: false,
            accuracy: 0
          }
        ]
      }
    ];
  } else if (isTechOrWorkplace) {
    milestones = [
      {
        milestone_id: 'ms-tech-1',
        order: 1,
        title: isVi ? 'Báo cáo Daily Standup & Cập nhật sự cố' : 'Daily Standup Clarity & Incident Reporting',
        description: isVi
          ? 'Truyền tải trạng thái công việc và sự cố kỹ thuật chính xác, rõ ràng mà không gây mơ hồ cho đồng nghiệp.'
          : 'Communicate sprint status, blocker updates, and production incidents with precision.',
        target_cefr: 'B1',
        status: 'in_progress',
        real_world_task: isVi
          ? 'Viết cập nhật blocker trên Slack và trình bày miệng 1 phút trong standup meeting.'
          : 'Deliver a concise 60-second standup status update and Slack incident summary.',
        required_skills: [
          {
            skill_id: 'present_perfect_past_simple',
            name: isVi ? 'Hiện tại hoàn thành trong báo cáo tiến độ' : 'Present Perfect vs Past Simple for Milestones',
            category: 'grammar',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'collocation_mitigate',
            name: isVi ? 'Cụm từ kỹ thuật: Mitigate, Resolve, Bottleneck' : 'Precision Tech Collocations: Mitigate & Resolve',
            category: 'vocabulary',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'workplace_slack_update',
            name: isVi ? 'Viết cập nhật công việc ngắn gọn trên Slack' : 'Clear Workplace Status Updates & Blocker Memos',
            category: 'writing',
            target_level: 'B1',
            prerequisites: ['present_perfect_past_simple'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-tech-2',
        order: 2,
        title: isVi ? 'Bảo vệ quyết định kiến trúc & Đánh giá giải pháp' : 'Architectural Trade-offs & Design Defense',
        description: isVi
          ? 'Sử dụng câu điều kiện hỗn hợp và đảo ngữ để giải thích sự đánh đổi giữa hiệu năng, chi phí và thời gian.'
          : 'Articulate architectural trade-offs, engineering compromises, and post-mortem root causes.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Viết phần Technical Trade-offs trong tài liệu thiết kế hệ thống (RFC / Design Doc).'
          : 'Author a defensible trade-offs section in a technical design RFC.',
        required_skills: [
          {
            skill_id: 'mixed_conditionals',
            name: isVi ? 'Câu điều kiện trộn (Quá khứ gây ảnh hưởng hiện tại)' : 'Mixed Conditionals for System Trade-offs',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['present_perfect_past_simple'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'negative_inversion',
            name: isVi ? 'Đảo ngữ nhấn mạnh rủi ro & trường hợp biên' : 'Negative Inversion for Critical System Warnings',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'passive_voice_objective',
            name: isVi ? 'Câu bị động trong báo cáo kỹ thuật trung lập' : 'Passive Voice in Incident Post-Mortems',
            category: 'writing',
            target_level: 'B2',
            prerequisites: [],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-tech-3',
        order: 3,
        title: isVi ? 'Đánh giá mã nguồn ngoại giao & Thảo luận kỹ thuật' : 'Diplomatic Code Review & Technical Alignment',
        description: isVi
          ? 'Đưa ra nhận xét phản biện mang tính xây dựng cao trên Pull Request và thương lượng giải pháp với đồng nghiệp quốc tế.'
          : 'Deliver constructive, diplomatic PR review comments and negotiate refactoring priorities.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Nhận xét một PR phức tạp có nhiều tranh luận với giọng văn ngoại giao, chuyên nghiệp.'
          : 'Review a complex contested PR with tactful diplomatic phrasing and clear architectural rationale.',
        required_skills: [
          {
            skill_id: 'cleft_sentences_focus',
            name: isVi ? 'Câu chẻ nhấn mạnh trọng tâm cốt lõi' : 'Cleft Sentences for Diplomatic Emphasis',
            category: 'writing',
            target_level: 'B2',
            prerequisites: ['mixed_conditionals'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'formal_contrast_connectors',
            name: isVi ? 'Từ nối đối lập: Nevertheless, In spite of' : 'Formal Contrast Connectors & Concession',
            category: 'writing',
            target_level: 'B2',
            prerequisites: ['passive_voice_objective'],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-tech-4',
        order: 4,
        title: isVi ? 'Trình bày chiến lược kỹ thuật cho lãnh đạo' : 'Executive Technical Alignment & Pitching',
        description: isVi
          ? 'Trình bày lộ trình kỹ thuật và đề xuất ngân sách công nghệ cho ban giám đốc phi kỹ thuật.'
          : 'Pitch high-level engineering roadmaps and justify tech debt refactoring to executive stakeholders.',
        target_cefr: 'C1',
        status: 'locked',
        real_world_task: isVi
          ? 'Trình bày bản tóm tắt điều hành 5 phút giải thích lý do cần nâng cấp hệ thống hạ tầng.'
          : 'Deliver a persuasive 5-minute executive briefing justifying infrastructure investment.',
        required_skills: [
          {
            skill_id: 'subjunctive_mood_executive',
            name: isVi ? 'Thể giả định trong đề xuất chiến lược' : 'Subjunctive Mood in Formal Recommendations',
            category: 'grammar',
            target_level: 'C1',
            prerequisites: ['cleft_sentences_focus'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      }
    ];
  } else if (isExamOrAcademic) {
    milestones = [
      {
        milestone_id: 'ms-exam-1',
        order: 1,
        title: isVi ? 'Xây dựng đoạn văn mạch lạc & Luận điểm vững chắc' : 'Cohesive Paragraph Construction & Evidence',
        description: isVi
          ? 'Nắm vững các từ nối học thuật, mệnh đề quan hệ và cách dẫn chứng số liệu để phát triển luận điểm chặt chẽ.'
          : 'Master academic discourse markers, relative clause cohesion, and structured evidence integration.',
        target_cefr: 'B1',
        status: 'in_progress',
        real_world_task: isVi
          ? 'Viết một đoạn văn nghị luận 100 từ tổng hợp hai góc nhìn đối lập.'
          : 'Draft a tight 100-word paragraph synthesizing two opposing perspectives.',
        required_skills: [
          {
            skill_id: 'academic_relative_clauses',
            name: isVi ? 'Mệnh đề quan hệ xác định & không xác định' : 'Defining & Non-Defining Relative Clauses',
            category: 'grammar',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'cohesive_discourse_markers',
            name: isVi ? 'Từ nối lập luận học thuật' : 'Academic Discourse Markers & Transitional Devices',
            category: 'writing',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-exam-2',
        order: 2,
        title: isVi ? 'Mệnh đề rút gọn & Phân tích văn bản phức tạp' : 'Participial Reduction & Analytical Stance',
        description: isVi
          ? 'Sử dụng phân từ hiện tại và quá khứ để rút gọn câu, nâng cao mật độ thông tin học thuật.'
          : 'Apply participial clause reduction and hedging to take defensible academic stances.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Phân tích và nhận xét một bài báo khoa học ngắn bằng ngôn ngữ học thuật chuẩn.'
          : 'Critique an analytical article using academic vocabulary and reduced relative clauses.',
        required_skills: [
          {
            skill_id: 'reduced_relative_clauses',
            name: isVi ? 'Rút gọn mệnh đề quan hệ (-ing / -ed)' : 'Participial Clauses & Reduced Relative Modifiers',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['academic_relative_clauses'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'academic_hedging_modality',
            name: isVi ? 'Kỹ thuật giảm nhẹ quan điểm (Hedging)' : 'Academic Hedging & Epistemic Modality',
            category: 'writing',
            target_level: 'B2',
            prerequisites: ['cohesive_discourse_markers'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-exam-3',
        order: 3,
        title: isVi ? 'Đảo ngữ nâng cao & Bài viết nghị luận hoàn chỉnh' : 'Advanced Inversion & Timed Essay Synthesis',
        description: isVi
          ? 'Làm chủ các cấu trúc ngữ pháp phức tạp nâng band điểm và hoàn thành bài viết có cấu trúc chặt chẽ trong thời gian quy định.'
          : 'Master high-level inversion syntax and write cohesive multi-paragraph analytical essays.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Hoàn thành bài viết học thuật 250 từ dưới áp lực thời gian với cấu trúc lập luận chuẩn mực.'
          : 'Produce a 250-word timed essay evaluating technological impacts with zero fatal cohesion errors.',
        required_skills: [
          {
            skill_id: 'negative_inversion',
            name: isVi ? 'Đảo ngữ với trạng từ phủ định' : 'Negative & Restrictive Inversion in Writing',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['reduced_relative_clauses'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'cleft_sentences_focus',
            name: isVi ? 'Câu chẻ tạo điểm nhấn học thuật' : 'Cleft Sentences for Thematic Highlighting',
            category: 'writing',
            target_level: 'B2',
            prerequisites: ['academic_hedging_modality'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-exam-4',
        order: 4,
        title: isVi ? 'Chinh phục C1 & Độc lập phân tích văn bản' : 'C1 Mastery & Autonomous Critical Synthesis',
        description: isVi
          ? 'Đạt độ thuần thục cao về văn phong học thuật, làm chủ thể giả định và phân biệt sắc thái từ vựng tinh tế.'
          : 'Achieve effortless academic fluency, register precision, and critical argument formulation.',
        target_cefr: 'C1',
        status: 'locked',
        real_world_task: isVi
          ? 'Thực hiện phân tích tổng hợp văn bản học thuật C1 với độ chính xác ngữ pháp và từ vựng tuyệt đối.'
          : 'Synthesize complex scholarly texts with nuanced lexical choice and sophisticated rhetorical cadence.',
        required_skills: [
          {
            skill_id: 'subjunctive_mood_executive',
            name: isVi ? 'Thể giả định trong văn bản học thuật cao cấp' : 'Subjunctive Structures in Formal Synthesis',
            category: 'grammar',
            target_level: 'C1',
            prerequisites: ['negative_inversion'],
            mastery_requirement: 'retained_mastery',
            is_mastered: false,
            accuracy: 0
          }
        ]
      }
    ];
  } else {
    // Balanced / General English
    milestones = [
      {
        milestone_id: 'ms-balanced-1',
        order: 1,
        title: isVi ? 'Nền tảng giao tiếp tự tin & Phản xạ chuẩn xác' : 'Conversational Fluency & Spontaneous Response',
        description: isVi
          ? 'Củng cố thì động từ thường dùng, các cấu trúc giao tiếp thông dụng và mở rộng vốn từ cho các tình huống hàng ngày.'
          : 'Build rock-solid command of core tenses and natural conversational cadence for daily situations.',
        target_cefr: 'B1',
        status: 'in_progress',
        real_world_task: isVi
          ? 'Tham gia cuộc trò chuyện 5 phút về sở thích cá nhân, kế hoạch tương lai và công việc thường nhật.'
          : 'Hold an engaging 5-minute conversation about daily life and career goals without hesitation.',
        required_skills: [
          {
            skill_id: 'present_perfect_past_simple',
            name: isVi ? 'Hiện tại hoàn thành vs Quá khứ đơn' : 'Present Perfect vs Past Simple in Dialogue',
            category: 'grammar',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'everyday_collocations',
            name: isVi ? 'Cụm từ giao tiếp tự nhiên hàng ngày' : 'Everyday Conversational Collocations',
            category: 'vocabulary',
            target_level: 'B1',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-balanced-2',
        order: 2,
        title: isVi ? 'Diễn đạt quan điểm & Thảo luận tình huống giả định' : 'Expressing Nuanced Opinions & Hypotheticals',
        description: isVi
          ? 'Học cách sử dụng câu điều kiện hỗn hợp và các từ nối tương phản để đưa ra quan điểm cá nhân sâu sắc.'
          : 'Express sophisticated opinions, handle hypothetical trade-offs, and defend viewpoints diplomatically.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Tranh luận về một chủ đề đời sống xã hội trong 10 phút, đưa ra lập luận và ví dụ minh họa rõ ràng.'
          : 'Debate a contemporary lifestyle topic for 10 minutes with clear argumentative backing.',
        required_skills: [
          {
            skill_id: 'mixed_conditionals',
            name: isVi ? 'Câu điều kiện trộn (Past Cause, Present Effect)' : 'Mixed Conditionals for Hypothetical Scenarios',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['present_perfect_past_simple'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'formal_contrast_connectors',
            name: isVi ? 'Từ nối tương phản: Nevertheless, Despite' : 'Formal Contrast & Nuanced Transitions',
            category: 'writing',
            target_level: 'B2',
            prerequisites: [],
            mastery_requirement: 'active_recall',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-balanced-3',
        order: 3,
        title: isVi ? 'Đảo ngữ nhấn mạnh & Làm chủ sắc thái ngôn ngữ' : 'Emphatic Inversion & Expressive Variety',
        description: isVi
          ? 'Nâng cấp khả năng diễn đạt thông qua cấu trúc đảo ngữ và câu chẻ để tạo ấn tượng mạnh mẽ khi giao tiếp.'
          : 'Enhance expressive variety with emphatic inversion and cleft structures for impactful communication.',
        target_cefr: 'B2',
        status: 'locked',
        real_world_task: isVi
          ? 'Trình bày một bài nói ngắn 3 phút với ngữ điệu và trọng âm nhấn mạnh tự nhiên như người bản xứ.'
          : 'Deliver an expressive 3-minute presentation with authentic emphasis and conversational flow.',
        required_skills: [
          {
            skill_id: 'negative_inversion',
            name: isVi ? 'Đảo ngữ với trạng từ phủ định' : 'Negative Inversion for Natural Emphasis',
            category: 'grammar',
            target_level: 'B2',
            prerequisites: ['mixed_conditionals'],
            mastery_requirement: 'guided_production',
            is_mastered: false,
            accuracy: 0
          },
          {
            skill_id: 'cleft_sentences_focus',
            name: isVi ? 'Câu chẻ nhấn mạnh thông tin trọng tâm' : 'Cleft Sentences for Focus & Impact',
            category: 'writing',
            target_level: 'B2',
            prerequisites: ['formal_contrast_connectors'],
            mastery_requirement: 'independent_production',
            is_mastered: false,
            accuracy: 0
          }
        ]
      },
      {
        milestone_id: 'ms-balanced-4',
        order: 4,
        title: isVi ? 'Làm chủ tiếng Anh toàn diện C1' : 'Complete Articulation & Effortless C1 Nuance',
        description: isVi
          ? 'Sử dụng tiếng Anh linh hoạt, tự nhiên trong mọi bối cảnh từ giao tiếp thân mật đến hội thảo chuyên nghiệp.'
          : 'Fluidly adapt register and tone across all formal, professional, and intimate casual situations.',
        target_cefr: 'C1',
        status: 'locked',
        real_world_task: isVi
          ? 'Chuyển đổi nhịp nhàng giữa văn phong thân mật và trang trọng trong các tình huống thực tế.'
          : 'Seamlessly shift between casual social banter and high-stakes formal discussions.',
        required_skills: [
          {
            skill_id: 'subjunctive_mood_executive',
            name: isVi ? 'Thể giả định & Cấu trúc trang trọng' : 'Subjunctive Mood & Formal Rhetoric',
            category: 'grammar',
            target_level: 'C1',
            prerequisites: ['cleft_sentences_focus'],
            mastery_requirement: 'retained_mastery',
            is_mastered: false,
            accuracy: 0
          }
        ]
      }
    ];
  }

  return {
    roadmap_id: `roadmap-${profile.id || 'learner'}-${Date.now()}`,
    learner_id: profile.id || 'learner-primary',
    goal_summary: goalSummary,
    current_milestone_id: milestones[0].milestone_id,
    assessed_starting_level: startingLevel,
    target_cefr: targetLevel,
    milestones,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * Checks learner's skill mastery against active milestone requirements.
 * When mastery criteria are satisfied, marks milestone completed and unlocks the next milestone!
 */
export function syncAndAdvanceRoadmap(
  roadmap: CurriculumRoadmap,
  userSkills: LearnerSkillState[]
): {
  roadmap: CurriculumRoadmap;
  didAdvance: boolean;
  completedMilestone?: RoadmapMilestone;
  newlyUnlockedMilestone?: RoadmapMilestone;
} {
  let didAdvance = false;
  let completedMilestone: RoadmapMilestone | undefined;
  let newlyUnlockedMilestone: RoadmapMilestone | undefined;

  const currentIdx = roadmap.milestones.findIndex(
    m => m.milestone_id === roadmap.current_milestone_id
  );
  if (currentIdx === -1) {
    return { roadmap, didAdvance: false };
  }

  const activeMilestone = roadmap.milestones[currentIdx];

  // Update skill mastery status inside active milestone
  let masteredCount = 0;
  for (const skillReq of activeMilestone.required_skills) {
    const userSkill = userSkills.find(
      s => s.skill_id === skillReq.skill_id ||
           s.skill_name.toLowerCase() === skillReq.name.toLowerCase()
    );

    if (userSkill) {
      skillReq.accuracy = userSkill.accuracy_rate || 0;
      const isRetainedOrApplication =
        userSkill.mastery_stage === 'retained_mastery' ||
        userSkill.mastery_stage === 'application' ||
        userSkill.status === 'mastered' ||
        userSkill.status === 'mostly_mastered';

      const meetsRequirement =
        (skillReq.mastery_requirement === 'recognition' && (userSkill.mastery_stage !== 'exposure' || userSkill.accuracy_rate >= 0.7)) ||
        (skillReq.mastery_requirement === 'active_recall' && (userSkill.mastery_stage === 'active_recall' || isRetainedOrApplication)) ||
        (skillReq.mastery_requirement === 'guided_production' && isRetainedOrApplication) ||
        (skillReq.mastery_requirement === 'independent_production' && isRetainedOrApplication && userSkill.accuracy_rate >= 0.75) ||
        (skillReq.mastery_requirement === 'retained_mastery' && userSkill.mastery_stage === 'retained_mastery');

      if (meetsRequirement) {
        skillReq.is_mastered = true;
        masteredCount++;
      }
    }
  }

  // If all (or at least 80%) of required skills in current milestone are mastered, advance!
  const requiredCount = activeMilestone.required_skills.length;
  const isMilestoneComplete = requiredCount > 0 && masteredCount >= Math.ceil(requiredCount * 0.75);

  if (isMilestoneComplete && activeMilestone.status !== 'completed') {
    activeMilestone.status = 'completed';
    activeMilestone.completed_at = new Date().toISOString();
    didAdvance = true;
    completedMilestone = activeMilestone;

    // Unlock next milestone if present
    const nextMilestone = roadmap.milestones[currentIdx + 1];
    if (nextMilestone) {
      nextMilestone.status = 'in_progress';
      nextMilestone.unlocked_at = new Date().toISOString();
      roadmap.current_milestone_id = nextMilestone.milestone_id;
      newlyUnlockedMilestone = nextMilestone;
    }
  }

  roadmap.updated_at = new Date().toISOString();
  return {
    roadmap,
    didAdvance,
    completedMilestone,
    newlyUnlockedMilestone
  };
}
