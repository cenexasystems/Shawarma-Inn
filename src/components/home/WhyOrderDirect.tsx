import { motion } from 'framer-motion';
import { Tag, TrendingDown, ShieldCheck, Check } from 'lucide-react';

export default function WhyOrderDirect() {
  return (
    <section className="py-24 bg-[var(--black)] relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-zinc-900/40 to-transparent blur-3xl pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-6xl font-bebas tracking-[3px] text-white uppercase leading-none mb-4">
              Why Order <span className="text-[var(--red)]">Direct?</span>
            </h2>
            <p className="text-white/50 font-body text-lg leading-relaxed">
              Skip the middleman. Get the absolute best food at the most authentic price, prepared with priority.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-6 py-3 backdrop-blur-md">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bebas text-lg tracking-[1px] text-white uppercase mt-1">Official Platform</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Card 1: Better Pricing */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="group relative bg-[#0f0f0f] border border-white/5 rounded-[32px] p-8 md:p-10 overflow-hidden hover:border-white/10 transition-colors duration-500"
          >
            {/* Subtle Hover Gradient */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-white/0 via-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <TrendingDown className="w-8 h-8 text-white/80" />
            </div>
            
            <h3 className="text-3xl font-bebas text-white tracking-[2px] uppercase mb-4">Better Pricing</h3>
            <p className="text-white/50 font-body leading-relaxed mb-8 text-sm md:text-base">
              Delivery apps charge up to 30% in commissions and inflate menu prices. When you order direct, you pay the real store price with zero hidden markups.
            </p>
            
            <ul className="space-y-4 font-body text-sm text-white/80">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--red)]/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-[var(--red)]" />
                </div>
                No inflated menu prices
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--red)]/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-[var(--red)]" />
                </div>
                Lower packing charges
              </li>
            </ul>
          </motion.div>

          {/* Card 2: Exclusive Offers */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="group relative bg-[#0f0f0f] border border-white/5 rounded-[32px] p-8 md:p-10 overflow-hidden hover:border-white/10 transition-colors duration-500"
          >
            {/* Subtle Hover Gradient */}
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/0 via-white/0 to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-2xl">
              <Tag className="w-8 h-8 text-white/80" />
            </div>
            
            <h3 className="text-3xl font-bebas text-white tracking-[2px] uppercase mb-4">Exclusive Offers</h3>
            <p className="text-white/50 font-body leading-relaxed mb-8 text-sm md:text-base">
              Unlock special deals, loyal customer discounts, and free add-ons that are never available on third-party apps. We reward our direct customers.
            </p>
            
            <ul className="space-y-4 font-body text-sm text-white/80">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--red)]/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-[var(--red)]" />
                </div>
                Direct customer coupons
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--red)]/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-[var(--red)]" />
                </div>
                Priority order preparation
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
