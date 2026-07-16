import { useState, useEffect, useMemo } from 'react';
import SEO from '../components/SEO';
import { type CredentialResponse } from '@react-oauth/google';
import { useNavigate, Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useOrders } from '../hooks/useOrders';
import { usePublicSettings } from '../hooks/usePublicSettings';
import { useStoreSettings } from '../context/SettingsContext';
import { apiRequest } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { useSupabaseAuth } from '../lib/runtime';
import { playCheckoutSound } from '../utils/playCheckoutSound';
import type { CartItem } from '../hooks/useCart';
import CheckoutLayout from '../components/checkout/CheckoutLayout';
import CustomerDetailsForm from '../components/checkout/CustomerDetailsForm';
import AddressSection from '../components/checkout/AddressSection';
import CartSummary from '../components/checkout/CartSummary';
import { isOrderingAvailable, formatTime } from '../utils/orderAvailability';

interface CheckoutCartData {
  cart: CartItem[];
  subtotal: number;
  clearCart: () => void;
}

interface CheckoutProps {
  cartData?: CheckoutCartData;
}

export default function Checkout({ cartData }: CheckoutProps) {
  if (!cartData) return null;
  const { cart, subtotal, clearCart } = cartData;
  const { user, login, signup, signInWithGoogle, logout } = useAuth();
  const { settings } = useStoreSettings();
  const orderingAvailable = isOrderingAvailable(settings);
  const whatsappPhone = settings.whatsapp_number || import.meta.env.VITE_OWNER_WHATSAPP || '916382877479';
  const { placeOrder } = useOrders();
  const navigate = useNavigate();
  const isCustomerLoggedIn = user?.role === 'user';
  const { deliveryCharge: liveDeliveryCharge, packingCharge: livePackingCharge, gstActive, gstPercentage } = usePublicSettings();
  
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [addressData, setAddressData] = useState({
    houseNo: '',
    street: '',
    area: '',
    landmark: '',
    city: 'Chennai',
    pincode: ''
  });
  const [placed, setPlaced] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [deliveryMethod, setDeliveryMethod] = useState<'self_delivery' | 'we_arrange' | 'pickup'>('we_arrange');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState({ text: '', type: '' });
  const [couponLoading, setCouponLoading] = useState(false);
  
  const totals = useMemo(() => {
    const discount = appliedCoupon?.discount ?? 0;
    const cappedDiscount = Math.max(0, Math.min(discount, subtotal));
    const taxableAmount = subtotal - cappedDiscount;
    const dc = deliveryMethod !== 'pickup' ? liveDeliveryCharge : 0;
    const gst = gstActive ? Math.round(taxableAmount * (gstPercentage / 100) * 100) / 100 : 0;
    const grandTotal = Math.round((taxableAmount + dc + livePackingCharge + gst) * 100) / 100;
    return {
      itemsTotal: subtotal,
      deliveryCharge: dc,
      packingCharge: livePackingCharge,
      gstEnabled: gstActive,
      gstPercentage,
      gst,
      discount: cappedDiscount,
      couponCode: appliedCoupon?.code,
      grandTotal,
    };
  }, [subtotal, deliveryMethod, appliedCoupon, liveDeliveryCharge, livePackingCharge, gstActive, gstPercentage]);

  const validateCouponViaSupabase = async (rawCode: string, itemsTotal: number) => {
    const code = rawCode.trim().toUpperCase();
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (fetchError || !coupon) {
      throw new Error('Invalid or inactive coupon code.');
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      throw new Error('This coupon is not active yet.');
    }
    if (coupon.valid_to && new Date(coupon.valid_to) < now) {
      throw new Error('This coupon has expired.');
    }
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      throw new Error('Coupon usage limit has been reached.');
    }
    if (coupon.min_order_value && itemsTotal < coupon.min_order_value) {
      throw new Error(`Minimum order of ₹${coupon.min_order_value} required for this coupon.`);
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = itemsTotal * (Number(coupon.discount_value) / 100);
    } else if (coupon.discount_type === 'fixed') {
      discount = Number(coupon.discount_value);
    }
    if (coupon.max_discount) {
      discount = Math.min(discount, Number(coupon.max_discount));
    }
    discount = Math.round(Math.min(discount, itemsTotal) * 100) / 100;

    return { code: coupon.code as string, discount };
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponMessage({ text: '', type: '' });
    try {
      const result = useSupabaseAuth
        ? await validateCouponViaSupabase(couponInput.trim(), subtotal)
        : await apiRequest<{ coupon: { code: string }; discount: number }>(
            '/coupons/validate',
            { method: 'POST', body: { code: couponInput.trim(), subtotal } }
          ).then((r) => ({ code: r.coupon.code, discount: r.discount }));

      setAppliedCoupon({ code: result.code, discount: result.discount });
      setCouponMessage({ text: `"${result.code}" applied!`, type: 'success' });
      setCouponInput('');
    } catch (err) {
      setAppliedCoupon(null);
      setCouponMessage({ text: err instanceof Error ? err.message : 'Invalid coupon code.', type: 'error' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage({ text: '', type: '' });
  };

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authSaving, setAuthSaving] = useState(false);
  const [authError, setAuthError] = useState('');
  
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.phone) setPhone(user.phone);
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
        await login({ email: authEmail, password: authPassword, rememberMe: true });
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

  const getFormattedAddress = () => {
    const { houseNo, street, area, landmark, city, pincode } = addressData;
    return `${houseNo}, ${street}, ${area}, ${landmark ? landmark + ', ' : ''}${city} - ${pincode}`;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!phone.trim() || phone.replace(/\D/g, '').length !== 10) errors.phone = 'Valid 10-digit phone is required';
    
    if (deliveryMethod === 'we_arrange') {
      if (!addressData.houseNo.trim()) errors.houseNo = 'Required';
      if (!addressData.street.trim()) errors.street = 'Required';
      if (!addressData.area.trim()) errors.area = 'Required';
      if (!addressData.city.trim()) errors.city = 'Required';
      if (!addressData.pincode.trim()) errors.pincode = 'Required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!orderingAvailable) {
      alert(`Online ordering is unavailable. We reopen at ${formatTime(settings.opening_time)}.`);
      return;
    }
    if (!isCustomerLoggedIn) {
      alert('Please sign in to place your order.');
      return;
    }
    
    if (!validateForm()) {
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
      customerEmail: user?.email ?? undefined,
      deliveryAddress: deliveryMethod === 'we_arrange' ? getFormattedAddress() : (deliveryMethod === 'self_delivery' ? 'RAPIDO/PORTER' : 'STORE PICKUP'),
      deliveryType: deliveryMethod === 'pickup' ? 'store_pickup' : 'home_delivery',
      couponCode: appliedCoupon?.code ?? undefined,
      discountAmount: totals.discount ?? 0,
      packingCharge: totals.packingCharge ?? 0,
      gstAmount: totals.gst ?? 0,
    });

    if (!result.success) {
      setSaving(false);
      alert(result.error || 'Could not place order. Please try again.');
      return;
    }

    setSaving(false);
    playCheckoutSound();
    
    // Generate Custom WhatsApp Message
    const orderItemsText = cart.map(item => `• ${item.qty}x ${item.name} (₹${item.price * item.qty})`).join('\n');
    const finalAddress = deliveryMethod === 'we_arrange' ? getFormattedAddress() : (deliveryMethod === 'self_delivery' ? 'Self Delivery (Rapido/Porter)' : 'Store Pickup');
    const discountText = appliedCoupon ? `\nCoupon Applied: ${appliedCoupon.code} (-₹${totals.discount})` : '';
    
      const message = `*NEW ORDER FROM SHAWARMA INN* 🌯🔥\n\n` +
      `*Customer Details*\n` +
      `Name: ${name}\n` +
      `Phone: ${phone}\n\n` +
      `*Delivery Type*\n${deliveryMethod === 'we_arrange' ? 'We Arrange Delivery' : deliveryMethod === 'self_delivery' ? 'Self Delivery (Rapido/Porter)' : 'Store Pickup'}\n\n` +
      `*Address/Location*\n${finalAddress}\n\n` +
      `*Order Items*\n${orderItemsText}\n\n` +
      `*Order Summary*${discountText}\n` +
      `Items Total: ₹${totals.itemsTotal}\n` +
      (totals.gstEnabled ? `GST (${totals.gstPercentage}%): ₹${totals.gst}\n` : '') +
      `*Grand Total: ₹${totals.grandTotal}*\n\n` +
      `*Note: Delivery charges will be applied (Not for Store Pickup)*\n\n` +
      `Please confirm my order!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappPhone}?text=${encodedMessage}`, '_blank');

    setPlaced(true);
    clearCart();
    navigate('/order-confirmation', { state: { orderData: { name, phone, deliveryMethod, totals } } });
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

  if (!orderingAvailable && !placed) {
    return <main className="pt-32 min-h-screen bg-[var(--black)] text-white px-6 text-center"><h1 className="font-bebas text-5xl">STORE CLOSED</h1><p className="mt-4 text-white/60">Online ordering is unavailable. We reopen at {formatTime(settings.opening_time)}.</p><button onClick={() => navigate('/menu')} className="mt-8 rounded-full bg-[var(--red)] px-8 py-3 font-bold">Back to Menu</button></main>;
  }

  if (placed) {
    return null; // The redirect to /order-confirmation happens instantly
  }

  return (
    <main className="pt-24 bg-[var(--black)] text-[var(--white)] min-h-screen">
      <SEO title="Checkout | Shawarma Inn" description="Secure checkout" noindex={true} />
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1200px] mx-auto pb-12">
        <div className="mb-10 text-center lg:text-left">
          <Link to="/menu" className="inline-flex items-center gap-2 text-white/50 hover:text-[var(--red)] transition-colors mb-4 text-[10px] font-bold uppercase tracking-[2px] font-body">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Menu
          </Link>
          <h1 className="font-bebas text-4xl sm:text-5xl md:text-6xl tracking-[3px] uppercase leading-none text-white">
            SECURE CHECKOUT
          </h1>
        </div>

        <CheckoutLayout>
          {/* Left Column: Details */}
          <div className="flex-1 space-y-8">
            <CustomerDetailsForm 
              isCustomerLoggedIn={isCustomerLoggedIn}
              user={user}
              logout={logout}
              authMode={authMode}
              setAuthMode={setAuthMode}
              authName={authName}
              setAuthName={setAuthName}
              authEmail={authEmail}
              setAuthEmail={setAuthEmail}
              authPassword={authPassword}
              setAuthPassword={setAuthPassword}
              showAuthPassword={showAuthPassword}
              setShowAuthPassword={setShowAuthPassword}
              authError={authError}
              authSaving={authSaving}
              handleCheckoutAuth={handleCheckoutAuth}
              handleGoogleCheckoutAuth={handleGoogleCheckoutAuth}
            />

            {/* 2. Delivery Method */}
            <div className={`bg-[#111111] border border-white/5 rounded-[24px] p-4 sm:p-6 shadow-2xl transition-opacity duration-300 ${!isCustomerLoggedIn ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[var(--red)]/10 flex items-center justify-center text-[var(--red)]">2</span>
                Order Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setDeliveryMethod('self_delivery')}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${deliveryMethod === 'self_delivery' ? 'bg-[var(--red)]/10 border-[var(--red)] text-white' : 'bg-black/40 border-white/5 text-white/50 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span className="font-bebas text-xl tracking-wider">Self Delivery</span>
                  </div>
                  <p className="text-xs font-body leading-relaxed opacity-80">Book Rapido or Porter. Delivery charges apply.</p>
                  {deliveryMethod === 'self_delivery' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[var(--red)] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setDeliveryMethod('we_arrange')}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${deliveryMethod === 'we_arrange' ? 'bg-[var(--red)]/10 border-[var(--red)] text-white' : 'bg-black/40 border-white/5 text-white/50 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <span className="font-bebas text-xl tracking-wider">We Arrange</span>
                  </div>
                  <p className="text-xs font-body leading-relaxed opacity-80">We'll handle the delivery. Delivery charges apply.</p>
                  {deliveryMethod === 'we_arrange' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[var(--red)] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setDeliveryMethod('pickup')}
                  className={`relative p-5 rounded-2xl border text-left transition-all ${deliveryMethod === 'pickup' ? 'bg-[var(--red)]/10 border-[var(--red)] text-white' : 'bg-black/40 border-white/5 text-white/50 hover:border-white/20'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    <span className="font-bebas text-xl tracking-wider">Store Pickup</span>
                  </div>
                  <p className="text-xs font-body leading-relaxed opacity-80">Skip the queue, collect from Mathur branch.</p>
                  {deliveryMethod === 'pickup' && (
                    <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[var(--red)] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <AddressSection 
              isCustomerLoggedIn={isCustomerLoggedIn}
              deliveryMethod={deliveryMethod}
              name={name}
              setName={setName}
              phone={phone}
              setPhone={setPhone}
              addressData={addressData}
              setAddressData={setAddressData}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
            />
          </div>

          {/* Right Column: Summary & Payment */}
          <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0">
            <div className="lg:sticky lg:top-32 space-y-6">
              <CartSummary 
                cart={cart}
                totals={totals}
                saving={saving}
                isCustomerLoggedIn={isCustomerLoggedIn}
                handlePlaceOrder={handlePlaceOrder}
                appliedCoupon={appliedCoupon}
                couponInput={couponInput}
                setCouponInput={setCouponInput}
                couponLoading={couponLoading}
                couponMessage={couponMessage}
                handleApplyCoupon={handleApplyCoupon}
                handleRemoveCoupon={handleRemoveCoupon}
              />
            </div>
          </div>
        </CheckoutLayout>
      </div>
      <Footer />
    </main>
  );
}
