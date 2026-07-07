import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="flex flex-col gap-[24px] mb-[30px] lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-[12px] min-w-0">
        <h1 className="text-[42px] leading-[1.05] tracking-[-0.03em] font-[700] text-erp-text">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[#64748B] text-[17px] font-[400]">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex flex-wrap items-center gap-[8px] lg:justify-end pt-[2px]">
          {action}
        </div>
      )}
    </div>
  );
};
