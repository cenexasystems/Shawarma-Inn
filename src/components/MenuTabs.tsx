import { useEffect, useRef } from 'react';

interface MenuTabsProps {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
  counts?: Record<string, number>;
}

export default function MenuTabs({ categories, active, onChange, counts }: MenuTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view on mobile
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeBtn = container.querySelector('[data-active="true"]') as HTMLElement;
    if (activeBtn) {
      const containerRect = container.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      const scrollLeft = activeBtn.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [active]);

  return (
    <section className="sticky top-[64px] z-40 bg-[var(--black)]/95 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-8">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto hide-scrollbar"
          style={{ paddingBlock: '10px' }}
        >
          {categories.map(cat => {
            const isActive = active.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                data-active={isActive}
                onClick={() => onChange(cat)}
                style={{ 
                  fontSize: 'clamp(13px, 3.5vw, 18px)',
                  minHeight: '44px',
                }}
                className={`whitespace-nowrap shrink-0 px-4 sm:px-5 rounded-full font-bebas tracking-wider transition-all ${
                  isActive
                    ? 'bg-[var(--red)] text-white shadow-[0_0_15px_rgba(214,43,43,0.3)]'
                    : 'bg-[var(--charcoal)] text-[var(--white)]/70 hover:text-white border border-[var(--border)] hover:border-[var(--red)]'
                }`}
              >
                {cat}
                {counts?.[cat] !== undefined && (
                  <span className="ml-1 opacity-60 text-xs">({counts[cat]})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
