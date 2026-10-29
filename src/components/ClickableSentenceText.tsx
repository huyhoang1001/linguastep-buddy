import React from 'react';
import { InteractiveWord } from './ui/InteractiveWord.tsx';

interface ClickableSentenceTextProps {
  text: string;
  contextSentence?: string;
  onWordClick: (word: string, contextSentence: string) => void;
  className?: string;
  highlightWords?: string[];
  enabled?: boolean;
}

export const ClickableSentenceText: React.FC<ClickableSentenceTextProps> = ({
  text,
  contextSentence,
  onWordClick,
  className = '',
  highlightWords = [],
  enabled = true
}) => {
  if (!text) return null;
  const sentenceCtx = contextSentence || text;

  const cleanWord = (raw: string): string => {
    return raw.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  };

  const isClickableWord = (raw: string): boolean => {
    const cleaned = cleanWord(raw);
    if (cleaned.length < 2) return false;
    if (/^[0-9]+$/.test(cleaned)) return false;
    if (/^_{2,}$/.test(cleaned)) return false;
    return /^[a-zA-Z]/i.test(cleaned);
  };

  const tokens = text.split(/(\s+)/);

  return (
    <span className={`inline ${className}`}>
      {tokens.map((tok, tIdx) => {
        if (/^\s+$/.test(tok)) {
          if (tok.includes('\n')) {
            const parts = tok.split('\n');
            return (
              <React.Fragment key={tIdx}>
                {parts.map((part, pIdx) => (
                  <React.Fragment key={pIdx}>
                    {part}
                    {pIdx < parts.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </React.Fragment>
            );
          }
          return <React.Fragment key={tIdx}>{tok}</React.Fragment>;
        }

        const blankMatch = tok.match(/^([^a-zA-Z0-9_]*)(_{2,})([^a-zA-Z0-9_]*)$/);
        if (blankMatch) {
          const leading = blankMatch[1];
          const blank = blankMatch[2];
          const trailing = blankMatch[3];
          return (
            <React.Fragment key={tIdx}>
              {leading && <span>{leading}</span>}
              <span className="font-mono text-[#2D6A4F] dark:text-[#52B788] font-bold px-0.5 underline decoration-[#2D6A4F]/60 dark:decoration-[#52B788]/60 decoration-2 select-none">
                {blank}
              </span>
              {trailing && <span>{trailing}</span>}
            </React.Fragment>
          );
        }

        const wordMatch = tok.match(/^([^a-zA-Z0-9]*)([\w'-]+)([^a-zA-Z0-9]*)$/);
        if (!wordMatch) {
          return <span key={tIdx}>{tok}</span>;
        }

        const leading = wordMatch[1];
        const core = wordMatch[2];
        const trailing = wordMatch[3];
        const cleaned = cleanWord(core);

        const isTargetHighlighted = highlightWords.some(
          hw => hw.toLowerCase() === cleaned.toLowerCase()
        );

        if (enabled && isClickableWord(core)) {
          return (
            <React.Fragment key={tIdx}>
              {leading && <span>{leading}</span>}
              <InteractiveWord
                word={core}
                contextSentence={sentenceCtx}
                onWordClick={(w, ctx) => onWordClick(cleanWord(w), ctx || sentenceCtx)}
                isHighlighted={isTargetHighlighted}
              />
              {trailing && <span>{trailing}</span>}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={tIdx}>
            {tok}
          </React.Fragment>
        );
      })}
    </span>
  );
};
