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
      className={`${noBg ? '' : 'bg-erp-card border border-erp-border shadow-erp rounded-erp'} ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon, valueColor = 'text-erp-text' }: { title: string; value: string | number; subtitle?: string; icon?: ReactNode; valueColor?: string }) {
  return (
    <Card className="flex flex-col relative overflow-hidden group">
      <div className="flex items-center justify-between mb-[16px]">
        <h3 className="font-inter text-[13px] font-[700] uppercase tracking-[1px] text-erp-muted">
          {title}
        </h3>
        {icon && <div className="text-erp-muted transition-transform group-hover:scale-110">{icon}</div>}
      </div>
      <p className={`font-manrope text-[48px] font-[800] leading-none tracking-tight ${valueColor}`}>
        {value}
      </p>
      {subtitle && (
        <p className="font-inter text-[13px] font-[500] text-erp-muted mt-[12px]">
          {subtitle}
        </p>
      )}
    </Card>
  );
}

export function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="flex flex-col h-full">
      <h2 className="font-manrope text-[18px] font-[700] text-erp-text mb-[24px]">
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
