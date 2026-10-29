import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Heart, MessageCircle, X, ChevronDown, Send, Volume2, VolumeX, RotateCcw, RefreshCw } from 'lucide-react';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import { StatusBadge, ActionChip, IconButton, AppButton } from './ui/index.ts';
import {
  CatCustomizationConfig,
  CAT_COMPANIONS,
  CAT_THEMES,
  CatMood
} from '../types/catTheme.ts';
import { CompanionChatMessage, CompanionChatContext } from '../types/learning.ts';
import { playMeowSound, playPurrSound } from '../services/catSoundService.ts';
import { requestCompanionChat, localStore } from '../services/api.ts';

interface CatCompanionWidgetProps {
  config: CatCustomizationConfig;
  onOpenCustomizer: () => void;
  lessonContext?: CompanionChatContext;
}

export const CatCompanionWidget: React.FC<CatCompanionWidgetProps> = ({
  config,
  onOpenCustomizer,
  lessonContext
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [mood, setMood] = useState<CatMood>('happy');
  const [speechBubble, setSpeechBubble] = useState<string>('');
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [fishCount, setFishCount] = useState<number>(3);
  const [soundMuted, setSoundMuted] = useState<boolean>(!config.soundEnabled);

  // Chat panel states
  const [messages, setMessages] = useState<CompanionChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [suggestedPills, setSuggestedPills] = useState<string[]>([
    'Explain this lesson 📖',
    'Give me a hint 💡',
    'Quiz me 🎯',
    'Practice English 💬'
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const companion = CAT_COMPANIONS[config.companionId] || CAT_COMPANIONS.mikan;
  const activeUserId = localStore.getActiveAccount();

  // Load chat history from localStore on mount or account switch
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const history = await localStore.getCompanionChatHistory(activeUserId);
        if (isMounted) {
          if (history && history.length > 0) {
            setMessages(history);
          } else {
            // Initial greeting
            const initialGreeting: CompanionChatMessage = {
              id: `msg-cat-init-${Date.now()}`,
              sender: 'cat',
              content: 'Meo meo! Xin chào bạn! Mình là MeoMeo 🐱, bạn đồng hành học tiếng Anh. Bạn cần giải thích bài học, gợi ý câu hỏi hay luyện tập cùng không? 🐾',
              timestamp: new Date().toISOString(),
              suggestedPills: [
                'Explain this lesson 📖',
                'Give me a hint 💡',
                'Quiz me 🎯',
                'Practice English 💬'
              ]
            };
            setMessages([initialGreeting]);
            await localStore.saveCompanionChatHistory(activeUserId, [initialGreeting]);
          }
        }
      } catch (err) {
        console.warn('Failed to load companion chat history:', err);
      }
    };
    loadHistory();
    return () => { isMounted = false; };
  }, [activeUserId]);

  // Save chat history to localStore whenever messages update
  useEffect(() => {
    if (messages.length > 0) {
      localStore.saveCompanionChatHistory(activeUserId, messages);
    }
  }, [messages, activeUserId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isChatOpen]);

  // Initial welcome greeting speech bubble
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
    if (!soundMuted) {
      playPurrSound();
    }

    const heartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: heartId, x: Math.random() * 40 - 20, y: -20 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1200);

    const purrQuotes = [
      `*Purrrrr~* ${config.catName} thích được sen xoa đầu lắm! 🐾`,
      'Meo meo! Tinh thần sảng khoái, cùng học thêm từ vựng nhé!',
      'Xoa đầu lấy may! Câu tiếp theo chắc chắn đúng 100%!',
      'Chăm chỉ như mèo rình chuột, nhất định sẽ giỏi tiếng Anh!'
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
    if (!soundMuted) {
      playMeowSound(1.25);
    }

    setSpeechBubble(`Yum yum! 🐟 Được ăn cá ngon rồi meow~ Cảm ơn sen nhiều! (Đã thưởng: ${fishCount + 1} cá)`);

    setTimeout(() => {
      setMood('happy');
    }, 3000);

    setTimeout(() => {
      setSpeechBubble('');
    }, 6000);
  };

  // Chat message sending logic
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isTyping) return;

    setInputText('');
    setChatError(null);

    const userMsg: CompanionChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsTyping(true);
    setMood('studying');

    try {
      const apiHistory = updatedHistory.slice(-8).map(m => ({
        role: (m.sender === 'user' ? 'user' : 'cat') as 'user' | 'cat',
        content: m.content
      }));

      const res = await requestCompanionChat(apiHistory, lessonContext);

      const catMsg: CompanionChatMessage = {
        id: `msg-cat-${Date.now()}`,
        sender: 'cat',
        content: res.reply,
        timestamp: new Date().toISOString(),
        suggestedPills: res.suggestedPills
      };

      setMessages(prev => [...prev, catMsg]);
      if (res.suggestedPills && res.suggestedPills.length > 0) {
        setSuggestedPills(res.suggestedPills);
      }
      setMood('happy');
      if (!soundMuted) {
        playMeowSound(1.0);
      }
    } catch (err: any) {
      console.warn('Companion chat error:', err);
      setChatError(err.message || 'Không thể kết nối với MeoMeo. Vui lòng thử lại!');
      setMood('sad' as any);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = async () => {
    await localStore.clearCompanionChatHistory(activeUserId);
    const initialGreeting: CompanionChatMessage = {
      id: `msg-cat-init-${Date.now()}`,
      sender: 'cat',
      content: 'Lịch sử trò chuyện đã được làm sạch! 🧹 MeoMeo đã sẵn sàng cho buổi học mới cùng bạn 🐾',
      timestamp: new Date().toISOString(),
      suggestedPills: [
        'Explain this lesson 📖',
        'Give me a hint 💡',
        'Quiz me 🎯',
        'Practice English 💬'
      ]
    };
    setMessages([initialGreeting]);
    setSuggestedPills(initialGreeting.suggestedPills || []);
    setChatError(null);
  };

  if (!config.showCompanionWidget) return null;

  return (
    <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 select-none animate-fadeIn flex flex-col items-end">
      {/* Speech Bubble */}
      {speechBubble && !isMinimized && !isChatOpen && (
        <div className="relative mb-2 max-w-[260px] bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC] text-xs p-3 rounded-2xl shadow-xl animate-bounce-short">
          <div className="flex items-start justify-between gap-1">
            <span className="font-medium leading-relaxed">{speechBubble}</span>
            <button
              onClick={() => setSpeechBubble('')}
              className="text-[#8A938C] hover:text-[#1B4332] dark:hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {/* Bubble tail */}
          <div className="absolute -bottom-1.5 right-8 w-3 h-3 bg-white dark:bg-[#1E231F] border-r border-b border-[#EBE4D7] dark:border-[#3C443E] rotate-45" />
        </div>
      )}

      {/* Floating Hearts Animation */}
      {floatingHearts.map(h => (
        <div
          key={h.id}
          className="absolute pointer-events-none text-rose-400 animate-float-heart z-10"
          style={{
            bottom: '70px',
            right: `${40 + h.x}px`
          }}
        >
          <Heart className="w-5 h-5 fill-rose-500" />
        </div>
      ))}

      {/* Expandable AI Study Companion Chat Panel */}
      {isChatOpen && (
        <div className="mb-3 w-[340px] sm:w-[380px] h-[480px] sm:h-[520px] max-h-[80vh] bg-[#FAF7F2] dark:bg-[#1C211E] border border-[#EBE4D7] dark:border-[#333B35] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-scaleUp transition-all">
          {/* Drawer Header */}
          <div className="p-3.5 bg-white dark:bg-[#222824] border-b border-[#EBE4D7] dark:border-[#333B35] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div
                onClick={handlePetCat}
                className="cursor-pointer relative transform hover:scale-105 transition"
                title="Xoa đầu MeoMeo"
              >
                <CatChibiAvatar
                  companionId={config.companionId}
                  accessoryId={config.accessoryId}
                  mood={mood}
                  size="sm"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-white dark:border-[#222824] rounded-full" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold text-[#1B4332] dark:text-[#F4F2EC]">
                    {config.catName || 'MeoMeo'}
                  </h3>
                  <StatusBadge variant="success">
                    AI Companion
                  </StatusBadge>
                </div>
                <p className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">
                  {lessonContext?.skillName ? `Đang học: ${lessonContext.skillName}` : 'Sẵn sàng hỗ trợ học tập'}
                </p>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center space-x-1">
              <IconButton
                onClick={() => setSoundMuted(!soundMuted)}
                icon={soundMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#2D6A4F] dark:text-[#52B788]" />}
                ariaLabel={soundMuted ? 'Mở âm thanh meo meo' : 'Tắt âm thanh'}
                size="sm"
                variant="ghost"
              />
              <IconButton
                onClick={handleClearChat}
                icon={<RotateCcw className="w-4 h-4" />}
                ariaLabel="Làm sạch hội thoại"
                size="sm"
                variant="ghost"
              />
              <IconButton
                onClick={() => setIsChatOpen(false)}
                icon={<X className="w-4 h-4" />}
                ariaLabel="Đóng chat"
                size="sm"
                variant="ghost"
              />
            </div>
          </div>

          {/* Active Context Banner */}
          {lessonContext?.questionPrompt && (
            <div className="bg-[#EAE4D7]/60 dark:bg-[#262E29] px-3 py-1.5 border-b border-[#E1D8C8] dark:border-[#333B35] text-[11px] text-[#2D312E] dark:text-[#E2E6E3] flex items-center justify-between">
              <span className="truncate max-w-[280px]">
                📌 <strong>Câu hỏi:</strong> "{lessonContext.questionPrompt}"
              </span>
              <span className="text-[10px] text-[#2D6A4F] dark:text-[#52B788] font-medium shrink-0 ml-1">
                Context Active
              </span>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 font-sans">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#2D6A4F] text-white rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-[#262E29] text-[#2D312E] dark:text-[#F4F2EC] border border-[#EBE4D7] dark:border-[#333B35] rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                <span className="text-[9px] text-[#8A938C] dark:text-[#7A837C] mt-1 px-1">
                  {msg.sender === 'user' ? 'Bạn' : config.catName || 'MeoMeo'}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center space-x-2 p-2 bg-white dark:bg-[#262E29] border border-[#EBE4D7] dark:border-[#333B35] rounded-2xl rounded-bl-none max-w-[120px]">
                <span className="text-xs">🐱</span>
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 bg-[#2D6A4F] dark:bg-[#52B788] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#2D6A4F] dark:bg-[#52B788] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-[#2D6A4F] dark:bg-[#52B788] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Error & Retry */}
            {chatError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                <span>{chatError}</span>
                <button
                  onClick={() => handleSendMessage()}
                  className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-medium flex items-center space-x-1 hover:bg-rose-700 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Thử lại</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Pills */}
          {suggestedPills.length > 0 && !isTyping && (
            <div className="px-3 py-1.5 bg-white/60 dark:bg-[#222824]/60 border-t border-[#EBE4D7] dark:border-[#333B35] flex items-center space-x-1.5 overflow-x-auto no-scrollbar">
              {suggestedPills.map((pill, idx) => (
                <ActionChip
                  key={idx}
                  onClick={() => handleSendMessage(pill)}
                  variant="subtle"
                >
                  {pill}
                </ActionChip>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div className="p-2.5 bg-white dark:bg-[#222824] border-t border-[#EBE4D7] dark:border-[#333B35]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Hỏi ${config.catName || 'MeoMeo'} bất kỳ điều gì...`}
                className="flex-1 bg-[#FAF7F2] dark:bg-[#1A1F1C] border border-[#EBE4D7] dark:border-[#333B35] rounded-xl px-3 py-2 text-xs text-[#2D312E] dark:text-[#F4F2EC] placeholder-[#8A938C] focus:outline-none focus:border-[#2D6A4F] dark:focus:border-[#52B788]"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="p-2 rounded-xl bg-[#2D6A4F] dark:bg-[#52B788] text-white dark:text-black disabled:opacity-40 hover:bg-[#1B4332] dark:hover:bg-[#40916C] transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Floating Cat Widget Control Box */}
      <div className="bg-[#161A17]/90 dark:bg-[#161A17]/95 border border-[#2C332E] hover:border-[#52B788]/60 p-2 rounded-3xl shadow-2xl backdrop-blur-md flex items-center space-x-2.5 transition group">
        {/* Cat Avatar Button - Click opens chat or pets */}
        <div
          onClick={() => {
            if (!isChatOpen) {
              handlePetCat();
              setIsChatOpen(true);
            } else {
              handlePetCat();
            }
          }}
          className="cursor-pointer relative transform group-hover:scale-105 active:scale-95 transition"
          title={`Xoa đầu ${config.catName} hoặc trò chuyện cùng AI Companion!`}
        >
          <CatChibiAvatar
            companionId={config.companionId}
            accessoryId={config.accessoryId}
            mood={mood}
            size="md"
          />
          {/* Online paw indicator */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#161A17] rounded-full" />
        </div>

        {!isMinimized && (
          <div className="space-y-1 pr-1">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-white max-w-[90px] truncate">
                {config.catName || 'MeoMeo'}
              </span>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#52B788]/20 text-[#52B788] font-semibold border border-[#52B788]/30 flex items-center space-x-1 hover:bg-[#52B788]/30 transition"
              >
                <MessageCircle className="w-2.5 h-2.5" />
                <span>AI Chat</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1 pt-0.5">
              <ActionChip
                onClick={handlePetCat}
                variant="subtle"
                icon={<span>🐾</span>}
              >
                Xoa đầu
              </ActionChip>
              <ActionChip
                onClick={handleFeedFish}
                variant="accent"
                icon={<span>🐟</span>}
              >
                {fishCount}
              </ActionChip>
              <IconButton
                onClick={onOpenCustomizer}
                icon={<Sparkles className="w-3 h-3 text-[#52B788]" />}
                ariaLabel="Tùy chỉnh diện mạo mèo & giao diện"
                size="sm"
                variant="ghost"
              />
            </div>
          </div>
        )}

        {/* Toggle Minimize */}
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#262E29] transition"
          title={isMinimized ? 'Mở rộng bạn mèo' : 'Thu gọn'}
        >
          {isMinimized ? <Sparkles className="w-3.5 h-3.5 text-[#52B788]" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
