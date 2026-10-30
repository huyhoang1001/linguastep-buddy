import {
  UserProfile
} from '../../src/types/learning.js';

export function polishWritingText(
  rawText: string,
  prompt: string,
  profile: UserProfile
): {
  polishedText: string;
  keyCorrections: Array<{ original: string; corrected: string; reason: string }>;
  usefulPhrases: Array<{ phrase: string; meaning: string; how_to_use: string }>;
  reusablePattern: string;
} {
  const isVi = profile.explanation_language === 'vi';
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();
  const promptLower = prompt.toLowerCase();

  const corrections: Array<{ original: string; corrected: string; reason: string }> = [];
  let polished = trimmed;

  const replacements: Array<{ regex: RegExp; replacement: string; originalMatch: string; reasonVi: string; reasonEn: string }> = [
    {
      regex: /\bi have complete\b/gi,
      replacement: 'I have completed',
      originalMatch: 'have complete',
      reasonVi: 'Sau "have" trong thì hiện tại hoàn thành, cần dùng phân từ hai "completed".',
      reasonEn: 'Present perfect requires past participle "completed".'
    },
    {
      regex: /\bi complete the task yesterday\b/gi,
      replacement: 'I completed the task yesterday',
      originalMatch: 'complete ... yesterday',
      reasonVi: 'Trạng từ quá khứ "yesterday" yêu cầu thì quá khứ đơn "completed".',
      reasonEn: 'Past time marker "yesterday" requires simple past "completed".'
    },
    {
      regex: /\bsend to (my |the )?(manager|client|team)\b/gi,
      replacement: 'sent to $1$2 for review',
      originalMatch: 'send to ...',
      reasonVi: 'Chuyển sang dạng quá khứ "sent" và bổ sung "for review" để câu văn tự nhiên, chuyên nghiệp.',
      reasonEn: 'Use past tense "sent" and qualify with "for review" for professional clarity.'
    },
    {
      regex: /\bwe discussed about\b/gi,
      replacement: 'we discussed',
      originalMatch: 'discussed about',
      reasonVi: '"Discuss" là ngoại động từ trực tiếp, không đi kèm giới từ "about".',
      reasonEn: '"Discuss" is transitive; do not use the preposition "about".'
    },
    {
      regex: /\bbecause of .* so\b/gi,
      replacement: 'because',
      originalMatch: 'because ... so',
      reasonVi: 'Tránh dùng cặp liên từ "because ... so" trong cùng một câu tiếng Anh.',
      reasonEn: 'Avoid pairing "because" with "so" in the same clause structure.'
    },
    {
      regex: /\bfix (the |this )?(bug|problem|issue)\b/gi,
      replacement: 'resolve the issue',
      originalMatch: 'fix bug/problem',
      reasonVi: '"Resolve the issue" là cách diễn đạt chuyên nghiệp và tự nhiên hơn trong giao tiếp công việc.',
      reasonEn: '"Resolve the issue" is more idiomatic and professional in workplace communication.'
    },
    {
      regex: /\btell (my |the )?manager\b/gi,
      replacement: 'brief my manager',
      originalMatch: 'tell manager',
      reasonVi: '"Brief my manager" thể hiện sự chủ động báo cáo ngắn gọn, chuẩn xác.',
      reasonEn: '"Brief my manager" denotes concise, professional communication.'
    },
    {
      regex: /\bmake it fast\b/gi,
      replacement: 'expedite the process',
      originalMatch: 'make it fast',
      reasonVi: '"Expedite the process" diễn đạt việc đẩy nhanh tiến độ một cách lịch sự, trang trọng.',
      reasonEn: '"Expedite the process" elevates informal phrasing.'
    },
    {
      regex: /\bi think we should\b/gi,
      replacement: 'I recommend that we',
      originalMatch: 'I think we should',
      reasonVi: '"I recommend that we" mang tính xây dựng và quyết đoán hơn trong văn bản công việc.',
      reasonEn: '"I recommend that we" sounds more confident and constructive.'
    }
  ];

  for (const rule of replacements) {
    if (rule.regex.test(polished)) {
      polished = polished.replace(rule.regex, rule.replacement);
      corrections.push({
        original: rule.originalMatch,
        corrected: rule.replacement,
        reason: isVi ? rule.reasonVi : rule.reasonEn
      });
    }
  }

  if (corrections.length === 0) {
    if (lower.startsWith('i am ') || lower.startsWith("i'm ")) {
      polished = polished.replace(/\bi am \b/i, 'I am currently ').replace(/\bi'm \b/i, 'I am currently ');
      corrections.push({
        original: 'Present continuous opening',
        corrected: 'I am currently + present participle',
        reason: isVi
          ? 'Thêm trạng từ "currently" giúp câu cập nhật tiến độ có tính thời điểm rõ nét hơn.'
          : 'Adding "currently" enhances the temporal context of a status update.'
      });
    } else {
      if (lower.includes('anticipate deploying')) {
        polished = polished.replace(/anticipate deploying/gi, 'expect to deploy');
      } else if (!lower.includes('currently') && !lower.includes('furthermore')) {
        polished = polished.replace(/\.\s*$/, '') + ' to ensure long-term operational stability.';
      }
      corrections.push({
        original: 'Stylistic refinement',
        corrected: 'Professional workplace phrasing',
        reason: isVi
          ? 'Nâng cấp từ vựng và nhịp điệu câu tự nhiên như người bản xứ.'
          : 'Refined vocabulary and sentence rhythm for idiomatic native style.'
      });
    }
  }

  // Ensure first character is capitalized and ends with a period
  if (polished.length > 0) {
    polished = polished.charAt(0).toUpperCase() + polished.slice(1);
    if (!/[.!?]$/.test(polished)) {
      polished += '.';
    }
  }

  // Generate dynamic, contextually relevant useful phrases
  const usefulPhrases: Array<{ phrase: string; meaning: string; how_to_use: string }> = [];

  if (promptLower.includes('incident') || promptLower.includes('bug') || promptLower.includes('blocker') || lower.includes('issue') || lower.includes('problem')) {
    usefulPhrases.push(
      {
        phrase: 'mitigate the risk',
        meaning: isVi ? 'Giảm thiểu rủi ro' : 'Lessen the impact or likelihood of a problem',
        how_to_use: 'We implemented a fallback handler to mitigate the risk of downtime.'
      },
      {
        phrase: 'identify the root cause',
        meaning: isVi ? 'Xác định nguyên nhân gốc rễ' : 'Discover the core reason for a defect',
        how_to_use: 'The engineering team is analyzing logs to identify the root cause.'
      },
      {
        phrase: 'implement a hotfix',
        meaning: isVi ? 'Triển khai bản sửa lỗi khẩn cấp' : 'Deploy an immediate emergency patch',
        how_to_use: 'We deployed a hotfix to restore service within 20 minutes.'
      }
    );
  } else if (promptLower.includes('delay') || promptLower.includes('timeline') || promptLower.includes('postpone') || lower.includes('later')) {
    usefulPhrases.push(
      {
        phrase: 'encounter an unexpected bottleneck',
        meaning: isVi ? 'Gặp điểm nghẽn bất ngờ' : 'Face an unplanned impediment',
        how_to_use: 'Due to API rate limits, we encountered an unexpected bottleneck.'
      },
      {
        phrase: 'adjust the delivery timeline',
        meaning: isVi ? 'Điều chỉnh mốc thời gian bàn giao' : 'Modify the release schedule transparently',
        how_to_use: 'We need to adjust the delivery timeline to ensure thorough QA.'
      },
      {
        phrase: 'keep stakeholders informed',
        meaning: isVi ? 'Giữ cho các bên liên quan luôn được cập nhật' : 'Maintain proactive communication',
        how_to_use: 'I will brief the client and keep stakeholders informed daily.'
      }
    );
  } else {
    usefulPhrases.push(
      {
        phrase: 'streamline the workflow',
        meaning: isVi ? 'Tối ưu hóa quy trình làm việc' : 'Make a operational process more efficient',
        how_to_use: 'Adopting automated tests will streamline our deployment workflow.'
      },
      {
        phrase: 'align with cross-functional teams',
        meaning: isVi ? 'Thống nhất với các đội ngũ liên quan' : 'Ensure mutual agreement across departments',
        how_to_use: 'I aligned with the design team before finalizing the UI specifications.'
      },
      {
        phrase: 'provide a progress update',
        meaning: isVi ? 'Báo cáo cập nhật tiến độ' : 'Share current status clearly',
        how_to_use: 'I am writing to provide a progress update on the Q3 roadmap.'
      }
    );
  }

  // Build customized reusable pattern
  let reusablePattern = 'By the time [event A happened], our team had already [action B completed].';
  if (promptLower.includes('recommend') || promptLower.includes('suggest')) {
    reusablePattern = 'I strongly recommend that we [action], as it will enable us to [benefit].';
  } else if (promptLower.includes('delay') || promptLower.includes('blocker')) {
    reusablePattern = 'Although we faced [blocker], nevertheless we managed to [achievement].';
  }

  return {
    polishedText: polished,
    keyCorrections: corrections,
    usefulPhrases,
    reusablePattern
  };
}
