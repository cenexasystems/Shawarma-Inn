const CATEGORIES = ['All', 'Shawarma', 'Wraps', 'Bowls', 'Juice', 'Pizza', 'Mojito', 'Sides', 'Desserts'];

interface MenuTabsProps {
  active: string;
  onChange: (cat: string) => void;
}

export default function MenuTabs({ active, onChange }: MenuTabsProps) {
  return (
    <section className="sticky top-[64px] z-40 bg-[var(--black)]/90 backdrop-blur-md py-4 border-b border-[var(--border)] overflow-hidden">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onChange(cat)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-bebas text-lg tracking-wider transition-all ${
                active.toLowerCase() === cat.toLowerCase()
                  ? 'bg-[var(--red)] text-white shadow-[0_0_15px_rgba(214,43,43,0.3)]'
                  : 'bg-[var(--charcoal)] text-[var(--white)]/70 hover:text-white border border-[var(--border)] hover:border-[var(--red)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
