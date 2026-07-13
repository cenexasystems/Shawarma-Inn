
import { motion } from 'framer-motion';

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all';

interface UniversalFilterProps {
  currentPreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
}

const PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

export function UniversalFilter({ currentPreset, onPresetChange }: UniversalFilterProps) {
  return (
    <div className="bg-erp-bg p-[4px] rounded-[12px] flex flex-wrap gap-[4px]">
      {PRESETS.map(p => {
        const isActive = currentPreset === p.value;
        return (
          <button
            key={p.value}
            onClick={() => onPresetChange(p.value)}
            className={`relative px-[16px] py-[8px] rounded-[8px] text-[13px] font-[600] font-inter transition-colors flex-shrink-0 z-10 ${
              isActive ? 'text-white' : 'text-erp-muted hover:text-erp-text'
            }`}
          >
            {isActive && (
              <motion.div 
                layoutId="filter-bg"
                className="absolute inset-0 bg-erp-primary rounded-[8px] shadow-sm -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
