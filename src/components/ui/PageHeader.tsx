import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <h1 className="text-[22px] font-[700] leading-tight tracking-[-0.02em] text-erp-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] font-[400] text-erp-muted">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {action}
        </div>
      )}
    </div>
  );
};
