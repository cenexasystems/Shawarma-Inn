import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, noPadding = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-erp-card rounded-erp border border-erp-border shadow-erp transition-all duration-120 ${
          noPadding ? '' : 'p-erp-24'
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
