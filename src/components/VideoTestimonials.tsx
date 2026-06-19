import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Quote } from 'lucide-react';
import testimonialsData from '../data/testimonials.json';
import type { VideoTestimonial } from '../types';

const testimonials = testimonialsData as VideoTestimonial[];

function TestimonialCard({ item }: { item: VideoTestimonial }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const card = cardRef.current;
    if (!video || !card) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative shrink-0 w-[260px] md:w-[280px] aspect-[9/16] rounded-2xl overflow-hidden border border-white/10 bg-[#141414] snap-center"
    >
      {item.videoUrl ? (
        <video
          ref={videoRef}
          src={item.videoUrl}
          poster={item.posterUrl || undefined}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <div className="w-14 h-14 rounded-full bg-[#d62b2b]/15 border border-[#d62b2b]/30 flex items-center justify-center">
            <Play className="w-6 h-6 text-[#d62b2b]" fill="currentColor" />
          </div>
          <Quote className="w-5 h-5 text-white/20" />
          <p className="text-sm text-white/70 leading-relaxed italic">"{item.quote}"</p>
          <p className="text-[10px] uppercase tracking-[2px] text-white/30">Video coming soon</p>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
        <p className="font-headline font-bold text-white text-sm uppercase tracking-[1px]">{item.customerName}</p>
        <p className="text-[10px] text-[#d62b2b] uppercase tracking-[1.5px] mt-0.5">{item.branchName}</p>
      </div>
    </div>
  );
}

export default function VideoTestimonials() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

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
            <TestimonialCard key={item.branchId} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
