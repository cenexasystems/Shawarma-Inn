import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface StatusSelectProps {
  value: OrderStatus;
  onChange: (value: OrderStatus) => void;
  className?: string;
  options?: OrderStatus[];
}

const STATUS_CONFIG: Record<OrderStatus, { bg: string; border: string; text: string; indicator: string; label: string }> = {
  pending: {
    bg: 'bg-[#FFF8E7]',
    border: 'border-[#F7D76A]',
    text: 'text-[#B7791F]',
    indicator: 'fill-[#F7D76A] text-[#F7D76A]',
    label: 'Pending'
  },
  processing: {
    bg: 'bg-[#EEF4FF]',
    border: 'border-[#B9D4FF]',
    text: 'text-[#2563EB]',
    indicator: 'fill-[#B9D4FF] text-[#B9D4FF]',
    label: 'Processing'
  },
  completed: {
    bg: 'bg-[#ECFDF3]',
    border: 'border-[#B7E8C4]',
    text: 'text-[#15803D]',
    indicator: 'fill-[#B7E8C4] text-[#B7E8C4]',
    label: 'Completed'
  },
  cancelled: {
    bg: 'bg-[#FEF2F2]',
    border: 'border-[#F5B5B5]',
    text: 'text-[#DC2626]',
    indicator: 'fill-[#F5B5B5] text-[#F5B5B5]',
    label: 'Cancelled'
  }
};

const DEFAULT_OPTIONS: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled'];

export const StatusSelect: React.FC<StatusSelectProps> = ({ value, onChange, className = '', options = DEFAULT_OPTIONS }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const config = STATUS_CONFIG[value] || STATUS_CONFIG.pending;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between min-w-[160px] h-[40px] px-[16px] rounded-full border ${config.bg} ${config.border} ${config.text} text-[14px] font-[600] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1`}
        style={{ '--tw-ring-color': config.text.replace('text-', '') } as React.CSSProperties}
      >
        <div className="flex items-center gap-[8px]">
          <Circle size={8} className={`${config.indicator}`} />
          <span className="whitespace-nowrap">{config.label}</span>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 w-[170px] bg-white rounded-[12px] p-[6px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100 z-50"
          >
            {options.map((option) => {
              const optConfig = STATUS_CONFIG[option];
              const isSelected = option === value;
              return (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-[8px] h-[38px] px-[10px] rounded-[8px] text-[14px] font-[600] transition-colors ${
                    isSelected 
                      ? 'bg-erp-primary text-white' 
                      : 'text-gray-700 hover:bg-[#F5F7FA]'
                  }`}
                >
                  <Circle size={8} className={`${isSelected ? 'fill-white text-white' : optConfig.indicator}`} />
                  <span className="whitespace-nowrap">{optConfig.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
