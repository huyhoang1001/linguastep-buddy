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
    'p-4 rounded-3xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] active:scale-[0.99]';

  const stateStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none bg-[#F4EFEB] dark:bg-[#1B211C] border border-[#E1D8C8] dark:border-[#2C332E]'
    : selected
    ? 'bg-white dark:bg-[#202722] border-2 border-[#2D6A4F] dark:border-[#52B788] shadow-md text-[#1B4332] dark:text-[#F4F2EC]'
    : 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#3C443E] hover:border-[#2D6A4F]/60 dark:hover:border-[#52B788]/60 hover:shadow-md text-[#2D312E] dark:text-[#F4F2EC]';

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
