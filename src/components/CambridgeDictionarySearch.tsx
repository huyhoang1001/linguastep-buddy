import React, { useState, useEffect, useRef } from 'react';
import { Search, X, BookOpen, Volume2, Bookmark, Sparkles, ArrowRight, CornerDownLeft } from 'lucide-react';
import { localStore } from '../services/api.ts';
import { VocabularyItem } from '../types/learning.ts';

// High-yield Cambridge academic and professional vocabulary suggestions
const CAMBRIDGE_RECOMMENDED_WORDS = [
  { word: 'discrepancy', pos: 'noun', level: 'B2', meaning: 'Sự khác biệt, chênh lệch không nhất quán' },
  { word: 'reconcile', pos: 'verb', level: 'B2', meaning: 'Đối chiếu, hòa giải hoặc làm cho phù hợp' },
  { word: 'mitigate', pos: 'verb', level: 'B2', meaning: 'Giảm thiểu, làm dịu bớt mức độ nghiêm trọng' },
  { word: 'consensus', pos: 'noun', level: 'B2', meaning: 'Sự đồng thuận chung giữa các bên' },
  { word: 'substantiate', pos: 'verb', level: 'C1', meaning: 'Chứng minh, cung cấp bằng chứng xác thực' },
  { word: 'leverage', pos: 'verb', level: 'B2', meaning: 'Tận dụng tối đa nguồn lực hoặc lợi thế' },
  { word: 'facilitate', pos: 'verb', level: 'B2', meaning: 'Tạo điều kiện thuận lợi, thúc đẩy tiến độ' },
  { word: 'articulate', pos: 'verb', level: 'C1', meaning: 'Diễn đạt rành mạch, rõ ràng và thuyết phục' },
  { word: 'scrutinize', pos: 'verb', level: 'C1', meaning: 'Xem xét, soi xét và kiểm tra kỹ lưỡng' },
  { word: 'ambiguous', pos: 'adj', level: 'B2', meaning: 'Mơ hồ, có thể hiểu theo nhiều cách khác nhau' },
  { word: 'feasibility', pos: 'noun', level: 'B2', meaning: 'Tính khả thi của một dự án hoặc giải pháp' },
  { word: 'precedent', pos: 'noun', level: 'C1', meaning: 'Tiền lệ, án lệ hoặc quy chuẩn đã có từ trước' },
  { word: 'fluctuate', pos: 'verb', level: 'B2', meaning: 'Dao động, biến động lên xuống thất thường' },
  { word: 'paradigm', pos: 'noun', level: 'C1', meaning: 'Mô hình, mô thức tư duy hoặc khuôn mẫu' },
  { word: 'resilient', pos: 'adj', level: 'B2', meaning: 'Kiên cường, có khả năng phục hồi nhanh chóng' },
  { word: 'comply', pos: 'verb', level: 'B1', meaning: 'Tuân thủ các quy tắc, quy chuẩn hoặc luật lệ' },
  { word: 'advocate', pos: 'verb', level: 'B2', meaning: 'Chủ trương, tán thành hoặc ủng hộ công khai' },
  { word: 'preclude', pos: 'verb', level: 'C1', meaning: 'Ngăn ngừa, loại trừ khả năng xảy ra từ đầu' }
];

interface CambridgeDictionarySearchProps {
  onSelectWord: (word: string) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

export const CambridgeDictionarySearch: React.FC<CambridgeDictionarySearchProps> = ({
  onSelectWord,
  placeholder = 'Search Cambridge dictionary or type a word...',
  className = '',
  compact = false,
  autoFocus = false
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [savedVocab, setSavedVocab] = useState<VocabularyItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load saved vocabulary for suggestions
  useEffect(() => {
    let isMounted = true;
    const fetchVocab = async () => {
      try {
        const list = await localStore.getVocabulary();
        if (isMounted) setSavedVocab(list || []);
      } catch (err) {
        console.warn('Failed to load vocabulary for search suggestions:', err);
      }
    };
    fetchVocab();
    return () => {
      isMounted = false;
    };
  }, []);

  // Global hotkey: '/' or 'Cmd+K' / 'Ctrl+K' focuses this search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is already typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.key === '/' && !isInput) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsFocused(true);
      } else if (e.key === 'Escape' && isFocused) {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchTerm.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, '');
    if (!clean) return;
    setIsFocused(false);
    onSelectWord(clean);
  };

  const handleSelectSuggestion = (word: string) => {
    setSearchTerm(word);
    setIsFocused(false);
    onSelectWord(word);
  };

