import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

// Use verified outlet links when configured; otherwise fall back to Chennai-wide searches.
const swiggyUrl = import.meta.env.VITE_SWIGGY_URL || 'https://www.swiggy.com/city/chennai/shawarma-inn';
const zomatoUrl = import.meta.env.VITE_ZOMATO_URL || 'https://www.zomato.com/chennai/restaurants/shawarma';

const deliveryApps = [
  {
    name: 'Swiggy',
    href: swiggyUrl,
    image: '/swiggy-logo-ref.png',
    accentClass: 'text-[#f97316]',
    glow: 'rgba(249, 115, 22, 0.35)',
    label: 'Fast Delivery Partner',
  },
  {
    name: 'Zomato',
    href: zomatoUrl,
    image: '/zomato-logo-ref.jpg',
    accentClass: 'text-[#ef4444]',
    glow: 'rgba(239, 68, 68, 0.35)',
    label: 'Customer Favorite',
  },
];

export default function DeliveryAppsSection() {
  return (
    <section className="py-24 bg-[#0b0b0b] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-8">
        <h2 className="font-bebas text-4xl md:text-5xl tracking-[2px] uppercase text-white mb-5 text-center md:text-left">
          Order On Delivery Apps
        </h2>
        <p className="text-white/70 font-body mb-8 text-center md:text-left max-w-2xl">
          Find Shawarma Inn Mathur on your favorite delivery platforms and enjoy the same authentic flavors you love, delivered right to your door.
        </p>

        {(!import.meta.env.VITE_SWIGGY_URL || !import.meta.env.VITE_ZOMATO_URL) ? (
          <p className="mb-6 text-[10px] uppercase tracking-[1.5px] text-white/30 text-center md:text-left">
            Showing Chennai-wide searches until verified Mathur outlet links are configured.
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {deliveryApps.map((app) => (
            <motion.a
              key={app.name}
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex min-h-[220px] items-center gap-6 bg-[#151515] border border-white/10 p-8 md:p-10 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:border-white/25"
              whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${app.glow}` }}
              transition={{ duration: 0.3 }}
            >
              <div className="h-36 w-56 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white shadow-xl">
                <img
                  src={app.image}
                  alt={app.name}
                  className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[11px] uppercase tracking-[2px] font-bold text-white/40 group-hover:text-white/60 transition-colors">{app.label}</span>
                <span className="mt-3 flex items-center gap-2 font-bebas text-3xl tracking-[1px] text-white">
                  {app.name}
                  <ExternalLink className={`h-5 w-5 ${app.accentClass}`} />
                </span>
                <span className="mt-4 block text-sm leading-relaxed text-white/60 max-w-xl">
                  Order directly on {app.name} to get access to Shawarma Inn Mathur with reliable, on-time delivery service.
                </span>
              </div>
            </motion.a>
          ))}
        </div>

        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 max-w-xs mx-auto md:mx-0">
          <p className="text-xs text-white/50 text-center">
            Search "Shawarma Inn Mathur" on both platforms for fastest delivery
          </p>
        </div>
      </div>
    </section>
  );
}
