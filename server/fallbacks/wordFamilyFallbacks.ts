import {
  WordFamilyData,
  WordFamilyExercise,
  WordPracticeData,
  UserProfile
} from '../../src/types/learning.js';

interface WordFamilyKnowledge {
  family_root: string;
  headword: string;
  part_of_speech: string;
  ipa: string;
  meaning_vi: string;
  meaning_en: string;
  collocation_pattern: string;
  example_workplace: string;
  example_general: string;
  pronunciation_tip?: string;
  similar_word_comparison?: {
    word: string;
    difference: string;
  };
  missing_forms_note?: string;
  members: Array<{
    form: string;
    part_of_speech: string;
    ipa?: string;
    suffix_or_pattern?: string;
    meaning_vi: string;
    example_sentence: string;
    is_headword?: boolean;
  }>;
  exercises: WordFamilyExercise[];
}

export const CURATED_WORD_FAMILIES: Record<string, WordFamilyKnowledge> = {
  collaboration: {
    family_root: 'collaborate',
    headword: 'collaboration',
    part_of_speech: 'noun',
    ipa: '/kəˌlæb.əˈreɪ.ʃən/',
    meaning_vi: 'Sự hợp tác, quá trình làm việc cùng nhau giữa nhiều người hoặc nhóm để đạt mục tiêu chung',
    meaning_en: 'The act of working with someone to produce or create something',
    collocation_pattern: 'close collaboration with; in collaboration with; foster collaboration',
    example_workplace: 'Cross-functional collaboration between engineering and product led to our fastest launch to date.',
    example_general: 'The new community center was built through collaboration between local volunteers and the city council.',
    pronunciation_tip: 'Trọng âm rơi vào âm tiết thứ tư: col-lab-o-RA-tion. Đuôi "-tion" phát âm là /ʃən/.',
    similar_word_comparison: {
      word: 'cooperation',
      difference: 'Collaboration đòi hỏi cùng nhau đồng sáng tạo và chịu trách nhiệm chung, trong khi cooperation đôi khi chỉ là sự hỗ trợ, tuân thủ hoặc không cản trở nhau.'
    },
    missing_forms_note: 'Họ từ đầy đủ 4 từ loại chính kèm theo danh từ chỉ người ("collaborator").',
    members: [
      {
        form: 'collaborate',
        part_of_speech: 'verb',
        ipa: '/kəˈlæb.ə.reɪt/',
        suffix_or_pattern: 'verb base (-ate)',
        meaning_vi: 'Hợp tác, cùng làm việc',
        example_sentence: 'Both departments decided to collaborate on the upcoming client presentation.'
      },
      {
        form: 'collaboration',
        part_of_speech: 'noun',
        ipa: '/kəˌlæb.əˈreɪ.ʃən/',
        suffix_or_pattern: '-tion (abstract noun)',
        meaning_vi: 'Sự hợp tác, việc hợp tác',
        example_sentence: 'Effective collaboration requires mutual transparency and consistent communication.',
        is_headword: true
      },
      {
        form: 'collaborative',
        part_of_speech: 'adjective',
        ipa: '/kəˈlæb.ər.ə.tɪv/',
        suffix_or_pattern: '-ive (descriptive adjective)',
        meaning_vi: 'Có tính hợp tác, mang tính phối hợp',
        example_sentence: 'We created a collaborative workspace designed for brainstorming sessions.'
      },
      {
        form: 'collaboratively',
        part_of_speech: 'adverb',
        ipa: '/kəˈlæb.ər.ə.tɪv.li/',
        suffix_or_pattern: '-ly (adverb of manner)',
        meaning_vi: 'Một cách hợp tác, đồng lòng cùng nhau',
        example_sentence: 'The remote engineering and design teams worked collaboratively to deliver the milestone on schedule.'
      },
      {
        form: 'collaborator',
        part_of_speech: 'noun_person',
        ipa: '/kəˈlæb.ə.reɪ.tər/',
        suffix_or_pattern: '-or (agent noun / person)',
        meaning_vi: 'Người cộng tác, đối tác làm việc',
        example_sentence: 'She has been a key collaborator on several international research papers.'
      }
    ],
    exercises: [
      {
        id: 'wf-collab-1',
        exercise_type: 'word_form_selection',
        prompt: 'The remote engineering and design teams worked ________ to deliver the software release ahead of schedule.',
        target_form: 'collaboratively',
        target_part_of_speech: 'adverb',
        options: [
          { id: 'A', text: 'collaborate', part_of_speech: 'verb' },
          { id: 'B', text: 'collaboration', part_of_speech: 'noun' },
          { id: 'C', text: 'collaborative', part_of_speech: 'adjective' },
          { id: 'D', text: 'collaboratively', part_of_speech: 'adverb' }
        ],
        expected_answer_id: 'D',
        expected_answer_text: 'collaboratively',
        full_correct_sentence: 'The remote engineering and design teams worked collaboratively to deliver the software release ahead of schedule.',
        grammatical_clue: 'Vị trí sau động từ "worked" chỉ cách thức hành động diễn ra (how they worked) -> Cần một Trạng từ (Adverb) kết thúc bằng hậu tố "-ly".',
        vietnamese_explanation: 'Cần trạng từ "collaboratively" để bổ nghĩa cho động từ "worked". Các phương án khác: collaborate (động từ nguyên mẫu), collaboration (danh từ), collaborative (tính từ chỉ đứng trước danh từ hoặc sau to-be).',
        distractor_explanations: {
          A: 'collaborate là động từ nguyên mẫu; hai động từ chính không thể đứng liền nhau ("worked collaborate").',
          B: 'collaboration là danh từ; danh từ không thể bổ nghĩa trực tiếp cho động từ hành động "worked".',
          C: 'collaborative là tính từ; tính từ bổ nghĩa cho danh từ (vd: "collaborative effort"), không bổ nghĩa cho động từ "worked".',
          D: 'Chính xác! "collaboratively" là trạng từ chỉ thể cách bổ nghĩa trực tiếp cho động từ "worked".'
        },
        hint: 'Xác định từ loại đứng sau động từ "worked" để diễn tả cách thức hai nhóm cùng làm việc.'
      },
      {
        id: 'wf-collab-2',
        exercise_type: 'error_correction',
        prompt: 'Identify and correct the grammatical error in this project status update:',
        error_sentence: 'The two research divisions worked collaborative to submit the clinical trial proposal.',
        target_form: 'collaboratively',
        target_part_of_speech: 'adverb',
        options: [
          { id: 'A', text: 'Replace "collaborative" with "collaboratively" (Adverb needed after action verb "worked")', part_of_speech: 'adverb' },
          { id: 'B', text: 'Replace "collaborative" with "collaboration" (Noun form required)', part_of_speech: 'noun' },
          { id: 'C', text: 'Change "worked" to "working" without altering "collaborative"', part_of_speech: 'verb' },
          { id: 'D', text: 'No error; "collaborative" functions correctly as an adverb', part_of_speech: 'none' }
        ],
        expected_answer_id: 'A',
        expected_answer_text: 'Replace "collaborative" with "collaboratively" (Adverb needed after action verb "worked")',
        full_correct_sentence: 'The two research divisions worked collaboratively to submit the clinical trial proposal.',
        grammatical_clue: '"worked" là động từ hành động chỉ quá trình công việc -> Cần trạng từ thể cách "collaboratively", không được dùng tính từ "collaborative".',
        vietnamese_explanation: 'Lỗi sai phổ biến là dùng tính từ thay cho trạng từ sau động từ hành động. Cần sửa thành trạng từ "collaboratively".',
        distractor_explanations: {
          A: 'Chính xác! Cần chuyển tính từ "-ive" thành trạng từ "-ively" để bổ nghĩa cho động từ "worked".',
          B: 'Sai vì danh từ "collaboration" không thể làm bổ ngữ chỉ thể cách cho động từ "worked" nếu không có giới từ (in collaboration).',
          C: 'Sai vì câu sẽ thiếu vị ngữ chính trong mệnh đề độc lập.',
          D: 'Sai vì "collaborative" chỉ là tính từ, không thể đóng vai trò trạng từ.'
        },
        hint: 'Chú ý từ loại bổ nghĩa cho động từ "worked".'
      },
      {
        id: 'wf-collab-3',
        exercise_type: 'sentence_transformation',
        prompt: 'Rewrite the sentence using the noun form "collaboration":',
        transformation_source_sentence: 'The senior engineers and architects collaborated smoothly throughout the migration.',
        transformation_prompt: 'Rewrite using "collaboration"',
        target_form: 'collaboration',
        target_part_of_speech: 'noun',
        options: [
          { id: 'A', text: 'Smooth collaboration between senior engineers and architects ensured the migration succeeded.', part_of_speech: 'noun' },
          { id: 'B', text: 'The senior engineers collaborative smoothly with architects during migration.', part_of_speech: 'adjective' },
          { id: 'C', text: 'The migration was collaboratively by senior engineers and architects.', part_of_speech: 'adverb' },
          { id: 'D', text: 'Senior engineers in collaborator with architects completed the migration.', part_of_speech: 'noun_person' }
        ],
        expected_answer_id: 'A',
        expected_answer_text: 'Smooth collaboration between senior engineers and architects ensured the migration succeeded.',
        full_correct_sentence: 'Smooth collaboration between senior engineers and architects ensured the migration succeeded.',
        grammatical_clue: 'Chuyển đổi từ động từ "collaborated" sang cụm danh từ làm chủ ngữ "Smooth collaboration between...".',
        vietnamese_explanation: 'Phương án A chuyển đổi chính xác động từ "collaborated smoothly" thành cụm danh từ "Smooth collaboration". Các câu khác dùng sai từ loại hoặc sai ngữ pháp.',
        distractor_explanations: {
          A: 'Chính xác! Chuyển đổi tự nhiên, chuẩn ngữ pháp tiếng Anh công việc.',
          B: 'Sai vì dùng tính từ "collaborative" thay thế cho động từ vị ngữ mà không có to-be.',
          C: 'Sai cấu trúc bị động ("was collaboratively" thiếu phân từ hai past participle).',
          D: 'Sai vì "collaborator" là danh từ chỉ người, cụm chuẩn phải là "in collaboration with".'
        },
        hint: 'Hãy tìm câu sử dụng cụm danh từ "collaboration" kết hợp với tính từ "smooth".'
      }
    ]
  },
  mitigate: {
    family_root: 'mitigate',
    headword: 'mitigate',
    part_of_speech: 'verb',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    meaning_vi: 'Làm giảm nhẹ, xoa dịu mức độ nghiêm trọng hoặc rủi ro của vấn đề',
    meaning_en: 'To make something less harmful, unpleasant, or bad',
    collocation_pattern: 'mitigate the risk; mitigate the impact; measures to mitigate',
    example_workplace: 'The risk management team implemented backup servers to mitigate potential downtime.',
    example_general: 'Drinking hot tea with honey helped mitigate her throat discomfort.',
    pronunciation_tip: 'Trọng âm ở âm tiết đầu: MI-ti-gate. Đuôi "-gate" phát âm là /ɡeɪt/.',
    similar_word_comparison: {
      word: 'prevent',
      difference: 'Mitigate là làm giảm nhẹ tác động tiêu cực của một sự việc có thể hoặc đã xảy ra; còn prevent là ngăn chặn hoàn toàn không để nó xảy ra.'
    },
    missing_forms_note: 'Từ loại trạng từ "mitigatingly" cực kỳ hiếm và không khuyến khích dùng; thay vào đó người bản xứ dùng cụm "in a mitigating manner".',
    members: [
      {
        form: 'mitigate',
        part_of_speech: 'verb',
        ipa: '/ˈmɪt.ɪ.ɡeɪt/',
        suffix_or_pattern: 'verb base (-ate)',
        meaning_vi: 'Làm giảm nhẹ, giảm thiểu',
        example_sentence: 'We must take proactive steps to mitigate climate risks before next quarter.',
        is_headword: true
      },
      {
        form: 'mitigation',
        part_of_speech: 'noun',
        ipa: '/ˌmɪt.ɪˈɡeɪ.ʃən/',
        suffix_or_pattern: '-ion (abstract noun)',
        meaning_vi: 'Sự giảm nhẹ, biện pháp giảm thiểu rủi ro',
        example_sentence: 'The report outlined several cost-effective mitigation strategies.'
      },
      {
        form: 'mitigating',
        part_of_speech: 'adjective',
        ipa: '/ˈmɪt.ɪ.ɡeɪ.tɪŋ/',
        suffix_or_pattern: '-ing (participial adjective)',
        meaning_vi: 'Có tính chất giảm nhẹ (thường dùng trong "mitigating circumstances / factors")',
        example_sentence: 'The committee took into account several mitigating factors before reaching their verdict.'
      },
      {
        form: 'unmitigated',
        part_of_speech: 'adjective (negative)',
        ipa: '/ʌnˈmɪt.ɪ.ɡeɪ.tɪd/',
        suffix_or_pattern: 'un- ... -ed (complete / absolute negative)',
        meaning_vi: 'Hoàn toàn, không thể cứu vãn (thường dùng: "an unmitigated disaster")',
        example_sentence: 'Without a clear contingency plan, the project launch was an unmitigated disaster.'
      }
    ],
    exercises: [
      {
        id: 'wf-mitigate-1',
        exercise_type: 'word_form_selection',
        prompt: 'Implementing redundant cloud architecture provides effective risk ________ for mission-critical banking operations.',
        target_form: 'mitigation',
        target_part_of_speech: 'noun',
        options: [
          { id: 'A', text: 'mitigate', part_of_speech: 'verb' },
          { id: 'B', text: 'mitigation', part_of_speech: 'noun' },
          { id: 'C', text: 'mitigating', part_of_speech: 'adjective' },
          { id: 'D', text: 'mitigative', part_of_speech: 'adjective' }
        ],
        expected_answer_id: 'B',
        expected_answer_text: 'mitigation',
        full_correct_sentence: 'Implementing redundant cloud architecture provides effective risk mitigation for mission-critical banking operations.',
        grammatical_clue: 'Cụm danh từ ghép "risk ________" đóng vai trò tân ngữ trực tiếp cho động từ "provides", do đó cần Danh từ "mitigation" (risk mitigation = việc giảm thiểu rủi ro).',
        vietnamese_explanation: 'Cần danh từ "mitigation" để kết hợp với "risk" tạo thành danh từ ghép "risk mitigation" (giảm thiểu rủi ro).',
        distractor_explanations: {
          A: 'mitigate là động từ, không thể ghép sau danh từ "risk" ở vị trí tân ngữ.',
          B: 'Chính xác! "risk mitigation" là cụm thuật ngữ phổ biến trong quản trị rủi ro.',
          C: 'mitigating là tính từ phân từ, đứng trước danh từ (vd: "mitigating factors"), không đứng sau "risk" làm danh từ ghép ở đây.',
          D: 'mitigative là tính từ, không phù hợp ở vị trí danh từ của cụm tân ngữ.'
        },
        hint: 'Cần một danh từ đi cùng với "risk" để tạo thành cụm danh từ giảm thiểu rủi ro.'
      },
      {
        id: 'wf-mitigate-2',
        exercise_type: 'error_correction',
        prompt: 'Find and correct the incorrect part of speech in this incident report:',
        error_sentence: 'The team proposed several mitigate steps to prevent data loss in future outages.',
        target_form: 'mitigating',
        target_part_of_speech: 'adjective',
        options: [
          { id: 'A', text: 'Change "mitigate steps" to "mitigating steps" (or "mitigation steps") as a modifier for the noun "steps"', part_of_speech: 'adjective' },
          { id: 'B', text: 'Change "proposed" to "proposal"', part_of_speech: 'noun' },
          { id: 'C', text: 'Change "outages" to "outaging"', part_of_speech: 'verb' },
          { id: 'D', text: 'Replace "prevent" with "prevention"', part_of_speech: 'noun' }
        ],
        expected_answer_id: 'A',
        expected_answer_text: 'Change "mitigate steps" to "mitigating steps" (or "mitigation steps") as a modifier for the noun "steps"',
        full_correct_sentence: 'The team proposed several mitigating steps to prevent data loss in future outages.',
        grammatical_clue: 'Động từ nguyên mẫu "mitigate" không thể trực tiếp đứng trước bổ nghĩa cho danh từ "steps". Cần tính từ "mitigating" hoặc danh từ bổ trợ "mitigation".',
        vietnamese_explanation: 'Đứng trước danh từ "steps" phải là tính từ ("mitigating steps") hoặc danh từ làm định ngữ ("mitigation steps"), không được để động từ nguyên mẫu "mitigate".',
        distractor_explanations: {
          A: 'Chính xác! Cần tính từ hoặc danh từ định ngữ bổ nghĩa cho "steps".',
          B: 'Sai vì "proposed" là động từ chính của mệnh đề, đổi sang danh từ câu sẽ mất vị ngữ.',
          C: 'Sai vì "outaging" không phải danh từ chuẩn, "outages" (sự cố gián đoạn) là chính xác.',
          D: 'Sai vì sau to-infinitive mục đích cần động từ nguyên mẫu "prevent".'
        },
        hint: 'Chú ý từ đứng trước danh từ "steps".'
      }
    ]
  },
  discrepancy: {
    family_root: 'discrepant',
    headword: 'discrepancy',
    part_of_speech: 'noun',
    ipa: '/dɪˈskrep.ən.si/',
    meaning_vi: 'Sự không nhất quán, sự sai lệch, khác biệt bất thường giữa hai nguồn thông tin',
    meaning_en: 'An unexpected difference between two things that should be the same',
    collocation_pattern: 'reconcile a discrepancy; unexplained discrepancy; noticeable discrepancy',
    example_workplace: 'The internal audit flagged an unexplained discrepancy between physical inventory and warehouse records.',
    example_general: 'There was a wide discrepancy between what the politician promised and what was actually budgeted.',
    pronunciation_tip: 'Trọng âm ở âm tiết thứ hai: dis-CREP-an-cy (/dɪˈskrep.ən.si/).',
    similar_word_comparison: {
      word: 'difference',
      difference: 'Difference là sự khác biệt nói chung giữa hai vật; Discrepancy nhấn mạnh vào sự mâu thuẫn, sai lệch bất thường khi đáng lẽ hai nguồn dữ liệu phải khớp nhau.'
    },
    missing_forms_note: 'Từ "discrepancy" không có dạng động từ hay trạng từ thông dụng trong tiếng Anh hiện đại; chỉ có tính từ trang trọng "discrepant".',
    members: [
      {
        form: 'discrepancy',
        part_of_speech: 'noun',
        ipa: '/dɪˈskrep.ən.si/',
        suffix_or_pattern: '-ancy (noun denoting state/quality)',
        meaning_vi: 'Sự sai lệch, bất nhất',
        example_sentence: 'The accountant spent two days investigating the balance sheet discrepancy.',
        is_headword: true
      },
      {
        form: 'discrepant',
        part_of_speech: 'adjective',
        ipa: '/dɪˈskrep.ənt/',
        suffix_or_pattern: '-ant (formal adjective)',
        meaning_vi: 'Bất nhất, không khớp, mâu thuẫn',
        example_sentence: 'The witnesses gave discrepant accounts of what happened during the incident.'
      }
    ],
    exercises: [
      {
        id: 'wf-discrepancy-1',
        exercise_type: 'word_form_selection',
        prompt: 'The forensic investigator compared the two server logs and noted that their timestamps were noticeably ________.',
        target_form: 'discrepant',
        target_part_of_speech: 'adjective',
        options: [
          { id: 'A', text: 'discrepancy', part_of_speech: 'noun' },
          { id: 'B', text: 'discrepant', part_of_speech: 'adjective' },
          { id: 'C', text: 'discrepantly', part_of_speech: 'adverb' },
          { id: 'D', text: 'discrepance', part_of_speech: 'noun' }
        ],
        expected_answer_id: 'B',
        expected_answer_text: 'discrepant',
        full_correct_sentence: 'The forensic investigator compared the two server logs and noted that their timestamps were noticeably discrepant.',
        grammatical_clue: 'Theo sau động từ liên kết "were" và trạng từ chỉ mức độ "noticeably", vị trí này cần một Tính từ vị ngữ (Predicate Adjective) -> "discrepant".',
        vietnamese_explanation: 'Sau "were noticeably" cần tính từ vị ngữ "discrepant" để bổ nghĩa cho chủ ngữ "timestamps" (các mốc thời gian bị lệch nhau).',
        distractor_explanations: {
          A: 'discrepancy là danh từ; sau "were noticeably" cần tính từ vị ngữ chứ không phải danh từ.',
          B: 'Chính xác! "discrepant" là dạng tính từ chính thống, có nghĩa là không ăn khớp, bất nhất.',
          C: 'discrepantly là trạng từ, câu đã có trạng từ "noticeably" nên cần tính từ vị ngữ sau to-be.',
          D: 'discrepance là từ cổ không dùng trong tiếng Anh hiện đại.'
        },
        hint: 'Cần một tính từ đứng sau cụm "were noticeably".'
      }
    ]
  },
  resilient: {
    family_root: 'resile',
    headword: 'resilient',
    part_of_speech: 'adjective',
    ipa: '/rɪˈzɪl.jənt/',
    meaning_vi: 'Kiên cường, có khả năng phục hồi nhanh chóng sau biến cố hoặc áp lực',
    meaning_en: 'Able to recover quickly from difficult conditions, damage, or shock',
    collocation_pattern: 'resilient infrastructure; demonstrate resilience; remain resilient',
    example_workplace: 'The engineering team built a resilient microservices architecture that automatically absorbs traffic spikes.',
    example_general: 'Children are often remarkably resilient when adjusting to a new environment.',
    pronunciation_tip: 'Trọng âm rơi vào âm tiết thứ hai: re-SIL-ient (/rɪˈzɪl.jənt/).',
    missing_forms_note: 'Động từ gốc "resile" (/rɪˈzaɪl/) là thuật ngữ pháp lý cổ, hiếm khi dùng trong giao tiếp thường nhật.',
    members: [
      {
        form: 'resilience',
        part_of_speech: 'noun',
        ipa: '/rɪˈzɪl.jəns/',
        suffix_or_pattern: '-ence (abstract noun)',
        meaning_vi: 'Khả năng phục hồi, tính kiên cường',
        example_sentence: 'Emotional resilience helps professionals navigate high-pressure work environments.'
      },
      {
        form: 'resilient',
        part_of_speech: 'adjective',
        ipa: '/rɪˈzɪl.jənt/',
        suffix_or_pattern: '-ent (adjective)',
        meaning_vi: 'Kiên cường, bền bỉ',
        example_sentence: 'Our supply chain proved resilient despite severe regional port disruptions.',
        is_headword: true
      },
      {
        form: 'resiliently',
        part_of_speech: 'adverb',
        ipa: '/rɪˈzɪl.jənt.li/',
        suffix_or_pattern: '-ly (adverb of manner)',
        meaning_vi: 'Một cách kiên cường, đầy bền bỉ',
        example_sentence: 'The local economy bounced back resiliently following the market downturn.'
      }
    ],
    exercises: [
      {
        id: 'wf-resilient-1',
        exercise_type: 'word_form_selection',
        prompt: 'To thrive in fast-changing tech markets, modern startups must cultivate organizational ________ across all departments.',
        target_form: 'resilience',
        target_part_of_speech: 'noun',
        options: [
          { id: 'A', text: 'resile', part_of_speech: 'verb' },
          { id: 'B', text: 'resilience', part_of_speech: 'noun' },
          { id: 'C', text: 'resilient', part_of_speech: 'adjective' },
          { id: 'D', text: 'resiliently', part_of_speech: 'adverb' }
        ],
        expected_answer_id: 'B',
        expected_answer_text: 'resilience',
        full_correct_sentence: 'To thrive in fast-changing tech markets, modern startups must cultivate organizational resilience across all departments.',
        grammatical_clue: 'Đứng sau tính từ "organizational" và làm tân ngữ cho ngoại động từ "cultivate", vị trí này bắt buộc phải là một Danh từ -> "resilience".',
        vietnamese_explanation: 'Cần danh từ "resilience" đứng sau tính từ "organizational" để tạo thành cụm danh từ "organizational resilience" (sức bền bỉ của tổ chức).',
        distractor_explanations: {
          A: 'resile là động từ, không thể đứng sau tính từ "organizational" làm tân ngữ.',
          B: 'Chính xác! "resilience" là danh từ chỉ khả năng phục hồi, hoàn hảo về cả ngữ nghĩa và ngữ pháp.',
          C: 'resilient là tính từ, hai tính từ đứng liền nhau mà không có danh từ theo sau sẽ khiến cụm tân ngữ cụt lửng.',
          D: 'resiliently là trạng từ, không thể làm tân ngữ trực tiếp cho động từ "cultivate".'
        },
        hint: 'Cần một danh từ đứng sau tính từ "organizational".'
      }
    ]
  }
};

