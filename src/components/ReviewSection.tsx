import type { Review } from '../types';

interface ReviewSectionProps {
  reviews: Review[];
}

function StarIcon({ filled, half }: { filled?: boolean; half?: boolean }) {
  if (half) {
    return (
      <svg className="w-4 h-4 text-[#d62b2b]" fill="currentColor" viewBox="0 0 20 20">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path fill="url(#half)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
      </svg>
    );
  }
  return (
    <svg className={`w-4 h-4 ${filled ? 'text-[#d62b2b]' : 'text-white/10'}`} fill={filled ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.196-1.539-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function StarRow({ count, size = 'sm' }: { count: number; size?: 'sm' | 'md' }) {
  return (
    <div className={`flex gap-1 ${size === 'md' ? 'scale-125 my-2' : ''}`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const isFull = i < Math.floor(count);
        const isHalf = !isFull && i < count && count % 1 >= 0.5;
        return <StarIcon key={i} filled={isFull} half={isHalf} />;
      })}
    </div>
  );
}

export default function ReviewSection({ reviews }: ReviewSectionProps) {
  return (
    <section className="py-24 border-t border-white/5 bg-[#080808]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-24 gap-12 px-8">
        <div className="text-center md:text-left max-w-2xl">
          <h2 className="font-bebas text-7xl md:text-9xl tracking-[4px] uppercase mb-4 leading-none">
            VOICES OF <span className="text-[var(--red)]">FLAVOR</span>
          </h2>
          <p className="text-white/40 font-body uppercase tracking-[4px] text-xs">The nocturne community has spoken. 5,000+ Five-star deliveries monthly.</p>
        </div>

        {/* Rating widget */}
        <div className="bg-[#111111] p-10 rounded-[32px] border border-white/5 flex flex-col items-center flex-shrink-0 shadow-2xl relative overflow-hidden group hover:border-[var(--red)]/30 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-[var(--red)]" />
          <span className="font-bebas text-7xl font-bold text-white mb-2">4.8</span>
          <StarRow count={4.8} size="md" />
          <div className="mt-8">
            <button
              id="review-google-btn"
              className="px-8 py-3 bg-[var(--red)] text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:shadow-[0_0_20px_rgba(214,43,43,0.4)] transition-all"
            >
              View on Google
            </button>
          </div>
        </div>
      </div>

      {/* Review cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-8">
        {reviews.map(review => (
          <div
            key={review.id}
            className="flex flex-col bg-[#111111] p-10 rounded-[32px] border border-white/5 hover:border-white/20 transition-all duration-500 relative group"
          >
            <div className="flex justify-between items-start mb-6">
              <StarRow count={review.rating} />
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/10 group-hover:text-[var(--red)]/40 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 13.1216 16 12.017 16H9.01701V14H12.017C14.2261 14 16.017 15.7909 16.017 18V21H14.017ZM8.01701 21V18C8.01701 15.7909 9.80787 14 12.017 14H15.017V12H12.017C9.80787 12 8.01701 10.2091 8.01701 8V5H10.017V8C10.017 9.10457 10.9124 10 12.017 10H15.017V12H21.017V21H8.01701Z" /></svg>
              </div>
            </div>
            <p className="text-white/70 text-lg leading-relaxed mb-10 font-body transition-colors group-hover:text-white">
              "{review.text}"
            </p>
            <div className="mt-auto flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/5 p-1 bg-black">
                <img
                  src={review.avatarUrl}
                  alt={review.author}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
              <div>
                <p className="font-bebas text-xl tracking-[1px] uppercase text-white">{review.author}</p>
                <p className="text-[10px] text-white/30 uppercase tracking-[2px] font-body mt-0.5">{review.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
