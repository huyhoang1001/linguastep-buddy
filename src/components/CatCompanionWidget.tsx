import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, MessageCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import {
  CatCustomizationConfig,
  CAT_COMPANIONS,
  CAT_THEMES,
  CatMood
} from '../types/catTheme.ts';
import { playMeowSound, playPurrSound } from '../services/catSoundService.ts';

interface CatCompanionWidgetProps {
  config: CatCustomizationConfig;
  onOpenCustomizer: () => void;
}

export const CatCompanionWidget: React.FC<CatCompanionWidgetProps> = ({
  config,
  onOpenCustomizer
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [mood, setMood] = useState<CatMood>('happy');
  const [speechBubble, setSpeechBubble] = useState<string>('');
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [fishCount, setFishCount] = useState<number>(3);

  const companion = CAT_COMPANIONS[config.companionId] || CAT_COMPANIONS.mikan;
  const theme = CAT_THEMES[config.themeId] || CAT_THEMES.calico;

  // Initial welcome greeting
  useEffect(() => {
    setSpeechBubble(companion.vietnameseCatchphrase);
    const timer = setTimeout(() => {
      setSpeechBubble('');
    }, 6000);
    return () => clearTimeout(timer);
  }, [config.companionId]);

  // Listen for lesson time urgency events
  useEffect(() => {
    const handleHurryUp = (e: any) => {
      setMood('excited');
      const text = e.detail?.quote || 'Meo meo! ⏰ Sắp hết giờ rồi sen ơi, vồ lấy điểm số nào! 🐾💨';
      setSpeechBubble(text);
      setTimeout(() => {
        setMood('studying');
      }, 5000);
    };

    const handleTimeUp = (e: any) => {
      setMood('sleepy');
      const text = e.detail?.quote || '⏰ Hết giờ học rồi meow! Hoàn thành xuất sắc hôm nay, nghỉ ngơi xíu nào sen ơi 🐾💤';
      setSpeechBubble(text);
      setTimeout(() => {
        setMood('happy');
      }, 7000);
    };

    window.addEventListener('meomeo:hurry-up', handleHurryUp);
    window.addEventListener('meomeo:time-up', handleTimeUp);

    return () => {
      window.removeEventListener('meomeo:hurry-up', handleHurryUp);
      window.removeEventListener('meomeo:time-up', handleTimeUp);
    };
  }, []);

  const handlePetCat = () => {
    setMood('purring');
    if (config.soundEnabled) {
      playPurrSound();
    }

    const heartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: heartId, x: Math.random() * 40 - 20, y: -20 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1200);

    const purrQuotes = [
      `*Purrrrr~* ${config.catName} thích được sen xoa đầu lắm! 🐾`,
      'Meo meo! Tinh thần sảng khoái, học thêm 5 từ vựng nữa nào!',
      'Xoa đầu lấy may! Câu tiếp theo chắc chắn đúng 100%!',
      'Học tập chăm chỉ như mèo rình chuột, nhất định sẽ giỏi tiếng Anh!'
    ];
    setSpeechBubble(purrQuotes[Math.floor(Math.random() * purrQuotes.length)]);

    setTimeout(() => {
      setMood('happy');
    }, 2500);

    setTimeout(() => {
      setSpeechBubble('');
    }, 5500);
  };

  const handleFeedFish = () => {
    setMood('excited');
    setFishCount(prev => prev + 1);
    if (config.soundEnabled) {
      playMeowSound(1.25);
    }

    setSpeechBubble(`Yum yum! 🐟 Được ăn cá ngon rồi meo~ Cảm ơn sen nhiều! (Đã thưởng: ${fishCount + 1} cá)`);

    setTimeout(() => {
      setMood('happy');
    }, 3000);

    setTimeout(() => {
      setSpeechBubble('');
    }, 6000);
  };

  if (!config.showCompanionWidget) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 select-none animate-fadeIn flex flex-col items-end">
      {/* Speech Bubble */}
      {speechBubble && !isMinimized && (
        <div className="relative mb-2 max-w-[260px] bg-slate-900/95 border-2 border-amber-400/50 text-white text-xs p-3 rounded-2xl shadow-2xl backdrop-blur-md animate-bounce-short">
          <div className="flex items-start justify-between gap-1">
            <span className="font-medium leading-relaxed">{speechBubble}</span>
            <button
              onClick={() => setSpeechBubble('')}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {/* Bubble tail */}
          <div className="absolute -bottom-2 right-8 w-3 h-3 bg-slate-900 border-r-2 border-b-2 border-amber-400/50 rotate-45" />
        </div>
      )}

      {/* Floating Hearts Animation */}
      {floatingHearts.map(h => (
        <div
          key={h.id}
          className="absolute pointer-events-none text-rose-400 animate-float-heart"
          style={{
            bottom: '70px',
            right: `${40 + h.x}px`
          }}
        >
          <Heart className="w-5 h-5 fill-rose-500" />
        </div>
      ))}

      {/* Main Cat Box */}
      <div className="bg-slate-900/95 border border-slate-700/80 hover:border-amber-400/60 p-2.5 rounded-3xl shadow-2xl backdrop-blur-md flex items-center space-x-3 transition group">
        {/* Cat Avatar Button */}
        <div
          onClick={handlePetCat}
          className="cursor-pointer relative transform group-hover:scale-105 active:scale-95 transition"
          title={`Xoa đầu ${config.catName} để nghe tiếng rừ rừ (*purr*)!`}
        >
          <CatChibiAvatar
            companionId={config.companionId}
            accessoryId={config.accessoryId}
            mood={mood}
            size="md"
          />
          {/* Online paw indicator */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
        </div>

        {!isMinimized && (
          <div className="space-y-1 pr-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white max-w-[100px] truncate">
                {config.catName}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                🐾 Chibi
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1 pt-0.5">
              <button
                onClick={handlePetCat}
                className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-slate-200 transition flex items-center space-x-1"
                title="Xoa đầu mèo"
              >
                <span>Xoa đầu</span>
                <span>🐾</span>
              </button>
              <button
                onClick={handleFeedFish}
                className="px-2 py-0.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-medium transition flex items-center space-x-1 border border-amber-500/30"
                title="Cho mèo ăn cá"
              >
                <span>{fishCount}</span>
                <span>🐟</span>
              </button>
              <button
                onClick={onOpenCustomizer}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Tùy chỉnh diện mạo mèo & giao diện"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
              </button>
            </div>
          </div>
        )}

        {/* Toggle Minimize */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          title={isMinimized ? 'Mở rộng bạn mèo' : 'Thu gọn'}
        >
          {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
