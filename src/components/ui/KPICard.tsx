import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-erp-primary', 
  iconBgColor = 'bg-erp-primary/10',
  className = ''
}) => {
  return (
    <div className={`flex-1 min-w-[240px] max-w-[340px] min-h-[112px] bg-white border border-erp-border flex items-center justify-between gap-[16px] p-[20px] rounded-[22px] shadow-erp ${className}`}>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[12px] font-[600] text-erp-muted uppercase tracking-[0.12em] truncate mb-[8px]">
          {title}
        </p>
        <div className="flex items-baseline gap-2 min-w-0">
          <h3 className="max-w-full truncate text-[clamp(30px,2.6vw,44px)] font-[700] text-erp-text leading-none tracking-[-0.03em]">
            {value}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[12px] text-erp-muted mt-[8px] font-[500]">{subtitle}</p>
        )}
      </div>
      <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0 ${iconBgColor}`}>
        <Icon size={20} className={iconColor} strokeWidth={1.8} />
      </div>
    </div>
  );
};
