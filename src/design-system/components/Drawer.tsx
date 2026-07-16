import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
  headerAction?: ReactNode;
}

export function Drawer({ isOpen, onClose, title, subtitle, children, footer, width = 'max-w-[480px]', headerAction }: DrawerProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={`fixed right-0 top-0 h-full w-full ${width} bg-white border-l border-gray-200 z-[110] flex flex-col shadow-2xl animate-in slide-in-from-right-full duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10 shrink-0">
          <div>
            {title && <h3 className="font-bebas text-3xl tracking-[2px] text-gray-900 leading-none uppercase">{title}</h3>}
            {subtitle && <p className="text-[11px] text-gray-400 font-medium mt-1 font-inter">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto relative">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-white border-t border-gray-200 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] shrink-0 z-10 relative">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}
