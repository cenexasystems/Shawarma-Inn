import { useState } from 'react';
import MenuTabs from '../components/MenuTabs';
import FoodCard from '../components/FoodCard';
import Footer from '../components/Footer';
import { useMenuItems } from '../hooks/useMenuItems';

interface MenuProps {
  cartData?: any;
}

export default function Menu({ cartData }: MenuProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const { items: menu, loading } = useMenuItems();

  const filtered =
    activeCategory === 'All'
      ? menu
      : menu.filter(item => item.category.toLowerCase() === activeCategory.toLowerCase());

  return (
    <main className="pt-[64px] min-h-screen bg-[var(--black)]">
      {/* Sticky category tabs */}
      <MenuTabs active={activeCategory} onChange={setActiveCategory} />

      {/* Page title */}
      <header className="max-w-7xl mx-auto px-8 pt-12 pb-8">
        <h1 className="font-bebas text-6xl md:text-8xl tracking-wide text-[var(--white)] uppercase leading-none">
          THE MENU
        </h1>
        <p className="font-body text-[var(--white)]/60 mt-4 tracking-widest text-sm uppercase">
          Curated heat from the heart of the grill.
        </p>
      </header>

      {/* Menu grid */}
      <section className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {loading && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center text-[var(--white)]/40 font-bebas uppercase text-2xl tracking-widest">
            Loading menu...
          </div>
        )}
        {filtered.map(item => (
          <FoodCard 
            key={item.id} 
            item={item} 
            addItem={cartData?.addItem} 
          />
        ))}
        {!loading && filtered.length === 0 && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center text-[var(--white)]/40 font-bebas uppercase text-2xl tracking-widest">
            No items found in this category.
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
