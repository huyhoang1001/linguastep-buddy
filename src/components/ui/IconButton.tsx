import React from 'react';
import { AppButton, ButtonSize } from './AppButton.tsx';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: 'default' | 'subtle' | 'ghost' | 'accent';
  size?: ButtonSize;
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
  // Mapping local variant to AppButton variants
  const variantMap: Record<string, any> = {
    default: 'outline',
    subtle: 'secondary',
    ghost: 'ghost',
    accent: 'primary'
  };

  return (
    <AppButton
      variant={variant === 'ghost' ? 'icon' : variantMap[variant]}
      size={size}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`!p-0 aspect-square ${variant === 'ghost' ? '' : 'min-w-0'} ${className}`}
      {...props}
    >
      {icon}
    </AppButton>
  );
};
