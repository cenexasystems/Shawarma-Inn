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
  
  const baseClasses = 'inline-flex items-center justify-center font-manrope font-[700] rounded-erp-button transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-erp-primary text-white hover:bg-erp-primary/90',
    secondary: 'bg-[#F7F8FA] text-erp-text hover:bg-gray-200',
    outline: 'border border-gray-200 bg-white text-erp-text hover:bg-gray-50',
    ghost: 'bg-transparent text-erp-text hover:bg-gray-100',
    danger: 'bg-erp-danger text-white hover:bg-erp-danger/90',
  };

  const sizeClasses = {
    sm: 'h-[36px] px-4 text-[13px]',
    md: 'h-[46px] px-6 text-[15px]',
    lg: 'h-[56px] px-8 text-[16px]',
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
