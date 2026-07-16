import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', icon: Icon, error, ...props }, ref) => {
    return (
      <div className="relative w-full font-inter">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-erp-muted pointer-events-none">
            <Icon size={18} strokeWidth={1.8} />
          </div>
        )}
        <input
          ref={ref}
          className={`w-full bg-white border border-erp-border rounded-full text-erp-text placeholder-erp-muted transition-colors focus:outline-none focus:border-erp-primary focus:ring-1 focus:ring-erp-primary text-[14px] h-[44px] ${
            Icon ? 'pl-[44px] pr-[16px]' : 'px-[16px]'
          } ${error ? 'border-erp-danger focus:border-erp-danger focus:ring-erp-danger' : ''} ${className}`}
          {...props}
        />
        {error && <p className="mt-1.5 text-[11px] text-erp-danger">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
