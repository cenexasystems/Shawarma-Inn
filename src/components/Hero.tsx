import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(false);

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
        <div className="flex flex-col justify-center px-16 xl:px-24 py-12">
          <div className="max-w-xl">

            <div className="mb-4">
              <h2 className="font-bebas text-3xl tracking-[8px] uppercase leading-none opacity-90 hero-brand">
                SHAWARMA INN
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 bg-[rgba(214,43,43,0.15)] text-[var(--red)] border border-[var(--red)]/20 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[3px] mb-3 font-bebas backdrop-blur-md">
              EST. 2018 · MATHUR
            </div>

            <p className="text-white/40 text-[11px] font-bold tracking-[2px] uppercase mb-8 font-body">
              Official website of our Mathur branch only
            </p>

            <h1
              className="font-bebas mb-8 hero-brand"
              style={{ lineHeight: '0.92', textShadow: '0 10px 40px rgba(0,0,0,0.95)' }}
            >
              <span className="text-[var(--white)] block text-[70px] md:text-[100px]">FLAME</span>
              <span className="text-[var(--white)] block text-[70px] md:text-[100px]">GRILLED</span>
              <span className="block text-[80px] md:text-[110px]">PERFECTION.</span>
            </h1>

            <p
              className="text-[var(--white)]/70 text-[18px] font-light mb-12 leading-[1.8] font-body max-w-md"
              style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
            >
              Authentic Lebanese shawarma served fresh from our Mathur branch.
              Flame grilled, handcrafted and delivered hot across Mathur and nearby areas.
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
        <div className="relative z-20 w-full h-full flex items-center justify-center px-12 py-8 pb-16">
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

          {/* Mute toggle — desktop */}
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="absolute bottom-12 left-12 z-30 w-14 h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-2xl hover:scale-110 active:scale-95"
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
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
          paddingBottom: 'max(2.5rem, calc(2.5rem + env(safe-area-inset-bottom, 0px)))',
        }}
      >
        {/* Brand label */}
        <div className="mb-3">
          <span className="inline-flex items-center gap-2 bg-[rgba(214,43,43,0.18)] text-[var(--red)] border border-[var(--red)]/25 px-3 py-1 rounded-full font-bebas text-xs tracking-[3px] backdrop-blur-md">
            EST. 2018 · MATHUR BRANCH
          </span>
        </div>

        {/* Main headline — mobile-specific sizes */}
        <h1
          className="font-bebas hero-brand mb-4"
          style={{
            lineHeight: '0.9',
            textShadow: '0 4px 20px rgba(0,0,0,0.9)',
            fontSize: 'clamp(48px, 15vw, 80px)',
          }}
        >
          <span className="block text-white" style={{ fontSize: 'clamp(22px, 5.5vw, 32px)', letterSpacing: '0.25em' }}>
            SHAWARMA INN
          </span>
          FLAME
          <br />
          GRILLED
          <br />
          <span style={{ fontSize: 'clamp(52px, 16vw, 88px)' }}>PERFECTION.</span>
        </h1>

        {/* Sub-description — short, readable, 2 lines max */}
        <p
          className="text-white/65 font-body font-light mb-8 leading-relaxed"
          style={{
            fontSize: 'clamp(13px, 3.5vw, 16px)',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            maxWidth: '320px',
          }}
        >
          Authentic Lebanese shawarma. Flame grilled.
          Order directly — no middleman, lower prices.
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

        {/* Rating pill — bottom left of CTAs */}
        <div className="flex items-center gap-2 mt-5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-white/60 font-body text-xs tracking-wider">4.9 · Top Rated in Mathur</span>
        </div>

        {/* Mute toggle — mobile, bottom right, above WhatsApp FAB */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="absolute bottom-safe-4 right-20 z-30 w-11 h-11 rounded-full border border-white/15 bg-black/50 backdrop-blur-xl flex items-center justify-center text-white/70 transition-all active:scale-90"
          style={{ bottom: 'max(1rem, calc(1rem + env(safe-area-inset-bottom, 0px)))' }}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

    </header>
  );
}
