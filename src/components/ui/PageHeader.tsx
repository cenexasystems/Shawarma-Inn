import React from 'react';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    <div className="mb-[24px] flex flex-col gap-4 lg:mb-[30px] lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col gap-[12px] min-w-0">
        <h1 className="text-[24px] font-[700] leading-[1.05] tracking-[-0.03em] text-erp-text sm:text-[30px] xl:text-[42px]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] font-[400] text-[#64748B] sm:text-[17px]">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex w-full flex-wrap items-stretch gap-[8px] pt-[2px] sm:w-auto sm:items-center lg:justify-end">
          {action}
        </div>
      )}
    </div>
  );
};
