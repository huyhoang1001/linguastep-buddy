import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'icon';
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
    'inline-flex items-center justify-center font-bold transition-all duration-200 rounded-xl select-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.97] whitespace-normal';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-8 gap-1.5',
    md: 'text-sm px-4 py-2 min-h-10 gap-2',
    lg: 'text-base px-6 py-2.5 min-h-11 gap-2.5'
  };

  const variantStyles = {
    primary:
      'bg-[var(--brand-primary)] text-[var(--brand-primary-fg)] hover:opacity-90 shadow-sm',
    secondary:
      'bg-[var(--bg-surface-subdued)] text-[var(--text-primary)] hover:bg-[var(--border-app)]',
    outline:
      'bg-transparent text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--bg-surface-subdued)] hover:border-[var(--brand-primary)]',
    ghost:
      'bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-surface-subdued)] hover:text-[var(--text-primary)]',
    destructive:
      'bg-[var(--bg-alert)] text-[var(--fg-alert-title)] hover:opacity-90 shadow-sm',
    icon: 
      'p-0 aspect-square min-w-0 bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-surface-subdued)] hover:text-[var(--text-primary)]'
  };

  const widthStyle = fullWidth ? 'w-full' : '';

  // Icon size standardizing
  const iconSizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className={`${iconSizeClass} border-2 border-current border-t-transparent rounded-full animate-spin shrink-0`} />
      ) : (
        leftIcon && <span className={`${iconSizeClass} flex items-center justify-center shrink-0`}>{leftIcon}</span>
      )}
      {variant !== 'icon' && children && (
        <span className="flex-1 text-center">{children}</span>
      )}
      {!isLoading && rightIcon && (
        <span className={`${iconSizeClass} flex items-center justify-center shrink-0`}>{rightIcon}</span>
      )}
    </button>
  );
};
