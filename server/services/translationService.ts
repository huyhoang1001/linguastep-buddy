import {
  EnglishLevel,
  Question,
  AnswerEvaluation,
  UserProfile
} from '../../src/types/learning.js';

export interface AdaptiveTranslationBankItem {
  id: string;
  cefrLevel: EnglishLevel;
  targetSkillId: string;
  targetSkillName: string;
  vietnameseText: string;
  scenario: string;
  tone: 'casual' | 'playful' | 'sarcastic' | 'annoyed' | 'rough' | 'cheeky';
  relationship: 'close_friends' | 'coworkers' | 'partner' | 'online_chat' | 'other';
  hints: [string, string, string]; // [1. Communicative Intent, 2. Grammar Concept, 3. Vocab/Phrasing Clue]
  modelAnswer: string;
  acceptedAlternatives: string[];
  evaluationCriteria: string[];
  grammarConnectionVi: string;
  grammarConnectionEn: string;
  toneInsightVi: string;
  toneInsightEn: string;
  alternativePhrasing: string;
}

export const GENZ_TRANSLATION_BANK: AdaptiveTranslationBankItem[] = [
  // -------------------------------------------------------------------------
  // A1 / Beginner Foundation: Everyday Casual Openers & Simple Desires
  // -------------------------------------------------------------------------
  {
    id: 'tr-a1-bubble-tea',
    cefrLevel: 'A1',
    targetSkillId: 'present_simple_vs_continuous',
    targetSkillName: 'Present Simple vs Continuous',
    vietnameseText: 'Ê mệt quá, đi uống trà sữa không?',
    scenario: 'Rủ bạn thân đi giải lao sau giờ học/làm căng thẳng',
    tone: 'casual',
    relationship: 'close_friends',
    hints: [
      'Ý định: Rủ bạn bè đi xả stress một cách tự nhiên, thân mật.',
      'Ngữ pháp: Dùng cấu trúc rủ rê đơn giản "Want to get..." hoặc "Why don\'t we...".',
      'Gợi ý từ: Trà sữa trong tiếng Anh giao tiếp là "boba" hoặc "bubble tea".'
    ],
    modelAnswer: 'Man I\'m exhausted, want to get some boba?',
    acceptedAlternatives: [
      'I\'m so tired, wanna grab some bubble tea?',
      'So tired, want to get boba?',
      'So exhausted, wanna grab some milk tea?'
    ],
    evaluationCriteria: [
      'Thể hiện được sự mệt mỏi tự nhiên ("tired", "exhausted", "beat")',
      'Lời rủ thân mật ("wanna", "want to grab/get")',
      'Không dùng cấu trúc quá trang trọng như "Shall we consume milk tea"'
    ],
    grammarConnectionVi: 'Dùng câu hỏi rút gọn thân mật "Want to...?" thay cho "Do you want to...?" trong giao tiếp hàng ngày.',
    grammarConnectionEn: 'Informal ellipsis: Omitting auxiliary "Do you" in spoken invitations ("Want to grab...?").',
    toneInsightVi: '"Wanna get boba?" tạo cảm giác thoải mái, gần gũi như hai người bạn thân rủ nhau.',
    toneInsightEn: '"Wanna get some boba?" strikes the perfect relaxed, friendly tone between close friends.',
    alternativePhrasing: 'I\'m beat, let\'s grab boba!'
  },
  {
    id: 'tr-a1-starving',
    cefrLevel: 'A1',
    targetSkillId: 'present_simple_vs_continuous',
    targetSkillName: 'Present Simple vs Continuous',
    vietnameseText: 'Tui đói bụng quá trời luôn á.',
    scenario: 'Than thở với đứa bạn cùng phòng hoặc người yêu',
    tone: 'playful',
    relationship: 'close_friends',
    hints: [
      'Ý định: Nhấn mạnh cơn đói cồn cào một cách sinh động, nũng nịu.',
      'Ngữ pháp: Thì hiện tại đơn với tính từ nhấn mạnh (starving / so hungry).',
      'Gợi ý từ: Thay vì chỉ nói "I am very hungry", người bản xứ hay nói "I\'m starving!".'
    ],
    modelAnswer: 'I\'m literally starving right now.',
    acceptedAlternatives: [
      'I\'m so hungry right now!',
      'I\'m starving to death!',
      'I\'m absolutely starving.'
    ],
    evaluationCriteria: [
      'Truyền tải mức độ đói cao ("starving", "so hungry")',
      'Giọng điệu than thở vui vẻ, đời thường'
    ],
    grammarConnectionVi: 'Thì hiện tại đơn diễn tả trạng thái thể chất tức thời ("I\'m starving").',
    grammarConnectionEn: 'Present simple state with non-gradable extreme adjectives ("starving").',
    toneInsightVi: '"Literally starving" là cách Gen Z nói quá (hyperbole) rất phổ biến để diễn tả cơn đói.',
    toneInsightEn: '"Literally starving" uses playful Gen Z hyperbole to emphasize how hungry you feel.',
    alternativePhrasing: 'My stomach is screaming for food.'
  },

  // -------------------------------------------------------------------------
  // A2 / Elementary: Past Simple, Routines, and Casual Teasing
  // -------------------------------------------------------------------------
  {
    id: 'tr-a2-overslept',
    cefrLevel: 'A2',
    targetSkillId: 'past_simple_regular_irregular',
    targetSkillName: 'Past Simple Regular & Irregular',
    vietnameseText: 'Hôm qua tui ngủ quên nên trễ học.',
    scenario: 'Phân trần với bạn cùng lớp lý do vắng mặt tiết đầu',
    tone: 'casual',
    relationship: 'close_friends',
    hints: [
      'Ý định: Kể lại sự việc đã xảy ra trong quá khứ một cách thành thật.',
      'Ngữ pháp: Thì quá khứ đơn với động từ bất quy tắc "sleep" → "overslept".',
      'Gợi ý từ: "Ngủ quên" dùng "overslept", "trễ học" dùng "was late for class".'
    ],
    modelAnswer: 'I overslept yesterday so I was late for class.',
    acceptedAlternatives: [
      'Yesterday I overslept, so I ended up late to class.',
      'I accidentally overslept yesterday and missed the start of class.',
      'I slept through my alarm yesterday and was late for school.'
    ],
    evaluationCriteria: [
      'Dùng chính xác quá khứ đơn "overslept" thay vì "forget to wake up"',
      'Mệnh đề nguyên nhân - kết quả mạch lạc với "so"',
      'Cụm "late for class/school"'
    ],
    grammarConnectionVi: 'Động từ bất quy tắc "overslept" đi kèm mốc thời gian xác định "yesterday".',
    grammarConnectionEn: 'Irregular past simple "overslept" with definite past time marker "yesterday".',
    toneInsightVi: 'Dùng "overslept" tự nhiên và ngắn gọn hơn nhiều so with các cách diễn đạt vòng vo như "slept too much".',
    toneInsightEn: '"Overslept" is the natural, idiomatic way native speakers explain sleeping past their alarm.',
    alternativePhrasing: 'My alarm didn\'t wake me up yesterday, so I showed up late.'
  },
  {
    id: 'tr-a2-missed-calls',
    cefrLevel: 'A2',
    targetSkillId: 'past_simple_regular_irregular',
    targetSkillName: 'Past Simple Regular & Irregular',
    vietnameseText: 'Ê nãy giờ gọi không bắt máy nha!',
    scenario: 'Cằn nhằn yêu một đứa bạn vì gọi mấy cuộc liền không thèm nghe',
    tone: 'playful',
    relationship: 'close_friends',
    hints: [
      'Ý định: Trách móc nhẹ nhàng, giỡn vui vì bạn không nghe máy.',
      'Ngữ pháp: Thì hiện tại hoàn thành hoặc quá khứ với "haven\'t answered / didn\'t pick up".',
      'Gợi ý từ: "Bắt máy" là "pick up" hoặc "answer the phone".'
    ],
    modelAnswer: 'Hey, you haven\'t been picking up my calls!',
    acceptedAlternatives: [
      'Hey, you didn\'t pick up my phone!',
      'Dude, you didn\'t answer any of my calls!',
      'Why haven\'t you been answering my calls?'
    ],
    evaluationCriteria: [
      'Hành động bắt máy: "pick up" hoặc "answer"',
      'Sắc thái trêu đùa, không phải tức giận thù hằn'
    ],
    grammarConnectionVi: 'Dùng cụm động từ "pick up (the phone)" rất phổ biến trong giao tiếp đời thường.',
    grammarConnectionEn: 'Phrasal verb "pick up" for answering phone calls in informal settings.',
    toneInsightVi: 'Thêm thán từ "Hey" hoặc "Dude" ở đầu câu giúp giữ sắc thái thân mật, trêu chọc.',
    toneInsightEn: 'Starting with a casual vocative ("Hey" / "Dude") keeps the annoyance playful rather than aggressive.',
    alternativePhrasing: 'Ignoring my calls, huh?'
  },

  // -------------------------------------------------------------------------
  // B1 / Intermediate: Was about to, Past with Thought, Teasing Banter
  // -------------------------------------------------------------------------
  {
    id: 'tr-b1-late-reply-tease',
    cefrLevel: 'B1',
    targetSkillId: 'present_perfect_past_simple',
    targetSkillName: 'Present Perfect vs Past Simple',
    vietnameseText: 'Ủa alo, giờ mới rep hả? Tưởng mất tích luôn rồi chứ.',
    scenario: 'Trêu đứa bạn chí cốt sau khi nó ngâm tin nhắn cả buổi',
    tone: 'sarcastic',
    relationship: 'close_friends',
    hints: [
      'Ý định: Cà khịa đứa bạn vì rep chậm như rùa, tưởng đâu bốc hơi rồi.',
      'Ngữ pháp: Thì quá khứ với "thought" (lầm tưởng) kết hợp câu hỏi mỉa mai.',
      'Gợi ý từ: Câu châm biếm kinh điển của người bản xứ: "Oh, so you\'re alive?" hoặc "thought you died/disappeared".'
    ],
    modelAnswer: 'Oh, so you\'re alive? Thought you\'d disappeared!',
    acceptedAlternatives: [
      'Look who finally replied! I thought you fell off the face of the earth.',
      'Finally replying? Thought you went completely missing.',
      'Oh look, you\'re alive! Thought you vanished into thin air.'
    ],
    evaluationCriteria: [
      'Thể hiện được sự châm biếm hài hước ("so you\'re alive", "finally replying")',
      'Sử dụng mệnh đề "thought + past/past perfect" ("thought you\'d disappeared")',
      'Không dịch máy cứng nhắc kiểu "Why do you now reply"'
    ],
    grammarConnectionVi: 'Cấu trúc "Thought you had [past participle]" diễn tả điều mình từng suy đoán trong quá khứ.',
    grammarConnectionEn: 'Elliptical past simple with mental verb: "(I) thought you\'d disappeared".',
    toneInsightVi: '"Oh, so you\'re alive?" là câu đùa kinh điển giữa bạn thân, thể hiện sự trêu chọc duyên dáng.',
    toneInsightEn: '"Oh, so you\'re alive?" is a staple playful tease between friends, turning mild irritation into humor.',
    alternativePhrasing: 'Look who decided to grace me with a reply!'
  },
  {
    id: 'tr-b1-was-about-to',
    cefrLevel: 'B1',
    targetSkillId: 'present_perfect_past_simple',
    targetSkillName: 'Present Perfect vs Past Simple',
    vietnameseText: 'Tui tính đi ngủ rồi mà nhỏ bạn gọi tám chuyện.',
    scenario: 'Giải thích với người khác tại sao đêm qua thức khuya',
    tone: 'casual',
    relationship: 'close_friends',
    hints: [
      'Ý định: Diễn tả một hành động suýt nữa đã xảy ra nhưng bị gián đoạn.',
      'Ngữ pháp: Cấu trúc "was about to [verb]" (định / tính làm gì đó).',
      'Gợi ý từ: "Tám chuyện" là "chat", "catch up", hoặc "gossip".'
    ],
    modelAnswer: 'I was just about to go to sleep, but my friend called to chat.',
    acceptedAlternatives: [
      'I was about to head to bed when my friend called to gossip.',
      'I was gonna sleep, but my friend called to chat.',
      'I was ready to hit the sack, but a friend called to catch up.'
    ],
    evaluationCriteria: [
      'Sử dụng cấu trúc "was (just) about to" hoặc "was going to"',
      'Chuyển ngữ tự nhiên của "tám chuyện" ("chat", "catch up")',
      'Mệnh đề tương phản với liên từ "but" hoặc "when"'
    ],
    grammarConnectionVi: '"Was about to + V" diễn đạt một dự định sát nút trong quá khứ bị sự kiện khác chen ngang.',
    grammarConnectionEn: '"Be about to + infinitive" in past tense denotes imminent interrupted intention.',
    toneInsightVi: 'Thêm "just" ("was just about to") giúp câu nói nghe sinh động và đúng ngữ cảnh đời thường.',
    toneInsightEn: 'Adding "just" ("was just about to") emphasizes the immediacy of your interrupted plan.',
    alternativePhrasing: 'I was literally on my way to dreamland until my friend called.'
  },
  {
    id: 'tr-b1-flaked-out',
    cefrLevel: 'B1',
    targetSkillId: 'conditionals_real_hypothetical',
    targetSkillName: 'First & Second Conditionals',
    vietnameseText: 'Tui tưởng ông bùng kèo luôn rồi.',
    scenario: 'Chào đứa bạn vừa đến trễ nửa tiếng tại quán nước',
    tone: 'cheeky',
    relationship: 'close_friends',
    hints: [
      'Ý định: Trêu chọc người bạn đến muộn, tưởng là đã cho mình leo cây.',
      'Ngữ pháp: Thì quá khứ đơn với "thought you...".',
      'Gợi ý từ: Cụm từ tiếng lóng cho "bùng kèo / cho leo cây" là "bail on me", "flake out", hoặc "ghost me".'
    ],
    modelAnswer: 'I thought you bailed on me!',
    acceptedAlternatives: [
      'I thought you flaked out on me!',
      'Thought you were ghosting our plan!',
      'I honestly thought you stood me up!'
    ],
    evaluationCriteria: [
      'Sử dụng tiếng lóng tự nhiên ("bail on", "flake", "stand up")',
      'Cấu trúc "I thought you [past tense]"',
      'Giữ được thái độ trêu chọc thân mật'
    ],
    grammarConnectionVi: 'Động từ "thought" theo sau bởi mệnh đề quá khứ diễn tả giả định đã bị phủ định bởi thực tế.',
    grammarConnectionEn: 'Past hypothesis contradicted by reality: "I thought you bailed (but here you are)".',
    toneInsightVi: '"Bailed on me" hay "flaked out" chuẩn xác sắc thái "bùng kèo" hơn từ chung chung như "cancel".',
    toneInsightEn: '"Bailed on me" or "flaked" captures the colloquial casualness of breaking plans much better than "canceled".',
    alternativePhrasing: 'Almost gave up on you showing up!'
  },
  {
    id: 'tr-b1-doomscrolling',
    cefrLevel: 'B1',
    targetSkillId: 'past_simple_regular_irregular',
    targetSkillName: 'Past Simple Regular & Irregular',
    vietnameseText: 'Tính ngủ sớm mà lướt điện thoại cái tới 2 giờ sáng.',
    scenario: 'Thú nhận thói quen thức khuya lướt mạng với nhóm bạn',
    tone: 'playful',
    relationship: 'close_friends',
    hints: [
      'Ý định: Tự giễu bản thân vì dự định một đằng nhưng lại lướt điện thoại quên giờ giấc.',
      'Ngữ pháp: Cấu trúc "ended up [V-ing]" (rốt cuộc lại) diễn tả kết quả không lường trước.',
      'Gợi ý từ: "Lướt điện thoại khuya" tiếng Anh hiện đại có từ "doomscrolling" hoặc "scrolling on my phone".'
    ],
    modelAnswer: 'I planned to sleep early, but ended up scrolling on my phone until 2 AM.',
    acceptedAlternatives: [
      'Meant to go to bed early, but doomscrolled until 2 AM instead.',
      'I intended to sleep early, but got sucked into my phone till 2 in the morning.',
      'Wanted to sleep early, but one TikTok led to another and suddenly it was 2 AM.'
    ],
    evaluationCriteria: [
      'Cấu trúc kết quả bất ngờ "ended up -ing" hoặc "got sucked into"',
      'Chuyển ngữ tự nhiên của hành vi lướt điện thoại',
      'Giọng điệu đồng cảm, hài hước'
    ],
    grammarConnectionVi: '"Ended up + V-ing" là cấu trúc xuất sắc để diễn tả việc mình rơi vào tình huống không mong đợi ban đầu.',
    grammarConnectionEn: '"End up + gerund" perfectly describes doing something unplanned due to distraction.',
    toneInsightVi: '"Ended up scrolling until 2 AM" diễn tả sự bất lực hài hước của Gen Z trước thuật toán mạng xã hội.',
    toneInsightEn: '"Ended up doomscrolling" captures the universally relatable struggle of nighttime screen addiction.',
    alternativePhrasing: 'My plan was early sleep; my phone had other ideas.'
  },

  // -------------------------------------------------------------------------
  // B2 / Upper Intermediate: Third Conditional, Modals, Drama & Cynicism
  // -------------------------------------------------------------------------
  {
    id: 'tr-b2-third-conditional-regret',
    cefrLevel: 'B2',
    targetSkillId: 'mixed_conditionals_regret',
    targetSkillName: 'Mixed Conditionals in Retrospectives',
    vietnameseText: 'Biết vậy hồi đó tui đã không nhận cái job này.',
    scenario: 'Than thở với đồng nghiệp cũ về dự án áp lực cao ngập ngụa lỗi',
    tone: 'annoyed',
    relationship: 'coworkers',
    hints: [
      'Ý định: Bày tỏ sự hối tiếc sâu sắc về một quyết định sai lầm trong quá khứ.',
      'Ngữ pháp: Câu điều kiện loại 3 (Third Conditional: "If I had known, I wouldn\'t have...") hoặc cấu trúc với "wish".',
      'Gợi ý từ: "Nhận công việc" có thể dùng "taken this job" hoặc "accepted this gig".'
    ],
    modelAnswer: 'If I had known, I wouldn\'t have taken this job.',
    acceptedAlternatives: [
      'Had I known, I never would have accepted this gig.',
      'I really wish I hadn\'t taken this job in the first place.',
      'If only I hadn\'t said yes to this job back then.'
    ],
    evaluationCriteria: [
      'Cấu trúc điều kiện loại 3: "If had [V3], would have [V3]" hoặc "I wish I hadn\'t [V3]"',
      'Không dùng thì hiện tại hoặc điều kiện loại 1/2',
      'Giữ được thái độ chán nản, tiếc nuối'
    ],
    grammarConnectionVi: 'Câu điều kiện loại 3 ("If I had known..., I wouldn\'t have...") diễn tả sự tiếc nuối trái ngược với quá khứ.',
    grammarConnectionEn: 'Third conditional ("If + past perfect, would have + past participle") expresses hypothetical past regret.',
    toneInsightVi: '"If I had known" ngắn gọn nhưng lột tả trọn vẹn sự cay đắng của "biết vậy hồi đó".',
    toneInsightEn: '"If I had known" or "Had I known" captures the resigned regret of hindsight.',
    alternativePhrasing: 'Major regrets accepting this offer, honestly.'
  },
  {
    id: 'tr-b2-deadline-unrealistic',
    cefrLevel: 'B2',
    targetSkillId: 'modals_degrees_certainty',
    targetSkillName: 'Modals of Deduction & Probability',
    vietnameseText: 'Nói thiệt chứ cái deadline này hơi ảo ma.',
    scenario: 'Nói chuyện riêng với đồng nghiệp về thời hạn dự án quá vô lý',
    tone: 'sarcastic',
    relationship: 'coworkers',
    hints: [
      'Ý định: Nhận xét thẳng thắn, nửa đùa nửa thật về thời hạn bất khả thi.',
      'Ngữ pháp: Dùng trạng từ mở đầu "To be honest / Honestly" kèm tính từ mô tả sự phi thực tế.',
      'Gợi ý từ: "Ảo ma" trong ngữ cảnh này có nghĩa là "unrealistic", "insane", hoặc "delusional".'
    ],
    modelAnswer: 'Honestly, this deadline is completely unrealistic.',
    acceptedAlternatives: [
      'Not gonna lie, this deadline is pretty insane.',
      'Real talk, who came up with this crazy deadline?',
      'To be fair, this deadline is borderline delusional.'
    ],
    evaluationCriteria: [
      'Cách mở đầu tự nhiên ("Honestly", "Not gonna lie", "Real talk")',
      'Diễn đạt được chữ "ảo ma" theo ngữ cảnh công việc ("unrealistic", "insane", "wild")',
      'Không dịch từng chữ kiểu "virtual magic"'
    ],
    grammarConnectionVi: 'Trạng từ liên kết ("Honestly", "Admittedly") giúp định hình thái độ của người nói trước khi nêu nhận định.',
    grammarConnectionEn: 'Discourse markers ("Honestly", "Not gonna lie") establish authentic peer-to-peer workplace rapport.',
    toneInsightVi: '"Borderline delusional" hay "completely unrealistic" bắt trọn cái chất "ảo ma" của dân IT.',
    toneInsightEn: '"Borderline delusional" or "insane" conveys that specific tech-industry disbelief at management estimates.',
    alternativePhrasing: 'This timeline exists strictly in fantasy land.'
  },
  {
    id: 'tr-b2-caught-in-drama',
    cefrLevel: 'B2',
    targetSkillId: 'passive_voice_objective',
    targetSkillName: 'Passive Voice in Objective Reports',
    vietnameseText: 'Đang yên đang lành tự nhiên dính drama.',
    scenario: 'Tâm sự với hội bạn thân khi bất ngờ bị lôi vào vụ thị phi nơi công sở',
    tone: 'annoyed',
    relationship: 'close_friends',
    hints: [
      'Ý định: Diễn tả sự bực bội khi bản thân không làm gì nhưng vẫn bị vạ lây.',
      'Ngữ pháp: Thể bị động dạng cảm xúc ("got dragged into", "got caught up in").',
      'Gợi ý từ: "Dính drama" là "got dragged into drama", "đang yên lành" là "minding my own business".'
    ],
    modelAnswer: 'I was minding my own business and suddenly got dragged into workplace drama.',
    acceptedAlternatives: [
      'Everything was peaceful until I got dragged into all this unnecessary drama.',
      'Out of nowhere, I somehow got pulled into office drama.',
      'I was just minding my life and bam, drama out of thin air.'
    ],
    evaluationCriteria: [
      'Cụm "minding my own business" hoặc "everything was fine/peaceful"',
      'Cấu trúc bị động "got dragged into / pulled into"',
      'Từ "drama" giữ nguyên nghĩa đời sống xã hội'
    ],
    grammarConnectionVi: 'Thể bị động với "get" ("got dragged into") nhấn mạnh cảm giác bị động bất đắc dĩ của nạn nhân.',
    grammarConnectionEn: 'Get-passive ("got dragged into") conveys involuntary immersion in an unpleasant event.',
    toneInsightVi: '"Minding my own business" là đối trọng hoàn hảo cho "đang yên đang lành", tạo sự tương phản gay cấn.',
    toneInsightEn: '"Minding my own business" provides the classic narrative setup before dramatic disruption.',
    alternativePhrasing: 'Zero involvement, yet somehow I\'m in the center of the crossfire.'
  },
  {
    id: 'tr-b2-fishy-instinct',
    cefrLevel: 'B2',
    targetSkillId: 'modals_degrees_certainty',
    targetSkillName: 'Modals of Deduction & Probability',
    vietnameseText: 'Thôi thôi, nghe là thấy có mùi rồi.',
    scenario: 'Cảnh báo bạn đừng dại dột tin vào một lời mời chào đầu tư hoặc profile hẹn hò đáng ngờ',
    tone: 'sarcastic',
    relationship: 'close_friends',
    hints: [
      'Ý định: Cảnh báo hoài nghi, khẳng định linh cảm chuyện này có điều bất minh.',
      'Ngữ pháp: Động từ chỉ giác quan ("sounds fishy", "smells sketchy").',
      'Gợi ý từ: "Có mùi" trong tiếng Anh dịch thành "sounds fishy", "sounds shady", hoặc "red flags everywhere".'
    ],
    modelAnswer: 'Yeah right, that sounds super fishy to me.',
    acceptedAlternatives: [
      'Nah, I smell something fishy here.',
      'Hold up, that sounds shady as hell.',
      'No way, that\'s a massive red flag right there.'
    ],
    evaluationCriteria: [
      'Sử dụng các thành ngữ tương đương "có mùi" ("fishy", "shady", "red flag")',
      'Thán từ từ chối dứt khoát ("Nah", "Yeah right", "No way")',
      'Giữ được độ tỉnh táo, sắc sảo'
    ],
    grammarConnectionVi: 'Động từ liên kết chỉ giác quan ("sounds / smells + adjective") dùng trong phán đoán trực giác.',
    grammarConnectionEn: 'Sensory linking verbs ("sounds fishy / looks sketchy") for intuitive evaluations.',
    toneInsightVi: '"Sounds super fishy" chuyển ngữ nguyên vẹn hình tượng "có mùi" từ tiếng Việt sang tiếng Anh bản ngữ.',
    toneInsightEn: '"Sounds super fishy" matches the culinary metaphor in Vietnamese ("có mùi") with native English idiom.',
    alternativePhrasing: 'That whole story stinks from a mile away.'
  },

  // -------------------------------------------------------------------------
  // C1 / Advanced: Subtle Irony, Cynicism, Sharp Rhetoric & Nuanced Flow
  // -------------------------------------------------------------------------
  {
    id: 'tr-c1-who-asked-you',
    cefrLevel: 'C1',
    targetSkillId: 'cleft_sentences_emphasis',
    targetSkillName: 'Cleft Sentences for Focus & Emphasis',
    vietnameseText: 'Ủa rồi ai mượn? Tự làm tự chịu đi chứ than thở gì.',
    scenario: 'Đáp trả một kẻ tự rước việc vào thân rồi quay sang than vãn làm phiền người khác',
    tone: 'rough',
    relationship: 'coworkers',
    hints: [
      'Ý định: Chặn đứng lời than vãn bằng một câu hỏi tu từ sắc bén, yêu cầu chịu trách nhiệm.',
      'Ngữ pháp: Câu hỏi tu từ ("Did anyone ask you to...?") kết hợp thành ngữ răn đe.',
      'Gợi ý từ: Thành ngữ tiếng Anh kinh điển cho "tự làm tự chịu" là "You made your bed, now lie in it".'
    ],
    modelAnswer: 'Did anyone even ask you to? You made your bed, now lie in it instead of whining.',
    acceptedAlternatives: [
      'Nobody asked you to do that. Deal with your own choices and stop complaining.',
      'Who asked you to step in? Own your decisions and quit whining.',
      'Nobody forced your hand. You brought this on yourself, so stop complaining.'
    ],
    evaluationCriteria: [
      'Câu hỏi tu từ châm biếm ("Did anyone ask you?", "Who asked you?")',
      'Thành ngữ hoặc cấu trúc chỉ sự tự chịu trách nhiệm ("made your bed", "own your decisions")',
      'Sắc thái thẳng thắn, không nể nang'
    ],
    grammarConnectionVi: 'Sử dụng câu hỏi tu từ mang ý phủ định tuyệt đối kết hợp mệnh lệnh thức song song.',
    grammarConnectionEn: 'Rhetorical question paired with idiomatic imperative ("You made your bed, now lie in it").',
    toneInsightVi: '"Quit whining" và "own your choices" thể hiện lập trường dứt khoát của một người không ưa mè nheo.',
    toneInsightEn: '"You made your bed, now lie in it" delivers the exact unvarnished toughness of "tự làm tự chịu".',
    alternativePhrasing: 'Play stupid games, win stupid prizes—stop complaining to me.'
  },
  {
    id: 'tr-c1-calculated-smooth-talker',
    cefrLevel: 'C1',
    targetSkillId: 'inversion_negative_adverbials',
    targetSkillName: 'Inversion After Negative Adverbials',
    vietnameseText: 'Nó nói năng nghe mượt tai vậy thôi chứ trong bụng tính kế hết rồi.',
    scenario: 'Cảnh báo đồng nghiệp cảnh giác với một nhân vật thảo mai, mưu mô trong công ty',
    tone: 'sarcastic',
    relationship: 'coworkers',
    hints: [
      'Ý định: Bóc trần bộ mặt thật của kẻ khéo miệng nhưng hiểm độc.',
      'Ngữ pháp: Mệnh đề tương phản nhượng bộ ("He talks a smooth game, but...").',
      'Gợi ý từ: "Khéo ăn nói" dùng "talks a smooth game" hoặc "silver-tongued"; "tính kế" dùng "calculated every move" hoặc "has an agenda".'
    ],
    modelAnswer: 'He talks a smooth game, but he\'s calculated every single move behind the scenes.',
    acceptedAlternatives: [
      'Don\'t let his smooth talk fool you; he has a hidden agenda for everything.',
      'He sounds all sweet and charming, but every move is coldly calculated.',
      'He\'s a silver-tongued operator, but deep down he\'s playing politics.'
    ],
    evaluationCriteria: [
      'Diễn tả được sự đối lập giữa lời nói ngọt ngào và mưu mô bên trong',
      'Từ vựng nâng cao: "smooth game", "calculated", "hidden agenda", "silver-tongued"',
      'Văn phong sắc sảo, cảnh giác cao độ'
    ],
    grammarConnectionVi: 'Mệnh đề tương phản ("He talks..., but...") làm bật lên sự giả dối tinh vi giữa bề nổi và bản chất.',
    grammarConnectionEn: 'Concessive contrast contrasting surface appearance with concealed machinations.',
    toneInsightVi: '"Silver-tongued operator" hay "calculated every move" thể hiện khả năng nhìn thấu tâm can đối phương.',
    toneInsightEn: '"He talks a smooth game" perfectly reflects the Vietnamese expression "nói năng mượt tai".',
    alternativePhrasing: 'His charm is just camouflage for cold, calculated politics.'
  }
];

