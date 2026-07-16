import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Tag, Coffee, Gift } from 'lucide-react';
import Footer from '../components/Footer';

const offers = [
  {
    icon: Gift,
    title: '₹50 OFF on First Order',
    code: 'WELCOME50',
    description: 'Use code WELCOME50 at checkout. Applicable on your first direct order.',
    color: 'from-pink-500/20 to-rose-500/5',
    iconColor: 'text-pink-500'
  },
  {
    icon: Tag,
    title: '10% OFF on all Direct Orders',
    code: 'DIRECT10',
    description: 'Order directly from our website and get 10% off on all items. No aggregators, no extra fees!',
    color: 'from-emerald-500/20 to-teal-500/5',
    iconColor: 'text-emerald-500'
  },
  {
    icon: Coffee,
    title: 'Free Drink on orders above ₹299',
    code: 'FREEDRINK',
    description: 'Add a refreshing beverage to your order for free when your cart total exceeds ₹299.',
    color: 'from-blue-500/20 to-cyan-500/5',
    iconColor: 'text-blue-500'
  }
];

export default function OffersPage() {
  return (
    <main className="min-h-screen bg-[var(--black)] text-white pt-24 pb-12 flex flex-col">
      <SEO 
        title="Special Offers | Shawarma Inn"
        description="Order directly from our website and get 10% off, free drinks, and exclusive discounts on your favorite shawarma combos."
        keywords="shawarma combo offers Chennai, discount shawarma"
        canonicalUrl="/offers"
      />
      <div className="flex-1 max-w-5xl mx-auto px-6 w-full">
        <div className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[4px] text-[var(--red)] font-bold mb-3">Special Deals</p>
          <h1 className="font-bebas text-5xl md:text-7xl uppercase tracking-[4px]">
            Exclusive <span className="text-[var(--red)]">Offers</span>
          </h1>
          <p className="mt-4 text-white/60 font-body text-lg max-w-xl mx-auto">
            Order directly with us and enjoy the best prices, exclusive discounts, and freebies. Use the promo codes at checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {offers.map((offer, index) => (
            <div key={index} className={`bg-gradient-to-b ${offer.color} border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-all`}>
              <div className="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center mb-6">
                <offer.icon className={`w-6 h-6 ${offer.iconColor}`} />
              </div>
              <h3 className="font-bebas text-3xl tracking-[1px] mb-3">{offer.title}</h3>
              <p className="text-white/70 font-body text-sm mb-8 leading-relaxed min-h-[60px]">{offer.description}</p>
              
              <div className="bg-black/50 border border-white/10 rounded-xl p-4 flex items-center justify-between group-hover:border-white/30 transition-colors">
                <span className="font-mono text-lg font-bold tracking-wider">{offer.code}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(offer.code)}
                  className="text-xs font-bold uppercase tracking-[2px] bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Link 
            to="/menu" 
            className="inline-block bg-[var(--red)] hover:bg-red-700 text-white font-bebas text-2xl tracking-[2px] py-4 px-12 rounded-xl transition-all hover:scale-105"
          >
            Order Now
          </Link>
        </div>
      </div>
      <div className="mt-24">
        <Footer />
      </div>
    </main>
  );
}
