import React from 'react';

export interface InteractiveWordProps {
  word: string;
  contextSentence?: string;
  onWordClick: (word: string, contextSentence?: string) => void;
  isHighlighted?: boolean;
  className?: string;
  title?: string;
}

export const InteractiveWord: React.FC<InteractiveWordProps> = ({
  word,
  contextSentence,
  onWordClick,
  isHighlighted = false,
  className = '',
  title
}) => {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation();
    onWordClick(word, contextSentence);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onWordClick(word, contextSentence);
    }
  };

  const highlightStyles = isHighlighted
    ? 'text-[#B87A24] dark:text-[#E6A23C] font-semibold border-b-2 border-solid border-[#E6A23C]'
    : 'border-b border-dotted border-[#2D6A4F]/60 dark:border-[#52B788]/60 hover:text-[#1B4332] dark:hover:text-[#52B788] hover:border-solid hover:border-[#2D6A4F] dark:hover:border-[#52B788]';

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={title || `Explore word "${word}"`}
      className={`inline cursor-pointer select-text font-inherit text-inherit transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] rounded-xs ${highlightStyles} ${className}`}
    >
      {word}
    </span>
  );
};
