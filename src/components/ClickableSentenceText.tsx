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

  // Split text by whitespace while keeping structure and line breaks
  // Regex tokenizes words vs whitespace/punctuation
  const lines = text.split('\n');

  const cleanWord = (raw: string): string => {
    return raw.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
  };

  const isClickableWord = (raw: string): boolean => {
    const cleaned = cleanWord(raw);
    // Ignore blanks (____), numbers alone, single characters, or pure symbols
    if (cleaned.length < 2) return false;
    if (/^[0-9]+$/.test(cleaned)) return false;
    if (/^_{2,}$/.test(raw)) return false;
    return /^[a-zA-Z]/i.test(cleaned);
  };

  const renderToken = (token: string, tokenIdx: number) => {
    // Preserve blanks like "________" or "____"
    if (/^_{2,}$/.test(token)) {
      return (
        <span key={tokenIdx} className="font-mono text-indigo-400 font-bold px-1 underline decoration-indigo-400/60 decoration-2">
          {token}
        </span>
      );
    }

    // Match leading punctuation, core word, trailing punctuation
    const match = token.match(/^([^a-zA-Z0-9]*)(.*?)([^a-zA-Z0-9]*)$/);
    if (!match) {
      return <span key={tokenIdx}>{token} </span>;
    }

    const leading = match[1];
    const core = match[2];
    const trailing = match[3];
    const cleaned = cleanWord(core);

    const isTargetHighlighted = highlightWords.some(
      hw => hw.toLowerCase() === cleaned.toLowerCase()
    );

    if (enabled && isClickableWord(core)) {
      return (
        <span key={tokenIdx} className="inline">
          {leading && <span>{leading}</span>}
          <button
            type="button"
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
            className={`inline rounded px-0.5 py-0 transition-colors duration-150 text-left font-inherit ${
              isTargetHighlighted
                ? 'bg-amber-500/20 text-amber-200 underline decoration-amber-400 font-semibold cursor-pointer'
                : 'hover:text-sky-300 hover:bg-sky-950/60 hover:underline decoration-sky-400/60 cursor-pointer'
            }`}
          >
            {core}
          </button>
          {trailing && <span>{trailing}</span>}
          {' '}
        </span>
      );
    }

    return (
      <span key={tokenIdx}>
        {token}{' '}
      </span>
    );
  };

  return (
    <span className={`inline-block leading-relaxed ${className}`}>
      {lines.map((line, lIdx) => {
        const tokens = line.split(/\s+/).filter(Boolean);
        return (
          <React.Fragment key={lIdx}>
            {tokens.map((tok, tIdx) => renderToken(tok, tIdx))}
            {lIdx < lines.length - 1 && <br />}
          </React.Fragment>
        );
      })}
    </span>
  );
};
