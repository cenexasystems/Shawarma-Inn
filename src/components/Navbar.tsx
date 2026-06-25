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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <nav className={`fixed top-0 w-full z-50 h-[64px] border-b-[0.5px] flex justify-between items-center px-8 transition-all ${navClass}`}>
      {/* Logo LEFT: "SHAWARMA INN" with .logo-shimmer class */}
      <Link to="/" className="flex items-baseline gap-2">
        <span className="text-2xl font-black uppercase logo-shimmer">SHAWARMA INN</span>
        <span className="hidden sm:inline text-[10px] font-bold tracking-[2px] uppercase text-[var(--red)] border border-[var(--red)]/40 rounded-full px-2 py-0.5">
          Mathur Branch
        </span>
      </Link>

      {/* Links CENTER: HOME · MENU · BRANCHES · CHECKOUT — Sora 600, 11px, uppercase, letter-spacing 0.14em */}
      <div className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
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

      {/* Actions RIGHT: cart icon with badge, user avatar or sign-in button */}
      <div className="flex items-center gap-6 z-10">
        <button
          onClick={onCartClick}
          className="flex items-center gap-2 text-[var(--white)] hover:text-[var(--red)] transition-colors"
          aria-label="Open cart"
        >
          <span className="relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--red)] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {cartCount}
              </span>
            )}
          </span>
          {cartSubtotal > 0 && (
            <span className="font-bebas text-sm tracking-wider">₹{cartSubtotal.toFixed(0)}</span>
          )}
        </button>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full overflow-hidden border border-[var(--red)]"
            >
              <img src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format'} alt={user.name || 'User'} className="w-full h-full object-cover" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-[var(--charcoal)] border border-[var(--border)] rounded-xl py-2 shadow-2xl">
                <div className="px-4 py-2 border-b border-[var(--border)]">
                  <p className="text-sm font-semibold text-white truncate">{user.name || 'Account'}</p>
                  <p className="text-xs text-[var(--white)] opacity-60 truncate">{user.email}</p>
                </div>
                {user.role === 'user' && (
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--white)] hover:bg-[var(--smoke)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile &amp; Orders
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[var(--white)] hover:bg-[var(--smoke)] transition-colors"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button 
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-[var(--red)] hover:bg-[var(--smoke)] transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onAuthClick}
            className="text-[11px] font-semibold tracking-[0.14em] text-[var(--white)] hover:text-[var(--red)] uppercase transition-colors"
          >
            SIGN IN
          </button>
        )}
      </div>
    </nav>
  );
}
