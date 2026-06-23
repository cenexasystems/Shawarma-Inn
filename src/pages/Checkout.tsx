import { useState, useEffect, useMemo } from 'react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { useSupabaseAuth } from '../lib/runtime';
import { computeCheckoutTotals } from '../config/pricing';
import { applyCoupon } from '../config/coupons';
import { playCheckoutSound } from '../utils/playCheckoutSound';
import type { CartItem } from '../hooks/useCart';

interface CheckoutProps {
  cartData?: any;
}

const WHATSAPP_PHONE = import.meta.env.VITE_OWNER_WHATSAPP || '919003195805';

export default function Checkout({ cartData }: CheckoutProps) {
  const { cart, subtotal, buildWhatsAppUrl, clearCart } = cartData;
  const { user, login, signup, signInWithGoogle } = useAuth();
  const { placeOrder } = useOrders();
  const navigate = useNavigate();
  const isCustomerLoggedIn = user?.role === 'user';
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [placed, setPlaced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'cart' | 'details' | 'review'>('cart');
  const [detailsError, setDetailsError] = useState('');
  
  // New State for Task 4
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState('');
  const totals = useMemo(
    () => computeCheckoutTotals(subtotal, deliveryMethod, appliedCoupon?.discount ?? 0, appliedCoupon?.code),
    [subtotal, deliveryMethod, appliedCoupon]
  );

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput, subtotal);
    if (!result.valid || !result.coupon) {
      setAppliedCoupon(null);
      setCouponMessage(result.error || 'Invalid coupon code.');
      return;
    }
    setAppliedCoupon({ code: result.coupon.code, discount: result.discount });
    setCouponMessage(`"${result.coupon.code}" applied — ₹${result.discount.toFixed(2)} off.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage('');
  };
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authSaving, setAuthSaving] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleCheckoutAuth = async () => {
    setAuthError('');

    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required.');
      return;
    }

    try {
      setAuthSaving(true);
      if (authMode === 'signup') {
        await signup({ email: authEmail, password: authPassword, name: authName });
      } else {
        await login({ email: authEmail, password: authPassword });
      }
      setAuthEmail('');
      setAuthPassword('');
      setAuthName('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setAuthSaving(false);
    }
  };

  const handleGoogleCheckoutAuth = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setAuthError('Google sign-in did not return a valid credential.');
      return;
    }

    setAuthError('');
    try {
      setAuthSaving(true);
      await signInWithGoogle(credentialResponse.credential);
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Google authentication failed';
      if (raw.toLowerCase().includes('provider') && raw.toLowerCase().includes('not enabled')) {
        setAuthError('Google sign-in is temporarily unavailable. Continue with Email Login/Sign Up.');
      } else {
        setAuthError(raw);
      }
    } finally {
      setAuthSaving(false);
    }
  };

  const handleContinueFromDetails = () => {
    setDetailsError('');

    if (!isCustomerLoggedIn) {
      setDetailsError('Please sign in to continue.');
      return;
    }
    if (!name || !phone) {
      setDetailsError('Name and phone number are required.');
      return;
    }
    if (deliveryMethod === 'delivery' && !address) {
      setDetailsError('Please enter your delivery address.');
      return;
    }

    setStep('review');
  };

  const handlePlaceOrder = async () => {
    if (!isCustomerLoggedIn) {
      setAuthError('Please sign in to place your order.');
      return;
    }

    if (!name || !phone) {
      alert("Phone number and name are required!");
      return;
    }
    if (deliveryMethod === 'delivery' && !address) {
      alert("Please enter your delivery address!");
      return;
    }

    setSaving(true);
    const result = await placeOrder({
      cartItems: cart,
      subtotal: totals.itemsTotal,
      gst: totals.gst,
      total: totals.grandTotal,
      customerName: name,
      customerPhone: phone,
      deliveryAddress: deliveryMethod === 'delivery' ? address : 'STORE PICKUP',
    });

    if (!result.success) {
      setSaving(false);
      alert(result.error || 'Could not place order. Please try again.');
      return;
    }

    setSaving(false);
    playCheckoutSound();
    window.open(buildWhatsAppUrl(WHATSAPP_PHONE, totals), '_blank');
    setPlaced(true);
    clearCart();
    setTimeout(() => navigate('/'), 3000);
  };

  if (cart.length === 0 && !placed) {
    return (
      <main className="pt-32 min-h-screen flex flex-col items-center justify-center gap-8 bg-[var(--black)] text-center px-6">
        <svg className="w-20 h-20 text-[var(--white)]/20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="font-bebas text-6xl md:text-8xl text-[var(--white)] tracking-[4px]">CART IS EMPTY</h1>
        <p className="text-[var(--white)]/40 font-body uppercase tracking-[2px]">Add some flame-grilled delicacies first.</p>
        <button
          onClick={() => navigate('/menu')}
          className="bg-[var(--red)] text-[var(--white)] px-12 py-5 rounded-full font-bebas text-2xl tracking-[4px] uppercase hover:shadow-[0_0_40px_rgba(214,43,43,0.4)] transition-all active:scale-95"
        >
          Browse Menu
        </button>
        <div className="w-full mt-auto"><Footer /></div>
      </main>
    );
  }

  if (placed) {
    return (
      <main className="pt-32 min-h-screen flex flex-col items-center justify-center gap-8 bg-[var(--black)] text-center px-6">
        <div className="w-24 h-24 bg-[#25D366]/10 rounded-full flex items-center justify-center border border-[#25D366]/20 shadow-[0_0_60px_rgba(37,211,102,0.1)] mb-4">
          <svg className="w-12 h-12 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-bebas text-7xl uppercase text-[var(--white)] tracking-[6px] animate-pulse">ORDER SENT!</h1>
        <p className="text-[var(--white)]/60 font-body max-w-sm leading-relaxed">Check WhatsApp for confirmation and tracking. Redirecting home shortly…</p>
      </main>
    );
  }

  return (
    <main className="pt-24 bg-[var(--black)] text-[var(--white)] min-h-screen">
      <div className="px-4 sm:px-5 max-w-2xl mx-auto pb-12">
      <div className="text-center mb-10">
        <h1 className="font-bebas text-5xl md:text-6xl tracking-[3px] uppercase leading-none mb-3">
          CHECKOUT
        </h1>
        <div className="flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-white/10" />
          <p className="text-[var(--white)]/40 font-body uppercase tracking-[3px] text-[10px]">
            Enterprise Fulfillment System
          </p>
          <div className="h-[1px] w-12 bg-white/10" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 mb-8">
        {([
          ['cart', 'Cart'],
          ['details', 'Address'],
          ['review', 'Summary'],
        ] as const).map(([key, label], index) => (
          <div key={key} className="flex items-center gap-3">
            {index > 0 && <div className="h-[1px] w-6 bg-white/10" />}
            <span
              className={`font-bebas text-xs uppercase tracking-[2px] px-3 py-1 rounded-full ${
                step === key
                  ? 'bg-[var(--red)] text-white'
                  : 'text-white/30'
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-7">
        {/* Step: Cart */}
        {step === 'cart' && (
          <div className="bg-[#111111] border border-white/5 rounded-[24px] p-5 md:p-6 shadow-2xl">
            <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6 pb-4 border-b border-white/5">
              YOUR CART
            </h2>
            <div className="space-y-3 mb-6">
              {cart.map((ci: CartItem) => (
                <div key={ci.id} className="flex items-center justify-between p-3.5 bg-black/20 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-4">
                    <span className="text-[var(--red)] font-bebas text-lg">×{ci.qty}</span>
                    <span className="font-bebas text-base md:text-lg tracking-wide text-white/80">{ci.name}</span>
                  </div>
                  <span className="font-bebas text-base md:text-lg tracking-wider text-white">₹{ci.price * ci.qty}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mb-6 px-1">
              <span className="font-bebas text-lg text-white/60 uppercase tracking-[2px]">Subtotal</span>
              <span className="font-bebas text-3xl text-[var(--red)] tracking-wider">₹{subtotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => setStep('details')}
              className="w-full bg-[var(--red)] text-white font-bebas text-xl py-4 rounded-2xl tracking-[2px] uppercase hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Address & Delivery (Authentication + Destination & Logistics) */}
        {step === 'details' && (
          <>
        {!isCustomerLoggedIn && (
          <div className="bg-[#111111] border border-white/5 rounded-[24px] p-5 md:p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)]">
                AUTHENTICATION
              </h2>
              <div className="flex bg-black p-1 rounded-full border border-white/5">
                <button 
                  onClick={() => setAuthMode('login')}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'login' ? 'bg-[var(--red)] text-white' : 'text-white/40'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setAuthMode('signup')}
                  className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${authMode === 'signup' ? 'bg-[var(--red)] text-white' : 'text-white/40'}`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {useSupabaseAuth ? (
              <div className="mb-6">
                <div className="w-full flex justify-center">
                  <GoogleLogin
                    onSuccess={(response) => {
                      void handleGoogleCheckoutAuth(response);
                    }}
                    onError={() => setAuthError('Google sign-in popup was closed or blocked.')}
                    shape="pill"
                    text="continue_with"
                    theme="filled_black"
                    size="large"
                  />
                </div>
                <div className="flex items-center gap-2 mt-5">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] uppercase tracking-[2px] text-white/30">or use email</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-center text-white/35 uppercase tracking-[2px] mb-6">
                Google sign-in is disabled in local auth mode. Use email login or sign up.
              </p>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {authMode === 'signup' && (
                <input
                  type="text"
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="Full Name"
                  className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[var(--red)] transition-all font-body md:col-span-2"
                />
              )}
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email Address"
                className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[var(--red)] transition-all font-body"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Password"
                className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm outline-none focus:border-[var(--red)] transition-all font-body"
              />
            </div>

            {authError && (
              <p className="text-xs text-red-400 mt-4 text-center">{authError}</p>
            )}

            <button
              onClick={handleCheckoutAuth}
              disabled={authSaving}
              className="w-full mt-5 bg-[var(--red)] text-white font-bebas text-lg py-3.5 rounded-2xl tracking-[2px] uppercase disabled:opacity-40"
            >
              {authSaving ? 'Please wait...' : authMode === 'signup' ? 'Create account' : 'Sign in'}
            </button>

            {user?.role === 'admin' && (
              <p className="text-[10px] text-amber-300/90 mt-4 text-center uppercase tracking-[2px]">
                Admin session detected. Customer checkout profile is not linked to admin accounts.
              </p>
            )}
            <p className="text-[9px] text-white/20 uppercase tracking-[2px] mt-6 text-center">
              Logging in allows you to track order history and earn points.
            </p>
          </div>
        )}

        {/* Step 2: Delivery Details */}
        <div className="bg-[#111111] border border-white/5 rounded-[24px] p-5 md:p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
            <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)]">
              DESTINATION & LOGISTICS
            </h2>
            <div className="flex bg-black p-1 rounded-full border border-white/5 self-start">
              <button 
                onClick={() => setDeliveryMethod('delivery')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryMethod === 'delivery' ? 'bg-white text-black' : 'text-white/40'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Home Delivery
              </button>
              <button 
                onClick={() => setDeliveryMethod('pickup')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryMethod === 'pickup' ? 'bg-white text-black' : 'text-white/40'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                Store Pickup
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-3 text-white/40 font-body">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-3 text-white/40 font-body">Phone (Required)</label>
                <div className="flex gap-3">
                  <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white">+91</div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="9000000000"
                    required
                    className="flex-1 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body ring-1 ring-white/5 focus:ring-[var(--red)]/20"
                  />
                </div>
              </div>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-3 text-white/40 font-body">Delivery Address</label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter your full street address, landmark, and area..."
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all resize-none font-body"
                />
              </div>
            )}

            {deliveryMethod === 'pickup' && (
              <div className="bg-[#d62b2b]/5 border border-[#d62b2b]/20 rounded-2xl p-6 animate-in zoom-in-95 duration-500">
                <p className="text-xs text-[var(--red)] font-body tracking-wide leading-relaxed">
                  <strong>Pickup selected:</strong> You can collect your order from our Mathur Branch within 20-30 minutes of confirmation.
                </p>
              </div>
            )}
          </div>

          {detailsError && (
            <p className="text-xs text-red-400 mt-5 text-center">{detailsError}</p>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setStep('cart')}
              className="flex-1 bg-black/40 border border-white/10 text-white/70 font-bebas text-lg py-3.5 rounded-2xl tracking-[2px] uppercase hover:border-white/20 transition-all"
            >
              Back
            </button>
            <button
              onClick={handleContinueFromDetails}
              className="flex-[2] bg-[var(--red)] text-white font-bebas text-lg py-3.5 rounded-2xl tracking-[2px] uppercase hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              Continue
            </button>
          </div>
        </div>
          </>
        )}

        {/* Step: Order Summary & Payment */}
        {step === 'review' && (
        <div className="bg-[#111111] border border-white/5 rounded-[24px] p-5 md:p-6 shadow-2xl">
          <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6 pb-4 border-b border-white/5">
            ORDER SUMMARY
          </h2>

          <div className="space-y-3 mb-6">
            {cart.map((ci: CartItem) => (
              <div key={ci.id} className="flex items-center justify-between p-3.5 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-[var(--red)] font-bebas text-lg">×{ci.qty}</span>
                  <span className="font-bebas text-base md:text-lg tracking-wide text-white/80">{ci.name}</span>
                </div>
                <span className="font-bebas text-base md:text-lg tracking-wider text-white">₹{ci.price * ci.qty}</span>
              </div>
            ))}
          </div>

          {/* Coupon code */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-5 mb-6">
            {appliedCoupon ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bebas text-lg text-white tracking-wide">{appliedCoupon.code} applied</p>
                  <p className="text-[10px] text-emerald-400/80 uppercase tracking-[2px] mt-1">
                    You saved ₹{appliedCoupon.discount.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-[10px] font-bold uppercase tracking-[2px] text-white/40 hover:text-[var(--red)] transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="Coupon code"
                  className="flex-1 bg-black/50 border border-white/5 rounded-2xl p-4 text-sm uppercase tracking-wider text-white outline-none focus:border-[var(--red)] transition-all font-body"
                />
                <button
                  onClick={handleApplyCoupon}
                  className="bg-white text-black font-bebas text-sm px-6 rounded-2xl uppercase tracking-[2px] hover:bg-white/90 transition-all"
                >
                  Apply
                </button>
              </div>
            )}
            {!appliedCoupon && couponMessage && (
              <p className="text-[10px] text-red-400 uppercase tracking-[2px] mt-3">{couponMessage}</p>
            )}
          </div>

          <div className="bg-black/60 rounded-3xl p-6 border border-white/5 space-y-3">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-[3px] text-white/40">
              <span>Items Total</span><span>₹{totals.itemsTotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-[3px] text-emerald-400/80">
                <span>Coupon ({totals.couponCode})</span><span>-₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-[3px] text-white/40">
              <span>Delivery Charge</span><span>₹{totals.deliveryCharge.toFixed(2)}</span>
            </div>
            {totals.packingCharge > 0 && (
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-[3px] text-white/40">
                <span>Packing Charge</span><span>₹{totals.packingCharge.toFixed(2)}</span>
              </div>
            )}
            {totals.gstEnabled && (
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-[3px] text-white/40">
                <span>GST ({totals.gstPercentage}%)</span><span>₹{totals.gst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-end pt-5 border-t border-white/5 mt-3">
              <span className="font-bebas text-lg text-white/60">GRAND TOTAL</span>
              <span className="font-bebas text-4xl md:text-5xl text-[var(--red)] tracking-wider">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mt-8 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bebas text-2xl uppercase tracking-[2px] text-white/60">Amount to Pay</span>
              <span className="font-bebas text-5xl md:text-6xl text-[var(--red)] tracking-wider">₹{totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={!isCustomerLoggedIn || !name || !phone || saving}
            className="w-full bg-gradient-to-r from-[var(--red)] to-[#ff4d4d] text-white font-bebas text-xl md:text-2xl py-4 rounded-2xl flex items-center justify-center gap-3 tracking-[2px] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_20px_60px_rgba(214,43,43,0.3)] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase"
          >
            {saving ? (
              <span className="animate-pulse">PROCESSING...</span>
            ) : !isCustomerLoggedIn ? (
              <span>Sign In To Continue</span>
            ) : (
              <>
                Confirm & Pay via WhatsApp
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82c1.516.903 3.09 1.38 4.711 1.381 5.452 0 9.889-4.437 9.892-9.889.002-2.646-1.027-5.132-2.9-6.999-1.874-1.868-4.363-2.896-7.005-2.897-5.451 0-9.888 4.437-9.89 9.889-.001 1.761.464 3.479 1.345 5.006l-1.022 3.733 3.869-1.014zm11.351-7.73c-.161-.081-1.12-.553-1.293-.617-.174-.064-.3-.097-.426.091-.125.189-.485.617-.595.744-.109.127-.218.143-.379.062-.161-.081-.679-.251-1.293-.8-.478-.426-.801-.951-.894-1.114-.093-.163-.01-.251.071-.331.073-.072.161-.189.242-.284.081-.094.108-.161.161-.27.053-.109.027-.204-.013-.284-.04-.081-.426-1.026-.584-1.405-.154-.373-.306-.322-.426-.328l-.364-.006c-.125 0-.329.047-.501.236-.172.189-.657.642-.657 1.565 0 .923.671 1.815.766 1.943.094.127 1.32 2.016 3.198 2.826.447.193.795.308 1.068.394.448.143.855.123 1.176.075.358-.053 1.12-.458 1.279-.901.16-.442.16-.821.112-.901-.049-.081-.177-.128-.338-.209z" /></svg>
              </>
            )}
          </button>
          <p className="text-[9px] text-white text-center uppercase tracking-[2px] mt-6 leading-relaxed">
            * Direct WhatsApp integration ensures real-time updates and manual customization for your order.
          </p>
          <button
            onClick={() => setStep('details')}
            disabled={saving}
            className="w-full mt-4 bg-black/40 border border-white/10 text-white/70 font-bebas text-base py-3 rounded-2xl tracking-[2px] uppercase hover:border-white/20 transition-all disabled:opacity-40"
          >
            Back
          </button>
        </div>
        )}
      </div>
      </div>
      <Footer />
    </main>
  );
}

