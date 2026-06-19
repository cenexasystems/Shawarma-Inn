import Footer from '../components/Footer';
import TrendingProducts from '../components/TrendingProducts';
import FranchiseSection from '../components/FranchiseSection';
import AiVideosSection from '../components/AiVideosSection';
import ReviewsCarousel from '../components/ReviewsCarousel';
import VideoTestimonials from '../components/VideoTestimonials';
import MapsSection from '../components/MapsSection';

// No public Swiggy/Zomato listing specific to the Mathur outlet could be verified.
// Fall back to a Chennai-wide search rather than silently linking to another branch (e.g. Madhavaram).
// Set VITE_SWIGGY_URL / VITE_ZOMATO_URL to the verified Mathur outlet URL once available.
const swiggyUrl = import.meta.env.VITE_SWIGGY_URL || 'https://www.swiggy.com/city/chennai/shawarma-inn';
const zomatoUrl = import.meta.env.VITE_ZOMATO_URL || 'https://www.zomato.com/chennai/restaurants/shawarma';

export default function Home() {
  return (
    <main>
      <TrendingProducts />
      <FranchiseSection />
      <AiVideosSection />
      <ReviewsCarousel />
      <VideoTestimonials />
      <MapsSection />

      {/* ─── CTA Banner: Order on Delivery Apps ──────────────────────────────── */}
      <section id="order-online" className="py-32 bg-[#0e0e0e] overflow-hidden border-t border-white/5">
        <div className="px-8 mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl font-headline font-black tracking-[4px] text-white uppercase mb-4">
            ORDER ON DELIVERY APPS
          </h2>
          <div className="h-1 w-24 bg-[#d62b2b]" />
        </div>
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href={swiggyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#f97316] hover:shadow-[0_20px_60px_rgba(249,115,22,0.28)]"
          >
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-[#f97316]/20 blur-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
            <div className="absolute top-4 right-4 bg-[#f97316] text-black text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              Pop Out Offer
            </div>
            <p className="text-[11px] uppercase tracking-[3px] text-white/40">Fast Delivery Partner • Mathur Branch</p>
            <div className="mt-3 h-[118px] w-[170px] rounded-[14px] border border-white/10 overflow-hidden shadow-lg">
              <img
                src="/swiggy-logo-ref.png"
                alt="Swiggy"
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="text-white/70 font-body mt-4 leading-relaxed">
              Very fresh Shawarma Inn Mathur store, grilled hot every batch, wrapped clean, and delivered fast to your door.
            </p>
            <span className="inline-flex items-center gap-2 mt-6 text-[11px] uppercase tracking-[3px] text-white/90 bg-[#f97316]/20 px-4 py-2 rounded-full border border-[#f97316]/30 group-hover:translate-x-2 group-hover:scale-105 transition-transform duration-300">
              Open Shawarma Inn Mathur on Swiggy
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4" />
              </svg>
            </span>
          </a>

          <a
            href={zomatoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#ef4444] hover:shadow-[0_20px_60px_rgba(239,68,68,0.28)]"
          >
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-[#ef4444]/20 blur-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
            <div className="absolute top-4 right-4 bg-[#ef4444] text-white text-[10px] font-bold uppercase tracking-[2px] px-3 py-1 rounded-full shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              Pop Out Offer
            </div>
            <p className="text-[11px] uppercase tracking-[3px] text-white/40">Customer Favorite • Mathur Branch</p>
            <div className="mt-3 h-[118px] w-[190px] rounded-[14px] border border-white/10 overflow-hidden shadow-lg">
              <img
                src="/zomato-logo-ref.jpg"
                alt="Zomato"
                className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="text-white/70 font-body mt-4 leading-relaxed">
              Freshly sliced shawarma, juicy wraps, and signature sauces from the Shawarma Inn Mathur kitchen.
            </p>
            <span className="inline-flex items-center gap-2 mt-6 text-[11px] uppercase tracking-[3px] text-white/90 bg-[#ef4444]/20 px-4 py-2 rounded-full border border-[#ef4444]/30 group-hover:translate-x-2 group-hover:scale-105 transition-transform duration-300">
              Open Shawarma Inn Mathur on Zomato
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4" />
              </svg>
            </span>
          </a>
        </div>
        {!import.meta.env.VITE_SWIGGY_URL || !import.meta.env.VITE_ZOMATO_URL ? (
          <p className="text-center text-white/30 text-[11px] uppercase tracking-[2px] mt-8 px-8">
            Showing a Chennai-wide search until the exact Mathur outlet listing is configured. Set VITE_SWIGGY_URL / VITE_ZOMATO_URL to the verified Mathur branch page.
          </p>
        ) : null}
      </section>

      <Footer />
    </main>
  );
}
