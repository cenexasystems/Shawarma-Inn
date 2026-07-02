import type { MenuItem } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { getRecoveryImage } from '../utils/menuImages';

interface FoodCardProps {
  item: MenuItem;
  addItem: (i: any) => void;
  qty?: number;
  updateQty?: (id: string | number, qty: number) => void;
}

export default function FoodCard({ item, addItem, qty = 0, updateQty }: FoodCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(item.id);
  // Recovery image: semantically correct for this item's food type, never crosses categories.
  const recoveryImage = getRecoveryImage(item);

  return (
    <div className="group bg-[var(--card-bg)] border border-white/5 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-[#d62b2b]/50">
      {/* Image with overlaid name */}
      <div className="relative w-full aspect-square overflow-hidden bg-[#141414]">
        <img
          src={item.image || recoveryImage}
          alt={item.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = recoveryImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {item.bestseller && (
          <span className="absolute top-3 left-3 bg-[var(--red)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider font-body">
            Bestseller
          </span>
        )}

        <button
          onClick={() => toggleFavorite(item)}
          className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-90"
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          {favorited ? (
            <svg className="w-4 h-4 text-red-500 fill-current" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </button>

        <h3 className="absolute bottom-3 left-4 right-4 font-bebas text-[22px] text-white tracking-wide uppercase leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
          {item.name}
        </h3>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col p-4 pt-3">
        <p className="font-body text-[12.5px] text-[var(--muted)] leading-relaxed line-clamp-2 flex-1">
          {item.desc || item.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bebas text-[24px] text-[var(--red)] tracking-wider">₹{item.price}</span>
            {item.rating != null && (
              <span className="flex items-center gap-1 text-white/50 text-xs">
                <span className="text-[#d62b2b]">★</span>
                {item.rating}
              </span>
            )}
          </div>

          {qty > 0 && updateQty ? (
            <div className="flex items-center bg-white rounded-full p-1 shadow-md">
              <button
                onClick={() => updateQty(item.id, qty - 1)}
                className="w-10 h-10 flex items-center justify-center text-black font-bold text-lg active:scale-90 transition-transform"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="text-black text-sm font-bold w-6 text-center">{qty}</span>
              <button
                onClick={() => updateQty(item.id, qty + 1)}
                className="w-10 h-10 flex items-center justify-center text-black font-bold text-lg active:scale-90 transition-transform"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(item)}
              className="bg-white text-black text-xs font-bold px-6 py-3 rounded-full uppercase tracking-wider hover:bg-white/90 shadow-md transition-all active:scale-95"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
