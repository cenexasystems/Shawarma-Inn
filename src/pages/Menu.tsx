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
  
  // Outlet & Delivery State
  const [selectedOutlet, setSelectedOutlet] = useState('Mathur');
  const [deliveryType, setDeliveryType] = useState('We Arrange Delivery');

  const { items: menu, loading, categories: hookCategories } = useMenuItems();
  const { favorites } = useFavorites();

  const base = showFavoritesOnly ? favorites : menu;

  const dynamicCategories = hookCategories.filter(c => c !== 'All' && c !== 'Bestsellers');
  const allCategories = ['All', 'Bestsellers', ...dynamicCategories];

  const categoryCounts = base.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    if (item.bestseller) {
      acc['Bestsellers'] = (acc['Bestsellers'] || 0) + 1;
    }
    return acc;
  }, { All: base.length });

  const filtered = base
    .filter(item => {
      if (activeCategory === 'Bestsellers') return item.bestseller;
      if (activeCategory === 'All') return true;
      return item.category === activeCategory;
    })
    .filter(item => {
      if (dietFilter === 'veg') return item.isVeg === true;
      if (dietFilter === 'non-veg') return item.isVeg === false;
      return true;
    })
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
      <MenuTabs categories={allCategories} active={activeCategory} onChange={setActiveCategory} counts={categoryCounts} />

      {/* ── Menu Page Header ─────────────────────────────── */}
      <header className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-8 xl:px-12 pt-3 md:pt-6 pb-3 md:pb-5">

        {/* Row 1: Title + Outlet/Delivery controls */}
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-bebas tracking-tight text-white uppercase leading-none drop-shadow-lg shrink-0"
            style={{ fontSize: 'clamp(28px, 8vw, 48px)' }}>
            THE <span className="text-[#dc2626]">MENU</span>
          </h1>

          {/* Controls — horizontally scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar shrink-0">
            <div className="flex flex-col gap-0.5 shrink-0">
              <label className="text-[8px] text-white/40 uppercase tracking-[2px] font-bold">Outlet</label>
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="bg-[var(--charcoal)] border border-[var(--border)] rounded-full px-3 py-1 text-white font-body text-xs focus:outline-none focus:border-[#dc2626] transition-colors cursor-pointer appearance-none"
                style={{ background: 'var(--charcoal) url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23ffffff\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E") no-repeat right 0.5rem center/0.6rem', minWidth: '100px', maxWidth: '130px' }}
              >
                <option value="Mathur">Mathur</option>
                <option value="Madhavaram">Madhavaram</option>
                <option value="Kolathur">Kolathur</option>
                <option value="Retteri">Retteri</option>
                <option value="Thirumullaivoyal">T'voyal</option>
                <option value="Kodungaiyur">Kodungaiyur</option>
              </select>
            </div>

            <div className="flex flex-col gap-0.5 shrink-0">
              <label className="text-[8px] text-white/40 uppercase tracking-[2px] font-bold">Delivery</label>
              <div className="flex bg-[var(--charcoal)] border border-[var(--border)] rounded-full p-0.5">
                {['Self', 'Arrange', 'Pickup'].map((label, i) => {
                  const val = ['Self Delivery', 'We Arrange Delivery', 'Pickup'][i];
                  return (
                    <button
                      key={val}
                      onClick={() => setDeliveryType(val)}
                      style={{ minHeight: '28px', minWidth: '44px' }}
                      className={`text-[9px] font-bold uppercase tracking-[0.5px] rounded-full px-2 transition-all ${deliveryType === val ? 'bg-[#dc2626] text-white shadow' : 'text-white/55 hover:text-white'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Search + Diet filters + Favorites — single scrollable row on mobile */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto hide-scrollbar">
          {/* Search */}
          <div className="relative shrink-0" style={{ width: 'min(100%, 200px)' }}>
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[var(--charcoal)] border border-[var(--border)] rounded-full pl-9 pr-3 text-white placeholder:text-white/40 font-body text-xs focus:outline-none focus:border-[#dc2626] transition-colors"
              style={{ height: '32px' }}
            />
          </div>

          {/* Diet pills */}
          {(['all', 'veg', 'non-veg'] as const).map((val) => {
            const label = val === 'all' ? 'All' : val === 'veg' ? 'Veg' : 'Non-Veg';
            const activeClass = val === 'veg' ? 'bg-green-600 text-white border-green-600'
              : val === 'non-veg' ? 'bg-red-600 text-white border-red-600'
              : 'bg-white/20 text-white border-white/20';
            return (
              <button
                key={val}
                onClick={() => setDietFilter(val)}
                style={{ minHeight: '32px', minWidth: '44px' }}
                className={`px-3 rounded-full text-[10px] font-bold uppercase tracking-[1px] transition-colors whitespace-nowrap border shrink-0 ${
                  dietFilter === val ? activeClass : 'bg-[var(--charcoal)] border-[var(--border)] text-white/50 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}

          {/* Favorites toggle */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{ minHeight: '32px' }}
            className={`flex items-center gap-1.5 px-3 rounded-full font-body text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap shrink-0 border ${
              showFavoritesOnly
                ? 'bg-[var(--red)] text-white border-[var(--red)] shadow-[0_0_20px_rgba(214,43,43,0.4)]'
                : 'border-white/20 text-white/60 hover:border-white/40'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favorites.length > 0 && <span>{favorites.length}</span>}
            ♡
          </button>
        </div>
      </header>

      {/* Menu grid */}
      <section className="max-w-[1600px] mx-auto px-2.5 sm:px-4 md:px-8 xl:px-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6 pb-32">
        {selectedOutlet !== 'Mathur' && !loading && (
          <div className="col-span-full mb-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-2xl flex items-start gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p className="font-bold uppercase tracking-[1px] text-sm">Online ordering not available</p>
              <p className="text-xs mt-1 text-yellow-400/80">Direct ordering is currently live only for our Mathur branch. Please visit {selectedOutlet} outlet directly.</p>
            </div>
          </div>
        )}

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
        {!loading && filtered.length > 0 && activeCategory === 'All' ? (
          <div className="col-span-full space-y-16 mt-4">
            {['Bestsellers', ...dynamicCategories].map(cat => {
              const catItems = filtered.filter(item => cat === 'Bestsellers' ? item.bestseller : item.category === cat);
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="font-bebas text-4xl tracking-widest text-white uppercase">{cat}</h2>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {catItems.map(item => {
                      const cartItem = cartData?.cart?.find((ci: any) => ci.id === item.id);
                      return (
                        <FoodCard
                          key={item.id}
                          item={item}
                          addItem={cartData?.addItem}
                          qty={cartItem?.qty ?? 0}
                          updateQty={cartData?.updateQty}
                          disabled={selectedOutlet !== 'Mathur'}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading && filtered.map(item => {
            const cartItem = cartData?.cart?.find((ci: any) => ci.id === item.id);
            return (
              <FoodCard
                key={item.id}
                item={item}
                addItem={cartData?.addItem}
                qty={cartItem?.qty ?? 0}
                updateQty={cartData?.updateQty}
                disabled={selectedOutlet !== 'Mathur'}
              />
            );
          })
        )}
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
                setActiveCategory('Bestsellers');
                setDietFilter('all');
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
