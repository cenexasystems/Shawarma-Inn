import type { ReactNode, HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'normal' | 'large';
  noBg?: boolean;
}

export function Card({ children, padding = 'normal', noBg = false, className = '', ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    normal: 'p-[24px]',
    large: 'p-[32px]'
  };

  return (
    <div 
      className={`${noBg ? '' : 'bg-erp-card border border-erp-border shadow-erp rounded-[22px]'} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon, valueColor = 'text-erp-text' }: { title: string; value: string | number; subtitle?: string; icon?: ReactNode; valueColor?: string }) {
  return (
    <Card className="h-[118px] flex flex-col justify-center relative overflow-hidden group">
      <div className="flex items-center justify-between mb-[16px]">
        <h3 className="text-[12px] font-[600] uppercase tracking-[0.12em] text-erp-muted">
          {title}
        </h3>
        {icon && <div className="text-erp-muted transition-transform group-hover:scale-110">{icon}</div>}
      </div>
      <p className={`text-[52px] font-[700] leading-none tracking-[-0.03em] ${valueColor}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[12px] font-[500] text-erp-muted mt-[8px]">
          {subtitle}
        </p>
      )}
    </Card>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col h-full">
      <h2 className="text-[18px] font-[700] text-erp-text mb-[24px]">
        {title}
      </h2>
      <div className="flex-1 min-h-[240px]">
        {children}
      </div>
    </Card>
  );
}

export function TableCard({ children }: { children: ReactNode }) {
  return (
    <Card padding="none" className="overflow-hidden flex flex-col">
      {children}
    </Card>
  );
}
