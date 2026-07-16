import React from 'react';
import type { LucideIcon } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', icon: Icon, isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center font-[600] rounded-[16px] transition-all duration-150 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
    
    // Scaled down by 10%
    const sizeStyles = {
      sm: 'px-[14px] text-[13px] h-[36px]',
      md: 'px-[16px] text-[14px] h-[42px]',
      lg: 'px-[24px] text-[14px] h-[48px]',
    };

    const variantStyles = {
      primary: 'bg-erp-primary text-white hover:opacity-90',
      secondary: 'bg-white text-erp-text border border-erp-border hover:bg-gray-50',
      danger: 'bg-erp-danger text-white hover:opacity-90',
      outline: 'bg-white text-erp-blue border border-erp-blue/20 hover:text-erp-blue hover:bg-erp-blue/5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : Icon ? (
          <Icon size={20} className="mr-2 stroke-[1.8]" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
