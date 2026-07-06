import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  statistics?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function PageLayout({ title, subtitle, toolbar, statistics, children, footer }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-erp-bg text-erp-text flex flex-col font-inter">
      
      {/* Header Area */}
      <div className="pt-[48px] px-[40px] pb-[24px]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <h1 className="font-manrope text-[48px] font-[800] tracking-[-1px] leading-none text-erp-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-[12px] text-[15px] font-[500] text-erp-muted">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Toolbar */}
        {toolbar && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="mt-[32px] flex items-center justify-between gap-[24px]">
            {toolbar}
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-[40px] pb-[48px] flex flex-col gap-[32px]">
        {/* Statistics row */}
        {statistics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[24px]">
            {statistics}
          </motion.div>
        )}

        {/* Main Body */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="flex-1 flex flex-col gap-[24px]">
          {children}
        </motion.div>
      </div>

      {footer && (
        <div className="px-[40px] py-[24px] bg-white border-t border-erp-border">
          {footer}
        </div>
      )}
    </div>
  );
}
