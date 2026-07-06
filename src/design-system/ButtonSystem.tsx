import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) {
  
  const baseClasses = 'inline-flex items-center justify-center h-[46px] px-[24px] text-[15px] font-manrope font-[700] rounded-[12px] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95';
  
  const variantClasses = {
    primary: 'bg-erp-primary text-white hover:bg-erp-primary/90 shadow-sm',
    secondary: 'bg-white border border-erp-border text-erp-text hover:bg-erp-bg shadow-sm',
    danger: 'bg-erp-danger text-white hover:bg-erp-danger/90 shadow-sm',
    ghost: 'bg-transparent text-erp-text hover:bg-erp-bg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
