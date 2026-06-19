import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { reviewApi, type HomepageReview } from '../lib/api';

const GOOGLE_RATING = 4.8;
const GOOGLE_REVIEW_COUNT = 312;
const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps/search/?api=1&query=Shawarma+Inn+Mathur+Chennai';

const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) {
    return '•'.repeat(digits.length || 6);
  }
  const start = digits.slice(0, 2);
  const end = digits.slice(-2);
  return `${start}${'•'.repeat(digits.length - 4)}${end}`;
};

const renderStars = (value: number) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={14}
        className={index < value ? 'fill-[#d62b2b] text-[#d62b2b]' : 'text-white/20'}
      />
    ))}
  </div>
);

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [startIndex, setStartIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [location, setLocation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [lastSubmitAt, setLastSubmitAt] = useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  const fetchReviews = async () => {
    try {
      const { reviews: items } = await reviewApi.list({ limit: 12 });
      setReviews(items);
    } catch {
      setReviews([]);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, []);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(window.innerWidth < 768 ? 1 : window.innerWidth < 1280 ? 2 : 3);
    };
    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const goNext = () => {
    if (reviews.length <= visibleCount) return;
    setStartIndex((prev) => (prev + 1) % reviews.length);
  };

  const goPrev = () => {
    if (reviews.length <= visibleCount) return;
    setStartIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  useEffect(() => {
    if (reviews.length <= visibleCount) return;
    const timer = window.setInterval(goNext, 6000);
    return () => window.clearInterval(timer);
  }, [reviews, visibleCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;

      if (event.key === 'ArrowRight') goNext();
      if (event.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [reviews, visibleCount]);

  const visibleReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    if (reviews.length <= visibleCount) return reviews;

    const items: HomepageReview[] = [];
    for (let i = 0; i < visibleCount; i += 1) {
      items.push(reviews[(startIndex + i) % reviews.length]);
    }
    return items;
  }, [reviews, startIndex, visibleCount]);

  const submitReview = async () => {
    setError('');
    setSuccess('');

    const trimmedName = name.trim();
    const trimmedMessage = message.replace(/\s+/g, ' ').trim();

    if (!trimmedName || !trimmedMessage) {
      setError('Name and review message are required.');
      return;
    }

    if (trimmedMessage.length > 300) {
      setError('Review message must be 300 characters or less.');
      return;
    }

    if (lastSubmitAt && Date.now() - lastSubmitAt < 30 * 1000) {
      setError('Please wait a few seconds before submitting another review.');
      return;
    }

    try {
      setSaving(true);
      await reviewApi.submit({
        name: trimmedName,
        review_text: trimmedMessage,
        rating,
        location: location.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      setLastSubmitAt(Date.now());
      setName('');
      setPhone('');
      setMessage('');
      setLocation('');
      setAvatarUrl('');
      setRating(5);
      setSuccess('Thanks! Your review has been submitted.');
      await fetchReviews();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit review. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="reviews" ref={sectionRef} className="py-16 bg-[#090909] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-8 flex flex-col items-center text-center gap-4">
          <h2 className="text-4xl md:text-5xl font-bebas text-white tracking-[3px] uppercase">
            WHAT OUR <span className="text-[#d62b2b]">CUSTOMERS SAY</span>
          </h2>
          <p className="text-white/50 text-sm uppercase tracking-[2px]">Loved by Shawarma Fans</p>

          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#141414] border border-white/10 rounded-full px-5 py-2.5 hover:border-[#d62b2b]/50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-white font-bold text-sm">{GOOGLE_RATING.toFixed(1)}</span>
            {renderStars(Math.round(GOOGLE_RATING))}
            <span className="text-white/40 text-xs">({GOOGLE_REVIEW_COUNT} Google Reviews)</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
          <div className="bg-[#151515] border border-white/10 rounded-3xl p-6">
            <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-4">Submit Review</h3>

            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Customer Name"
                className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
              />

              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone Number (optional)"
                className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
              />

              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Location (optional)"
                className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
              />

              <input
                type="url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="Profile Image URL (optional)"
                className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
              />

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                maxLength={300}
                placeholder="Write your review..."
                className="w-full appearance-none bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b] resize-none"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60 uppercase tracking-[1px]">Rating</span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className={`text-lg leading-none ${value <= rating ? 'text-[#d62b2b]' : 'text-white/30'}`}
                          aria-label={`Set rating ${value}`}
                        >
                          ★
                        </button>
                      );
                    })}
                  </div>
                </div>
                <span className="text-xs text-white/40">{message.trim().length}/300</span>
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-emerald-400">{success}</p>}

              <button
                type="button"
                onClick={() => {
                  void submitReview();
                }}
                disabled={saving}
                className="w-full mt-1 bg-[#d62b2b] text-white rounded-xl py-3 font-headline font-bold uppercase tracking-[2px] hover:bg-[#bf2323] transition-colors disabled:opacity-50"
              >
                {saving ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>

          <div
            className="relative"
            onTouchStart={(event) => {
              touchStartX.current = event.touches[0].clientX;
            }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return;
              const delta = event.changedTouches[0].clientX - touchStartX.current;
              if (delta > 50) goPrev();
              if (delta < -50) goNext();
              touchStartX.current = null;
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={startIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {visibleReviews.map((review) => (
                  <article
                    key={review.id}
                    className="aspect-square flex flex-col bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-headline font-bold text-white text-sm uppercase tracking-[1px]">{review.name}</h4>
                        <p className="text-[11px] text-white/45 mt-1">{review.location || 'Shawarma Inn Customer'}</p>
                        {review.phone && (
                          <p className="text-[11px] text-white/30 mt-0.5 tracking-wider">{maskPhone(review.phone)}</p>
                        )}
                      </div>
                      {review.avatar_url ? (
                        <img
                          src={review.avatar_url}
                          alt={review.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/15 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/40 text-xs shrink-0">
                          {review.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">{renderStars(review.rating)}</div>
                    <p className="mt-3 text-sm text-white/80 leading-relaxed break-words flex-1 overflow-hidden">
                      "{review.review_text}"
                    </p>
                    <p className="mt-4 text-[11px] text-white/45">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </article>
                ))}
              </motion.div>
            </AnimatePresence>

            {reviews.length === 0 && (
              <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 text-center text-white/50">
                No reviews yet. Be the first to share your experience.
              </div>
            )}

            {reviews.length > visibleCount && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Previous reviews"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#d62b2b] hover:border-[#d62b2b] transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Next reviews"
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-[#d62b2b] hover:border-[#d62b2b] transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
