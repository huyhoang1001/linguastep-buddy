import React from 'react';

export interface AppLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  isExternal?: boolean;
  active?: boolean;
}

export const AppLink: React.FC<AppLinkProps> = ({
  children,
  isExternal = false,
  active = false,
  className = '',
  href,
  onClick,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center text-xs sm:text-sm font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D6A4F] dark:focus-visible:outline-[#52B788] rounded-md';

  const activeStyles = active
    ? 'text-[#1B4332] dark:text-[#52B788] font-bold underline decoration-[#2D6A4F] dark:decoration-[#52B788] underline-offset-4'
    : 'text-[#5C645E] dark:text-[#A7ABA4] hover:text-[#1B4332] dark:hover:text-[#F4F2EC] hover:underline underline-offset-4';

  const targetProps = isExternal
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <a
      href={href}
      onClick={onClick}
      className={`${baseStyles} ${activeStyles} ${className}`}
      {...targetProps}
      {...props}
    >
      {children}
    </a>
  );
};
