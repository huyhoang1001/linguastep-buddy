import React from 'react';

export interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  selected = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles =
    'p-4 rounded-3xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] active:scale-[0.99]';

  const stateStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none bg-[var(--bg-surface-subdued)] border border-[var(--border-default)]'
    : selected
    ? 'bg-[var(--bg-concept)] border-2 border-[var(--brand-primary)] shadow-md text-[var(--text-primary)]'
    : 'bg-[var(--bg-surface-subdued)] border border-[var(--border-default)] hover:border-[var(--brand-primary)]/60 hover:bg-[var(--bg-surface)] hover:shadow-md text-[var(--text-secondary)]';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
      e.preventDefault();
      onClick(e as any);
    }
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={handleKeyDown}
      className={`${baseStyles} ${stateStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
