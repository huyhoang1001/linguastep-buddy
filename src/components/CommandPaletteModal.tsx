import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Compass,
  BookMarked,
  Layers,
  Sparkles,
  Cat,
  Sliders,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { CambridgeDictionarySearch } from './CambridgeDictionarySearch.tsx';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (destination: 'home' | 'learn' | 'words' | 'progress') => void;
  onPracticeWord: (word: string) => void;
  onOpenSettings: () => void;
  onOpenCatStudio: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onPracticeWord,
  onOpenSettings,
  onOpenCatStudio
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    {
      id: 'home',
      label: 'Home — Study Desk & Today\'s Mission',
      icon: Compass,
      action: () => {
        onNavigate('home');
        onClose();
      }
    },
    {
      id: 'learn',
      label: 'Learn — Active Session & Exercises',
      icon: Sparkles,
      action: () => {
        onNavigate('learn');
        onClose();
      }
    },
    {
      id: 'words',
      label: 'Words — Personal Word Stash & Spaced Review',
      icon: BookMarked,
      action: () => {
        onNavigate('words');
        onClose();
      }
    },
    {
      id: 'progress',
      label: 'Progress — Mastery Ledger & Curriculum Roadmap',
      icon: Layers,
      action: () => {
        onNavigate('progress');
        onClose();
      }
    },
    {
      id: 'cat',
      label: 'Cat Companion Studio — Customization & Themes',
      icon: Cat,
      action: () => {
        onOpenCatStudio();
        onClose();
      }
    },
    {
      id: 'settings',
      label: 'Settings — Daily Minutes, Target Level & Data',
      icon: Sliders,
      action: () => {
        onOpenSettings();
        onClose();
      }
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#161A17]/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF7F2] dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#2C332E] rounded-3xl shadow-2xl p-5 space-y-4 text-[#2D312E] dark:text-[#F4F2EC] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Search and Close */}
        <div className="flex items-center justify-between border-b border-[#EBE4D7] dark:border-[#2C332E] pb-3">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-lg text-[#1B4332] dark:text-[#F4F2EC]">
              meomeo<span className="text-[#E07A5F]">.</span>
            </span>
            <span className="text-xs text-[#8A938C]">Command Palette</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8A938C] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] hover:bg-white dark:hover:bg-[#272E29] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cambridge Word Search */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#52796F] dark:text-[#84A98C] block">
            Instant Dictionary Search
          </span>
          <CambridgeDictionarySearch
            onSelectWord={(w) => {
              onPracticeWord(w);
              onClose();
            }}
            placeholder="Type word to lookup Cambridge definition & morphology..."
            compact={false}
          />
        </div>

        {/* Quick Destinations */}
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A938C] block">
            Quick Navigation
          </span>
          <div className="space-y-1">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={link.action}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white dark:hover:bg-[#252C26] border border-transparent hover:border-[#EBE4D7] dark:hover:border-[#333D35] transition flex items-center justify-between text-xs text-[#2D312E] dark:text-[#F4F2EC] cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-[#74A892] group-hover:text-[#2D6A4F] transition" />
                    <span className="font-medium">{link.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#8A938C] opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="pt-2 border-t border-[#F4EFEB] dark:border-[#28302A] flex items-center justify-between text-[11px] text-[#8A938C]">
          <span>Press ESC to dismiss</span>
          <span>Shortcut: ⌘K or Ctrl+K</span>
        </div>
      </div>
    </div>
  );
};
