import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
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
    <div className={`bg-white border border-erp-border flex items-center justify-between gap-4 h-[86px] p-[18px] rounded-[14px] shadow-sm ${className}`}>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-[11px] font-bold text-erp-muted uppercase tracking-[1px] truncate mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-[42px] font-inter font-bold text-erp-text leading-none tracking-tight">
            {value}
          </h3>
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
        <Icon size={24} className={iconColor} strokeWidth={1.5} />
      </div>
    </div>
  );
};