/**
 * Generates a linguistically valid rule-based word family fallback
 * for words not in the curated dictionary.
 */
export function buildRuleBasedWordFamily(
  rawWord: string,
  contextSentence: string,
  profile: UserProfile,
  majorOrField?: string
): WordPracticeData {
  const cleaned = rawWord.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
  const curated = CURATED_WORD_FAMILIES[cleaned];
  if (curated) {
    return {
      word: curated.headword,
      cleaned_word: cleaned,
      part_of_speech: curated.part_of_speech,
      ipa: curated.ipa,
      pronunciation_tip: curated.pronunciation_tip,
      meaning_vi: curated.meaning_vi,
      meaning_en: curated.meaning_en,
      collocation_pattern: curated.collocation_pattern,
      example_workplace: curated.example_workplace,
      example_general: curated.example_general,
      similar_word_comparison: curated.similar_word_comparison,
      context_in_exam: contextSentence,
      word_family: {
        family_root: curated.family_root,
        members: curated.members,
        missing_forms_note: curated.missing_forms_note
      },
      exercises: curated.exercises,
      practice_question: {
        prompt: curated.exercises[0].prompt,
        options: curated.exercises[0].options.map(o => ({ id: o.id, text: o.text })),
        expected_answer_id: curated.exercises[0].expected_answer_id,
        expected_answer_text: curated.exercises[0].expected_answer_text,
        explanation: curated.exercises[0].vietnamese_explanation,
        hint: curated.exercises[0].hint || 'Choose the correct grammatical form.'
      }
    };
  }

  // Morphological heuristic generator for arbitrary user input
  // Infers canonical base and common derivational patterns
  let base = cleaned;
  let detectedPos = 'noun';
  let nounForm = cleaned;
  let verbForm = cleaned;
  let adjForm = cleaned;
  let advForm = cleaned;

  if (cleaned.endsWith('tion') || cleaned.endsWith('sion') || cleaned.endsWith('ment') || cleaned.endsWith('ance') || cleaned.endsWith('ence')) {
    detectedPos = 'noun';
    if (cleaned.endsWith('tion')) {
      base = cleaned.replace(/tion$/, 'te');
      verbForm = base;
      adjForm = cleaned.replace(/tion$/, 'tive');
      advForm = adjForm + 'ly';
      nounForm = cleaned;
    } else if (cleaned.endsWith('ment')) {
      base = cleaned.replace(/ment$/, '');
      verbForm = base;
      adjForm = base + 'able';
      advForm = adjForm + 'ly';
      nounForm = cleaned;
    }
  } else if (cleaned.endsWith('ate') || cleaned.endsWith('ize') || cleaned.endsWith('ise') || cleaned.endsWith('ify')) {
    detectedPos = 'verb';
    verbForm = cleaned;
    nounForm = cleaned.endsWith('ate') ? cleaned.replace(/e$/, 'ion') : cleaned + 'ation';
    adjForm = cleaned.endsWith('ate') ? cleaned.replace(/e$/, 'ive') : cleaned + 'able';
    advForm = adjForm + 'ly';
  } else if (cleaned.endsWith('ive') || cleaned.endsWith('able') || cleaned.endsWith('ible') || cleaned.endsWith('al') || cleaned.endsWith('ous')) {
    detectedPos = 'adjective';
    adjForm = cleaned;
    advForm = cleaned + 'ly';
    nounForm = cleaned.endsWith('ive') ? cleaned.replace(/ive$/, 'ion') : cleaned + 'ity';
    verbForm = cleaned.replace(/(ive|able|ible|al|ous)$/, '');
  } else if (cleaned.endsWith('ly')) {
    detectedPos = 'adverb';
    advForm = cleaned;
    adjForm = cleaned.replace(/ly$/, '');
    nounForm = adjForm + 'ness';
    verbForm = adjForm;
  }

  const primaryTestedPos = detectedPos === 'adverb' ? 'adjective' : 'adverb';
  const targetTestedForm = primaryTestedPos === 'adverb' ? advForm : adjForm;

  const members = [
    {
      form: nounForm,
      part_of_speech: 'noun',
      suffix_or_pattern: '-ion / -ment (noun)',
      meaning_vi: `Dạng danh từ của "${cleaned}"`,
      example_sentence: `The team analyzed the overall ${nounForm} during the evaluation.`
    },
    {
      form: verbForm,
      part_of_speech: 'verb',
      suffix_or_pattern: 'verb stem',
      meaning_vi: `Dạng động từ của "${cleaned}"`,
      example_sentence: `Leaders must ${verbForm} closely with cross-functional stakeholders.`
    },
    {
      form: adjForm,
      part_of_speech: 'adjective',
      suffix_or_pattern: '-ive / -able (adjective)',
      meaning_vi: `Dạng tính từ của "${cleaned}"`,
      example_sentence: `This represents an exceptionally ${adjForm} approach to solving the problem.`
    },
    {
      form: advForm,
      part_of_speech: 'adverb',
      suffix_or_pattern: '-ly (adverb)',
      meaning_vi: `Dạng trạng từ của "${cleaned}"`,
      example_sentence: `The project was executed ${advForm} from start to finish.`
    }
  ];

  const options = [
    { id: 'A', text: nounForm, part_of_speech: 'noun' },
    { id: 'B', text: verbForm, part_of_speech: 'verb' },
    { id: 'C', text: adjForm, part_of_speech: 'adjective' },
    { id: 'D', text: advForm, part_of_speech: 'adverb' }
  ];

  const expectedOption = options.find(o => o.text.toLowerCase() === targetTestedForm.toLowerCase()) || options[3];

  const primaryExercise: WordFamilyExercise = {
    id: `wf-${cleaned}-1`,
    exercise_type: 'word_form_selection',
    prompt: `The project milestones were executed ________ by the engineering squad.`,
    target_form: expectedOption.text,
    target_part_of_speech: expectedOption.part_of_speech || 'adverb',
    options,
    expected_answer_id: expectedOption.id,
    expected_answer_text: expectedOption.text,
    full_correct_sentence: `The project milestones were executed ${expectedOption.text} by the engineering squad.`,
    grammatical_clue: `Đứng sau phân từ quá khứ bị động "were executed" để chỉ thể cách thực hiện -> Cần Trạng từ (Adverb) kết thúc bằng "-ly".`,
    vietnamese_explanation: `Cần trạng từ "${expectedOption.text}" để bổ nghĩa cho động từ "executed".`,
    distractor_explanations: {
      A: `${nounForm} là danh từ; danh từ không thể bổ nghĩa trực tiếp cho động từ hành động.`,
      B: `${verbForm} là động từ; không thể đứng sau động từ phân từ "executed".`,
      C: `${adjForm} là tính từ; tính từ bổ nghĩa cho danh từ, không bổ nghĩa cho động từ.`,
      D: `Chính xác! "${advForm}" là trạng từ chỉ cách thức bổ nghĩa cho động từ "executed".`
    },
    hint: `Xác định từ loại bổ nghĩa cho động từ "executed".`
  };

  return {
    word: cleaned,
    cleaned_word: cleaned,
    part_of_speech: detectedPos,
    ipa: `/${cleaned}/`,
    meaning_vi: `Từ vựng chuyên ngành / học thuật: ${cleaned}`,
    meaning_en: `Academic and professional vocabulary term: ${cleaned}`,
    collocation_pattern: `apply ${cleaned}; critical ${cleaned}`,
    example_workplace: `Understanding ${cleaned} is essential for accurate workplace communication.`,
    example_general: `The speaker used the term ${cleaned} to explain the core concept.`,
    context_in_exam: contextSentence,
    word_family: {
      family_root: base,
      members,
      missing_forms_note: 'Họ từ được phân tích dựa trên hình thái học ngôn ngữ tiếng Anh.'
    },
    exercises: [primaryExercise],
    practice_question: {
      prompt: primaryExercise.prompt,
      options: primaryExercise.options.map(o => ({ id: o.id, text: o.text })),
      expected_answer_id: primaryExercise.expected_answer_id,
      expected_answer_text: primaryExercise.expected_answer_text,
      explanation: primaryExercise.vietnamese_explanation,
      hint: primaryExercise.hint || 'Select the correct grammatical form.'
    }
  };
}
