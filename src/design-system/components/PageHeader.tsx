import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
}

export function PageHeader({ title, subtitle, rightAction }: PageHeaderProps) {
  return (
    <div className="pt-[64px] mb-[40px] px-8 flex items-end justify-between">
      <div className="flex flex-col">
        <h1 className="font-manrope text-[42px] font-[800] text-[#1B1B1B] tracking-[-1px] leading-[1]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-[12px] font-inter text-[16px] font-[500] text-[#7B7B7B]">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && (
        <div className="flex items-center gap-3">
          {rightAction}
        </div>
      )}
    </div>
  );
}
