import { useState } from 'react';
import MenuTabs from '../components/MenuTabs';
import FoodCard from '../components/FoodCard';
import Footer from '../components/Footer';
import { useMenuItems } from '../hooks/useMenuItems';
import { useFavorites } from '../context/FavoritesContext';

interface MenuProps {
  cartData?: any;
}

type DietFilter = 'all' | 'veg' | 'non-veg';

export default function Menu({ cartData }: MenuProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [bestsellerOnly, setBestsellerOnly] = useState(false);
  const { items: menu, loading } = useMenuItems();
  const { favorites } = useFavorites();

  const base = showFavoritesOnly ? favorites : menu;

  const categoryCounts = base.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, { All: base.length });

  const filtered = base
    .filter(item =>
      activeCategory === 'All' || item.category.toLowerCase() === activeCategory.toLowerCase()
    )
    .filter(item => {
      if (dietFilter === 'veg') return item.isVeg === true;
      if (dietFilter === 'non-veg') return item.isVeg === false;
      return true;
    })
    .filter(item => !bestsellerOnly || item.bestseller)
    .filter(item => {
      const query = search.trim().toLowerCase();
      if (query === '') return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.desc || item.description || '').toLowerCase().includes(query)
      );
    });

  return (
    <main className="pt-[64px] min-h-screen bg-[var(--black)]">
      {/* Sticky category tabs */}
      <MenuTabs active={activeCategory} onChange={setActiveCategory} counts={categoryCounts} />

      {/* Page title with Favorites toggle */}
      <header className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 pt-8 md:pt-12 pb-6 md:pb-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="font-bebas text-5xl md:text-8xl tracking-wide text-[var(--white)] uppercase leading-none">
              THE MENU
            </h1>
            <p className="font-body text-[var(--white)]/60 mt-2 md:mt-4 tracking-widest text-xs md:text-sm uppercase">
              Curated heat from the heart of the grill.
            </p>
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-bebas text-sm tracking-widest uppercase transition-all whitespace-nowrap ${
              showFavoritesOnly
                ? 'bg-[var(--red)] text-white shadow-[0_0_40px_rgba(214,43,43,0.5)]'
                : 'border border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            <svg className="w-5 h-5" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favorites.length > 0 && <span className="font-bold">{favorites.length}</span>}
            FAVORITES
          </button>
        </div>

        {/* Search */}
        <div className="mt-8 relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search the menu..."
            className="w-full bg-[var(--charcoal)] border border-[var(--border)] rounded-full pl-12 pr-6 py-3 text-white placeholder:text-white/40 font-body text-sm focus:outline-none focus:border-[var(--red)] transition-colors"
          />
        </div>

        {/* Diet & bestseller filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          {([
            ['all', 'All'],
            ['veg', 'Veg'],
            ['non-veg', 'Non-Veg'],
          ] as [DietFilter, string][]).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setDietFilter(value)}
              className={`px-5 py-2 rounded-full font-bebas text-sm tracking-wider transition-all ${
                dietFilter === value
                  ? 'bg-[var(--red)] text-white shadow-[0_0_15px_rgba(214,43,43,0.3)]'
                  : 'bg-[var(--charcoal)] text-white/70 border border-[var(--border)] hover:border-[var(--red)]'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setBestsellerOnly(!bestsellerOnly)}
            className={`px-5 py-2 rounded-full font-bebas text-sm tracking-wider transition-all ${
              bestsellerOnly
                ? 'bg-[var(--red)] text-white shadow-[0_0_15px_rgba(214,43,43,0.3)]'
                : 'bg-[var(--charcoal)] text-white/70 border border-[var(--border)] hover:border-[var(--red)]'
            }`}
          >
            Bestsellers
          </button>
        </div>
      </header>

      {/* Menu grid */}
      <section className="max-w-[1600px] mx-auto px-4 md:px-8 xl:px-12 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pb-24">
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--card-bg)] border-[0.5px] border-[var(--border)] rounded-[16px] overflow-hidden animate-pulse"
            >
              <div className="w-full aspect-[4/3] bg-white/5" />
              <div className="p-4 pt-3 space-y-3">
                <div className="h-3 bg-white/5 rounded-full w-3/4" />
                <div className="h-3 bg-white/5 rounded-full w-1/2" />
                <div className="h-8 bg-white/5 rounded-full w-1/3 mt-4" />
              </div>
            </div>
          ))}
        {!loading &&
          filtered.map(item => {
            const cartItem = cartData?.cart?.find((ci: any) => ci.id === item.id);
            return (
              <FoodCard
                key={item.id}
                item={item}
                addItem={cartData?.addItem}
                qty={cartItem?.qty ?? 0}
                updateQty={cartData?.updateQty}
              />
            );
          })}
        {!loading && filtered.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center space-y-5">
            <p className="text-[var(--white)]/40 font-bebas uppercase text-2xl tracking-widest">
              {showFavoritesOnly
                ? 'No favorite items yet. Start adding! ❤️'
                : search.trim()
                ? `No results for "${search.trim()}".`
                : 'No items match your filters.'}
            </p>
            <button
              onClick={() => {
                setSearch('');
                setActiveCategory('All');
                setDietFilter('all');
                setBestsellerOnly(false);
                setShowFavoritesOnly(false);
              }}
              className="px-6 py-2 rounded-full font-bebas text-sm tracking-widest uppercase border border-white/20 text-white/60 hover:border-white/40 transition-all"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
