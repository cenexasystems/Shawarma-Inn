import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMenuItems } from '../hooks/useMenuItems';
import { getRecoveryImage } from '../utils/menuImages';

const MAX_TRENDING = 8;
const TARGET_ITEMS = ['Shawarma', 'Chicken Popcorn', 'Loaded French Fries', 'Waffle'];

export default function TrendingProducts() {
  const navigate = useNavigate();
  const { items, loading } = useMenuItems();

  const trending = useMemo(() => {
    if (loading || !items || items.length === 0) return [];
    
    // First, look for items explicitly marked as trending
    let pool = items.filter(item => item.trending);
    
    // Fallback to bestsellers if not enough trending items
    if (pool.length < MAX_TRENDING) {
      const bestsellers = items.filter(item => item.bestseller && !pool.some(p => p.id === item.id));
      pool = [...pool, ...bestsellers];
    }
    
    // Priority sorting matching old logic, if we need it
    const priority = TARGET_ITEMS
      .map(t => pool.find(item => item.name.toLowerCase().includes(t.toLowerCase())))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
      
    const rest = pool.filter(item => !priority.some(p => p.id === item.id));
    
    return [...priority, ...rest].slice(0, MAX_TRENDING);
  }, [items, loading]);

  if (loading || trending.length === 0) {
    return null;
  }

  return (
    <section id="trending" className="py-20 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">Most Loved This Week</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bebas text-white tracking-[3px] uppercase">
            TRENDING <span className="text-[#d62b2b]">PRODUCTS</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {trending.map((item, index) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => navigate('/menu')}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -6 }}
              className="group text-left bg-[#141414] border border-white/10 rounded-2xl overflow-hidden focus:outline-none focus:ring-1 focus:ring-[#d62b2b]"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = getRecoveryImage(item);
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 bg-[#d62b2b] text-white text-[9px] font-bold uppercase tracking-[1.5px] px-2 py-1 rounded-full">
                  {item.trending ? 'Trending' : 'Bestseller'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-headline font-bold text-white text-sm uppercase tracking-[1px] truncate">
                  {item.name}
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[var(--red)] font-bold text-lg">₹{item.price}</span>
                  <button className="bg-white/10 hover:bg-[var(--red)] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wider transition-colors">
                    Quick Add
                  </button>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/menu')}
            className="border border-white/10 text-white px-8 py-3 rounded-full font-headline font-bold text-xs tracking-widest uppercase hover:bg-white/5 hover:border-white/30 transition-all"
          >
            VIEW FULL MENU
          </button>
        </div>
      </div>
    </section>
  );
}
