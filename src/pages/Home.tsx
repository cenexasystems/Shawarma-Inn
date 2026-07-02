import Footer from '../components/Footer';
import TrendingProducts from '../components/TrendingProducts';
import WhyOrderDirect from '../components/home/WhyOrderDirect';
import SmartDeliveryModel from '../components/home/SmartDeliveryModel';
import FranchiseSection from '../components/FranchiseSection';
import TrustSection from '../components/home/TrustSection';
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
      <TrustSection />
      <TrendingProducts />
      <WhyOrderDirect />
      <SmartDeliveryModel />
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

      {/* ─── WhatsApp CTA ──────────────────────────────── */}
      <section className="py-24 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#25D366]/5 to-transparent" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="w-20 h-20 mx-auto bg-[#25D366]/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(37,211,102,0.2)]">
            <svg className="w-10 h-10 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-bebas tracking-[4px] text-white uppercase mb-4">
            Prefer <span className="text-[#25D366]">WhatsApp?</span>
          </h2>
          <p className="text-white/60 font-body text-lg mb-8 max-w-xl mx-auto">
            Order directly by messaging us on WhatsApp. Quick, easy, and personal.
          </p>
          <a
            href={`https://wa.me/${import.meta.env.VITE_OWNER_WHATSAPP || '918778024010'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#25D366] text-black font-bebas text-2xl tracking-[2px] uppercase px-12 py-5 rounded-full hover:scale-105 hover:shadow-[0_0_40px_rgba(37,211,102,0.4)] transition-all duration-300"
          >
            Order on WhatsApp
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
