import {
  UserProfile,
  DiscoveryMessage,
  DiagnosticSession,
  DiagnosticReport,
  SectionType
} from '../../src/types/learning.js';
import { createDiagnosticAssessmentPlan } from '../../src/types/diagnosticPlans.js';

export function fallbackDiscoveryTurn(
  _history: DiscoveryMessage[],
  userMessage: string,
  currentProfile: UserProfile,
  turnsCount: number
): {
  tutorReply: string;
  quickReplies?: string[];
  dimension?: DiscoveryMessage['dimension'];
  updatedProfile: Partial<UserProfile>;
  isDiscoveryComplete: boolean;
  confirmationSummary?: string;
} {
  const isVi = currentProfile.explanation_language === 'vi';
  const lower = userMessage.toLowerCase();
  const updated: Partial<UserProfile> = {};

  if (lower.includes('work') || lower.includes('tech') || lower.includes('software') || lower.includes('công việc') || lower.includes('kỹ thuật')) {
    updated.primary_goal = 'workplace_tech';
    updated.general_vs_work_ratio = 80;
  } else if (lower.includes('conversa') || lower.includes('giao tiếp') || lower.includes('nói') || lower.includes('hàng ngày') || lower.includes('daily')) {
    updated.primary_goal = 'conversation';
    updated.general_vs_work_ratio = 10;
  } else if (lower.includes('writ') || lower.includes('viết') || lower.includes('read') || lower.includes('đọc') || lower.includes('báo cáo')) {
    updated.primary_goal = 'reading_writing';
    updated.general_vs_work_ratio = 30;
  } else if (lower.includes('exam') || lower.includes('thi') || lower.includes('ielts') || lower.includes('toeic') || lower.includes('america') || lower.includes('us') || lower.includes('du học') || lower.includes('study')) {
    updated.primary_goal = 'exam';
    updated.general_vs_work_ratio = 20;
  } else if (lower.includes('balance') || lower.includes('cân bằng') || lower.includes('cả hai')) {
    updated.primary_goal = 'balanced';
    updated.general_vs_work_ratio = 50;
  }

  if (turnsCount <= 2 && userMessage.trim().length > 3) {
    updated.goal_summary = userMessage.trim();
  }

  if (lower.includes('a1') || lower.includes('mất gốc') || lower.includes('mới bắt đầu') || lower.includes('beginner') || lower.includes('from a1')) {
    updated.current_level = 'A1';
  } else if (lower.includes('a2') || lower.includes('elementary') || lower.includes('cơ bản')) {
    updated.current_level = 'A2';
  } else if (lower.includes('b1') || lower.includes('intermediate') || lower.includes('trung cấp')) {
    updated.current_level = 'B1';
  } else if (lower.includes('b2') || lower.includes('upper-intermediate')) {
    updated.current_level = 'B2';
  } else if (lower.includes('c1') || lower.includes('advanced') || lower.includes('thành thạo')) {
    updated.current_level = 'C1';
  }

  if (lower.includes('đạt c1') || lower.includes('target c1') || lower.includes('reach c1') || lower.includes('to c1') || lower.includes('go to c1')) {
    updated.target_level = 'C1';
  } else if (lower.includes('đạt b2') || lower.includes('target b2') || lower.includes('reach b2') || lower.includes('to b2')) {
    updated.target_level = 'B2';
  } else if (lower.includes('đạt b1') || lower.includes('target b1') || lower.includes('reach b1') || lower.includes('to b1')) {
    updated.target_level = 'B1';
  }

  if (lower.includes('10')) updated.daily_minutes = 10;
  else if (lower.includes('30')) updated.daily_minutes = 30;
  else if (lower.includes('20')) updated.daily_minutes = 20;

  if (turnsCount <= 1) {
    return {
      tutorReply: isVi
        ? 'Chào bạn! Mình là gia sư tiếng Anh đồng hành cùng bạn. Để thiết kế lộ trình học cá nhân hóa chính xác nhất, mục tiêu tiếng Anh quan trọng nhất của bạn lúc này là gì?'
        : 'Hello! I am your personal English tutor. To build your ideal study plan, what is your primary English learning goal right now?',
      quickReplies: isVi
        ? ['Giao tiếp công việc & Kỹ thuật', 'Nói chuyện hàng ngày tự nhiên', 'Viết báo cáo & Đọc tài liệu', 'Cân bằng cả hai']
        : ['Workplace & Tech English', 'Daily Conversation', 'Reading & Technical Writing', 'Balanced General & Work'],
      dimension: 'goal',
      updatedProfile: updated,
      isDiscoveryComplete: false
    };
  } else if (turnsCount === 2) {
    return {
      tutorReply: isVi
        ? 'Tuyệt vời. Bạn tự đánh giá trình độ hiện tại của mình ở mức nào (A1 Mất gốc, A2 Cơ bản, B1 Trung cấp, B2 hay C1), và bạn muốn chinh phục cấp độ mục tiêu nào (ví dụ từ A1 lên C1)?'
        : 'Great. How would you currently estimate your English level (A1 Beginner, A2 Elementary, B1 Intermediate, B2, or C1), and what is your ultimate target level (e.g. from A1 to C1)?',
      quickReplies: isVi
        ? ['Từ A1 Mất gốc → C1 Thành thạo', 'Khoảng A2 Cơ bản → B2 / C1', 'Khoảng B1 Trung cấp → C1', 'Chưa chắc chắn, cần kiểm tra']
        : ['From A1 Beginner → C1 Advanced', 'Around A2 Elementary → B2 / C1', 'Around B1 Intermediate → C1', 'Not sure, need assessment'],
      dimension: 'level',
      updatedProfile: updated,
      isDiscoveryComplete: false
    };
  } else if (turnsCount === 3) {
    return {
      tutorReply: isVi
        ? 'Trong thực tế, bạn thường cảm thấy gặp khó khăn nhất ở tình huống nào (ví dụ: phản xạ tìm từ, ngữ pháp câu phức, giải thích sự cố, hay nghe nói)?'
        : 'In real situations, where do you struggle the most (e.g. word retrieval, complex grammar accuracy, explaining technical issues, or writing fluently)?',
      quickReplies: isVi
        ? ['Hay nhầm thì động từ & câu phức', 'Thiếu collocations chuẩn xác', 'Ngại viết cập nhật công việc', 'Cần cải thiện tất cả']
        : ['Verb tenses & complex grammar', 'Natural collocations & vocabulary', 'Workplace updates & Slack writing', 'A bit of everything'],
      dimension: 'struggles',
      updatedProfile: { ...updated, struggles: [userMessage] },
      isDiscoveryComplete: false
    };
  } else if (turnsCount === 4) {
    const currentGoal = updated.primary_goal || currentProfile.primary_goal || 'conversation';
    const defaultRatio = currentGoal === 'workplace_tech' ? 80 : currentGoal === 'conversation' ? 10 : currentGoal === 'reading_writing' ? 30 : currentGoal === 'exam' ? 20 : 50;
    return {
      tutorReply: isVi
        ? 'Bạn có thể dành khoảng bao nhiêu phút mỗi ngày để luyện tập: 10 phút (Luyện nhanh), 20 phút (Tiêu chuẩn), hay 30 phút (Học sâu)?'
        : 'How many minutes per day can you commit to practicing: 10 mins (Quick Practice), 20 mins (Standard Practice), or 30 mins (Deep Practice)?',
      quickReplies: isVi
        ? ['10 phút (⚡ Luyện nhanh 4 câu hỏi)', '20 phút (🎯 Tiêu chuẩn 7 câu hỏi)', '30 phút (🔬 Học sâu 12 câu hỏi)']
        : ['10 mins (⚡ Quick: 4 questions)', '20 mins (🎯 Standard: 7 questions)', '30 mins (🔬 Deep: 12 questions)'],
      dimension: 'time',
      updatedProfile: { ...updated, daily_minutes: updated.daily_minutes || 20, general_vs_work_ratio: defaultRatio },
      isDiscoveryComplete: false
    };
  } else {
    const activeGoal = updated.primary_goal || currentProfile.primary_goal || 'conversation';
    const goalDisplayNamesVi: Record<string, string> = {
      workplace_tech: 'Giao tiếp công việc & Kỹ thuật',
      conversation: 'Nói chuyện hàng ngày & Phản xạ tự nhiên',
      reading_writing: 'Đọc hiểu & Viết tài liệu / Báo cáo',
      exam: 'Luyện thi & Củng cố chứng chỉ',
      balanced: 'Cân bằng Giao tiếp hàng ngày & Công việc'
    };
    const goalDisplayNamesEn: Record<string, string> = {
      workplace_tech: 'Workplace & Technical English',
      conversation: 'Daily Natural Conversation & Speaking',
      reading_writing: 'Reading Comprehension & Report Writing',
      exam: 'Exam Preparation & General Assessment',
      balanced: 'Balanced General & Workplace English'
    };

    const chosenGoalVi = goalDisplayNamesVi[activeGoal] || 'Nói chuyện hàng ngày tự nhiên';
    const chosenGoalEn = goalDisplayNamesEn[activeGoal] || 'Daily Natural Conversation';
    const chosenMins = updated.daily_minutes || currentProfile.daily_minutes || 20;

    const summaryText = isVi
      ? `Tóm tắt mục tiêu học tập:\n• Mục tiêu chính: ${chosenGoalVi}\n• Trình độ dự kiến: ${updated.current_level || currentProfile.current_level || 'B2'}\n• Thời lượng: ${chosenMins} phút/ngày (${chosenMins <= 12 ? 'Luyện nhanh 4 câu' : chosenMins >= 25 ? 'Học sâu 12 câu' : 'Tiêu chuẩn 7 câu'}).\n\nBây giờ chúng ta sẽ bắt đầu bài Đánh giá chẩn đoán thích ứng (Adaptive Diagnostic) được điều chỉnh theo đúng mục tiêu ${chosenGoalVi} của bạn nhé!`
      : `Summary of your goals:\n• Primary Goal: ${chosenGoalEn}\n• Baseline Level: ${updated.current_level || currentProfile.current_level || 'B2'}\n• Pace: ${chosenMins} mins/day (${chosenMins <= 12 ? 'Quick: 4 Qs' : chosenMins >= 25 ? 'Deep: 12 Qs' : 'Standard: 7 Qs'}).\n\nReady to begin your Adaptive Diagnostic Assessment customized specifically for ${chosenGoalEn}?`;

    return {
      tutorReply: isVi
        ? `Cảm ơn bạn! Dưới đây là tóm tắt mục tiêu của bạn. Hãy xác nhận để chúng ta tiến hành bài đánh giá chẩn đoán thích ứng nhé:`
        : `Thank you! Here is a summary of your goals. Please confirm to proceed to your adaptive diagnostic assessment:`,
      quickReplies: isVi
        ? ['Xác nhận & Bắt đầu đánh giá', 'Điều chỉnh lại mục tiêu']
        : ['Confirm & Start Assessment', 'Adjust Goals'],
      dimension: 'confirmation',
      updatedProfile: updated,
      isDiscoveryComplete: true,
      confirmationSummary: summaryText
    };
  }
}

