import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

export function PageHeader({ title, subtitle, rightAction }: PageHeaderProps) {
  return (
    <div className="pt-6 lg:pt-[32px] mb-6 lg:mb-[30px] px-4 lg:px-[32px] flex flex-col gap-4 lg:gap-[24px] lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-col">
        <h1 className="text-[42px] font-[700] text-erp-text tracking-[-0.03em] leading-[1.05]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-[12px] text-[17px] font-[400] text-[#64748B]">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && (
        <div className="flex flex-wrap items-center gap-[8px]">
          {rightAction}
        </div>
      )}
    </div>
  );
}
