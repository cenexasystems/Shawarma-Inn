import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  icon?: LucideIcon;
  error?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', icon: Icon, error, options, ...props }, ref) => {
    return (
      <div className="relative w-full font-inter">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-erp-muted pointer-events-none z-10">
            <Icon size={18} strokeWidth={1.75} />
          </div>
        )}
        <select
          ref={ref}
          className={`appearance-none w-full bg-white border border-erp-border rounded-[16px] text-erp-text transition-colors focus:outline-none focus:border-erp-primary focus:ring-1 focus:ring-erp-primary text-[14px] h-[42px] cursor-pointer font-[600] ${
            Icon ? 'pl-10 pr-10' : 'pl-3.5 pr-10'
          } ${error ? 'border-erp-danger focus:border-erp-danger focus:ring-erp-danger' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-erp-muted pointer-events-none">
          <ChevronDown size={16} strokeWidth={2} />
        </div>
        {error && <p className="mt-1.5 text-[11px] text-erp-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
