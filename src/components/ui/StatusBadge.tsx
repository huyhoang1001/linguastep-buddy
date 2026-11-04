import React from 'react';

export type BadgeVariant = 'neutral' | 'success' | 'warning' | 'info' | 'accent';

export interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  icon
}) => {
  const baseStyles =
    'inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full select-none cursor-default shrink-0';

  const variantStyles = {
    neutral:
      'bg-[var(--bg-surface-subdued)] text-[var(--text-muted)] border border-[var(--border-default)]',
    success:
      'bg-[var(--bg-concept)] text-[var(--fg-concept-title)] border border-[var(--border-concept)]',
    warning:
      'bg-[var(--bg-warning)] text-[var(--fg-warning-title)] border border-[var(--border-warning)]',
    info:
      'bg-[var(--bg-concept)] text-[var(--fg-concept-title)] border border-[var(--border-concept)] opacity-90',
    accent:
      'bg-[var(--bg-alert)] text-[var(--fg-alert-title)] border border-[var(--border-alert)]'
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
