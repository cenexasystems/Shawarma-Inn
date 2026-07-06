import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function RightDrawer({ isOpen, onClose, title, subtitle, children, footer, width = '540px' }: RightDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[80] bg-[#111111]/40 backdrop-blur-[2px]" 
            onClick={onClose} 
          />
          <motion.aside 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
            className="fixed right-0 top-0 h-full bg-white border-l border-erp-border z-[90] flex flex-col shadow-2xl rounded-l-erp overflow-hidden"
            style={{ width, maxWidth: '100vw' }}
          >
            <div className="flex items-center justify-between px-[32px] py-[24px] border-b border-erp-border bg-white shrink-0">
              <div>
                <h3 className="font-manrope font-[800] text-[28px] text-erp-text leading-none">{title}</h3>
                {subtitle && <p className="font-inter text-[14px] text-erp-muted font-[500] mt-[8px]">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose} 
                className="w-[40px] h-[40px] rounded-full bg-erp-bg flex items-center justify-center hover:bg-gray-200 text-erp-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-[32px] font-inter">
              {children}
            </div>

            {footer && (
              <div className="bg-white border-t border-erp-border p-[24px] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-20 shrink-0">
                {footer}
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
