import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './Card';

export interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
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
    <Card className={`flex items-center gap-4 ${className}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
        <Icon size={24} className={iconColor} strokeWidth={1.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-erp-muted uppercase tracking-[1px] truncate mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-[28px] font-inter font-bold text-erp-text leading-none tracking-tight">
            {value}
          </h3>
        </div>
        {subtitle && (
          <p className="text-[12px] text-erp-muted mt-1 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
};
