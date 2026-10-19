import { Question, SectionType, EnglishLevel } from '../src/types/learning.js';

export interface DiagnosticBankItem {
  id: string;
  category: SectionType;
  skillId: string;
  skillName: string;
  difficulty: EnglishLevel;
  topic: 'general' | 'workplace_tech';
  question: Question;
}

export const DIAGNOSTIC_BANK: DiagnosticBankItem[] = [
  // ==========================================
  // GRAMMAR: A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'diag-gram-a2-past-1',
    category: 'grammar',
    skillId: 'past_simple_regular_irregular',
    skillName: 'Past Simple Regular & Irregular',
    difficulty: 'A2',
    topic: 'general',
    question: {
      id: 'dg-a2-1',
      section: 'grammar',
      skill_id: 'past_simple_regular_irregular',
      skill_name: 'Past Simple Regular & Irregular',
      question_type: 'multiple_choice',
      difficulty: 'A2',
      context_topic: 'general',
      prompt: 'Yesterday, our team ____ the weekly progress report before leaving the office.',
      options: [
        { id: 'A', text: 'finished' },
        { id: 'B', text: 'finish' },
        { id: 'C', text: 'is finishing' },
        { id: 'D', text: 'have finished' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'finished',
      accepted_alternatives: ['finished'],
      hint: 'Chú ý từ chỉ thời gian "Yesterday" (hôm qua). Hành động đã hoàn tất trong quá khứ.',
      explanation_rule: 'Với mốc thời gian xác định trong quá khứ ("Yesterday"), ta sử dụng thì Past Simple (V-ed hoặc bất quy tắc).'
    }
  },
  {
    id: 'diag-gram-a2-pres-cont-1',
    category: 'grammar',
    skillId: 'present_simple_vs_continuous',
    skillName: 'Present Simple vs. Continuous',
    difficulty: 'A2',
    topic: 'general',
    question: {
      id: 'dg-a2-2',
      section: 'grammar',
      skill_id: 'present_simple_vs_continuous',
      skill_name: 'Present Simple vs. Continuous',
      question_type: 'multiple_choice',
      difficulty: 'A2',
      context_topic: 'general',
      prompt: 'Right now, the engineering team ____ a new update to fix the payment gateway.',
      options: [
        { id: 'A', text: 'deploys' },
        { id: 'B', text: 'is deploying' },
        { id: 'C', text: 'deployed' },
        { id: 'D', text: 'was deploying' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'is deploying',
      accepted_alternatives: ['is deploying'],
      hint: 'Chú ý cụm "Right now" (ngay lúc này) chỉ hành động đang diễn ra tại thời điểm nói.',
      explanation_rule: 'Dùng thì Present Continuous (is/are + V-ing) cho sự việc đang diễn ra ngay tại thời điểm nói.'
    }
  },
  {
    id: 'diag-gram-b1-pres-perf-1',
    category: 'grammar',
    skillId: 'present_perfect_vs_past_simple',
    skillName: 'Present Perfect vs. Past Simple',
    difficulty: 'B1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-b1-1',
      section: 'grammar',
      skill_id: 'present_perfect_vs_past_simple',
      skill_name: 'Present Perfect vs. Past Simple',
      question_type: 'multiple_choice',
      difficulty: 'B1',
      context_topic: 'workplace_tech',
      prompt: 'Our company ____ three new software engineers since January.',
      options: [
        { id: 'A', text: 'hired' },
        { id: 'B', text: 'has hired' },
        { id: 'C', text: 'hires' },
        { id: 'D', text: 'was hiring' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'has hired',
      accepted_alternatives: ['has hired'],
      hint: 'Chú ý dấu hiệu "since + mốc thời gian" (kể từ tháng 1 đến nay).',
      explanation_rule: 'Cấu trúc "since + mốc thời gian" diễn tả hành động bắt đầu trong quá khứ và kéo dài đến hiện tại, dùng thì Present Perfect (has/have + V3).'
    }
  },
  {
    id: 'diag-gram-b1-conditionals-1',
    category: 'grammar',
    skillId: 'second_conditional',
    skillName: 'Second Conditional (Hypothetical Present)',
    difficulty: 'B1',
    topic: 'general',
    question: {
      id: 'dg-b1-cond',
      section: 'grammar',
      skill_id: 'second_conditional',
      skill_name: 'Second Conditional',
      question_type: 'multiple_choice',
      difficulty: 'B1',
      context_topic: 'general',
      prompt: 'If I ____ more free time on weekends, I would take an advanced English writing course.',
      options: [
        { id: 'A', text: 'have' },
        { id: 'B', text: 'had' },
        { id: 'C', text: 'will have' },
        { id: 'D', text: 'would have' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'had',
      accepted_alternatives: ['had'],
      hint: 'Vế kết quả là "would take" (giả định ở hiện tại). Vế If dùng thì gì?',
      explanation_rule: 'Câu điều kiện loại 2: If + S + Past Simple (had), S + would + V. Dùng để giả định một tình huống không có thật ở hiện tại.'
    }
  },
  {
    id: 'diag-gram-b1-modals-1',
    category: 'grammar',
    skillId: 'modal_verbs_obligation',
    skillName: 'Modal Verbs of Obligation & Necessity',
    difficulty: 'B1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-b1-mod',
      section: 'grammar',
      skill_id: 'modal_verbs_obligation',
      skill_name: 'Modal Verbs of Obligation',
      question_type: 'multiple_choice',
      difficulty: 'B1',
      context_topic: 'workplace_tech',
      prompt: 'Developers ____ commit directly to the production branch without a peer code review.',
      options: [
        { id: 'A', text: 'must not' },
        { id: 'B', text: 'do not need to' },
        { id: 'C', text: 'should' },
        { id: 'D', text: 'might' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'must not',
      accepted_alternatives: ['must not'],
      hint: 'Đây là quy tắc cấm đoán nghiêm ngặt trong kỹ thuật (không được phép làm).',
      explanation_rule: '"Must not" diễn tả sự cấm chỉ mang tính quy định, trong khi "don\'t need to" chỉ sự không cần thiết.'
    }
  },
  {
    id: 'diag-gram-b2-past-perf-1',
    category: 'grammar',
    skillId: 'past_perfect_narrative',
    skillName: 'Past Perfect in Complex Narrative',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-b2-1',
      section: 'grammar',
      skill_id: 'past_perfect_narrative',
      skill_name: 'Past Perfect Narrative',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'By the time the product manager joined the meeting, the engineers ____ the database migration.',
      options: [
        { id: 'A', text: 'already completed' },
        { id: 'B', text: 'had already completed' },
        { id: 'C', text: 'have already completed' },
        { id: 'D', text: 'were already completing' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'had already completed',
      accepted_alternatives: ['had already completed', 'had completed'],
      hint: 'Hành động "hoàn thành việc chuyển đổi dữ liệu" xảy ra TRƯỚC thời điểm "product manager vào họp" trong quá khứ.',
      explanation_rule: 'Cấu trúc "By the time + Past Simple, Past Perfect (had + V3)". Diễn tả hành động hoàn tất trước một mốc quá khứ.'
    }
  },
  {
    id: 'diag-gram-b2-mixed-cond-1',
    category: 'grammar',
    skillId: 'mixed_conditionals',
    skillName: 'Third & Mixed Conditionals',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-b2-cond',
      section: 'grammar',
      skill_id: 'mixed_conditionals',
      skill_name: 'Third & Mixed Conditionals',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'If the QA lead had flagged the regression on Monday, our staging server ____ stable today.',
      options: [
        { id: 'A', text: 'would be' },
        { id: 'B', text: 'would have been' },
        { id: 'C', text: 'will be' },
        { id: 'D', text: 'had been' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'would be',
      accepted_alternatives: ['would be'],
      hint: 'Hãy nhìn từ "today" ở vế kết quả. Một sự việc trong quá khứ (on Monday) ảnh hưởng đến trạng thái hiện tại (today).',
      explanation_rule: 'Mixed Conditional (3-2): Giả định quá khứ (had flagged on Monday) đem lại kết quả ở hiện tại (would be stable today).'
    }
  },
  {
    id: 'diag-gram-b2-passive-tech',
    category: 'grammar',
    skillId: 'passive_voice_technical',
    skillName: 'Passive Voice in Technical Contexts',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-b2-pass',
      section: 'grammar',
      skill_id: 'passive_voice_technical',
      skill_name: 'Passive Voice in Technical Contexts',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'During yesterday\'s maintenance window, the network outage ____ by the infrastructure team within 20 minutes.',
      options: [
        { id: 'A', text: 'was resolved' },
        { id: 'B', text: 'resolved' },
        { id: 'C', text: 'has been resolved' },
        { id: 'D', text: 'is resolved' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'was resolved',
      accepted_alternatives: ['was resolved'],
      hint: 'Chủ ngữ "the network outage" là số ít, và sự kiện "yesterday\'s maintenance window" xảy ra trong quá khứ.',
      explanation_rule: 'Dùng thì Past Simple thể bị động cho chủ ngữ số ít: "was + resolved".'
    }
  },
  {
    id: 'diag-gram-b2-cleft-1',
    category: 'grammar',
    skillId: 'cleft_sentences_focus',
    skillName: 'Cleft Sentences for Emphasis',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-b2-cleft',
      section: 'grammar',
      skill_id: 'cleft_sentences_focus',
      skill_name: 'Cleft Sentences for Emphasis',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'It was the unhandled null exception, not the database timeout, that ____ the server crash.',
      options: [
        { id: 'A', text: 'triggered' },
        { id: 'B', text: 'triggering' },
        { id: 'C', text: 'triggers' },
        { id: 'D', text: 'to trigger' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'triggered',
      accepted_alternatives: ['triggered'],
      hint: 'Cấu trúc câu chẻ nhấn mạnh: "It was + đối tượng + that + V-past".',
      explanation_rule: 'Cleft sentence: It is/was + X + that/who + V. Động từ chia theo thời điểm quá khứ tương thích với "was".'
    }
  },
  {
    id: 'diag-gram-c1-inversion-1',
    category: 'grammar',
    skillId: 'inversion_negative_adverbials',
    skillName: 'Inversion with Negative Adverbials',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-c1-1',
      section: 'grammar',
      skill_id: 'inversion_negative_adverbials',
      skill_name: 'Inversion with Negative Adverbials',
      question_type: 'multiple_choice',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      prompt: 'Rarely ____ such a seamless cross-team integration without any deployment delays.',
      options: [
        { id: 'A', text: 'we have witnessed' },
        { id: 'B', text: 'have we witnessed' },
        { id: 'C', text: 'did we witnessed' },
        { id: 'D', text: 'we witnessed' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'have we witnessed',
      accepted_alternatives: ['have we witnessed'],
      hint: 'Khi trạng từ phủ định "Rarely" đứng đầu câu, cần đảo trợ động từ lên trước chủ ngữ.',
      explanation_rule: 'Cấu trúc đảo ngữ: Rarely + Auxiliary (have) + Subject (we) + Main Verb (witnessed).'
    }
  },
  {
    id: 'diag-gram-c1-participle-1',
    category: 'grammar',
    skillId: 'participle_clauses_advanced',
    skillName: 'Participle Clauses & Sentence Reduction',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-c1-part',
      section: 'grammar',
      skill_id: 'participle_clauses_advanced',
      skill_name: 'Participle Clauses',
      question_type: 'multiple_choice',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      prompt: '____ the legacy monolithic architecture for three years, the lead architect easily identified the bottlenecks.',
      options: [
        { id: 'A', text: 'Having maintained' },
        { id: 'B', text: 'Maintained' },
        { id: 'C', text: 'To maintain' },
        { id: 'D', text: 'Having been maintain' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'Having maintained',
      accepted_alternatives: ['Having maintained'],
      hint: 'Hành động duy trì kiến trúc đã diễn ra trong suốt 3 năm trước khi xác định được các nút thắt cổ chai.',
      explanation_rule: 'Dùng hoàn thành phân từ "Having + V3" để rút gọn mệnh đề trạng ngữ chỉ hành động xảy ra trước hành động chính.'
    }
  },

  // ==========================================
  // VOCABULARY: A2 / B1 / B2 / C1
  // ==========================================
  {
    id: 'diag-voc-a2-work-1',
    category: 'vocabulary',
    skillId: 'daily_work_action_verbs',
    skillName: 'Daily Workplace Verbs',
    difficulty: 'A2',
    topic: 'general',
    question: {
      id: 'dg-voc-a2',
      section: 'vocabulary',
      skill_id: 'daily_work_action_verbs',
      skill_name: 'Daily Workplace Verbs',
      question_type: 'multiple_choice',
      difficulty: 'A2',
      context_topic: 'general',
      prompt: 'Please remember to ____ the signed contract to your department manager before 5 PM.',
      options: [
        { id: 'A', text: 'send' },
        { id: 'B', text: 'remind' },
        { id: 'C', text: 'attend' },
        { id: 'D', text: 'listen' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'send',
      accepted_alternatives: ['send'],
      hint: 'Động từ nào chỉ việc gửi hoặc chuyển giao tài liệu ("the signed contract to your manager")?',
      explanation_rule: '"Send [something] to [someone]" là cấu trúc chính xác. "Remind" đòi hỏi tân ngữ người ("remind someone of something"), "attend" không đi với giới từ to theo nghĩa này.'
    }
  },
  {
    id: 'diag-voc-b1-colloc-1',
    category: 'vocabulary',
    skillId: 'collocation_schedule',
    skillName: 'Workplace Collocations (B1)',
    difficulty: 'B1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-b1',
      section: 'vocabulary',
      skill_id: 'collocation_schedule',
      skill_name: 'Workplace Collocations',
      question_type: 'multiple_choice',
      difficulty: 'B1',
      context_topic: 'workplace_tech',
      prompt: 'Could you please ____ a 30-minute sync meeting with the product owner for tomorrow afternoon?',
      options: [
        { id: 'A', text: 'schedule' },
        { id: 'B', text: 'invent' },
        { id: 'C', text: 'manufacture' },
        { id: 'D', text: 'compose' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'schedule',
      accepted_alternatives: ['schedule'],
      hint: 'Từ nào mang nghĩa lên lịch/sắp xếp một cuộc họp?',
      explanation_rule: 'Collocation thông dụng trong công việc là "schedule a meeting" (lên lịch họp).'
    }
  },
  {
    id: 'diag-voc-b1-phrasal-1',
    category: 'vocabulary',
    skillId: 'phrasal_verbs_workplace',
    skillName: 'Phrasal Verbs in Collaboration',
    difficulty: 'B1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-b1-pv',
      section: 'vocabulary',
      skill_id: 'phrasal_verbs_workplace',
      skill_name: 'Phrasal Verbs in Collaboration',
      question_type: 'multiple_choice',
      difficulty: 'B1',
      context_topic: 'workplace_tech',
      prompt: 'We need to ____ with the design team before finalizing the user interface layout.',
      options: [
        { id: 'A', text: 'follow up' },
        { id: 'B', text: 'give in' },
        { id: 'C', text: 'turn down' },
        { id: 'D', text: 'fall apart' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'follow up',
      accepted_alternatives: ['follow up'],
      hint: 'Cụm động từ chỉ việc trao đổi tiếp hoặc theo dõi tiến độ công việc với ai đó.',
      explanation_rule: '"Follow up with someone" là cụm động từ chỉ hành động liên hệ tiếp tục để cập nhật thông tin.'
    }
  },
  {
    id: 'diag-voc-b2-mitigate-1',
    category: 'vocabulary',
    skillId: 'collocation_mitigate',
    skillName: 'Precision Collocation (Mitigate)',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-b2-mit',
      section: 'vocabulary',
      skill_id: 'collocation_mitigate',
      skill_name: 'Precision Collocation (Mitigate)',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'To ____ the financial risk of sudden foreign exchange fluctuations, the CFO recommended hedging options.',
      options: [
        { id: 'A', text: 'mitigate' },
        { id: 'B', text: 'aggravate' },
        { id: 'C', text: 'defer' },
        { id: 'D', text: 'forfeit' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'mitigate',
      accepted_alternatives: ['mitigate'],
      hint: 'Từ chuyên ngành mang nghĩa "làm giảm bớt mức độ nghiêm trọng của rủi ro"?',
      explanation_rule: '"Mitigate the risk" là collocation chuẩn chỉ việc làm giảm nhẹ rủi ro. "Aggravate" là làm trầm trọng hơn (trái nghĩa), "defer" là hoãn lại, "forfeit" là đánh mất/từ bỏ quyền lợi.'
    }
  },
  {
    id: 'diag-voc-b2-tradeoff-1',
    category: 'vocabulary',
    skillId: 'tradeoff_and_leverage',
    skillName: 'Engineering Vocabulary (Trade-off & Leverage)',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-b2-to',
      section: 'vocabulary',
      skill_id: 'tradeoff_and_leverage',
      skill_name: 'Engineering Vocabulary',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'Every architectural decision involves a ____ between rapid feature delivery and long-term maintainability.',
      options: [
        { id: 'A', text: 'trade-off' },
        { id: 'B', text: 'bottleneck' },
        { id: 'C', text: 'standstill' },
        { id: 'D', text: 'fallback' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'trade-off',
      accepted_alternatives: ['trade-off'],
      hint: 'Thuật ngữ chỉ sự đánh đổi hoặc cân nhắc giữa hai yếu tố đối nghịch.',
      explanation_rule: '"Trade-off" là sự đánh đổi giữa hai tiêu chí đối nghịch (tốc độ ra mắt tính năng vs khả năng bảo trì mã nguồn).'
    }
  },
  {
    id: 'diag-voc-b2-streamline-1',
    category: 'vocabulary',
    skillId: 'collocation_streamline',
    skillName: 'Process Optimization Vocabulary',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-b2-stream',
      section: 'vocabulary',
      skill_id: 'collocation_streamline',
      skill_name: 'Process Optimization Vocabulary',
      question_type: 'multiple_choice',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'By automating repetitive CI/CD deployments, the platform team managed to ____ the release cycle.',
      options: [
        { id: 'A', text: 'streamline' },
        { id: 'B', text: 'complicate' },
        { id: 'C', text: 'stagnate' },
        { id: 'D', text: 'postpone' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'streamline',
      accepted_alternatives: ['streamline'],
      hint: 'Động từ chỉ việc tinh giản, tối ưu hóa quy trình để đạt hiệu quả cao hơn.',
      explanation_rule: '"Streamline the process/cycle" nghĩa là tinh gọn quy trình bằng cách loại bỏ thao tác dư thừa.'
    }
  },
  {
    id: 'diag-voc-c1-viable-1',
    category: 'vocabulary',
    skillId: 'nuanced_adjectives_c1',
    skillName: 'Nuanced Professional Adjectives (C1)',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-c1',
      section: 'vocabulary',
      skill_id: 'nuanced_adjectives_c1',
      skill_name: 'Nuanced Professional Adjectives',
      question_type: 'multiple_choice',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      prompt: 'Due to severe budget constraints, building a fully custom CRM is simply not economically ____ at this stage.',
      options: [
        { id: 'A', text: 'viable' },
        { id: 'B', text: 'tangible' },
        { id: 'C', text: 'subtle' },
        { id: 'D', text: 'arbitrary' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'viable',
      accepted_alternatives: ['viable', 'feasible'],
      hint: 'Từ nào mang nghĩa "khả thi/có thể tồn tại và thành công về mặt kinh tế"?',
      explanation_rule: '"economically viable" là collocation cao cấp chỉ tính khả thi về mặt tài chính.'
    }
  },
  {
    id: 'diag-voc-c1-discrepancy-1',
    category: 'vocabulary',
    skillId: 'advanced_analytical_nouns',
    skillName: 'Analytical & Diagnostic Nouns',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-voc-c1-disc',
      section: 'vocabulary',
      skill_id: 'advanced_analytical_nouns',
      skill_name: 'Analytical & Diagnostic Nouns',
      question_type: 'multiple_choice',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      prompt: 'The audit revealed a substantial ____ between the reported server costs and the actual cloud billing telemetry.',
      options: [
        { id: 'A', text: 'discrepancy' },
        { id: 'B', text: 'conformity' },
        { id: 'C', text: 'unanimity' },
        { id: 'D', text: 'synergy' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'discrepancy',
      accepted_alternatives: ['discrepancy'],
      hint: 'Danh từ chỉ sự sai lệch, khác biệt bất thường giữa hai nguồn số liệu đáng lẽ phải khớp nhau.',
      explanation_rule: '"Discrepancy" chỉ sự bất nhất, không khớp giữa các số liệu báo cáo và thực tế.'
    }
  },

  // ==========================================
  // READING PASSAGES & QUESTIONS
  // ==========================================
  // PASSAGE 1: Quick / B1 (Managing Screen Fatigue)
  {
    id: 'diag-read-b1-remote-1',
    category: 'reading',
    skillId: 'reading_main_idea',
    skillName: 'Reading Comprehension (Main Idea)',
    difficulty: 'B1',
    topic: 'general',
    question: {
      id: 'dg-read-b1-q1',
      section: 'reading',
      skill_id: 'reading_main_idea',
      skill_name: 'Reading Comprehension (Main Idea)',
      question_type: 'reading_comprehension',
      difficulty: 'B1',
      context_topic: 'general',
      reading_passage: {
        title: 'Managing Screen Fatigue',
        word_count: 104,
        topic: 'Health & Remote Work',
        text: 'Working from home offers immense flexibility, but prolonged screen exposure frequently causes eye strain and cognitive fatigue. Health specialists recommend following the 20-20-20 guideline: every twenty minutes, look away from your monitor at an object twenty feet away for at least twenty seconds. Additionally, scheduling short physical breaks between tasks helps maintain concentration throughout the afternoon. Standing up, stretching, or drinking water resets your focus far more effectively than scrolling on your phone during break time.'
      },
      prompt: 'What is the primary advice given in the passage to combat cognitive fatigue?',
      options: [
        { id: 'A', text: 'Work continuously without pausing until all tasks are finished' },
        { id: 'B', text: 'Take structured physical breaks and periodic eye rests away from screens' },
        { id: 'C', text: 'Check mobile phone social media feeds during work pauses' },
        { id: 'D', text: 'Increase monitor brightness to improve visual clarity' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'Take structured physical breaks and periodic eye rests away from screens',
      accepted_alternatives: ['B'],
      hint: 'Nhìn vào quy tắc 20-20-20 và lời khuyên về "short physical breaks".',
      explanation_rule: 'Đoạn văn khuyên áp dụng quy tắc 20-20-20 và vận động nhẹ thay vì tiếp tục nhìn vào màn hình điện thoại.'
    }
  },

  // PASSAGE 2: Standard / B2 (The Discipline of Technical Refactoring) - 3 LINKED QUESTIONS
  {
    id: 'diag-read-b2-techdebt-1',
    category: 'reading',
    skillId: 'reading_inference_tech',
    skillName: 'Reading Inference & Author Intent',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-read-b2-q1',
      section: 'reading',
      skill_id: 'reading_inference_tech',
      skill_name: 'Reading Inference & Author Intent',
      question_type: 'reading_comprehension',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      reading_passage: {
        title: 'The Discipline of Technical Refactoring',
        word_count: 145,
        topic: 'Engineering Management',
        text: 'When software startups transition into scaling companies, shortcuts taken during early product validation inevitably transform into systemic friction. Rushing features without modular architectural boundaries creates brittle codebases where a minor patch in payment logic can unexpectedly break user authentication. Experienced tech leads do not advocate for complete system halts or year-long rewrites. Instead, disciplined organizations institutionalize a continuous refactoring quota: allocating roughly fifteen to twenty percent of engineering capacity every sprint to resolve architectural debt, upgrade dependencies, and improve automated regression coverage. This sustainable balance preserves delivery velocity while maintaining platform resilience.'
      },
      prompt: 'What does the author suggest about addressing technical debt in a growing company?',
      options: [
        { id: 'A', text: 'Early-stage shortcuts should never be taken under any circumstances' },
        { id: 'B', text: 'Teams should allocate a regular, bounded portion of sprint time to continuous cleanup' },
        { id: 'C', text: 'Companies must freeze all new feature development until the system is rewritten' },
        { id: 'D', text: 'Automated regression testing is unnecessary once a product matures' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'Teams should allocate a regular, bounded portion of sprint time to continuous cleanup',
      accepted_alternatives: ['B'],
      hint: 'Đọc câu: "allocating roughly fifteen to twenty percent of engineering capacity every sprint to resolve architectural debt..."',
      explanation_rule: 'Tác giả ủng hộ phương pháp tiếp cận bền vững: dành 15-20% công suất mỗi sprint để refactor liên tục.'
    }
  },
  {
    id: 'diag-read-b2-techdebt-2',
    category: 'reading',
    skillId: 'reading_detail_inference',
    skillName: 'Reading Detail & Causal Inference',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-read-b2-q2',
      section: 'reading',
      skill_id: 'reading_detail_inference',
      skill_name: 'Reading Detail & Causal Inference',
      question_type: 'reading_comprehension',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      reading_passage: {
        title: 'The Discipline of Technical Refactoring',
        word_count: 145,
        topic: 'Engineering Management',
        text: 'When software startups transition into scaling companies, shortcuts taken during early product validation inevitably transform into systemic friction. Rushing features without modular architectural boundaries creates brittle codebases where a minor patch in payment logic can unexpectedly break user authentication. Experienced tech leads do not advocate for complete system halts or year-long rewrites. Instead, disciplined organizations institutionalize a continuous refactoring quota: allocating roughly fifteen to twenty percent of engineering capacity every sprint to resolve architectural debt, upgrade dependencies, and improve automated regression coverage. This sustainable balance preserves delivery velocity while maintaining platform resilience.'
      },
      prompt: 'According to the passage, what is an immediate risk of developing software without modular boundaries?',
      options: [
        { id: 'A', text: 'Engineering salaries become unsustainable' },
        { id: 'B', text: 'A localized change in one component can break an unrelated system feature' },
        { id: 'C', text: 'Startups lose the ability to validate early product features' },
        { id: 'D', text: 'Automated tests run significantly faster than expected' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'A localized change in one component can break an unrelated system feature',
      accepted_alternatives: ['B'],
      hint: 'Hãy tìm ví dụ trong bài về "minor patch in payment logic" và "user authentication".',
      explanation_rule: 'Đoạn văn chỉ rõ: thiếu tính module hóa khiến "a minor patch in payment logic can unexpectedly break user authentication".'
    }
  },
  {
    id: 'diag-read-b2-techdebt-3',
    category: 'reading',
    skillId: 'reading_vocabulary_in_context',
    skillName: 'Vocabulary in Context & Synthesis',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-read-b2-q3',
      section: 'reading',
      skill_id: 'reading_vocabulary_in_context',
      skill_name: 'Vocabulary in Context & Synthesis',
      question_type: 'reading_comprehension',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      reading_passage: {
        title: 'The Discipline of Technical Refactoring',
        word_count: 145,
        topic: 'Engineering Management',
        text: 'When software startups transition into scaling companies, shortcuts taken during early product validation inevitably transform into systemic friction. Rushing features without modular architectural boundaries creates brittle codebases where a minor patch in payment logic can unexpectedly break user authentication. Experienced tech leads do not advocate for complete system halts or year-long rewrites. Instead, disciplined organizations institutionalize a continuous refactoring quota: allocating roughly fifteen to twenty percent of engineering capacity every sprint to resolve architectural debt, upgrade dependencies, and improve automated regression coverage. This sustainable balance preserves delivery velocity while maintaining platform resilience.'
      },
      prompt: 'In this context, what does the word "brittle" most closely mean?',
      options: [
        { id: 'A', text: 'Easily damaged or prone to failure under minor stress' },
        { id: 'B', text: 'Highly flexible and adaptable to market demands' },
        { id: 'C', text: 'Strictly secure against unauthorized access' },
        { id: 'D', text: 'Extremely well-documented and transparent' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'Easily damaged or prone to failure under minor stress',
      accepted_alternatives: ['A'],
      hint: '"Brittle" trong vật lý nghĩa là giòn, dễ gãy; trong phần mềm là hệ thống dễ bị lỗi khi có thay đổi nhỏ.',
      explanation_rule: '"Brittle codebases" là thuật ngữ chỉ mã nguồn dễ vỡ, dễ phát sinh lỗi khi bị tác động.'
    }
  },

  // PASSAGE 3: Comprehensive / C1 (Asynchronous Culture & Cognitive Bandwidth) - 2 LINKED QUESTIONS
  {
    id: 'diag-read-c1-async-1',
    category: 'reading',
    skillId: 'reading_tone_implication_c1',
    skillName: 'Synthesizing Tone & Implications (C1)',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-read-c1-q1',
      section: 'reading',
      skill_id: 'reading_tone_implication_c1',
      skill_name: 'Synthesizing Tone & Implications',
      question_type: 'reading_comprehension',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      reading_passage: {
        title: 'Asynchronous Culture and Cognitive Bandwidth',
        word_count: 168,
        topic: 'Organizational Architecture',
        text: 'The proliferation of enterprise messaging channels was heralded as the demise of bureaucratic latency. However, unconstrained immediacy has merely substituted scheduled meetings with perpetual micro-interruptions. When engineers are perpetually tethered to real-time notification streams, the requisite cognitive immersion for deep algorithmic design is systematically fragmented. Genuine asynchronous maturity is not merely the adoption of collaborative software; it is an organizational covenant. It requires deliberate default-to-documentation policies, generous response SLAs measured in hours rather than seconds, and executive validation that uninterrupted contemplation is fundamentally productive labor.'
      },
      prompt: 'What central paradox regarding real-time messaging does the author articulate?',
      options: [
        { id: 'A', text: 'Tools intended to eliminate latency have created continuous cognitive disruption' },
        { id: 'B', text: 'Enterprise software has made scheduled meetings entirely obsolete' },
        { id: 'C', text: 'Deep thinking is only achievable in traditional co-located offices' },
        { id: 'D', text: 'Engineers prefer instant messaging over detailed documentation' }
      ],
      expected_answer_ids: ['A'],
      expected_answer_text: 'Tools intended to eliminate latency have created continuous cognitive disruption',
      accepted_alternatives: ['A'],
      hint: 'Chú ý tương phản giữa "heralded as the demise of latency" và "perpetual micro-interruptions".',
      explanation_rule: 'Nghịch lý được tác giả nêu: công cụ nhằm giảm độ trễ lại tạo ra sự phân mảnh chú ý liên tục.'
    }
  },
  {
    id: 'diag-read-c1-async-2',
    category: 'reading',
    skillId: 'reading_author_recommendation_c1',
    skillName: 'Author Solution & Subtext (C1)',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-read-c1-q2',
      section: 'reading',
      skill_id: 'reading_author_recommendation_c1',
      skill_name: 'Author Solution & Subtext',
      question_type: 'reading_comprehension',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      reading_passage: {
        title: 'Asynchronous Culture and Cognitive Bandwidth',
        word_count: 168,
        topic: 'Organizational Architecture',
        text: 'The proliferation of enterprise messaging channels was heralded as the demise of bureaucratic latency. However, unconstrained immediacy has merely substituted scheduled meetings with perpetual micro-interruptions. When engineers are perpetually tethered to real-time notification streams, the requisite cognitive immersion for deep algorithmic design is systematically fragmented. Genuine asynchronous maturity is not merely the adoption of collaborative software; it is an organizational covenant. It requires deliberate default-to-documentation policies, generous response SLAs measured in hours rather than seconds, and executive validation that uninterrupted contemplation is fundamentally productive labor.'
      },
      prompt: 'According to the author, what is essential for an organization to achieve true asynchronous maturity?',
      options: [
        { id: 'A', text: 'Requiring staff to respond to messages within five minutes' },
        { id: 'B', text: 'Establishing cultural norms with documented context and flexible response expectations' },
        { id: 'C', text: 'Banning all written communication in favor of daily standups' },
        { id: 'D', text: 'Investing exclusively in automated code completion agents' }
      ],
      expected_answer_ids: ['B'],
      expected_answer_text: 'Establishing cultural norms with documented context and flexible response expectations',
      accepted_alternatives: ['B'],
      hint: 'Tìm câu: "default-to-documentation policies, generous response SLAs measured in hours rather than seconds..."',
      explanation_rule: 'Tác giả nhấn mạnh văn hóa ưu tiên tài liệu và khung thời gian phản hồi theo giờ thay vì giây.'
    }
  },

  // ==========================================
  // ORIGINAL WRITING TASKS: B1 / B2 / C1
  // ==========================================
  {
    id: 'diag-write-b1-workflow',
    category: 'writing',
    skillId: 'writing_routine_opinion',
    skillName: 'Describing Routine & Expressing Opinions (B1)',
    difficulty: 'B1',
    topic: 'general',
    question: {
      id: 'dg-write-b1',
      section: 'writing',
      skill_id: 'writing_routine_opinion',
      skill_name: 'Describing Routine & Opinions',
      question_type: 'free_writing',
      difficulty: 'B1',
      context_topic: 'general',
      prompt: 'Write 3 to 4 sentences in English describing your daily routine or favorite way to spend your weekend. Explain why this routine works well for you.',
      hint: 'Sử dụng thì Present Simple cho thói quen hàng ngày và từ nối như "Usually", "Because", "In addition".',
      explanation_rule: 'Đánh giá độ chính xác ngữ pháp thì hiện tại, vốn từ cơ bản và khả năng liên kết câu tự nhiên.'
    }
  },
  {
    id: 'diag-write-b2-workplace-update',
    category: 'writing',
    skillId: 'writing_workplace_communication',
    skillName: 'Professional Blocker & Status Update (B2)',
    difficulty: 'B2',
    topic: 'workplace_tech',
    question: {
      id: 'dg-write-b2',
      section: 'writing',
      skill_id: 'writing_workplace_communication',
      skill_name: 'Workplace Blocker Update',
      question_type: 'free_writing',
      difficulty: 'B2',
      context_topic: 'workplace_tech',
      prompt: 'Write 3 to 4 sentences in English updating your team or manager on a task taking longer than expected. State what happened, what action you are taking right now, and when you expect to deliver the result.',
      hint: 'Bạn có thể dùng mẫu câu: "I ran into an unexpected issue with...", "Currently, I am investigating...", "I expect to complete the fix by..."',
      explanation_rule: 'Đánh giá tính mạch lạc, thì động từ phù hợp (Past Simple cho sự cố, Present Continuous cho hành động hiện tại, Future cho thời hạn) và văn phong chuyên nghiệp.'
    }
  },
  {
    id: 'diag-write-c1-tradeoffs',
    category: 'writing',
    skillId: 'writing_proposal_tradeoffs',
    skillName: 'Nuanced Proposal & Synthesizing Trade-offs (C1)',
    difficulty: 'C1',
    topic: 'workplace_tech',
    question: {
      id: 'dg-write-c1',
      section: 'writing',
      skill_id: 'writing_proposal_tradeoffs',
      skill_name: 'Nuanced Proposal & Trade-offs',
      question_type: 'free_writing',
      difficulty: 'C1',
      context_topic: 'workplace_tech',
      prompt: 'Write 4 to 5 sentences proposing a process or technical improvement for your team. Acknowledge one potential trade-off or short-term friction, and argue why the long-term benefit outweighs it.',
      hint: 'Sử dụng các cấu trúc liên kết nhượng bộ và đối lập như: "While adopting X requires initial overhead...", "Nevertheless...", "In the long run..."',
      explanation_rule: 'Đánh giá cấu trúc câu phức, từ nối đối lập/nhượng bộ, từ vựng nâng cao và sự tự nhiên trong lập luận chuyên nghiệp.'
    }
  }
];
