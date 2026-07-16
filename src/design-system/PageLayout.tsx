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
    <div className="min-h-screen bg-erp-bg text-erp-text flex flex-col">
      
      {/* Header Area */}
      <div className="pt-6 md:pt-[32px] px-4 md:px-[32px] pb-5 md:pb-[24px] max-w-[1440px] w-full mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <h1 className="text-[42px] font-[700] tracking-[-0.03em] leading-[1.05] text-erp-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-[12px] text-[17px] font-[400] text-erp-muted">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Toolbar */}
        {toolbar && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="mt-6 md:mt-[30px] flex flex-col items-stretch md:flex-row md:items-center md:justify-between gap-4 md:gap-[24px]">
            {toolbar}
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 md:px-[32px] pb-8 md:pb-[48px] flex flex-col gap-6 md:gap-[32px] max-w-[1440px] w-full mx-auto">
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
