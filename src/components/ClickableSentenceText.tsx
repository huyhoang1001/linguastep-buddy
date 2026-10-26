import React from 'react';

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
    // Ignore blanks, numbers alone, single characters, or pure symbols
    if (cleaned.length < 2) return false;
    if (/^[0-9]+$/.test(cleaned)) return false;
    if (/^_{2,}$/.test(cleaned)) return false;
    return /^[a-zA-Z]/i.test(cleaned);
  };

  // Split text by whitespace sequences (\s+) to preserve exact spaces, tabs, and newlines
  const tokens = text.split(/(\s+)/);

  return (
    <span className={`inline ${className}`}>
      {tokens.map((tok, tIdx) => {
        // Handle whitespace tokens (preserves exact space and newline layout)
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

        // Handle answer blanks (e.g., "_____", "________", "[_____]")
        const blankMatch = tok.match(/^([^a-zA-Z0-9_]*)(_{2,})([^a-zA-Z0-9_]*)$/);
        if (blankMatch) {
          const leading = blankMatch[1];
          const blank = blankMatch[2];
          const trailing = blankMatch[3];
          return (
            <React.Fragment key={tIdx}>
              {leading && <span>{leading}</span>}
              <span className="font-mono text-indigo-400 font-bold px-0.5 underline decoration-indigo-400/60 decoration-2 select-none">
                {blank}
              </span>
              {trailing && <span>{trailing}</span>}
            </React.Fragment>
          );
        }

        // Extract leading punctuation, core word, and trailing punctuation
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
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(cleaned, sentenceCtx);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    onWordClick(cleaned, sentenceCtx);
                  }
                }}
                title={`Click to learn & practice "${cleaned}"`}
                className={`inline p-0 m-0 border-0 bg-transparent font-inherit text-inherit select-text cursor-pointer transition-colors duration-100 ${
                  isTargetHighlighted
                    ? 'text-amber-300 font-semibold underline decoration-amber-400 decoration-2 underline-offset-2'
                    : 'hover:text-sky-300 hover:underline decoration-sky-400/70 underline-offset-2'
                }`}
              >
                {core}
              </span>
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
