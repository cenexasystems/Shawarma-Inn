import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  toolbar?: ReactNode;
  action?: ReactNode;
  statistics?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function PageLayout({ title, subtitle, toolbar, action, statistics, children, footer }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-erp-bg text-erp-text flex flex-col">
      
      {/* Header Area */}
      <div className="pt-4 px-4 md:px-6 xl:px-8 pb-4 max-w-[1440px] w-full mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <h1 className="text-[22px] font-[700] tracking-[-0.02em] leading-tight text-erp-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-[13px] font-[400] text-erp-muted">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Toolbar */}
        {(toolbar || action) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.05 }} className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {toolbar || <span />}
            {action}
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 md:px-6 xl:px-8 pb-8 flex flex-col gap-4 max-w-[1440px] w-full mx-auto">
        {/* Statistics row */}
        {statistics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statistics}
          </motion.div>
        )}

        {/* Main Body */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.15 }} className="flex-1 flex flex-col gap-4">
          {children}
        </motion.div>
      </div>

      {footer && (
        <div className="px-6 py-4 bg-white border-t border-erp-border">
          {footer}
        </div>
      )}
    </div>
  );
}
