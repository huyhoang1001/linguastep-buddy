export type CatThemeId = 'calico' | 'sakura' | 'kuro' | 'matcha' | 'siamese' | 'taro';

export type CatCompanionId = 'mochi' | 'kuro' | 'mikan' | 'boba' | 'luna';

export type CatAccessoryId = 'none' | 'ribbon' | 'wizard' | 'graduation' | 'fish' | 'bell';

export type CatMood = 'happy' | 'purring' | 'studying' | 'excited' | 'sleepy';

export interface CatThemePalette {
  id: CatThemeId;
  name: string;
  vietnameseName: string;
  description: string;
  badge: string;
  primaryGradient: string; // Tailwind gradient classes
  bgGradient: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  bannerGradient: string;
  buttonGradient: string;
  tabActiveColor: string;
}

export interface CatCompanionInfo {
  id: CatCompanionId;
  name: string;
  breedTitle: string;
  description: string;
  avatarColor: string;
  earColor: string;
  eyeColor: string;
  whiskerColor: string;
  catchphrase: string;
  vietnameseCatchphrase: string;
}

export interface CatAccessoryInfo {
  id: CatAccessoryId;
  name: string;
  icon: string;
  description: string;
}

export interface CatCustomizationConfig {
  themeId: CatThemeId;
  companionId: CatCompanionId;
  accessoryId: CatAccessoryId;
  catName: string;
  soundEnabled: boolean;
  floatingPaws: boolean;
  meowOnCorrect: boolean;
  showCompanionWidget: boolean;
}

