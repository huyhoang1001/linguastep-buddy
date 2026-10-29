import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: 'default' | 'subtle' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  variant = 'default',
  size = 'md',
  className = '',
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl transition-all duration-150 select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeStyles = {
    sm: 'w-8 h-8 min-w-[32px] min-h-[32px]',
    md: 'w-10 h-10 min-w-[40px] min-h-[40px]',
    lg: 'w-12 h-12 min-w-[48px] min-h-[48px]'
  };

  const variantStyles = {
    default:
      'bg-white text-[#2D312E] hover:bg-[#FAF7F2] dark:bg-[#202722] dark:text-[#F4F2EC] dark:hover:bg-[#27302A] border border-[#EBE4D7] dark:border-[#2E3730] shadow-2xs',
    subtle:
      'bg-[#F4EFEB] text-[#5C645E] hover:bg-[#EAE4D7] hover:text-[#1B4332] dark:bg-[#1B211C] dark:text-[#A7ABA4] dark:hover:bg-[#2C332E] dark:hover:text-white',
    ghost:
      'bg-transparent text-[#5C645E] dark:text-[#A7ABA4] hover:bg-[#EAE4D7]/50 dark:hover:bg-[#2C332E] hover:text-[#1B4332] dark:hover:text-white',
    accent:
      'bg-[#2D6A4F] text-white hover:bg-[#1B4332] dark:bg-[#52B788] dark:text-[#0F291E] dark:hover:bg-[#40916C]'
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
