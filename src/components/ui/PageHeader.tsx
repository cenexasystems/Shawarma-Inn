import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-erp-32">
      <div>
        <h1 className="font-bebas text-[44px] leading-none tracking-[2px] uppercase text-erp-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-erp-muted text-[14px] mt-2 font-inter">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-3">
          {action}
        </div>
      )}
    </div>
  );
};