  // Build suggestion list
  const query = searchTerm.trim().toLowerCase();
  
  // 1. Matches from user's saved review memory
  const memoryMatches = savedVocab.filter(v =>
    !query || v.word.toLowerCase().includes(query) || (v.meaning && v.meaning.toLowerCase().includes(query))
  );

  // 2. Matches from Cambridge dictionary high-yield list
  const cambridgeMatches = CAMBRIDGE_RECOMMENDED_WORDS.filter(w =>
    !query || w.word.toLowerCase().includes(query) || w.meaning.toLowerCase().includes(query)
  );

  // Combined unique suggestions
  const seen = new Set<string>();
  const combinedSuggestions: Array<{
    word: string;
    pos?: string;
    level?: string;
    meaning?: string;
    isSaved?: boolean;
  }> = [];

  // Prioritize memory matches first
  memoryMatches.forEach(m => {
    const lower = m.word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      combinedSuggestions.push({
        word: m.word,
        pos: m.part_of_speech,
        level: m.review_stage ? `Stage ${m.review_stage}d` : undefined,
        meaning: m.meaning,
        isSaved: true
      });
    }
  });

  // Then add Cambridge curated recommendations
  cambridgeMatches.forEach(c => {
    const lower = c.word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      combinedSuggestions.push({
        word: c.word,
        pos: c.pos,
        level: c.level,
        meaning: c.meaning,
        isSaved: false
      });
    }
  });

  const displayedSuggestions = combinedSuggestions.slice(0, 6);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Box (Cambridge Inspired) */}
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-slate-400 flex items-center">
          <Search className="w-3.5 h-3.5 text-indigo-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          autoFocus={autoFocus}
          onChange={e => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          aria-label="Search English vocabulary in Cambridge dictionary"
          className={`w-full bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 focus:border-indigo-500 rounded-xl pl-9 pr-14 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
            compact ? 'text-[11px] py-1 pl-8 pr-10' : ''
          }`}
        />

        {/* Clear or Action button inside input */}
        <div className="absolute right-2 flex items-center space-x-1">
          {searchTerm ? (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition"
              title="Clear input"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-900 border border-slate-700/80">
              /
            </kbd>
          )}

          {searchTerm.trim().length > 0 && (
            <button
              type="submit"
              className="p-1 rounded-lg text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/60 transition"
              title="Search and learn word"
            >
              <CornerDownLeft className="w-3 h-3" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestion Dropdown on Focus */}
      {isFocused && (
        <div className="absolute left-0 right-0 mt-1.5 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-100 max-h-80 overflow-y-auto animate-fadeIn">
          {/* Header Banner */}
          <div className="px-3.5 py-2 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>{searchTerm.trim() ? `Search for "${searchTerm.trim()}"` : 'Dictionary Suggestions & Memory'}</span>
            </span>
            <span className="text-[10px] text-slate-400">Press Enter ↵ to learn</span>
          </div>

          {/* Direct "Search <term>" button if user typed something custom */}
          {searchTerm.trim() && (
            <button
              type="button"
              onClick={() => handleSearchSubmit()}
              className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-950/50 border-b border-slate-800/80 flex items-center justify-between transition group"
            >
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <div>
                  <span className="text-xs font-bold text-white group-hover:text-indigo-200">
                    Look up & practice "{searchTerm.trim()}"
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Get pronunciation, Vietnamese meaning, workplace context & micro-exam
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* List of Suggestions */}
          <div className="py-1">
            {displayedSuggestions.map((item, idx) => (
              <button
                key={`${item.word}-${idx}`}
                type="button"
                onClick={() => handleSelectSuggestion(item.word)}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-800/70 transition flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  {item.isSaved ? (
                    <Bookmark className="w-3.5 h-3.5 text-sky-400 shrink-0 fill-sky-400/20" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-indigo-400 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 truncate">
                    {item.word}
                  </span>
                  {item.pos && (
                    <span className="text-[10px] text-slate-400 italic">
                      ({item.pos})
                    </span>
                  )}
                  {item.meaning && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[180px] hidden sm:inline">
                      — {item.meaning}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  {item.level && (
                    <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700/60">
                      {item.level}
                    </span>
                  )}
                  {item.isSaved && (
                    <span className="text-[10px] text-sky-400 font-semibold">
                      In Memory
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Cambridge Dictionary Info Footer */}
          <div className="px-3.5 py-1.5 bg-slate-950/60 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Powered by Cambridge-style Lexicographer AI</span>
            <span>Audio · IPA · Collocations · Spaced Repetition</span>
          </div>
        </div>
      )}
    </div>
  );
};
