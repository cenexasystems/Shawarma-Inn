import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { useAdminContext } from '../../context/AdminContext';
import { DATE_RANGE_PRESETS, PRESET_LABELS, type DateRangePreset } from '../../utils/dateRanges';

export default function GlobalCalendarFilter() {
  const { dateRangeType, dateRange, setDateRangeType } = useAdminContext();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dateRangeType === 'custom') {
      setCustomFrom(dateRange.from.slice(0, 10));
      setCustomTo(dateRange.to.slice(0, 10));
    }
  }, [dateRangeType, dateRange]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const selectPreset = (preset: DateRangePreset) => {
    setDateRangeType(preset);
    setOpen(false);
  };

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return;
    const from = new Date(`${customFrom}T00:00:00`).toISOString();
    const to = new Date(`${customTo}T23:59:59.999`).toISOString();
    setDateRangeType('custom', { from, to });
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors cursor-pointer text-sm font-medium text-white/80"
      >
        <Calendar size={16} className="text-[#ef8f2f]" />
        <span>{PRESET_LABELS[dateRangeType]}</span>
        <svg className="w-4 h-4 text-white/40 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_30px_60px_rgba(0,0,0,0.7)] overflow-hidden z-50">
          <div className="p-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {DATE_RANGE_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => selectPreset(preset)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  dateRangeType === preset
                    ? 'bg-[#ef8f2f]/10 text-[#ef8f2f] font-bold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 p-3 space-y-2">
            <p
              className={`text-xs font-bold uppercase tracking-[1.5px] ${
                dateRangeType === 'custom' ? 'text-[#ef8f2f]' : 'text-white/50'
              }`}
            >
              Custom Range
            </p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                max={customTo || undefined}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#ef8f2f]/50"
              />
              <span className="text-white/30 text-xs">to</span>
              <input
                type="date"
                value={customTo}
                min={customFrom || undefined}
                onChange={(e) => setCustomTo(e.target.value)}
                className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#ef8f2f]/50"
              />
            </div>
            <button
              type="button"
              onClick={applyCustomRange}
              disabled={!customFrom || !customTo}
              className="w-full bg-[#ef8f2f]/10 border border-[#ef8f2f]/30 text-[#ef8f2f] rounded-lg py-1.5 text-xs font-bold uppercase tracking-[1.5px] hover:bg-[#ef8f2f]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
