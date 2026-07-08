import { useState, useEffect, Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
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
import OrderConfirmation from './pages/OrderConfirmation';
import Branches from './pages/Branches';
import OffersPage from './pages/OffersPage';
import ContactPage from './pages/ContactPage';
import { useCart } from './hooks/useCart';
import { useAuth } from './hooks/useAuth';
import { AdminProvider } from './context/AdminContext';
import { runAutomaticMigration, initializeWithHealthCheck } from './lib/supabaseMigration';

const Profile = lazy(() => import('./pages/Profile'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const OperationsCenterPage = lazy(() => import('./pages/admin/OperationsCenterPage'));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));

const MenuPage = lazy(() => import('./pages/admin/MenuPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const CustomersPage = lazy(() => import('./pages/admin/CustomersPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const CouponsPage = lazy(() => import('./pages/admin/CouponsPage'));
const ReviewsPage = lazy(() => import('./pages/admin/ReviewsPage'));
const FranchisePage = lazy(() => import('./pages/admin/FranchisePage'));
const VideosPage = lazy(() => import('./pages/admin/VideosPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const ActivityLogPage = lazy(() => import('./pages/admin/ActivityLogPage'));
const PosBilling = lazy(() => import('./pages/PosBilling'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/admin/NotificationsPage'));
const KDSSettingsPage = lazy(() => import('./pages/admin/KDSSettingsPage'));
const KDSPage = lazy(() => import('./pages/admin/KDSPage'));

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <Loader />;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
}

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
    if (location.hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

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
    <div
      className={
        isAdminArea
          ? 'min-h-screen bg-erp-bg text-erp-text selection:bg-erp-primary selection:text-white'
          : 'min-h-screen bg-[var(--black)] text-[var(--white)] font-body selection:bg-[var(--red)] selection:text-white'
      }
    >

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
      {!isAdminArea && isHome && <Hero cartCount={cartData.count} />}

      <div
        style={{
          paddingBottom:
            !isAdminArea && !isCheckoutPage && cartData.count > 0
              ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'
              : undefined,
          transition: 'padding-bottom 0.3s ease',
        }}
      >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu cartData={cartData} />} />
        <Route path="/checkout" element={<Checkout cartData={cartData} />} />
        <Route path="/order-confirmation" element={<OrderConfirmation />} />
        <Route path="/branches" element={<Branches />} />
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/contact" element={<ContactPage />} />
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
            authLoading ? (
              <Loader />
            ) : user?.role === 'admin' ? (
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
            <ProtectedAdminRoute>
              <AdminProvider>
                <Suspense fallback={<Loader />}>
                  <AdminLayout />
                </Suspense>
              </AdminProvider>
            </ProtectedAdminRoute>
          }
        >
          <Route index element={<Suspense fallback={<Loader />}><DashboardPage /></Suspense>} />
          <Route path="whatsapp" element={<Suspense fallback={<Loader />}><OperationsCenterPage /></Suspense>} />
          <Route path="menu" element={<Suspense fallback={<Loader />}><MenuPage /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<Loader />}><CategoriesPage /></Suspense>} />
          <Route path="customers" element={<Suspense fallback={<Loader />}><CustomersPage /></Suspense>} />
          <Route path="team" element={<Suspense fallback={<Loader />}><UsersPage /></Suspense>} />
          <Route path="coupons" element={<Suspense fallback={<Loader />}><CouponsPage /></Suspense>} />
          <Route path="reviews" element={<Suspense fallback={<Loader />}><ReviewsPage /></Suspense>} />
          <Route path="franchise" element={<Suspense fallback={<Loader />}><FranchisePage /></Suspense>} />
          <Route path="media" element={<Suspense fallback={<Loader />}><VideosPage /></Suspense>} />
          <Route path="analytics" element={<Suspense fallback={<Loader />}><ReportsPage /></Suspense>} />
          <Route path="notifications" element={<Suspense fallback={<Loader />}><NotificationsPage /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<Loader />}><SettingsPage /></Suspense>} />
          <Route path="kds-settings" element={<Suspense fallback={<Loader />}><KDSSettingsPage /></Suspense>} />
          <Route path="kds" element={<Suspense fallback={<Loader />}><KDSPage /></Suspense>} />
          <Route path="activity" element={<Suspense fallback={<Loader />}><ActivityLogPage /></Suspense>} />
        </Route>
        <Route
          path="/pos"
          element={
            <ProtectedAdminRoute>
              <Suspense fallback={<Loader />}>
                <PosBilling />
              </Suspense>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedAdminRoute>
              <Suspense fallback={<Loader />}>
                <Analytics />
              </Suspense>
            </ProtectedAdminRoute>
          }
        />
      </Routes>
      </div>

      {/* Sticky bottom checkout bar — animates in only while the cart has items */}
      {!isAdminArea && !isCheckoutPage && cartData.count > 0 && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 animate-in fade-in slide-in-from-bottom-6 duration-500"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="mx-auto max-w-2xl px-3 pb-3 pt-2 sm:px-4">
            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-between gap-3 bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl px-5 py-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.55)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--red)] text-white text-xs font-bold font-body shrink-0">
                  {cartData.count}
                </span>
                <span className="font-bebas text-white text-[15px] tracking-[2px] uppercase">
                  ₹{cartData.subtotal.toFixed(0)}
                </span>
              </div>
              <span className="flex items-center gap-1.5 font-bebas text-[var(--red)] text-base tracking-[2px] uppercase">
                Checkout
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </span>
            </button>
          </div>
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
