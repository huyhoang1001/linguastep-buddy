import React from 'react';

export interface InfoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subtle' | 'highlight';
}

export const InfoCard: React.FC<InfoCardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyles = 'p-4 rounded-3xl cursor-default transition-colors select-text';

  const variantStyles = {
    default: 'bg-white dark:bg-[#1E231F] border border-[#EBE4D7] dark:border-[#3C443E] text-[#2D312E] dark:text-[#F4F2EC]',
    subtle: 'bg-[#F4EFEB] dark:bg-[#1B211C] border border-[#EBE4D7] dark:border-[#2C332E] text-[#2D312E] dark:text-[#F4F2EC]',
    highlight: 'bg-[#EFF6F1] dark:bg-[#252F28] border border-[#CDE1D4] dark:border-[#354539] text-[#1B4332] dark:text-[#F4F2EC]'
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
};