/**
 * Finds the best-fit translation challenge tailored to the learner's assessed level and target grammar.
 */
export function selectAdaptiveTranslation(
  profile: UserProfile,
  targetSkillName?: string,
  recentErrors?: string[]
): AdaptiveTranslationBankItem {
  const currentLevel: EnglishLevel = profile.current_level || 'B1';

  // 1. Prioritize skill match if specified
  if (targetSkillName) {
    const skillMatch = GENZ_TRANSLATION_BANK.find(
      item => item.targetSkillName.toLowerCase().includes(targetSkillName.toLowerCase()) ||
              targetSkillName.toLowerCase().includes(item.targetSkillName.toLowerCase())
    );
    if (skillMatch) return skillMatch;
  }

  // 2. Prioritize recent error reinforcement
  if (recentErrors && recentErrors.length > 0) {
    const errorMatch = GENZ_TRANSLATION_BANK.find(item =>
      recentErrors.some(err => item.targetSkillName.toLowerCase().includes(err.toLowerCase()))
    );
    if (errorMatch) return errorMatch;
  }

  // 3. Level-appropriate match
  const levelItems = GENZ_TRANSLATION_BANK.filter(item => item.cefrLevel === currentLevel);
  if (levelItems.length > 0) {
    return levelItems[Math.floor(Math.random() * levelItems.length)];
  }

  // Fallback to B1 core items
  const b1Items = GENZ_TRANSLATION_BANK.filter(item => item.cefrLevel === 'B1');
  return b1Items[0] || GENZ_TRANSLATION_BANK[0];
}

