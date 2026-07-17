import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, Quote } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { resolveTestimonialMediaUrl } from '../lib/testimonialMedia';

function TestimonialCard({ item }: { item: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasMediaError, setHasMediaError] = useState(false);
  const mediaUrl = resolveTestimonialMediaUrl(item.url);
  const posterUrl = resolveTestimonialMediaUrl(item.thumbnail_url);

  useEffect(() => {
    const video = videoRef.current;
    const card = cardRef.current;
    if (!video || !card || !mediaUrl) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        } else {
          video.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, [mediaUrl]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    video.pause();
    setIsPlaying(false);
  };

  return (
    <div
      ref={cardRef}
      className="relative shrink-0 w-[260px] md:w-[280px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-[#141414] snap-center"
    >
      {mediaUrl && !hasMediaError ? (
        <>
        <video
          ref={videoRef}
          src={mediaUrl}
          poster={posterUrl || undefined}
          loop
          muted
          playsInline
          preload="metadata"
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setHasMediaError(true)}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={() => { void togglePlayback(); }}
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75"
          aria-label={isPlaying ? `Pause ${item.title}` : `Play ${item.title}`}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
        </button>
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <div className="w-14 h-14 rounded-full bg-[#d62b2b]/15 border border-[#d62b2b]/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-[#d62b2b]" fill="currentColor" />
          </div>
          <Quote className="w-5 h-5 text-white/20" />
          <p className="text-sm text-white/70 leading-relaxed italic">"{item.quote || 'Customer testimonial will appear here once a video is published.'}"</p>
          <p className="text-[10px] uppercase tracking-[2px] text-white/30">{hasMediaError ? 'Video unavailable' : 'Video coming soon'}</p>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
        <p className="font-headline font-bold text-white text-sm uppercase tracking-[1px]">{item.title}</p>
      </div>
    </div>
  );
}

export default function VideoTestimonials() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('testimonial_videos')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setTestimonials(data || []);
      } catch (err) {
        console.error('Failed to fetch videos', err);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsPaused(!entry.isIntersecting),
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || isPaused) return;

    const timer = window.setInterval(() => {
      const atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4;
      if (atEnd) {
        scroller.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scroller.scrollBy({ left: 296, behavior: 'smooth' });
      }
    }, 3500);

    return () => window.clearInterval(timer);
  }, [isPaused]);

  return (
    <section ref={sectionRef} id="video-testimonials" className="py-20 bg-[#0e0e0e] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">From Our Customers</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bebas text-white tracking-[3px] uppercase">
            VIDEO <span className="text-[#d62b2b]">TESTIMONIALS</span>
          </h2>
        </motion.div>

        <div
          ref={scrollerRef}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none' }}
        >
          {testimonials.map((item) => (
            <TestimonialCard key={item.id} item={item} />
          ))}
          {testimonials.length === 0 && (
            <div className="text-white/40 text-sm py-10 w-full text-center">No active testimonial videos are published yet.</div>
          )}
        </div>
      </div>
    </section>
  );
}
