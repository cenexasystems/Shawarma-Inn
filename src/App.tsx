import { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import SupportModal from './components/SupportModal';
import WhatsAppFab from './components/WhatsAppFab';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Checkout from './pages/Checkout';
import Branches from './pages/Branches';
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { runAutomaticMigration, initializeWithHealthCheck } from './lib/supabaseMigration';

const Profile = lazy(() => import('./pages/Profile'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PosBilling = lazy(() => import('./pages/PosBilling'));
const Analytics = lazy(() => import('./pages/Analytics'));

export default function App() {
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isHome = location.pathname === '/';
  const isCheckoutPage = location.pathname === '/checkout';
  const isAdminArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/pos');

  useEffect(() => {
    // Show the Shawarma Roll for 1.8 seconds on initial load
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Initialize automatic migration on app load (silent, non-blocking)
  useEffect(() => {
    // Run migration in background without blocking UI
    void (async () => {
      try {
        // Check Supabase health before operating
        await initializeWithHealthCheck();
        // Run migration silently (only logs errors)
        const result = await runAutomaticMigration();
        if (result.summary.errors.length > 0) {
          console.info('Migration completed with warnings:', result.summary.errors);
        }
      } catch (error) {
        console.info('Migration initialization skipped:', error);
      }
    })();
  }, []);

  // Use the custom hook
  const cartData = useCart();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (
      user?.role === 'user' &&
      !user.is_profile_complete &&
      location.pathname !== '/profile-setup'
    ) {
      navigate('/profile-setup', { replace: true });
    }
  }, [authLoading, user, location.pathname, navigate]);

  useEffect(() => {
    if (location.hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const id = location.hash.replace('#', '');
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.pathname]);

  if (loading || authLoading) return <Loader />;

  return (
    <div className="min-h-screen bg-[var(--black)] text-[var(--white)] font-body selection:bg-[var(--red)] selection:text-white">

      {!isAdminArea && (
        <Navbar
          onCartClick={() => setCartOpen(true)}
          onAuthClick={() => setAuthOpen(true)}
          onSupportClick={() => setSupportOpen(true)}
          cartCount={cartData.count}
          cartSubtotal={cartData.subtotal}
        />
      )}

      {/* Hero only on home route */}
      {!isAdminArea && isHome && <Hero />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu cartData={cartData} />} />
        <Route path="/checkout" element={<Checkout cartData={cartData} />} />
        <Route path="/branches" element={<Branches />} />
        <Route
          path="/profile"
          element={
            user?.role === 'user' ? (
              <Suspense fallback={<Loader />}>
                <Profile />
              </Suspense>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile-setup"
          element={
            user?.role === 'user' ? (
              <Suspense fallback={<Loader />}>
                <ProfileSetup />
              </Suspense>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/login"
          element={
            user?.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Suspense fallback={<Loader />}>
                <AdminLogin />
              </Suspense>
            )
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<Loader />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route
          path="/pos"
          element={
            user?.role === 'admin' ? (
              <Suspense fallback={<Loader />}>
                <PosBilling />
              </Suspense>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            user?.role === 'admin' ? (
              <Suspense fallback={<Loader />}>
                <Analytics />
              </Suspense>
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        />
      </Routes>

      {/* Floating Checkout Button (Bottom) */}
      {!isAdminArea && !isCheckoutPage && cartData.count > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[50] w-full max-w-[280px] px-4 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-[var(--red)] text-white font-bebas text-xl py-4 rounded-full flex items-center justify-between px-8 tracking-[2px] shadow-[0_20px_40px_rgba(214,43,43,0.4)] hover:scale-105 active:scale-95 transition-all border border-white/10"
          >
            <span>CHECKOUT</span>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <div className="text-white/45 text-[10px]">{cartData.count} ITEMS</div>
                <div className="text-white text-[12px] tracking-[1px]">₹{cartData.subtotal.toFixed(0)}</div>
              </div>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </button>
        </div>
      )}

      {/* Global overlays */}
      {!isAdminArea && (
        <>
          <CartDrawer
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            cartData={cartData}
          />
          <AuthModal
            isOpen={authOpen}
            onClose={() => setAuthOpen(false)}
          />
          <SupportModal
            isOpen={supportOpen}
            onClose={() => setSupportOpen(false)}
          />
          {!isCheckoutPage && <WhatsAppFab liftedUp={cartData.count > 0} />}
        </>
      )}
    </div>
  );
}