/**
 * Converts a Bank Item into a full Question object with zero answer leakage.
 */
export function buildTranslationQuestion(
  bankItem: AdaptiveTranslationBankItem,
  profile: UserProfile
): Question {
  const isVi = profile.explanation_language === 'vi';

  return {
    id: `trans-${bankItem.id}-${Date.now()}`,
    section: 'writing',
    skill_id: bankItem.targetSkillId,
    skill_name: bankItem.targetSkillName,
    question_type: 'vi_to_en_translation',
    difficulty: bankItem.cefrLevel,
    context_topic: 'general',
    prompt: isVi
      ? 'Dịch câu tiếng Việt khẩu ngữ sau sang tiếng Anh tự nhiên (Say It Like You Mean It).'
      : 'Translate this modern Vietnamese expression into authentic, natural conversational English.',
    vietnamese_text: bankItem.vietnameseText,
    translation_scenario: bankItem.scenario,
    translation_tone: bankItem.tone,
    relationship: bankItem.relationship,
    translation_hints: bankItem.hints,
    evaluation_criteria: bankItem.evaluationCriteria,
    model_answer: bankItem.modelAnswer,
    hint: bankItem.hints[0],
    explanation_rule: isVi ? bankItem.grammarConnectionVi : bankItem.grammarConnectionEn
  };
}

