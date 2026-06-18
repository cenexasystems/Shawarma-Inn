import type { MenuItem } from '../types';
import { useFavorites } from '../context/FavoritesContext';

interface FoodCardProps {
  item: MenuItem;
  addItem: (i: any) => void;
}

export default function FoodCard({ item, addItem }: FoodCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(item.id);
  const fallbackImage = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300';
  return (
    <div className="group bg-[var(--card-bg)] border-[0.5px] border-[var(--border)] rounded-[16px] p-4 flex gap-4 transition-all duration-300 hover:scale-[1.01] hover:border-[var(--red)] relative overflow-hidden">
      
      {/* Heart Button - Top Right */}
      <button
        onClick={() => toggleFavorite(item)}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-90"
        title={favorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        {favorited ? (
          <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )}
      </button>
      
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
        <div className="relative w-[110px] h-[110px] rounded-xl overflow-hidden shadow-lg bg-[var(--charcoal)] border border-white/5">
          <img
            src={item.image || fallbackImage}
            alt={item.name}
            width={110}
            height={110}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={({ currentTarget }) => {
              currentTarget.src = fallbackImage;
            }}
          />
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
