import React from 'react';

export type BadgeStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status = 'default', className = '', children, ...props }) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold font-inter tracking-[0.5px] uppercase rounded-md whitespace-nowrap';
  
  // Height 26px, text 11px
  const sizingStyles = 'h-[26px] px-2.5 text-[11px]';

  const statusStyles = {
    pending: 'bg-erp-warning/10 text-erp-warning border border-erp-warning/20',
    processing: 'bg-erp-blue/10 text-erp-blue border border-erp-blue/20',
    completed: 'bg-erp-success/10 text-erp-success border border-erp-success/20',
    cancelled: 'bg-erp-danger/10 text-erp-danger border border-erp-danger/20',
    default: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  return (
    <span
      className={`${baseStyles} ${sizingStyles} ${statusStyles[status]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