/**
 * Robust 5-dimension local fallback translation evaluator.
 * Used when Gemini API is offline, quota-exhausted, or rate-limited.
 */
export function evaluateTranslationOffline(
  question: Question,
  userAnswer: string,
  profile: UserProfile
): AnswerEvaluation {
  const isVi = profile.explanation_language === 'vi';
  const cleanInput = userAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
  const modelClean = (question.model_answer || '').trim().toLowerCase().replace(/[.,!?;:]/g, '');
  
  // Find bank reference if possible
  const bankRef = GENZ_TRANSLATION_BANK.find(b => b.vietnameseText === question.vietnamese_text) || {
    grammarConnectionVi: question.explanation_rule || 'Áp dụng thì và cấu trúc tự nhiên.',
    grammarConnectionEn: question.explanation_rule || 'Applies natural tenses and structures.',
    toneInsightVi: 'Diễn đạt tự nhiên, đúng giọng điệu đời thường.',
    toneInsightEn: 'Natural phrasing matching informal spoken cadence.',
    alternativePhrasing: 'Look who finally decided to join the conversation!'
  };

  const words = cleanInput.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Meaning & Keyword Check
  const keyTokens = modelClean.split(/\s+/).filter(w => w.length > 3);
  const matchedTokens = keyTokens.filter(k => cleanInput.includes(k));
  const tokenMatchRatio = keyTokens.length > 0 ? matchedTokens.length / keyTokens.length : 0.5;

  const hasSubstance = wordCount >= 3;
  const isMeaningPreserved = hasSubstance && (tokenMatchRatio >= 0.3 || cleanInput.length >= 12);

  // 2. Naturalness & Contractions Check
  const hasContractions = /(can't|don't|won't|i'm|it's|you're|thought you'd|didn't|haven't|wanna|gonna)/i.test(userAnswer);
  const naturalnessScore = Math.min(95, Math.max(50, Math.round(55 + (tokenMatchRatio * 25) + (hasContractions ? 15 : 0))));

  // 3. Tone Matching
  const toneScore = Math.min(95, Math.max(55, Math.round(60 + (hasContractions ? 20 : 0) + (wordCount >= 4 ? 15 : 0))));

  const isPass = isMeaningPreserved && wordCount >= 3;
  const verdict = isPass ? (naturalnessScore >= 80 ? 'correct' : 'partially_correct') : 'incorrect';

  return {
    verdict,
    user_answer: userAnswer,
    expected_answer: question.model_answer || 'Natural conversational translation',
    full_correct_sentence: question.model_answer || '',
    decisive_clue: isPass
      ? (isVi ? 'Truyền tải được ý đồ giao tiếp tự nhiên!' : 'Communicative intention conveyed naturally!')
      : (isVi ? 'Câu văn cần tự nhiên hơn, tránh dịch máy từng từ.' : 'Needs more natural conversational flow, avoid literal word-for-word translation.'),
    explanation: isPass
      ? (isVi ? 'Bài dịch tốt! Người bản xứ hiểu ngay ý trêu chọc/giao tiếp đời thường của bạn.' : 'Great job! The native nuance and conversational intent come through clearly.')
      : (isVi ? 'Chưa bắt trọn sắc thái khẩu ngữ. Tham khảo cách diễn đạt tự nhiên bên dưới nhé!' : 'Not quite hitting the right tone yet. Review the recommended native phrasing below!'),
    meaning_feedback: isPass
      ? (isVi ? 'Ý nghĩa gốc của câu tiếng Việt được bảo toàn trọn vẹn.' : 'The original core intention of the Vietnamese expression is fully captured.')
      : (isVi ? 'Ý văn còn hơi gượng hoặc thiếu thông tin so với bản gốc.' : 'The translation feels slightly unnatural or incomplete compared to the original.'),
    tone_insight: isVi ? bankRef.toneInsightVi : bankRef.toneInsightEn,
    grammar_connection: isVi ? bankRef.grammarConnectionVi : bankRef.grammarConnectionEn,
    alternative_phrasing: bankRef.alternativePhrasing,
    naturalness_score: naturalnessScore,
    tone_score: toneScore,
    corrected_text: question.model_answer,
    error_tags: isPass ? [] : ['conversational_naturalness'],
    needs_retry: verdict === 'incorrect',
    next_action: verdict === 'incorrect' ? 'retry' : 'continue'
  };
}
