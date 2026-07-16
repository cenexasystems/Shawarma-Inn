import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) {
  
  const baseClasses = 'inline-flex items-center justify-center font-[600] rounded-[16px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-erp-primary text-white hover:bg-erp-primary/90',
    secondary: 'bg-white border border-erp-border text-erp-text hover:bg-[#FAFBFC]',
    outline: 'border border-erp-blue/20 bg-white text-erp-blue hover:bg-erp-blue/5',
    ghost: 'bg-transparent text-erp-text hover:bg-gray-100',
    danger: 'bg-erp-danger text-white hover:bg-erp-danger/90',
  };

  const sizeClasses = {
    sm: 'h-[36px] px-4 text-[13px]',
    md: 'h-[42px] px-[16px] text-[14px]',
    lg: 'h-[48px] px-[24px] text-[14px]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
