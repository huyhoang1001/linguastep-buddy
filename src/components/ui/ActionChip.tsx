import React from 'react';

export interface ActionChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'subtle';
}

export const ActionChip: React.FC<ActionChipProps> = ({
  children,
  icon,
  variant = 'default',
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    default:
      'bg-white text-[#2D312E] hover:bg-[#FAF7F2] dark:bg-[#202722] dark:text-[#F4F2EC] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] shadow-2xs',
    accent:
      'bg-[#EFF6F1] text-[#2D6A4F] hover:bg-[#2D6A4F] hover:text-white dark:bg-[#252F28] dark:text-[#52B788] dark:hover:bg-[#52B788] dark:hover:text-black border border-[#CDE1D4] dark:border-[#354539]',
    subtle:
      'bg-[#F4EFEB] text-[#5C645E] hover:bg-[#EAE4D7] hover:text-[#1B4332] dark:bg-[#1B211C] dark:text-[#A7ABA4] dark:hover:bg-[#2C332E] dark:hover:text-white'
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