export function computeDiagnosticReportFallback(
  session: DiagnosticSession,
  profile: UserProfile
): DiagnosticReport {
  const attempts = session.history;
  const totalCount = attempts.length;
  const plan = session.plan || createDiagnosticAssessmentPlan(session.mode, profile.explanation_language);

  const scoringWeights = plan.scoringWeights || {
    grammar: 25,
    vocabulary: 25,
    reading: 25,
    writing: 25
  };

  const sections: SectionType[] = ['grammar', 'vocabulary', 'reading', 'writing'];
  const skillEstimates: any = {};
  const sectionScores: any = {};

  sections.forEach(sec => {
    const secAttempts = attempts.filter(a => a.question.section === sec);
    const secCount = secAttempts.length;

    let earnedPoints = 0;
    let maxPoints = secCount > 0 ? secCount : 1;

    if (sec === 'writing') {
      if (secCount > 0) {
        const totalRubricScore = secAttempts.reduce((acc, a) => {
          if (a.writingRubric) {
            const r = a.writingRubric;
            const avg = (r.accuracy + r.vocabularyRange + r.sentenceComplexity + r.coherence + r.naturalness + r.taskCompletion) / 6;
            return acc + (avg / 5);
          }
          return acc + (a.verdict === 'correct' ? 1.0 : 0.6);
        }, 0);
        earnedPoints = Number((totalRubricScore).toFixed(2));
      }
    } else {
      earnedPoints = secAttempts.reduce((acc, a) => {
        if (a.verdict === 'correct') return acc + 1.0;
        if (a.verdict === 'partially_correct') return acc + 0.5;
        return acc;
      }, 0);
    }

    const secPercentage = secCount > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;

    let cefr = 'B1-B2';
    if (secCount === 0) {
      cefr = 'Not Assessed (Insufficient Data)';
    } else if (secPercentage >= 85) {
      cefr = 'B2-C1';
    } else if (secPercentage >= 70) {
      cefr = 'B2';
    } else if (secPercentage >= 50) {
      cefr = 'B1';
    } else {
      cefr = 'A2-B1';
    }

    const confidence: 'low' | 'moderate' | 'high' = secCount >= 4 ? 'high' : secCount >= 2 ? 'moderate' : 'low';

    skillEstimates[sec] = {
      category: sec,
      cefrRange: cefr,
      confidence,
      evidenceCount: secCount,
      correctCount: secAttempts.filter(a => a.verdict === 'correct').length,
      demonstratedStrengths: secAttempts.filter(a => a.verdict === 'correct').map(a => a.question.skill_name).slice(0, 3),
      priorityWeaknesses: secAttempts.filter(a => a.verdict !== 'correct').map(a => a.question.skill_name).slice(0, 3),
      recurringErrors: secAttempts.filter(a => a.verdict !== 'correct').map(a => a.evaluation.decisive_clue).filter(Boolean).slice(0, 2),
      unassessedSubskills: []
    };

    sectionScores[sec] = {
      score: earnedPoints,
      maxScore: maxPoints,
      percentage: secPercentage,
      cefr
    };
  });

  skillEstimates.speaking = {
    category: 'speaking',
    cefrRange: 'Not Assessed (Text Diagnostic)',
    confidence: 'low',
    evidenceCount: 0,
    correctCount: 0,
    demonstratedStrengths: [],
    priorityWeaknesses: ['Oral pronunciation and live conversational reflex require audio module'],
    recurringErrors: [],
    unassessedSubskills: ['Spoken spontaneous output']
  };

  skillEstimates.listening = {
    category: 'listening',
    cefrRange: 'Not Assessed (Text Diagnostic)',
    confidence: 'low',
    evidenceCount: 0,
    correctCount: 0,
    demonstratedStrengths: [],
    priorityWeaknesses: ['Acoustic decoding not tested in standard text mode'],
    recurringErrors: [],
    unassessedSubskills: ['Connected speech recognition']
  };

  const weightedScore = Math.round(
    (sectionScores.grammar.percentage * (scoringWeights.grammar / 100)) +
    (sectionScores.vocabulary.percentage * (scoringWeights.vocabulary / 100)) +
    (sectionScores.reading.percentage * (scoringWeights.reading / 100)) +
    (sectionScores.writing.percentage * (scoringWeights.writing / 100))
  );

  const overallCEFR = weightedScore >= 85 ? 'C1' : weightedScore >= 70 ? 'B2' : weightedScore >= 50 ? 'B1' : 'A2';
  const correctCountAll = attempts.filter(a => a.verdict === 'correct').length;

  return {
    id: `diag-report-${Date.now()}`,
    sessionId: session.sessionId,
    mode: session.mode,
    targetDurationMinutes: plan.targetDurationMinutes,
    completedAt: new Date().toISOString(),
    overallScorePercentage: weightedScore,
    overallCEFR,
    overallConfidence: totalCount >= 8 ? 'high' : 'moderate',
    overallSummary: profile.explanation_language === 'vi'
      ? `Bài đánh giá chẩn đoán hoàn tất. Bạn đạt ${weightedScore}% trên toàn bộ các kỹ năng, được xếp lớp ở trình độ ${overallCEFR}.`
      : `Adaptive diagnostic completed. Overall score is ${weightedScore}% across core sections, placing you at ${overallCEFR} CEFR.`,
    scoringWeights,
    sectionScores,
    skillEstimates,
    demonstratedStrengths: attempts.filter(a => a.verdict === 'correct').map(a => a.question.skill_name).slice(0, 4),
    priorityWeaknesses: attempts.filter(a => a.verdict !== 'correct').map(a => a.question.skill_name).slice(0, 4),
    recurringErrors: attempts.filter(a => a.verdict !== 'correct').map(a => a.evaluation.decisive_clue).filter(Boolean).slice(0, 3),
    totalQuestionsAnswered: totalCount,
    accuracyRate: totalCount > 0 ? Number((correctCountAll / totalCount).toFixed(2)) : 1.0
  };
}