export const CAT_THEMES: Record<CatThemeId, CatThemePalette> = {
  calico: {
    id: 'calico',
    name: 'Calico Caramel',
    vietnameseName: 'Mèo Tam Thể Vàng Cam',
    description: 'Ấm áp, tràn đầy năng lượng và tinh nghịch như chú mèo tam thể',
    badge: '🐾 🐱',
    primaryGradient: 'from-amber-500 via-orange-500 to-amber-600',
    bgGradient: 'from-amber-950/20 via-slate-900 to-slate-950',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/20',
    bannerGradient: 'from-amber-900/40 via-orange-900/30 to-slate-900',
    buttonGradient: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500',
    tabActiveColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Mochi Kitty',
    vietnameseName: 'Mèo Mochi Hoa Anh Đào',
    description: 'Hồng phấn ngọt ngào, dịu dàng và cực kỳ đáng yêu',
    badge: '🌸 🐱',
    primaryGradient: 'from-pink-500 via-rose-400 to-pink-600',
    bgGradient: 'from-pink-950/20 via-slate-900 to-slate-950',
    accentColor: 'text-pink-400',
    borderColor: 'border-pink-500/30',
    glowColor: 'shadow-pink-500/20',
    bannerGradient: 'from-pink-900/40 via-rose-900/30 to-slate-900',
    buttonGradient: 'from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500',
    tabActiveColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40'
  },
  kuro: {
    id: 'kuro',
    name: 'Midnight Kuro-Neko',
    vietnameseName: 'Mèo Đen Huyền Bí',
    description: 'Huyền bí, thông thái với điểm nhấn tím neon và mắt vàng rực',
    badge: '🌙 🐈‍⬛',
    primaryGradient: 'from-indigo-500 via-purple-500 to-violet-600',
    bgGradient: 'from-indigo-950/30 via-slate-900 to-slate-950',
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
    glowColor: 'shadow-indigo-500/25',
    bannerGradient: 'from-indigo-950/60 via-purple-950/40 to-slate-900',
    buttonGradient: 'from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500',
    tabActiveColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
  },
  matcha: {
    id: 'matcha',
    name: 'Mint Matcha Paw',
    vietnameseName: 'Mèo Trà Xanh Bạc Hà',
    description: 'Tươi mát, thư giãn, giúp tinh thần học tập sảng khoái',
    badge: '🍵 🐾',
    primaryGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    bgGradient: 'from-emerald-950/20 via-slate-900 to-slate-950',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-emerald-500/20',
    bannerGradient: 'from-emerald-950/50 via-teal-950/30 to-slate-900',
    buttonGradient: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500',
    tabActiveColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  },
  siamese: {
    id: 'siamese',
    name: 'Blueberry Siamese',
    vietnameseName: 'Mèo Xiêm Mắt Xanh Biển',
    description: 'Thanh lịch, quý phái với sắc xanh sapphire đại dương',
    badge: '🫐 🐱',
    primaryGradient: 'from-sky-400 via-blue-500 to-indigo-600',
    bgGradient: 'from-sky-950/20 via-slate-900 to-slate-950',
    accentColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    glowColor: 'shadow-sky-500/20',
    bannerGradient: 'from-sky-950/50 via-blue-950/30 to-slate-900',
    buttonGradient: 'from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500',
    tabActiveColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  taro: {
    id: 'taro',
    name: 'Taro Purr',
    vietnameseName: 'Mèo Khoai Môn Ngủ Nướng',
    description: 'Tím pastel nhẹ nhàng, êm dịu tạo cảm giác học không áp lực',
    badge: '🍠 💤',
    primaryGradient: 'from-violet-400 via-fuchsia-400 to-purple-600',
    bgGradient: 'from-violet-950/20 via-slate-900 to-slate-950',
    accentColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
    glowColor: 'shadow-violet-500/20',
    bannerGradient: 'from-violet-950/50 via-fuchsia-950/30 to-slate-900',
    buttonGradient: 'from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500',
    tabActiveColor: 'bg-violet-500/20 text-violet-300 border-violet-500/40'
  }
};

export const CAT_COMPANIONS: Record<CatCompanionId, CatCompanionInfo> = {
  mochi: {
    id: 'mochi',
    name: 'Mochi',
    breedTitle: 'Mèo Trắng Đôi Tai Hồng',
    description: 'Chú mèo trắng tinh nghịch, luôn động viên bạn mỗi khi gặp từ vựng khó!',
    avatarColor: '#F8FAFC',
    earColor: '#FDA4AF',
    eyeColor: '#0284C7',
    whiskerColor: '#94A3B8',
    catchphrase: 'Meow! You can do it! Paws-itive thinking!',
    vietnameseCatchphrase: 'Meo meo! Cố lên sen ơi, từng bước một sẽ thành thạo ngay!'
  },
  kuro: {
    id: 'kuro',
    name: 'Kuro',
    breedTitle: 'Mèo Đen Thông Thái',
    description: 'Chú mèo đen huyền bí, siêu giỏi ngữ pháp và các cặp từ dễ nhầm lẫn.',
    avatarColor: '#1E293B',
    earColor: '#475569',
    eyeColor: '#FBBF24',
    whiskerColor: '#64748B',
    catchphrase: 'Purrr... Accuracy is power in English grammar, nya~',
    vietnameseCatchphrase: 'Meo~ Ngữ pháp tiếng Anh phải thật chuẩn xác, đừng để bị lừa nha!'
  },
  mikan: {
    id: 'mikan',
    name: 'Mikan',
    breedTitle: 'Mèo Mướp Cam Năng Động',
    description: 'Chú mèo cam thèm cá rán, luôn thưởng cho bạn 1 con cá mỗi khi trả lời đúng!',
    avatarColor: '#FB923C',
    earColor: '#FDBA74',
    eyeColor: '#10B981',
    whiskerColor: '#C2410C',
    catchphrase: 'Fish treats unlocked! Let’s crush the next question!',
    vietnameseCatchphrase: 'Đúng rồi meo meo! Được thưởng một con cá vàng thơm lừng nè!'
  },
  boba: {
    id: 'boba',
    name: 'Boba',
    breedTitle: 'Mèo Xiêm Cà Phê',
    description: 'Thư thái, điềm tĩnh, thích nhâm nhi trà sữa và giải thích từ loại chi tiết.',
    avatarColor: '#F1F5F9',
    earColor: '#78350F',
    eyeColor: '#38BDF8',
    whiskerColor: '#94A3B8',
    catchphrase: 'Stay calm and master the word families, meow.',
    vietnameseCatchphrase: 'Bình tĩnh phân tích từ loại nhé sen, đáp án nằm ngay trong câu đó.'
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    breedTitle: 'Mèo Tinh Tú Diệu Kỳ',
    description: 'Chú mèo có dấu sao trên trán, mang lại may mắn và trực giác ngôn ngữ sắc bén.',
    avatarColor: '#E0E7FF',
    earColor: '#C084FC',
    eyeColor: '#A855F7',
    whiskerColor: '#818CF8',
    catchphrase: 'The stars shine upon your English fluency journey!',
    vietnameseCatchphrase: 'Vũ trụ gửi tín hiệu chúc bạn sớm đạt mục tiêu C1/IELTS nhé meo~'
  }
};

export const CAT_ACCESSORIES: Record<CatAccessoryId, CatAccessoryInfo> = {
  none: {
    id: 'none',
    name: 'Tự Nhiên',
    icon: '🐱',
    description: 'Mèo mộc mạc nguyên bản đáng yêu'
  },
  ribbon: {
    id: 'ribbon',
    name: 'Nơ Đỏ Thắt Cổ',
    icon: '🎀',
    description: 'Chiếc nơ đỏ rực rỡ nổi bật'
  },
  wizard: {
    id: 'wizard',
    name: 'Nón Phù Thủy Học Thuật',
    icon: '🧙‍♂️',
    description: 'Nón ma thuật tri thức giúp ghi nhớ siêu tốc'
  },
  graduation: {
    id: 'graduation',
    name: 'Mũ Cử Nhân IELTS',
    icon: '🎓',
    description: 'Mũ tốt nghiệp biểu tượng của sự đỗ đạt'
  },
  fish: {
    id: 'fish',
    name: 'Cá Vàng Trên Đầu',
    icon: '🐟',
    description: 'Món ăn yêu thích đội đầu siêu hài hước'
  },
  bell: {
    id: 'bell',
    name: 'Chuông Vàng Leng Keng',
    icon: '🔔',
    description: 'Chuông vàng may mắn kêu leng keng mỗi khi đúng'
  }
};

export const DEFAULT_CAT_CONFIG: CatCustomizationConfig = {
  themeId: 'calico',
  companionId: 'mikan',
  accessoryId: 'ribbon',
  catName: 'Mèo Mikan',
  soundEnabled: true,
  floatingPaws: true,
  meowOnCorrect: true,
  showCompanionWidget: true
};
