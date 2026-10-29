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
      'bg-[#EAE4D7]/70 text-[#5C645E] dark:bg-[#2C332E] dark:text-[#A7ABA4] border border-[#D8CFBF]/60 dark:border-[#3C443E]',
    success:
      'bg-[#EFF6F1] text-[#2D6A4F] dark:bg-[#252F28] dark:text-[#52B788] border border-[#CDE1D4] dark:border-[#354539]',
    warning:
      'bg-[#FFF8EC] text-[#B87A24] dark:bg-[#322A1E] dark:text-[#E6A23C] border border-[#F2E3C6] dark:border-[#4B3E2C]',
    info:
      'bg-[#F0F7FF] text-[#1E6091] dark:bg-[#1E2C38] dark:text-[#64B5F6] border border-[#D0E3F7] dark:border-[#2C4258]',
    accent:
      'bg-[#FDF0ED] text-[#E07A5F] dark:bg-[#342421] dark:text-[#E07A5F] border border-[#F5D5CC] dark:border-[#4E342D]'
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
