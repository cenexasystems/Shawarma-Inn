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
    
    const baseStyles = 'inline-flex items-center justify-center font-semibold font-inter rounded-erp-input transition-all duration-150 shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap';
    
    // Scaled down by 10%
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-[12px] h-8',
      md: 'px-4 py-2 text-[13px] h-[38px]', // ~10% smaller than standard 42px
      lg: 'px-6 py-3 text-[14px] h-12',
    };

    const variantStyles = {
      primary: 'bg-erp-primary text-white hover:opacity-90',
      secondary: 'bg-white text-erp-text border border-erp-border hover:bg-gray-50',
      danger: 'bg-erp-danger text-white hover:opacity-90',
      outline: 'bg-transparent text-erp-muted border border-erp-border hover:text-erp-text hover:bg-gray-50',
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
          <Icon size={18} className="mr-2 stroke-[1.75]" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
