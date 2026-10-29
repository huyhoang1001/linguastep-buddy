import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 min-h-[40px] gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 min-h-[48px] gap-2.5'
  };

  const variantStyles = {
    primary:
      'bg-[#2D6A4F] text-white hover:bg-[#1B4332] dark:bg-[#52B788] dark:text-[#0F291E] dark:hover:bg-[#40916C] dark:hover:text-white font-semibold shadow-xs',
    secondary:
      'bg-[#EAE4D7] text-[#1B4332] hover:bg-[#DDD6C5] dark:bg-[#2C332E] dark:text-[#F4F2EC] dark:hover:bg-[#38423B] font-semibold',
    outline:
      'bg-transparent text-[#2D312E] dark:text-[#F4F2EC] border border-[#D8CFBF] dark:border-[#3C443E] hover:bg-[#FAF7F2] dark:hover:bg-[#262F28] hover:border-[#2D6A4F] dark:hover:border-[#52B788]',
    ghost:
      'bg-transparent text-[#5C645E] dark:text-[#A7ABA4] hover:bg-[#EAE4D7]/50 dark:hover:bg-[#2C332E] hover:text-[#1B4332] dark:hover:text-[#F4F2EC]',
    destructive:
      'bg-[#E07A5F] text-white hover:bg-[#C85F45] dark:bg-[#E07A5F] dark:hover:bg-[#C85F45] font-semibold shadow-xs'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
