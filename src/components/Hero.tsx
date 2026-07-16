import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreSettings } from '../context/SettingsContext';

const RIBBON_ITEMS = [
  { icon: '🔥', text: 'FLAME GRILLED' },
  { icon: '🫓', text: 'SIGNATURE WRAPS' },
  { icon: '🌿', text: 'FRESH INGREDIENTS' },
  { icon: '📍', text: 'MATHUR BRANCH' },
  { icon: '⚡', text: 'FAST DELIVERY' },
  { icon: '💚', text: 'ORDER ON WHATSAPP' },
  { icon: '💰', text: 'SAVE vs SWIGGY' },
  { icon: '⭐', text: '4.9 RATED' },
  { icon: '🇱🇧', text: 'AUTHENTIC LEBANESE' },
];

// Reserved height of the global sticky checkout bar (App.tsx) — keeps the
// ribbon from sitting underneath it when the cart bar is visible on load.
const CART_BAR_RESERVE = 'calc(5.5rem + env(safe-area-inset-bottom, 0px))';

interface HeroProps {
  cartCount?: number;
}

export default function Hero({ cartCount = 0 }: HeroProps) {
  const { settings } = useStoreSettings();
  const whatsappPhone = settings.whatsapp_number || import.meta.env.VITE_OWNER_WHATSAPP || '916382877479';
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const hasCartItems = cartCount > 0;

  const ensurePlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          if (error.name === 'NotAllowedError') {
            setIsMuted(true);
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      }
    };

    if (video.readyState >= 2) {
      tryPlay();
      return;
    }
    video.addEventListener('canplay', tryPlay, { once: true });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.load();
    ensurePlayback();

    const retryTimer = window.setInterval(() => {
      if (video.paused && document.visibilityState === 'visible') ensurePlayback();
    }, 1800);

    const handlePageShow = () => ensurePlayback();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') ensurePlayback();
    };

    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.clearInterval(retryTimer);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <header className="relative w-full overflow-hidden bg-black" style={{ minHeight: '100svh' }}>

      {/* ─── VIDEO BACKGROUND (shared desktop + mobile) ─────────── */}
      <video
        ref={videoRef}
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="auto"
        poster="/i_also_need_202603192209.png"
        onLoadedData={ensurePlayback}
        onCanPlay={ensurePlayback}
        className="absolute inset-0 w-full h-full object-cover z-0"
        // Mobile: focus on top-center to preserve food focal point
        style={{ objectPosition: 'center 20%' }}
        src="/hero-bg.mp4.mp4"
      />

      {/* ─── DESKTOP GRADIENT (left-to-right) ─── lg+ only ──────── */}
      <div
        className="absolute inset-0 z-10 hidden lg:block"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* ─── MOBILE GRADIENT (bottom-to-top) ─── < lg only ──────── */}
      <div className="absolute inset-0 z-10 hero-mobile-gradient lg:hidden" />
      {/* Extra top darkening on mobile for logo/nav readability */}
      <div
        className="absolute top-0 left-0 right-0 h-32 z-10 lg:hidden"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
      />

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  DESKTOP LAYOUT  (lg and above)                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 hidden lg:grid lg:grid-cols-2 w-full h-full min-h-screen pt-[80px]">

        {/* Left Column — Text & CTAs */}
        <div className="flex flex-col justify-center px-16 xl:px-24 py-12 pb-[140px]">
          <div className="max-w-xl">

            {/* ── Brand block: name + Mathur Branch below ── */}
            <div className="mb-5">
              <h2 className="font-bebas text-3xl tracking-[8px] uppercase leading-none hero-brand">
                SHAWARMA INN
              </h2>
              <p className="font-body text-[10px] tracking-[4px] uppercase text-[var(--red)]/80 mt-1.5 font-semibold">
                Mathur Branch
              </p>
            </div>

            <div className="inline-flex items-center gap-2 bg-[rgba(214,43,43,0.15)] text-[var(--red)] border border-[var(--red)]/20 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[3px] mb-8 font-bebas backdrop-blur-md">
              EST. 2018 · NOW LIVE FOR DIRECT ORDERS
            </div>

            {/* ── Main Headline ── */}
            <h1
              className="font-bebas mb-6 text-white"
              style={{ lineHeight: '1.05', textShadow: '0 10px 40px rgba(0,0,0,0.95)' }}
            >
              <span className="block text-[50px] md:text-[72px] text-[var(--white)]" style={{ lineHeight: 1 }}>Now Live for</span>
              <span className="block text-[50px] md:text-[72px] hero-brand" style={{ lineHeight: 1 }}>Direct Orders</span>
              <span className="block text-[40px] md:text-[56px] text-[var(--white)]/80 font-body font-light mt-2" style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(20px,2.4vw,30px)', letterSpacing: '0.02em', lineHeight: 1.4 }}>in Mathur 🔴</span>
            </h1>

            <p
              className="text-[var(--white)]/70 text-[17px] font-light mb-10 leading-[1.7] font-body max-w-md"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
            >
              Order directly &amp; save more than ordering via Swiggy / Zomato.
              Flame grilled, handcrafted and delivered hot across Mathur.
            </p>

            <div className="flex flex-row flex-wrap gap-5 items-start">
              <button
                id="hero-order-now-btn"
                onClick={() => navigate('/menu')}
                className="group relative bg-[var(--red)] text-[var(--white)] px-12 py-[20px] rounded-full font-bebas text-2xl tracking-[4px] uppercase transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(214,43,43,0.7)] active:scale-[0.98] shadow-2xl"
              >
                ORDER FROM MATHUR
              </button>
              <button
                id="hero-see-menu-btn"
                onClick={() => navigate('/menu')}
                className="relative border border-[var(--white)]/20 text-[var(--white)] px-10 py-[20px] rounded-full font-bebas text-2xl tracking-[4px] uppercase backdrop-blur-md transition-all duration-500 hover:border-[var(--white)]/80 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:bg-white/10 active:scale-[0.98]"
              >
                VIEW MENU
              </button>
            </div>
          </div>
        </div>

        {/* Right Column — Image Card */}
        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center gap-6 px-12 py-8 pb-16">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full bg-[var(--red)]/20 blur-[100px]" />
          </div>
          <div
            className="relative w-full max-w-sm aspect-square rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/5 group animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000 fill-mode-both delay-300"
            style={{ transform: 'rotate(-4deg)' }}
          >
            <img
              src="/i_also_need_202603192209.png"
              alt="Signature Shawarma"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* Rating badge */}
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-2xl border border-white/10 rounded-[16px] px-4 py-3 flex flex-col items-center shadow-2xl">
              <p className="font-bebas text-3xl text-amber-400 leading-none tracking-[2px]">4.9</p>
              <div className="flex gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="font-body text-[8px] text-white/40 mt-2 tracking-[3px] uppercase">Top Rated</p>
            </div>

            {/* WhatsApp Order tag — top right of card */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
              <a
                href={`https://wa.me/${whatsappPhone}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 bg-[#25D366] text-white text-[10px] font-bold font-body tracking-[1.5px] px-3 py-2 rounded-full shadow-[0_4px_20px_rgba(37,211,102,0.5)] hover:scale-105 transition-transform"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                ORDER ON WHATSAPP
              </a>
            </div>

            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
              <div>
                <p className="font-bebas text-2xl text-[var(--white)] tracking-[3px]">SIGNATURE WRAP</p>
                <p className="font-body text-[10px] text-[var(--white)]/50 tracking-[3px] uppercase">Mathur Branch</p>
              </div>
              <span className="bg-[var(--red)] text-white text-[10px] font-bold font-body tracking-[2px] px-4 py-2 rounded-full shadow-lg">
                HOT
              </span>
            </div>
          </div>

          {/* Sound control — beside the hero media, in normal flow (never overlaps the card or floats loose) */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Turn sound on' : 'Turn sound off'}
            aria-label={isMuted ? 'Sound off. Click to turn sound on.' : 'Sound on. Click to turn sound off.'}
            aria-pressed={!isMuted}
            className="relative z-20 w-12 h-12 rounded-full border border-white/15 bg-white/5 backdrop-blur-2xl flex items-center justify-center text-white hover:bg-white/15 hover:border-white/30 transition-all shadow-xl hover:scale-110 active:scale-95"
          >
            <span className="relative w-5 h-5 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`sound-toggle-icon absolute w-5 h-5 ${isMuted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" className={`sound-toggle-icon absolute w-5 h-5 ${isMuted ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* ─── ANNOUNCEMENT RIBBON — bottom of hero section ─── */}
      <div 
        className="absolute left-0 right-0 z-[45] pointer-events-none"
        style={{ 
          bottom: hasCartItems ? CART_BAR_RESERVE : '0px', 
          transition: 'bottom 0.3s ease' 
        }}
      >
        <div className="marquee-wrap border-t border-white/10 bg-black/75 backdrop-blur-xl py-3.5 lg:py-4 pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="marquee-track flex whitespace-nowrap">
            {[...Array(2)].map((_, loopIdx) => (
              <div key={loopIdx} className="flex shrink-0 items-center" aria-hidden={loopIdx === 1}>
                {RIBBON_ITEMS.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-2 lg:gap-3 mx-4 lg:mx-6">
                    <span className="text-[13px] lg:text-base">{item.icon}</span>
                    <span className="font-bebas text-[12px] lg:text-sm tracking-[3px] lg:tracking-[4px] text-white/70 uppercase">{item.text}</span>
                    <span className="w-1 h-1 rounded-full bg-[var(--red)]/60 ml-2 lg:ml-3" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/*  MOBILE LAYOUT  (below lg — full dedicated design)         */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div
        className="relative z-20 lg:hidden flex flex-col justify-end w-full px-5 pb-10"
        style={{
          minHeight: '100svh',
          paddingTop: '80px',
          paddingBottom: hasCartItems
            ? CART_BAR_RESERVE
            : 'max(2.5rem, calc(2.5rem + env(safe-area-inset-bottom, 0px)))',
          transition: 'padding-bottom 0.3s ease',
        }}
      >
        {/* Brand + Mathur Branch stacked */}
        <div className="mb-3">
          <h2
            className="font-bebas hero-brand"
            style={{ fontSize: 'clamp(20px, 5.5vw, 30px)', letterSpacing: '0.2em', lineHeight: 1 }}
          >
            SHAWARMA INN
          </h2>
          <p className="font-body text-[9px] tracking-[3px] uppercase text-[var(--red)]/80 mt-1 font-semibold">
            Mathur Branch
          </p>
        </div>

        {/* Badge */}
        <span className="inline-flex items-center gap-2 bg-[rgba(214,43,43,0.18)] text-[var(--red)] border border-[var(--red)]/25 px-3 py-1 rounded-full font-bebas text-[10px] tracking-[2px] backdrop-blur-md mb-4 block w-fit">
          EST. 2018 · NOW LIVE FOR DIRECT ORDERS
        </span>

        {/* Main headline — mobile-specific */}
        <h1
          className="font-bebas text-white mb-2"
          style={{
            lineHeight: '1.05',
            textShadow: '0 4px 20px rgba(0,0,0,0.9)',
          }}
        >
          <span className="block" style={{ fontSize: 'clamp(36px, 11vw, 60px)' }}>Now Live for</span>
          <span className="block hero-brand" style={{ fontSize: 'clamp(36px, 11vw, 60px)' }}>Direct Orders</span>
          <span
            className="block text-white/75 font-body font-light mt-1"
            style={{ fontSize: 'clamp(15px, 4vw, 20px)', fontFamily: 'var(--font-body)', letterSpacing: '0.01em' }}
          >
            in Mathur 🔴
          </span>
        </h1>

        {/* Sub-description */}
        <p
          className="text-white/65 font-body font-light mb-6 leading-relaxed"
          style={{
            fontSize: 'clamp(13px, 3.5vw, 16px)',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            maxWidth: '300px',
          }}
        >
          Order directly &amp; save more than ordering via Swiggy / Zomato.
        </p>

        {/* CTAs — mobile: stacked, full-width, large touch targets */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Primary CTA */}
          <button
            id="hero-order-now-btn-mobile"
            onClick={() => navigate('/menu')}
            className="w-full bg-[var(--red)] text-white font-bebas tracking-[3px] uppercase rounded-2xl active:scale-[0.98] transition-transform shadow-[0_8px_30px_rgba(214,43,43,0.5)]"
            style={{ fontSize: 'clamp(18px, 5vw, 22px)', minHeight: '58px' }}
          >
            ORDER FROM MATHUR
          </button>

          {/* Secondary CTA */}
          <button
            id="hero-view-menu-btn-mobile"
            onClick={() => navigate('/menu')}
            className="w-full border border-white/25 text-white font-bebas tracking-[3px] uppercase rounded-2xl backdrop-blur-md hover:bg-white/10 active:scale-[0.98] transition-all"
            style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', minHeight: '52px' }}
          >
            VIEW MENU
          </button>
        </div>

        {/* Rating pill + sound control — inline, in-flow so it never overlaps the FAB/checkout bar */}
        <div className="flex items-center justify-between gap-3 mt-5">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-white/60 font-body text-xs tracking-wider">4.9 · Top Rated in Mathur</span>
          </div>

          {/* Sound control — mobile, integrated in-flow beside the rating row */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Turn sound on' : 'Turn sound off'}
            aria-label={isMuted ? 'Sound off. Click to turn sound on.' : 'Sound on. Click to turn sound off.'}
            aria-pressed={!isMuted}
            className="shrink-0 w-10 h-10 rounded-full border border-white/15 bg-white/5 backdrop-blur-xl flex items-center justify-center text-white/80 transition-all active:scale-90"
          >
            <span className="relative w-4 h-4 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`sound-toggle-icon absolute w-4 h-4 ${isMuted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" className={`sound-toggle-icon absolute w-4 h-4 ${isMuted ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </span>
          </button>
        </div>

        {/* Mobile announcement ribbon is now merged with the global sticky footer above */}
      </div>

    </header>
  );
}
