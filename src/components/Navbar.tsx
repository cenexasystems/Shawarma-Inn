import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface NavbarProps {
  onCartClick: () => void;
  onAuthClick: () => void;
  onSupportClick: () => void;
  cartCount: number;
  cartSubtotal?: number;
}

const navLinks = [
  { label: 'HOME', to: '/' },
  { label: 'MENU', to: '/menu' },
  { label: 'FRANCHISE', to: '/#franchise' },
  { label: 'BRANCHES', to: '/#branch' },
  { label: 'CHECKOUT', to: '/checkout' },
];

export default function Navbar({ onCartClick, onAuthClick, onSupportClick, cartCount, cartSubtotal = 0 }: NavbarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHome = location.pathname === '/';

  const navClass = isHome
    ? 'bg-transparent border-transparent backdrop-blur-0'
    : 'bg-[rgba(10,10,10,0.97)] border-[rgba(255,255,255,0.07)] backdrop-blur-[12px]';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownRef]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 h-[64px] border-b-[0.5px] flex justify-between items-center px-4 md:px-8 xl:px-12 transition-all ${navClass}`}>

        {/* Logo LEFT */}
        <Link to="/" className="flex items-center gap-2 z-50 shrink-0 min-w-0">
          <img
            src="/Shawarma-inn logo.jpeg"
            alt="Shawarma Inn"
            className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-full object-cover bg-white shadow-[0_2px_12px_rgba(0,0,0,0.22)]"
          />
          <span className="font-black uppercase logo-shimmer whitespace-nowrap">SHAWARMA INN</span>
          {/* "Mathur Branch" badge — hidden on smallest screens to prevent overflow */}
          <span className="hidden sm:inline text-[9px] font-bold tracking-[2px] uppercase text-[var(--red)] border border-[var(--red)]/40 rounded-full px-2 py-0.5 shrink-0">
            Mathur
          </span>
        </Link>

        {/* Links CENTER (Desktop only) */}
        <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(link => {
            const active = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`font-body font-semibold text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 mt-1 ${
                  active
                    ? 'text-[var(--red)] border-b-2 border-[var(--red)] pb-1'
                    : 'text-[var(--white)] hover:text-[var(--red)] pb-[6px]'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            onClick={onSupportClick}
            className="font-body font-semibold text-[11px] uppercase tracking-[0.14em] transition-colors duration-200 mt-1 text-[var(--white)] hover:text-[var(--red)] pb-[6px]"
          >
            SUPPORT
          </button>
        </div>

        {/* Actions RIGHT */}
        <div className="flex items-center gap-1 sm:gap-2 z-50">

          {/* Cart button — 44px touch target */}
          <button
            onClick={onCartClick}
            className="touch-target relative text-[var(--white)] hover:text-[var(--red)] transition-colors rounded-full"
            aria-label="Open cart"
          >
            <span className="relative">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[var(--red)] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            {/* Cart subtotal — desktop only */}
            {cartSubtotal > 0 && (
              <span className="hidden md:inline font-bebas text-sm tracking-wider ml-1">₹{cartSubtotal.toFixed(0)}</span>
            )}
          </button>

          {/* User / Auth button — 44px touch target */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="touch-target rounded-full"
                aria-label="Account menu"
              >
                <img
                  src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format'}
                  alt={user.name || 'User'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[var(--red)]"
                />
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-[#141414]/95 backdrop-blur-xl border border-[rgba(255,255,255,0.08)] rounded-[16px] py-2 shadow-2xl z-50 transform origin-top-right transition-all">
                  <div className="px-5 py-3 border-b border-[rgba(255,255,255,0.08)]">
                    <p className="text-[14px] font-semibold text-white tracking-wide truncate">{user.name || 'Account'}</p>
                    <p className="text-[12px] text-white/50 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="py-2">
                    {user.role === 'user' && (
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile & Orders
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full flex items-center gap-3 px-5 py-2.5 text-[13px] font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-[rgba(255,255,255,0.08)] py-1 mt-1">
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="w-full text-left flex items-center gap-3 px-5 py-2.5 text-[13px] font-semibold text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                    >
                      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onAuthClick}
              className="touch-target text-[10px] font-semibold tracking-[0.14em] text-[var(--white)] hover:text-[var(--red)] uppercase transition-colors rounded-full"
            >
              SIGN IN
            </button>
          )}

          {/* Hamburger — 44px touch target, lg+ hidden */}
          <button
            className="lg:hidden touch-target text-white rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* ─── Mobile Menu Full-Screen Overlay ─────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[rgba(10,10,10,0.98)] backdrop-blur-lg flex flex-col lg:hidden"
          style={{ paddingTop: '64px', paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          {/* Nav links — large touch targets */}
          <div className="flex flex-col flex-1 justify-center items-center gap-2 px-6">
            {navLinks.map(link => {
              const active = link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`w-full max-w-xs text-center font-bebas text-4xl tracking-widest uppercase py-3 transition-colors rounded-xl ${
                    active ? 'text-[var(--red)]' : 'text-white hover:text-[var(--red)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onSupportClick();
              }}
              className="w-full max-w-xs text-center font-bebas text-4xl tracking-widest uppercase py-3 text-white hover:text-[var(--red)] transition-colors rounded-xl"
            >
              SUPPORT
            </button>
          </div>

          {/* Bottom action — Order CTA */}
          <div className="px-6 pb-4">
            <Link
              to="/menu"
              className="block w-full text-center bg-[var(--red)] text-white font-bebas text-xl tracking-[3px] uppercase py-4 rounded-2xl shadow-[0_8px_30px_rgba(214,43,43,0.4)] active:scale-[0.98] transition-transform"
            >
              ORDER FROM MATHUR
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
