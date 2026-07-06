import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col gap-8 mb-8">
      <div className="flex flex-col gap-4">
        <h1 className="font-bebas text-[60px] leading-none tracking-[2px] uppercase text-erp-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#64748B] text-[16px] font-medium font-inter">
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
