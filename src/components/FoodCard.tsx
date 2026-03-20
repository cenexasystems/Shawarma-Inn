import type { MenuItem } from '../types';

interface FoodCardProps {
  item: MenuItem;
  addItem: (i: any) => void;
}

export default function FoodCard({ item, addItem }: FoodCardProps) {
  return (
    <div className="group bg-[var(--card-bg)] border-[0.5px] border-[var(--border)] rounded-[16px] p-4 flex gap-4 transition-all duration-300 hover:scale-[1.01] hover:border-[var(--red)] relative overflow-hidden">
      
      {/* LEFT: Info */}
      <div className="flex-1 flex flex-col justify-between pr-2">
        <div>
          {/* Category Badge */}
          <span className="inline-block bg-[var(--red)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 font-body">
            {item.category}
          </span>
          <h3 className="font-bebas text-[20px] text-white tracking-wide leading-tight mb-1">
            {item.name}
          </h3>
          <p className="font-body text-[12px] text-[var(--muted)] leading-relaxed line-clamp-2">
            {item.desc || item.description}
          </p>
        </div>
        
        {/* Bottom row: Price & Rating */}
        <div className="mt-3 flex items-center gap-3">
          <span className="font-bebas text-[24px] text-[var(--red)] tracking-wider">₹{item.price}</span>
          
          <div className="bg-white/5 rounded-full px-2 py-0.5 flex items-center gap-1 border border-white/10">
            <span className="text-amber-400 text-[10px]">⭐</span>
            <span className="text-[10.5px] font-bold text-white">{item.rating?.toFixed(1) || '4.5'}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Image container + ADD button */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="relative w-[110px] h-[110px] rounded-xl overflow-hidden shadow-lg bg-[var(--charcoal)]">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">{item.emoji || '🌯'}</div>
          )}
        </div>
        
        {/* Add button (now outside the image for clean layout) */}
        <button
          onClick={() => addItem(item)}
          className="w-[110px] bg-[var(--red)] text-white text-[11px] font-bold py-1.5 rounded-full uppercase tracking-wider hover:bg-[var(--red-hot)] shadow-[0_2px_10px_rgba(214,43,43,0.3)] transition-all active:scale-95"
        >
          + ADD
        </button>
      </div>
    </div>
  );
}
