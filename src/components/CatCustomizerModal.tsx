import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Volume2,
  VolumeX,
  Palette,
  Heart,
  Check,
  RotateCcw,
  Cat
} from 'lucide-react';
import {
  CatCustomizationConfig,
  CatThemeId,
  CatCompanionId,
  CatAccessoryId,
  CAT_THEMES,
  CAT_COMPANIONS,
  CAT_ACCESSORIES,
  DEFAULT_CAT_CONFIG
} from '../types/catTheme.ts';
import { CatChibiAvatar } from './CatChibiAvatar.tsx';
import { playMeowSound, playPurrSound } from '../services/catSoundService.ts';
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

  if (!isOpen) return null;

  const handleSave = () => {
    catCustomizationStore.saveConfig(config);
    onSaveConfig(config);
    if (config.soundEnabled) {
      playMeowSound(1.2);
    }
    onClose();
  };

  const handleResetDefaults = () => {
    setConfig(DEFAULT_CAT_CONFIG);
  };

  const selectedTheme = CAT_THEMES[config.themeId] || CAT_THEMES.calico;
  const selectedCompanion = CAT_COMPANIONS[config.companionId] || CAT_COMPANIONS.mikan;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="bg-slate-900 border-2 border-amber-500/30 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <span className="text-xl">🐱</span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center space-x-2">
                <span>MeoMeo Cat Studio</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🐾 Theme & Chibi UI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tự do tùy chỉnh diện mạo mèo chibi, màu sắc giao diện và âm thanh meo meo!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative group p-2 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-inner">
              <CatChibiAvatar
                companionId={config.companionId}
                accessoryId={config.accessoryId}
                mood={previewMood}
                size="lg"
                interactive={true}
              />
              <button
                onClick={() => {
                  setPreviewMood(prev => prev === 'purring' ? 'excited' : prev === 'excited' ? 'studying' : 'purring');
                  if (config.soundEnabled) playMeowSound(1.1);
                }}
                className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold shadow-md hover:scale-105 transition flex items-center space-x-0.5"
                title="Đổi biểu cảm mèo"
              >
                <span>🐾 Chạm</span>
              </button>
            </div>

            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={config.catName}
                  onChange={(e) => setConfig({ ...config, catName: e.target.value.slice(0, 24) })}
                  className="bg-slate-800/80 border border-slate-700 rounded-xl px-2.5 py-1 text-sm font-bold text-white max-w-[170px] focus:outline-none focus:border-amber-400"
                  placeholder="Đặt tên cho mèo..."
                />
                <span className="text-xs text-slate-400">({selectedCompanion.name})</span>
              </div>
              <p className="text-xs text-slate-300 italic">
                "{selectedCompanion.vietnameseCatchphrase}"
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Giao diện: {selectedTheme.name}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Phụ kiện: {CAT_ACCESSORIES[config.accessoryId]?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Sound Test Buttons */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => playMeowSound(1.1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5"
            >
              <span>Meow!</span>
              <span>🐱</span>
            </button>
            <button
              onClick={() => playPurrSound()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700 flex items-center space-x-1.5"
            >
              <span>Purrr~</span>
              <span>🐾</span>
            </button>
          </div>
        </div>

        {/* Customizer Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 pt-2 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('theme')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'theme'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Màu Sắc Giao Diện ({Object.keys(CAT_THEMES).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('companion')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'companion'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🐱</span>
            <span>Bạn Mèo Đồng Hành ({Object.keys(CAT_COMPANIONS).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('accessory')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'accessory'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <span>🎀</span>
            <span>Mũ & Phụ Kiện</span>
          </button>

          <button
            onClick={() => setActiveTab('sound')}
            className={`px-3 py-2 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'sound'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-white'
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Chọn Bảng Màu Cat Chibi cho ứng dụng:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(CAT_THEMES).map((theme) => {
                  const isSelected = config.themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => setConfig({ ...config, themeId: theme.id })}
                      className={`text-left p-3.5 rounded-2xl border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                          : 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${theme.primaryGradient} flex items-center justify-center text-sm shadow-md`}>
                          <span>{theme.badge.split(' ')[0]}</span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white">{theme.name}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-amber-400 font-bold" />
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{theme.vietnameseName}</span>
                          <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">{theme.description}</span>
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Chọn Chú Mèo Chibi Đồng Hành cùng bạn:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(CAT_COMPANIONS).map((comp) => {
                  const isSelected = config.companionId === comp.id;
                  return (
                    <button
                      key={comp.id}
                      onClick={() => {
                        setConfig({
                          ...config,
                          companionId: comp.id,
                          catName: config.catName.startsWith('Mèo') || config.catName === comp.name ? `Mèo ${comp.name}` : config.catName
                        });
                        if (config.soundEnabled) playMeowSound(1.1);
                      }}
                      className={`text-left p-3.5 rounded-2xl border transition flex items-start space-x-3 ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                          : 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="shrink-0 pt-0.5">
                        <CatChibiAvatar companionId={comp.id} mood="happy" size="sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{comp.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 font-bold" />}
                        </div>
                        <span className="text-[10px] font-semibold text-amber-400/90 block">
                          {comp.breedTitle}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Đội Mũ & Trang Trí Phụ Kiện cho mèo:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(CAT_ACCESSORIES).map((acc) => {
                  const isSelected = config.accessoryId === acc.id;
                  return (
                    <button
                      key={acc.id}
                      onClick={() => setConfig({ ...config, accessoryId: acc.id })}
                      className={`text-left p-3 rounded-2xl border transition flex flex-col items-center text-center space-y-1.5 ${
                        isSelected
                          ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/40 shadow-md'
                          : 'bg-slate-800/50 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{acc.icon}</span>
                      <span className="text-xs font-bold text-white">{acc.name}</span>
                      <span className="text-[10px] text-slate-400">{acc.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: SOUND & UI EFFECTS */}
          {activeTab === 'sound' && (
            <div className="space-y-3.5">
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Âm Thanh Meo Meo & Rừ Rừ (Purr)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Phát tiếng meo meo ngọt ngào mỗi khi tương tác hoặc làm đúng bài tập
                  </p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, soundEnabled: !config.soundEnabled })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    config.soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Meo Khen Thưởng Khi Trả Lời Đúng</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chú mèo sẽ meo chúc mừng và tặng cá vàng mỗi khi bạn chọn đúng đáp án
                  </p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, meowOnCorrect: !config.meowOnCorrect })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    config.meowOnCorrect ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Hiện Bạn Mèo Chibi Góc Màn Hình</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Tiện ích bạn mèo chibi luôn túc trực, cổ vũ và có thể xoa đầu bất kỳ lúc nào
                  </p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, showCompanionWidget: !config.showCompanionWidget })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    config.showCompanionWidget ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Họa Tiết Dấu Chân Mèo (Paw Prints)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Hiển thị các biểu tượng dấu chân mèo chibi bay nhẹ nhàng trang trí nền
                  </p>
                </div>
                <button
                  onClick={() => setConfig({ ...config, floatingPaws: !config.floatingPaws })}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                    config.floatingPaws ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold hover:bg-slate-800 transition flex items-center space-x-1.5"
            title="Khôi phục mặc định"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
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
