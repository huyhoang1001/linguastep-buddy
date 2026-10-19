import { DiagnosticMode, DiagnosticAssessmentPlan, DiagnosticSectionPlan } from './learning.js';

export function createDiagnosticAssessmentPlan(
  mode: DiagnosticMode,
  language: 'en' | 'vi' | 'bilingual' | string = 'en'
): DiagnosticAssessmentPlan {
  const isVi = language === 'vi';

  if (mode === 'quick') {
    const sections: DiagnosticSectionPlan[] = [
      {
        section: 'grammar',
        title: isVi ? 'Phần 1: Ngữ pháp cốt lõi' : 'Section 1: Core Grammar',
        description: isVi
          ? '3 câu hỏi trắc nghiệm kiểm tra thì động từ và liên kết câu.'
          : '3 targeted questions evaluating fundamental tenses and structure.',
        weightPercentage: 25,
        targetQuestionsCount: 3,
        estimatedMinutes: 2.5,
        completed: false
      },
      {
        section: 'vocabulary',
        title: isVi ? 'Phần 2: Từ vựng & Collocations' : 'Section 2: Vocabulary & Collocations',
        description: isVi
          ? '3 câu hỏi kiểm tra từ vựng thông dụng và kết hợp từ tự nhiên.'
          : '3 items testing high-frequency workplace and daily collocations.',
        weightPercentage: 25,
        targetQuestionsCount: 3,
        estimatedMinutes: 2.5,
        completed: false
      },
      {
        section: 'reading',
        title: isVi ? 'Phần 3: Đọc hiểu ngắn' : 'Section 3: Short Reading',
        description: isVi
          ? '1 đoạn văn ngắn (100 từ) kèm 1 câu hỏi suy luận ý chính.'
          : '1 concise passage (100 words) with 1 main-idea comprehension question.',
        weightPercentage: 25,
        targetQuestionsCount: 1,
        estimatedMinutes: 2.0,
        completed: false
      },
      {
        section: 'writing',
        title: isVi ? 'Phần 4: Viết phản xạ nhanh' : 'Section 4: Short Writing Production',
        description: isVi
          ? '1 bài viết ngắn (3-4 câu) diễn đạt ý kiến hoặc thói quen thường nhật.'
          : '1 short prompt (3-4 sentences) expressing a routine or personal opinion.',
        weightPercentage: 25,
        targetQuestionsCount: 1,
        estimatedMinutes: 3.0,
        completed: false
      }
    ];

    return {
      mode: 'quick',
      title: isVi ? 'Đánh giá Nhanh (Express)' : 'Express Calibration',
      subtitle: isVi
        ? 'Ước tính nhanh năng lực nền tảng qua 4 kỹ năng (8 câu hỏi • ~10 phút)'
        : 'Fast 4-skill baseline calibration (8 questions • ~10 mins)',
      targetDurationMinutes: 10,
      totalQuestions: 8,
      scoringWeights: {
        grammar: 25,
        vocabulary: 25,
        reading: 25,
        writing: 25
      },
      sections
    };
  }

  if (mode === 'comprehensive') {
    const sections: DiagnosticSectionPlan[] = [
      {
        section: 'grammar',
        title: isVi ? 'Phần 1: Ngữ pháp Chuyên sâu' : 'Section 1: In-Depth Grammar',
        description: isVi
          ? '8 câu hỏi thích ứng trải dài từ câu điều kiện hỗn hợp đến đảo ngữ và bị động phức.'
          : '8 adaptive items covering mixed conditionals, inversion, and complex syntax.',
        weightPercentage: 25,
        targetQuestionsCount: 8,
        estimatedMinutes: 6.5,
        completed: false
      },
      {
        section: 'vocabulary',
        title: isVi ? 'Phần 2: Từ vựng & Sắc thái Cao cấp' : 'Section 2: Advanced Vocabulary & Nuance',
        description: isVi
          ? '7 câu hỏi phân biệt từ đồng nghĩa, thành ngữ chuyên ngành và sắc thái trang trọng.'
          : '7 items testing technical registers, subtle synonyms, and idiomatic precision.',
        weightPercentage: 25,
        targetQuestionsCount: 7,
        estimatedMinutes: 6.0,
        completed: false
      },
      {
        section: 'reading',
        title: isVi ? 'Phần 3: Đọc hiểu Đa văn bản' : 'Section 3: Multi-Passage Reading',
        description: isVi
          ? '2 bài đọc chuyên ngành (5 câu hỏi) kiểm tra ý chính, chi tiết ẩn và hàm ý tác giả.'
          : '2 analytical articles (5 questions total) evaluating inference, nuance, and synthesis.',
        weightPercentage: 25,
        targetQuestionsCount: 5,
        estimatedMinutes: 10.5,
        completed: false
      },
      {
        section: 'writing',
        title: isVi ? 'Phần 4: Viết Đa nhiệm Chuyên nghiệp' : 'Section 4: Dual Workplace Writing',
        description: isVi
          ? '2 bài viết: Cập nhật sự cố khẩn cấp (ngắn) và Đề xuất giải pháp kèm đánh đổi (dài).'
          : '2 tasks: Rapid status/blocker update (~60 words) and Strategic proposal with trade-offs (~130 words).',
        weightPercentage: 25,
        targetQuestionsCount: 2,
        estimatedMinutes: 13.0,
        completed: false
      }
    ];

    return {
      mode: 'comprehensive',
      title: isVi ? 'Đánh giá Toàn diện (Comprehensive)' : 'Comprehensive Deep Diagnostic',
      subtitle: isVi
        ? 'Kiểm tra chuyên sâu độ tin cậy cao qua 2 bài đọc và 2 bài viết (22 câu hỏi • ~36 phút)'
        : 'Rigorous diagnostic with high statistical confidence (22 questions • ~36 mins)',
      targetDurationMinutes: 36,
      totalQuestions: 22,
      scoringWeights: {
        grammar: 25,
        vocabulary: 25,
        reading: 25,
        writing: 25
      },
      sections
    };
  }

  // Default: STANDARD (Recommended)
  const sections: DiagnosticSectionPlan[] = [
    {
      section: 'grammar',
      title: isVi ? 'Phần 1: Ngữ pháp' : 'Section 1: Grammar',
      description: isVi
        ? '5 câu hỏi thích ứng kiểm tra thì hoàn thành, câu điều kiện và thể bị động.'
        : '5 adaptive questions testing perfect tenses, conditionals, and passive voice.',
      weightPercentage: 25,
      targetQuestionsCount: 5,
      estimatedMinutes: 4.0,
      completed: false
    },
    {
      section: 'vocabulary',
      title: isVi ? 'Phần 2: Từ vựng & Collocations' : 'Section 2: Vocabulary & Collocations',
      description: isVi
        ? '4 câu hỏi kiểm tra từ vựng công việc, kết hợp từ chuẩn và phân biệt sắc thái.'
        : '4 items testing professional collocations, phrasal verbs, and context precision.',
      weightPercentage: 25,
      targetQuestionsCount: 4,
      estimatedMinutes: 3.5,
      completed: false
    },
    {
      section: 'reading',
      title: isVi ? 'Phần 3: Đọc hiểu Đoạn văn' : 'Section 3: Reading Comprehension',
      description: isVi
        ? '1 bài đọc chuyên nghiệp (200 từ) kèm 3 câu hỏi liên hoàn về thông tin và suy luận.'
        : '1 substantive passage (200 words) with 3 comprehension and inference questions.',
      weightPercentage: 25,
      targetQuestionsCount: 3,
      estimatedMinutes: 5.5,
      completed: false
    },
    {
      section: 'writing',
      title: isVi ? 'Phần 4: Viết Tình huống Thực tế' : 'Section 4: Contextual Writing',
      description: isVi
        ? '1 bài viết tình huống công việc (80-120 từ) được chấm điểm theo rubric 6 tiêu chí.'
        : '1 workplace task (80-120 words) evaluated on a 6-dimensional native rubric.',
      weightPercentage: 25,
      targetQuestionsCount: 1,
      estimatedMinutes: 7.0,
      completed: false
    }
  ];

  return {
    mode: 'standard',
    title: isVi ? 'Đánh giá Tiêu chuẩn (Standard)' : 'Standard Diagnostic',
    subtitle: isVi
      ? 'Đo lường cân bằng, chính xác năng lực thực chiến qua 4 kỹ năng (13 câu hỏi • ~20 phút)'
      : 'Balanced, accurate 4-dimension diagnostic placement (13 questions • ~20 mins)',
    targetDurationMinutes: 20,
    totalQuestions: 13,
    scoringWeights: {
      grammar: 25,
      vocabulary: 25,
      reading: 25,
      writing: 25
    },
    sections
  };
}
