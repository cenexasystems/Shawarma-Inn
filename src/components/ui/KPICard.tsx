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
  dark?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-erp-primary', 
  iconBgColor = 'bg-erp-primary/10',
  className = '',
  dark = false
}) => {
  const baseBg = dark ? 'bg-[#141414]' : 'bg-white';
  const baseBorder = dark ? 'border-white/10' : 'border-erp-border';
  const baseText = dark ? 'text-white' : 'text-erp-text';
  const mutedText = dark ? 'text-gray-400' : 'text-erp-muted';

  return (
    <div className={`w-full min-w-0 ${baseBg} border ${baseBorder} flex items-center justify-between gap-3 p-4 rounded-2xl shadow-sm ${className}`}>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className={`text-[11px] font-[700] ${mutedText} uppercase tracking-[0.1em] truncate mb-1`}>
          {title}
        </p>
        <h3 className={`text-[22px] font-[700] ${baseText} leading-none tracking-[-0.02em] break-all`}>
          {value}
        </h3>
        {subtitle && (
          <p className={`text-[11px] ${mutedText} mt-1 font-[500]`}>{subtitle}</p>
        )}
      </div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBgColor}`}>
        <Icon size={17} className={iconColor} strokeWidth={1.8} />
      </div>
    </div>
  );
};
