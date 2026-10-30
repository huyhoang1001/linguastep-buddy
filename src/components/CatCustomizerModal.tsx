import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  Palette,
  Heart,
  Check,
  RotateCcw
} from 'lucide-react';
import {
  CatCustomizationConfig,
  CAT_THEMES,
  CAT_COMPANIONS,
  CAT_ACCESSORIES,
  DEFAULT_CAT_CONFIG
} from '../types/catTheme.ts';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import { playPurrSound, playBabyCatMeow, playPatHeadSound } from '../services/catSoundService.ts';
import { catCustomizationStore } from '../services/catCustomizationStore.ts';

interface CatCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: CatCustomizationConfig;
  onSaveConfig: (newConfig: CatCustomizationConfig) => void;
}

export const CatCustomizerModal: React.FC<CatCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSaveConfig
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'companion' | 'accessory' | 'sound'>('theme');
  const [config, setConfig] = useState<CatCustomizationConfig>(currentConfig);
  const [previewMood, setPreviewMood] = useState<'happy' | 'purring' | 'studying' | 'excited'>('happy');
  const [isPurringActive, setIsPurringActive] = useState<boolean>(false);
  const [isMeowActive, setIsMeowActive] = useState<boolean>(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number }>>([]);

  // Sync state whenever modal opens or currentConfig changes
  useEffect(() => {
    if (isOpen) {
      setConfig(currentConfig);
      setPreviewMood('happy');
    }
  }, [isOpen, currentConfig]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateConfig = (newCfg: CatCustomizationConfig) => {
    setConfig(newCfg);
    catCustomizationStore.saveConfig(newCfg);
    onSaveConfig(newCfg);
  };

  const handleSave = () => {
    updateConfig(config);
    if (config.soundEnabled) {
      playPatHeadSound();
    }
    onClose();
  };

  const handleResetDefaults = () => {
    updateConfig(DEFAULT_CAT_CONFIG);
    if (config.soundEnabled) {
      playBabyCatMeow(1.1);
    }
  };

  const handleTriggerPurr = () => {
    setPreviewMood('purring');
    setIsPurringActive(true);
    playPurrSound();

    const heartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: heartId, x: Math.random() * 30 - 15 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1500);

    setTimeout(() => {
      setIsPurringActive(false);
      setPreviewMood('happy');
    }, 2200);
  };

  const handleTriggerMeow = () => {
    setPreviewMood('excited');
    setIsMeowActive(true);
    playBabyCatMeow(1.2);
    setTimeout(() => {
      setIsMeowActive(false);
      setPreviewMood('happy');
    }, 1500);
  };

  const handlePatCat = () => {
    setPreviewMood('purring');
    setIsPurringActive(true);
    playPatHeadSound();

    const heartId = Date.now();
    setFloatingHearts(prev => [...prev, { id: heartId, x: Math.random() * 30 - 15 }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== heartId));
    }, 1500);

    setTimeout(() => {
      setIsPurringActive(false);
      setPreviewMood('happy');
    }, 2000);
  };

  const selectedTheme = CAT_THEMES[config.themeId] || CAT_THEMES.calico;
  const selectedCompanion = CAT_COMPANIONS[config.companionId] || CAT_COMPANIONS.mikan;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#161A17]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#2D312E] dark:text-[#F4F2EC] max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#EBE4D7] dark:border-[#2C332E] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${selectedTheme.primaryGradient} flex items-center justify-center text-white shadow-xs`}>
              <span className="text-xl">🐱</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1B4332] dark:text-[#F4F2EC] tracking-tight flex items-center space-x-2">
                <span>MeoMeo Cat Studio</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${selectedTheme.tabActiveColor} border font-mono`}>
                  {selectedTheme.badge} {selectedTheme.name}
                </span>
              </h2>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">
                Tùy chỉnh diện mạo mèo chibi, màu sắc giao diện và âm thanh meo meo sống động!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white dark:bg-[#262F28] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white flex items-center justify-center transition border border-[#EBE4D7] dark:border-[#3C443E] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Card (Fully Themed and Reactive) */}
        <div className={`p-4 sm:p-5 border-b transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden bg-gradient-to-r ${selectedTheme.bannerGradient} ${selectedTheme.borderColor}`}>
          {/* Subtle themed ambient glow overlay */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 rounded-full bg-white/10 dark:bg-white/5 blur-2xl pointer-events-none" />

          {/* Floating Hearts Animation when purring or petting */}
          {floatingHearts.map(h => (
            <div
              key={h.id}
              className="absolute pointer-events-none text-rose-500 animate-float-heart z-20"
              style={{
                top: '20px',
                left: `${60 + h.x}px`
              }}
            >
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
          ))}

          <div className="flex items-center space-x-4 relative z-10">
            <div
              onClick={handlePatCat}
              className={`relative group p-2 rounded-2xl bg-white/80 dark:bg-[#1E231F]/90 border ${selectedTheme.borderColor} shadow-sm cursor-pointer transition transform hover:scale-105 active:scale-95`}
              title="Xoa đầu mèo để nghe tiếng kêu mèo con đáng yêu!"
            >
              <CatChibiAvatar
                companionId={config.companionId}
                accessoryId={config.accessoryId}
                mood={previewMood}
                size="lg"
                interactive={false}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePatCat();
                }}
                className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#D4A373] hover:bg-[#C28E5C] text-white text-[10px] font-bold shadow-xs hover:scale-105 active:scale-95 transition flex items-center space-x-0.5 cursor-pointer"
                title="Xoa đầu mèo"
              >
                <span>🐾 Xoa đầu</span>
              </button>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={config.catName}
                  onChange={(e) => updateConfig({ ...config, catName: e.target.value.slice(0, 24) })}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-enable-grammarly="false"
                  className="bg-white/90 dark:bg-[#1E231F] border border-[#D8CFBF] dark:border-[#3C443E] rounded-xl px-2.5 py-1 text-sm font-bold text-[#1B4332] dark:text-[#F4F2EC] max-w-[170px] focus:outline-none focus:border-[#2D6A4F]"
                  placeholder="Đặt tên cho mèo..."
                />
                <span className="text-xs text-[#5C645E] dark:text-[#A7ABA4]">({selectedCompanion.name})</span>
              </div>
              <p className="text-xs text-[#5C645E] dark:text-[#A7ABA4] italic">
                &ldquo;{selectedCompanion.vietnameseCatchphrase}&rdquo;
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${selectedTheme.tabActiveColor} border`}>
                  {selectedTheme.badge} Giao diện: {selectedTheme.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/80 dark:bg-[#1E231F] text-[#5C645E] dark:text-[#A7ABA4] border border-[#EBE4D7] dark:border-[#2C332E]">
                  Phụ kiện: {CAT_ACCESSORIES[config.accessoryId]?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sound Test Buttons with Visible Active Reaction */}
          <div className="flex sm:flex-col gap-2 shrink-0 relative z-10">
            <button
              type="button"
              onClick={handleTriggerMeow}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                isMeowActive
                  ? 'bg-[#E07A5F] text-white border-[#E07A5F] scale-105'
                  : 'bg-white dark:bg-[#1E231F] hover:bg-[#FAF7F2] dark:hover:bg-[#262F28] text-[#2D312E] dark:text-[#F4F2EC] border-[#EBE4D7] dark:border-[#3C443E]'
              }`}
              title="Nghe tiếng kêu mèo con ngọt ngào"
            >
              <span>{isMeowActive ? '🎶 Meww!' : 'Baby Mew!'}</span>
              <span className={isMeowActive ? 'animate-bounce' : ''}>🐱</span>
            </button>
            <button
              type="button"
              onClick={handleTriggerPurr}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border flex items-center space-x-1.5 cursor-pointer shadow-2xs ${
                isPurringActive
                  ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] scale-105'
                  : 'bg-white dark:bg-[#1E231F] hover:bg-[#FAF7F2] dark:hover:bg-[#262F28] text-[#2D312E] dark:text-[#F4F2EC] border-[#EBE4D7] dark:border-[#3C443E]'
              }`}
              title="Nghe tiếng mèo rừ rừ (purr) với độ rung ấm áp"
            >
              <span>{isPurringActive ? '💖 Đang Rừ Rừ~' : 'Purrrr~'}</span>
              <span className={isPurringActive ? 'animate-bounce' : ''}>🐾</span>
            </button>
          </div>
        </div>

        {/* Customizer Navigation Tabs */}
        <div className="flex border-b border-[#EBE4D7] dark:border-[#3C443E] bg-[#FAF7F2] dark:bg-[#1E231F] px-4 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'theme'
                ? 'border-[#2D6A4F] text-[#2D6A4F] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Màu Sắc Giao Diện ({Object.keys(CAT_THEMES).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('companion')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'companion'
                ? 'border-[#2D6A4F] text-[#2D6A4F] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <span>🐱</span>
            <span>Bạn Mèo Đồng Hành ({Object.keys(CAT_COMPANIONS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('accessory')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'accessory'
                ? 'border-[#2D6A4F] text-[#2D6A4F] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <span>🎀</span>
            <span>Mũ & Phụ Kiện</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'sound'
                ? 'border-[#2D6A4F] text-[#2D6A4F] dark:text-[#52B788] font-bold'
                : 'border-transparent text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Âm Thanh & Hiệu Ứng</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: THEMES */}
          {activeTab === 'theme' && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                Chọn Bảng Màu Cat Chibi cho ứng dụng:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(CAT_THEMES).map((theme) => {
                  const isSelected = config.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        updateConfig({ ...config, themeId: theme.id });
                        if (config.soundEnabled) playBabyCatMeow(1.25);
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFF6F1] dark:bg-[#262F28] border-[#2D6A4F] dark:border-[#52B788] ring-2 ring-[#2D6A4F]/30 shadow-md'
                          : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] text-[#2D312E] dark:text-[#F4F2EC]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${theme.primaryGradient} flex items-center justify-center text-sm shadow-md`}>
                          <span>{theme.badge.split(' ')[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">{theme.name}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788] font-bold" />
                            )}
                          </div>
                          <span className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] block">{theme.vietnameseName}</span>
                          <span className="text-[10px] text-[#8A938C] block leading-tight mt-0.5">{theme.description}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: COMPANIONS */}
          {activeTab === 'companion' && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                Chọn Chú Mèo Chibi Đồng Hành cùng bạn:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(CAT_COMPANIONS).map((comp) => {
                  const isSelected = config.companionId === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => {
                        const updated = {
                          ...config,
                          companionId: comp.id,
                          catName: config.catName.startsWith('Mèo') || config.catName === selectedCompanion.name ? `Mèo ${comp.name}` : config.catName
                        };
                        updateConfig(updated);
                        if (config.soundEnabled) {
                          playBabyCatMeow(comp.id === 'mochi' ? 1.3 : comp.id === 'kuro' ? 1.0 : 1.2);
                        }
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition flex items-start space-x-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFF6F1] dark:bg-[#262F28] border-[#2D6A4F] dark:border-[#52B788] ring-2 ring-[#2D6A4F]/30 shadow-md'
                          : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] text-[#2D312E] dark:text-[#F4F2EC]'
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">
                        <CatChibiAvatar companionId={comp.id} mood="happy" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">{comp.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#52B788] font-bold" />}
                        </div>
                        <span className="text-[10px] font-semibold text-[#2D6A4F] dark:text-[#74A892] block">
                          {comp.breedTitle}
                        </span>
                        <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-1 leading-snug">
                          {comp.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ACCESSORIES */}
          {activeTab === 'accessory' && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5C645E] dark:text-[#A7ABA4] block">
                Đội Mũ & Trang Trí Phụ Kiện cho mèo:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(CAT_ACCESSORIES).map((acc) => {
                  const isSelected = config.accessoryId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => {
                        updateConfig({ ...config, accessoryId: acc.id });
                        if (config.soundEnabled) playBabyCatMeow(1.2);
                      }}
                      className={`text-left p-3 rounded-2xl border transition flex flex-col items-center text-center space-y-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#EFF6F1] dark:bg-[#262F28] border-[#2D6A4F] dark:border-[#52B788] ring-2 ring-[#2D6A4F]/30 shadow-md'
                          : 'bg-white dark:bg-[#262F28] border-[#EBE4D7] dark:border-[#3C443E] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] text-[#2D312E] dark:text-[#F4F2EC]'
                      }`}
                    >
                      <span className="text-2xl">{acc.icon}</span>
                      <span className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">{acc.name}</span>
                      <span className="text-[10px] text-[#5C645E] dark:text-[#A7ABA4]">{acc.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SOUND & UI EFFECTS */}
          {activeTab === 'sound' && (
            <div className="space-y-3.5">
              <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">Âm Thanh Meo Meo & Rừ Rừ (Purr)</h4>
                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                    Phát tiếng meo meo ngọt ngào mỗi khi tương tác hoặc làm đúng bài tập
                  </p>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !config.soundEnabled;
                    updateConfig({ ...config, soundEnabled: nextVal });
                    if (nextVal) playBabyCatMeow(1.2);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    config.soundEnabled ? 'bg-[#2D6A4F] justify-end' : 'bg-[#EBE4D7] dark:bg-[#3C443E] justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">Meo Khen Thưởng Khi Trả Lời Đúng</h4>
                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                    Chú mèo sẽ meo chúc mừng và tặng cá vàng mỗi khi bạn chọn đúng đáp án
                  </p>
                </div>
                <button
                  onClick={() => {
                    updateConfig({ ...config, meowOnCorrect: !config.meowOnCorrect });
                    if (config.soundEnabled) playBabyCatMeow(1.3);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    config.meowOnCorrect ? 'bg-[#2D6A4F] justify-end' : 'bg-[#EBE4D7] dark:bg-[#3C443E] justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">Hiện Bạn Mèo Chibi Góc Màn Hình</h4>
                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                    Tiện ích bạn mèo chibi luôn túc trực, cổ vũ và có thể xoa đầu bất kỳ lúc nào
                  </p>
                </div>
                <button
                  onClick={() => {
                    updateConfig({ ...config, showCompanionWidget: !config.showCompanionWidget });
                    if (config.soundEnabled) playBabyCatMeow(1.15);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    config.showCompanionWidget ? 'bg-[#2D6A4F] justify-end' : 'bg-[#EBE4D7] dark:bg-[#3C443E] justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="bg-white dark:bg-[#262F28] border border-[#EBE4D7] dark:border-[#3C443E] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#1B4332] dark:text-[#F4F2EC]">Họa Tiết Dấu Chân Mèo (Paw Prints)</h4>
                  <p className="text-[11px] text-[#5C645E] dark:text-[#A7ABA4] mt-0.5">
                    Hiển thị các biểu tượng dấu chân mèo chibi bay nhẹ nhàng trang trí nền
                  </p>
                </div>
                <button
                  onClick={() => {
                    updateConfig({ ...config, floatingPaws: !config.floatingPaws });
                    if (config.soundEnabled) playBabyCatMeow(1.2);
                  }}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition cursor-pointer ${
                    config.floatingPaws ? 'bg-[#2D6A4F] justify-end' : 'bg-[#EBE4D7] dark:bg-[#3C443E] justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF7F2] dark:bg-[#1E231F] border-t border-[#EBE4D7] dark:border-[#2C332E] p-4 flex items-center justify-between gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white text-xs font-semibold hover:bg-white dark:hover:bg-[#262F28] transition flex items-center space-x-1.5 cursor-pointer"
            title="Khôi phục mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#262F28] hover:bg-[#FAF7F2] dark:hover:bg-[#1E231F] border border-[#D8CFBF] dark:border-[#3C443E] text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xs transition shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 font-bold" />
              <span>Áp Dụng Cho MeoMeo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
