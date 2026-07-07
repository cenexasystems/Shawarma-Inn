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
      className={`bg-white border border-erp-border rounded-[22px] shadow-erp ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function KpiCard({ title, value, icon, description, valueColor = 'text-[#1B1B1B]' }: { title: string; value: string | number; icon?: ReactNode; description?: string; valueColor?: string }) {
  return (
    <Card className="h-[118px] flex flex-col justify-center relative overflow-hidden">
      <div className="flex items-center justify-between mb-[16px]">
        <p className="text-[12px] font-[600] uppercase tracking-[0.12em] text-erp-muted">
          {title}
        </p>
        {icon && <div className="text-[#7B7B7B] opacity-50">{icon}</div>}
      </div>
      <p className={`text-[52px] font-[700] leading-none tracking-[-0.03em] ${valueColor}`}>
        {value}
      </p>
      {description && (
        <p className="text-[12px] font-[500] text-erp-muted mt-[8px]">
          {description}
        </p>
      )}
    </Card>
  );
}
