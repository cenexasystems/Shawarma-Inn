import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sound enabled by default. Browser policy will autoplay muted initially,
  // but user can unmute immediately via the toggle button.
  const [isMuted, setIsMuted] = useState(false);

  const ensurePlayback = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const tryPlay = () => {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch((error) => {
          // If browser blocks unmuted autoplay, fallback to muted so video still plays
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

    const onCanPlay = () => {
      tryPlay();
    };
    video.addEventListener('canplay', onCanPlay, { once: true });
  };

  // Auto-play fix for browsers and refresh restore cases
  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.load();
    ensurePlayback();

    const retryTimer = window.setInterval(() => {
      if (video.paused && document.visibilityState === 'visible') {
        ensurePlayback();
      }
    }, 1800);

    const handlePageShow = () => ensurePlayback();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        ensurePlayback();
      }
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
    <header className="relative w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 pt-[80px] overflow-hidden bg-black">

      {/* ─── LAYER 1: Background Video ─────────────────── */}
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
        src="/hero-bg.mp4.mp4"
      />

      {/* ─── LAYER 2: Gradient Overlay ─────────────────── */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            'linear-gradient(to right, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.75) 45%, rgba(0,0,0,0.35) 100%)',
        }}
      />

      {/* ─── LAYER 3: Left Column — Text & CTAs ─────────── */}
      <div className="relative z-20 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-xl">

          <div className="mb-4">
            <h2 className="font-bebas text-3xl tracking-[8px] uppercase leading-none opacity-90 hero-brand">
              SHAWARMA INN
            </h2>
          </div>

          {/* EST. 2018 Badge */}
          <div className="inline-flex items-center gap-2 bg-[rgba(214,43,43,0.15)] text-[var(--red)] border border-[var(--red)]/20 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[3px] mb-8 font-bebas backdrop-blur-md">
            EST. 2018 · MATHUR
          </div>

          {/* ── Main Headline ── */}
          <h1
            className="font-bebas mb-8 hero-brand"
            style={{
              lineHeight: '0.92',
              textShadow: '0 10px 40px rgba(0,0,0,0.95)',
            }}
          >
            <span
              className="text-[var(--white)] block"
              style={{ fontSize: '100px' }}
            >
              FLAME
            </span>
            <span
              className="text-[var(--white)] block"
              style={{ fontSize: '100px' }}
            >
              GRILLED
            </span>
            <span
              className="block"
              style={{
                fontSize: '110px',
              }}
            >
              PERFECTION.
            </span>
          </h1>

          {/* Subtext */}
          <p
            className="text-[var(--white)]/70 text-[18px] font-light mb-12 leading-[1.8] font-body max-w-md"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.95)' }}
          >
            Authentic Lebanese shawarma served fresh from our Mathur branch.
            Flame grilled, handcrafted and delivered hot across Mathur and nearby areas.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-5 items-center">
            <button
              id="hero-order-now-btn"
              onClick={() => navigate('/menu')}
              className="
                group relative
                bg-[var(--red)] text-[var(--white)]
                px-12 py-[20px] rounded-full
                font-bebas text-2xl tracking-[4px] uppercase
                transition-all duration-500
                hover:scale-[1.05]
                hover:shadow-[0_0_50px_rgba(214,43,43,0.7)]
                active:scale-[0.98]
                shadow-2xl
              "
            >
              ORDER NOW
            </button>

            <button
              id="hero-see-menu-btn"
              onClick={() => navigate('/menu')}
              className="
                relative
                border border-[var(--white)]/20 text-[var(--white)]
                px-10 py-[20px] rounded-full
                font-bebas text-2xl tracking-[4px] uppercase
                backdrop-blur-md
                transition-all duration-500
                hover:border-[var(--white)]/80
                hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]
                hover:bg-white/10
                active:scale-[0.98]
              "
            >
              SEE MENU
            </button>
          </div>
        </div>
      </div>

      {/* ─── LAYER 4: Right Column — Image Card ──────────── */}
      <div className="relative z-20 w-full h-[55vh] lg:h-full flex items-center justify-center px-6 lg:px-12 py-8">

        {/* Ambient red glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-[var(--red)]/20 blur-[100px]" />
        </div>

        {/* Main image card */}
        <div
          className="relative w-full max-w-sm aspect-square rounded-[40px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,1)] border border-white/5 group"
          style={{ transform: 'rotate(-4deg)' }}
        >
          <img
            src="/i_also_need_202603192209.png"
            alt="Signature Shawarma"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Rating badge pinned on top of image card */}
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

        {/* Mute toggle */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          className="absolute bottom-10 left-10 lg:bottom-12 lg:left-12 z-30 w-14 h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/10 transition-all shadow-2xl hover:scale-110 active:scale-95"
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M15.536 8.464a5 5 0 010 7.072M12 6a7 7 0 010 12M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )}
        </button>
      </div>

    </header>
  );
}
