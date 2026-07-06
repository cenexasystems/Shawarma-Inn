import type { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'normal' | 'large';
}

export function Card({ children, padding = 'normal', className = '', ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    normal: 'p-[30px]',
    large: 'p-10'
  };

  return (
    <div 
      className={`bg-white border border-gray-100 rounded-erp-card shadow-erp-card ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function KpiCard({ title, value, icon, description, valueColor = 'text-[#1B1B1B]' }: { title: string; value: string | number; icon?: ReactNode; description?: string; valueColor?: string }) {
  return (
    <Card className="flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-[16px]">
        <p className="font-inter text-[14px] font-[700] uppercase tracking-[1px] text-[#7B7B7B]">
          {title}
        </p>
        {icon && <div className="text-[#7B7B7B] opacity-50">{icon}</div>}
      </div>
      <p className={`font-manrope text-[48px] font-[800] leading-none tracking-tight ${valueColor}`}>
        {value}
      </p>
      {description && (
        <p className="font-inter text-[13px] font-[500] text-[#7B7B7B] mt-[12px]">
          {description}
        </p>
      )}
    </Card>
  );
}
