import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import BranchMap from '../components/BranchMap';
import { franchiseApi, reviewApi, type HomepageReview } from '../lib/api';
import branchesData from '../data/branches.json';
import type { Branch } from '../types';

// Single source of truth for branch data — see src/data/branches.json
// (previously this page kept its own hardcoded copy, which had drifted
// out of sync with the canonical addresses, e.g. missing pincodes).
const branches: Branch[] = branchesData as Branch[];

const buildEmbedMapUrl = (address: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;


// No public Swiggy/Zomato listing specific to the Mathur outlet could be verified.
// Fall back to a Chennai-wide search rather than silently linking to another branch (e.g. Madhavaram).
// Set VITE_SWIGGY_URL / VITE_ZOMATO_URL to the verified Mathur outlet URL once available.
const swiggyUrl = import.meta.env.VITE_SWIGGY_URL || 'https://www.swiggy.com/city/chennai/shawarma-inn';
const zomatoUrl = import.meta.env.VITE_ZOMATO_URL || 'https://www.zomato.com/chennai/restaurants/shawarma';

export default function Home() {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState(branches[0]);
  const [franchiseName, setFranchiseName] = useState('');
  const [franchisePhone, setFranchisePhone] = useState('');
  const [franchiseCity, setFranchiseCity] = useState('');
  const [franchiseEmail, setFranchiseEmail] = useState('');
  const [franchiseSaving, setFranchiseSaving] = useState(false);
  const [franchiseError, setFranchiseError] = useState('');
  const [franchiseSuccess, setFranchiseSuccess] = useState('');

  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewAvatarUrl, setReviewAvatarUrl] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewStartIndex, setReviewStartIndex] = useState(0);
  const [lastReviewSubmitAt, setLastReviewSubmitAt] = useState<number | null>(null);

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
    if (reviews.length <= 3) {
      return;
    }

    const timer = window.setInterval(() => {
      setReviewStartIndex((prev) => (prev + 3) % reviews.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [reviews]);

  const visibleReviews = useMemo(() => {
    if (reviews.length <= 3) {
      return reviews;
    }

    const items: HomepageReview[] = [];
    for (let i = 0; i < 3; i += 1) {
      items.push(reviews[(reviewStartIndex + i) % reviews.length]);
    }
    return items;
  }, [reviews, reviewStartIndex]);

  const submitReview = async () => {
    setReviewError('');
    setReviewSuccess('');

    const name = reviewName.trim();
    const message = reviewMessage.replace(/\s+/g, ' ').trim();

    if (!name || !message) {
      setReviewError('Name and review message are required.');
      return;
    }

    if (message.length > 300) {
      setReviewError('Review message must be 300 characters or less.');
      return;
    }

    if (lastReviewSubmitAt && Date.now() - lastReviewSubmitAt < 30 * 1000) {
      setReviewError('Please wait a few seconds before submitting another review.');
      return;
    }

    try {
      setReviewSaving(true);
      await reviewApi.submit({
        name,
        review_text: message,
        rating: reviewRating,
        location: reviewLocation.trim() || undefined,
        avatar_url: reviewAvatarUrl.trim() || undefined,
      });

      setLastReviewSubmitAt(Date.now());
      setReviewName('');
      setReviewMessage('');
      setReviewLocation('');
      setReviewAvatarUrl('');
      setReviewRating(5);
      setReviewSuccess('Thanks! Your review has been submitted.');
      await fetchReviews();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not submit review. Please try again.');
    } finally {
      setReviewSaving(false);
    }
  };

  const renderStars = (value: number) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < value ? 'text-[#d62b2b]' : 'text-white/20'}>
          ★
        </span>
      ))}
    </div>
  );

  const submitFranchiseLead = async () => {
    setFranchiseError('');
    setFranchiseSuccess('');

    if (!franchiseName.trim() || !franchisePhone.trim() || !franchiseCity.trim() || !franchiseEmail.trim()) {
      setFranchiseError('Name, phone number, city, and email are required.');
      return;
    }

    try {
      setFranchiseSaving(true);
      await franchiseApi.submitLead({
        name: franchiseName.trim(),
        phone: franchisePhone.trim(),
        email: franchiseEmail.trim(),
        message: `City: ${franchiseCity.trim()}`,
      });

      setFranchiseName('');
      setFranchisePhone('');
      setFranchiseCity('');
      setFranchiseEmail('');
      setFranchiseSuccess('Thanks! Our franchise team will contact you soon.');
    } catch (err) {
      setFranchiseError(err instanceof Error ? err.message : 'Could not submit your details. Please try again.');
    } finally {
      setFranchiseSaving(false);
    }
  };

  return (
    <main>
      {/* ... previous content ... */}
      <section id="franchise" className="py-24 bg-[#0b0b0b] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-8">
          <div className="bg-[#151515] border border-white/10 rounded-3xl p-8">
            <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">Franchise Opportunity</p>
            <h2 className="mt-3 text-4xl md:text-5xl font-bebas tracking-[3px] uppercase leading-none">
              <span className="hero-brand">Shawarma Inn</span> Is Open For Franchise
            </h2>
            <p className="mt-4 text-white/70 font-body leading-relaxed">
              Expand with our proven kitchen model and growing customer base. Share your details and our team will reach out with investment, location, and onboarding steps.
            </p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <input
                  type="text"
                  value={franchiseName}
                  onChange={(event) => setFranchiseName(event.target.value)}
                  placeholder="Your Name"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
                />
                <input
                  type="tel"
                  value={franchisePhone}
                  onChange={(event) => setFranchisePhone(event.target.value)}
                  placeholder="Phone Number"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
                />
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  value={franchiseCity}
                  onChange={(event) => setFranchiseCity(event.target.value)}
                  placeholder="City"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
                />
                <input
                  type="email"
                  value={franchiseEmail}
                  onChange={(event) => setFranchiseEmail(event.target.value)}
                  placeholder="Email Address"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
                />
              </div>
            </div>

              {franchiseError && <p className="text-sm text-red-400">{franchiseError}</p>}
              {franchiseSuccess && <p className="text-sm text-emerald-400">{franchiseSuccess}</p>}

              <button
                type="button"
                onClick={() => {
                  void submitFranchiseLead();
                }}
                disabled={franchiseSaving}
                className="w-full mt-4 bg-[#d62b2b] text-white rounded-2xl py-4 font-headline font-bold uppercase tracking-[2px] hover:bg-[#bf2323] transition-colors disabled:opacity-50"
              >
                {franchiseSaving ? 'Submitting...' : 'Submit Franchise Details'}
              </button>
          </div>
        </div>
      </section>

      {/* ─── Bento Grid Menu Preview ─────────────────────────── */}
      <section className="py-16 px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-5 h-auto md:h-[680px]">
          {/* Main featured card */}
          <div className="md:col-span-2 md:row-span-2 bg-[#201f1f] rounded-xl overflow-hidden relative group">
            <video
              src="/Chicken_pieces_falling_202603202345.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              controls={false}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate nofullscreen"
              onContextMenu={(event) => event.preventDefault()}
              className="w-full h-full object-cover brightness-75"
            />
            <div className="absolute bottom-10 left-10">
              <span className="text-[#d62b2b] font-headline font-bold tracking-[2px] uppercase mb-2 block">BESTSELLER</span>
              <h3 className="text-5xl font-bebas text-white mb-4">THE NOCTURNE PLATTER</h3>
              <button
                onClick={() => navigate('/menu')}
                className="bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-full font-headline text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all"
              >
                VIEW ITEM
              </button>
            </div>
          </div>

          <div className="bg-[#201f1f] rounded-xl overflow-hidden relative group">
            <video
              src="/Gourmet_burger_on_202603210021.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              controls={false}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate nofullscreen"
              onContextMenu={(event) => event.preventDefault()}
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center">
              <h3 className="text-2xl font-bebas text-white tracking-widest">FLAMING WINGS</h3>
              <p className="text-[#d62b2b] font-bold">₹220</p>
            </div>
          </div>

          <div className="bg-[#d62b2b] rounded-xl flex flex-col justify-center items-center p-6 text-center hover:scale-[1.02] transition-transform duration-500">
            <svg className="w-14 h-14 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h3 className="text-xl font-bebas text-white tracking-widest mb-2">FULL MENU</h3>
            <p className="text-white/80 text-sm mb-5">Explore 50+ Lebanese delicacies</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-white text-[#d62b2b] px-6 py-2 rounded-full font-headline font-bold text-[10px] tracking-widest uppercase"
            >
              BROWSE
            </button>
          </div>

          <div className="md:col-span-2 bg-[#201f1f] rounded-xl overflow-hidden relative group">
            <video
              src="/Prepare_and_cut_202603202328.mp4"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              controls={false}
              disablePictureInPicture
              controlsList="nodownload noplaybackrate nofullscreen"
              onContextMenu={(event) => event.preventDefault()}
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 flex flex-col justify-center p-12">
              <h3 className="text-4xl font-bebas text-white mb-2">COLD MEZZE BOX</h3>
              <p className="text-white/60 max-w-xs mb-6 font-light">The perfect companion to our flame-grilled meats.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="reviews" className="py-16 bg-[#090909] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bebas text-white tracking-[3px] uppercase">
              WHAT OUR <span className="text-[#d62b2b]">CUSTOMERS SAY</span>
            </h2>
            <p className="mt-3 text-white/50 text-sm uppercase tracking-[2px]">Loved by Shawarma Fans</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.9fr] gap-6">
            <div className="bg-[#151515] border border-white/10 rounded-3xl p-6">
              <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-4">Submit Review</h3>

              <div className="space-y-3">
                <input
                  type="text"
                  value={reviewName}
                  onChange={(event) => setReviewName(event.target.value)}
                  placeholder="Customer Name"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
                />

                <input
                  type="text"
                  value={reviewLocation}
                  onChange={(event) => setReviewLocation(event.target.value)}
                  placeholder="Location (optional)"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
                />

                <input
                  type="url"
                  value={reviewAvatarUrl}
                  onChange={(event) => setReviewAvatarUrl(event.target.value)}
                  placeholder="Profile Image URL (optional)"
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b]"
                />

                <textarea
                  value={reviewMessage}
                  onChange={(event) => setReviewMessage(event.target.value)}
                  rows={4}
                  maxLength={300}
                  placeholder="Write your review..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-[#d62b2b] resize-none"
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
                            onClick={() => setReviewRating(value)}
                            className={`text-lg leading-none ${value <= reviewRating ? 'text-[#d62b2b]' : 'text-white/30'}`}
                            aria-label={`Set rating ${value}`}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <span className="text-xs text-white/40">{reviewMessage.trim().length}/300</span>
                </div>

                {reviewError && <p className="text-sm text-red-400">{reviewError}</p>}
                {reviewSuccess && <p className="text-sm text-emerald-400">{reviewSuccess}</p>}

                <button
                  type="button"
                  onClick={() => {
                    void submitReview();
                  }}
                  disabled={reviewSaving}
                  className="w-full mt-1 bg-[#d62b2b] text-white rounded-xl py-3 font-headline font-bold uppercase tracking-[2px] hover:bg-[#bf2323] transition-colors disabled:opacity-50"
                >
                  {reviewSaving ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </div>

            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visibleReviews.map((review) => (
                  <article
                    key={review.id}
                    className="bg-[#141414] border border-white/10 rounded-xl p-6 min-h-[240px] shadow-[0_20px_40px_rgba(0,0,0,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-headline font-bold text-white text-sm uppercase tracking-[1px]">{review.name}</h4>
                        <p className="text-[11px] text-white/45 mt-1">{review.location || 'Shawarma Inn Customer'}</p>
                      </div>
                      {review.avatar_url ? (
                        <img
                          src={review.avatar_url}
                          alt={review.name}
                          className="w-10 h-10 rounded-full object-cover border border-white/15"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/40 text-xs">
                          {review.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="mt-3">{renderStars(review.rating)}</div>
                    <p className="mt-3 text-sm text-white/80 leading-relaxed break-words">"{review.review_text}"</p>
                    <p className="mt-4 text-[11px] text-white/45">
                      {new Date(review.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </article>
                ))}
              </div>

              {reviews.length === 0 && (
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-6 text-center text-white/50 mt-4">
                  No reviews yet. Be the first to share your experience.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Order on Delivery Apps ──────────────────────────────── */}
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

      {/* ─── Branch Map Preview ──────────────────────────────── */}
      <section id="branch" className="py-12 md:py-16 bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bebas text-white mb-6 tracking-wider">
              OUR NOCTURNE <span className="text-[#d62b2b]">DOMAINS</span>
            </h2>
            <div className="space-y-2.5">
              {branches.map(branch => {
                const isActive = activeBranch.id === branch.id;
                return (
                  <div
                    key={branch.id}
                    onClick={() => setActiveBranch(branch)}
                    className={`flex gap-4 items-start p-4 rounded-2xl cursor-pointer transition-all duration-300 group ${isActive ? 'bg-white/5 border border-white/10 ring-1 ring-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]' : 'hover:bg-white/5 hover:translate-x-1 border border-transparent'}`}
                  >
                    <svg
                      className={`w-6 h-6 shrink-0 mt-0.5 transition-colors ${isActive ? 'text-[#d62b2b]' : 'text-white/20 group-hover:text-white/40'}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-headline font-bold tracking-[1.5px] uppercase transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
                          {branch.name}
                        </h4>
                        {branch.isFlagship && (
                          <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#d62b2b] bg-[#d62b2b]/10 border border-[#d62b2b]/30 rounded-full px-2 py-0.5">
                            Flagship
                          </span>
                        )}
                      </div>
                      <p className={`text-xs md:text-sm font-light mt-1 transition-colors ${isActive ? 'text-[#e5e2e1]/60' : 'text-[#e5e2e1]/20'}`}>
                        {branch.address}
                      </p>
                      {isActive && (
                        <a
                          href={branch.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold uppercase tracking-[2px] text-[#d62b2b] hover:text-white transition-colors"
                        >
                          Get Directions
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6v6M10 14L20 4" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/branches')}
              className="mt-8 border border-white/10 text-white px-7 py-3 rounded-full font-headline font-bold text-xs tracking-widest uppercase hover:bg-white/5 hover:border-white/30 transition-all"
            >
              VIEW ALL {branches.length} BRANCHES
            </button>
          </div>
          <div className="relative group lg:max-w-[560px] lg:ml-auto w-full">
            <div className="absolute -inset-4 bg-[#d62b2b]/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <BranchMap mapUrl={buildEmbedMapUrl(activeBranch.address)} className="relative z-10" />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

