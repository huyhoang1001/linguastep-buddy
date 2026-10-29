import React from 'react';

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  count?: number;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  children,
  selected = false,
  count,
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] disabled:opacity-50 disabled:cursor-not-allowed';

  const stateStyles = selected
    ? 'bg-[#1B4332] text-white dark:bg-[#52B788] dark:text-[#0F291E] font-bold shadow-xs'
    : 'bg-[#F4EFEB] text-[#5C645E] hover:bg-[#EAE4D7] hover:text-[#1B4332] dark:bg-[#1B211C] dark:text-[#A7ABA4] dark:hover:bg-[#2C332E] dark:hover:text-white border border-[#EBE4D7] dark:border-[#2C332E]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${stateStyles} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
            selected
              ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#0F291E]'
              : 'bg-[#EAE4D7] text-[#2D6A4F] dark:bg-[#2C332E] dark:text-[#84A98C]'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
};
