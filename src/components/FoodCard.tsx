import type { MenuItem } from '../types';
import { useFavorites } from '../context/FavoritesContext';
import { getRecoveryImage } from '../utils/menuImages';

interface FoodCardProps {
  item: MenuItem;
  addItem: (i: any) => void;
  qty?: number;
  updateQty?: (id: string | number, qty: number) => void;
  disabled?: boolean;
}

export default function FoodCard({ item, addItem, qty = 0, updateQty, disabled = false }: FoodCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(item.id);
  const recoveryImage = getRecoveryImage(item);

  return (
    <div className="group bg-[var(--card-bg)] border border-white/5 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:scale-[1.02] hover:border-[#d62b2b]/50">
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-[#141414]" style={{ aspectRatio: '4/3' }}>
        <img
          src={item.image || recoveryImage}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== recoveryImage) {
              target.src = recoveryImage;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

        {item.bestseller && (
          <span className="absolute top-2 left-2 bg-[var(--red)] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-body">
            Bestseller
          </span>
        )}

        {/* Favorite button — 44px touch target */}
        <button
          onClick={() => toggleFavorite(item)}
          className="absolute top-2 right-2 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-90"
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          style={{ minWidth: '36px', minHeight: '36px' }}
        >
          {favorited ? (
            <svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </button>

        {/* Item name overlaid on image */}
        <h3 className="absolute bottom-2 left-3 right-3 font-bebas text-white tracking-wide uppercase leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
          style={{ fontSize: 'clamp(15px, 4vw, 20px)' }}>
          {item.name}
        </h3>
      </div>

      {/* Card body */}
      <div className="flex-1 flex flex-col px-3 py-2.5 sm:p-4 sm:pt-3">
        <p className="font-body text-[11px] sm:text-[12.5px] text-[var(--muted)] leading-relaxed line-clamp-2 flex-1">
          {item.desc || item.description}
        </p>

        <div className="mt-2 sm:mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-bebas text-[20px] sm:text-[24px] text-[var(--red)] tracking-wider leading-none">
              ₹{item.price}
            </span>
            {item.rating != null && (
              <span className="flex items-center gap-0.5 text-white/50 text-[10px]">
                <span className="text-[#d62b2b]">★</span>
                {item.rating}
              </span>
            )}
          </div>

          {qty > 0 && updateQty ? (
            // Quantity stepper — tighter on mobile
            <div className={`flex items-center bg-white rounded-full shadow-md ${disabled ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <button
                onClick={() => !disabled && updateQty(item.id, qty - 1)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-black font-bold text-base active:scale-90 transition-transform"
                aria-label="Decrease quantity"
                disabled={disabled}
              >
                −
              </button>
              <span className="text-black text-sm font-bold w-5 text-center">{qty}</span>
              <button
                onClick={() => !disabled && updateQty(item.id, qty + 1)}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-black font-bold text-base active:scale-90 transition-transform"
                aria-label="Increase quantity"
                disabled={disabled}
              >
                +
              </button>
            </div>
          ) : (
            // Add button — min 40px height
            <button
              onClick={() => !disabled && addItem(item)}
              disabled={disabled}
              className={`bg-white text-black text-xs font-bold px-3 sm:px-5 rounded-full uppercase tracking-wider shadow-md transition-all ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:bg-white/90 active:scale-95'}`}
              style={{ minHeight: '36px' }}
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
