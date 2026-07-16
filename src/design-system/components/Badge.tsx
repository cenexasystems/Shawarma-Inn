import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
}

export function Badge({ children, variant = 'neutral', size = 'md', icon, className = '' }: BadgeProps) {
  const variants = {
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'text-[9px] px-2 py-0.5',
    md: 'text-[10px] px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center gap-1 border rounded-lg font-inter font-bold uppercase tracking-wider ${variants[variant]} ${sizes[size]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

export function DotBadge({ variant = 'neutral' }: { variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const colors = {
    neutral: 'bg-gray-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-400',
    danger: 'bg-red-500',
    info: 'bg-blue-400',
  };
  return <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[variant]}`} />;
}
