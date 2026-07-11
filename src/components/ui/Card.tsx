import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  children?: React.ReactNode;
  noPadding?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', children, noPadding = false, title, subtitle, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-erp-card rounded-[22px] border border-erp-border shadow-erp transition-all duration-150 ${
          noPadding ? '' : 'p-erp-24'
        } ${className}`}
        {...props}
      >
        {(title || subtitle) && <div className="mb-erp-24"><h3 className="text-[16px] font-[700] text-erp-text">{title}</h3>{subtitle && <p className="mt-1 text-[12px] text-erp-muted">{subtitle}</p>}</div>}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export const ChartShell = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', children, noPadding = false, title, subtitle, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-erp-card rounded-[22px] border border-erp-border shadow-erp transition-all duration-150 ${
          noPadding ? '' : 'p-erp-24'
        } ${className}`}
        {...props}
      >
        {(title || subtitle) && <div className="mb-erp-24"><h3 className="text-[16px] font-[700] text-erp-text">{title}</h3>{subtitle && <p className="mt-1 text-[12px] text-erp-muted">{subtitle}</p>}</div>}
        {children}
      </div>
    );
  }
);

ChartShell.displayName = 'ChartShell';
