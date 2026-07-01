
import type { CartItem } from '../../hooks/useCart';
import type { CheckoutTotals } from '../../config/pricing';
import { getRecoveryImage } from '../../utils/menuImages';
import CouponSection from './CouponSection';

interface CartSummaryProps {
  cart: CartItem[];
  totals: CheckoutTotals;
  saving: boolean;
  isCustomerLoggedIn: boolean;
  handlePlaceOrder: () => void;
  appliedCoupon: { code: string; discount: number } | null;
  couponInput: string;
  setCouponInput: (val: string) => void;
  couponLoading: boolean;
  couponMessage: { text: string; type: string };
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
}

export default function CartSummary({
  cart,
  totals,
  saving,
  isCustomerLoggedIn,
  handlePlaceOrder,
  appliedCoupon,
  couponInput,
  setCouponInput,
  couponLoading,
  couponMessage,
  handleApplyCoupon,
  handleRemoveCoupon
}: CartSummaryProps) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-[24px] p-6 shadow-2xl">
      <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6">Order Summary</h2>
      
      {/* Cart Items */}
      <div className="max-h-[300px] overflow-y-auto pr-2 space-y-4 mb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {cart.map((ci: CartItem) => (
          <div key={ci.id} className="flex gap-4">
            <div className="relative w-16 h-16 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex-shrink-0">
              {ci.image ? (
                <img
                  src={ci.image}
                  alt={ci.name}
                  className="w-full h-full object-cover"
                  onError={({ currentTarget }) => {
                    currentTarget.onerror = null;
                    currentTarget.src = getRecoveryImage({ name: ci.name, category: 'Shawarma' });
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/10">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
              )}
              <span className="absolute -top-1 -right-1 bg-[var(--red)] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{ci.qty}</span>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              <p className="font-bebas text-lg leading-none mb-1 text-white/90 truncate">{ci.name}</p>
              <p className="text-sm font-body text-[var(--red)]">₹{ci.price * ci.qty}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="h-px bg-white/5 mb-6" />

      {/* Coupon Code */}
      <CouponSection 
        appliedCoupon={appliedCoupon}
        couponInput={couponInput}
        setCouponInput={setCouponInput}
        couponLoading={couponLoading}
        couponMessage={couponMessage}
        handleApplyCoupon={handleApplyCoupon}
        handleRemoveCoupon={handleRemoveCoupon}
      />

      {/* Bill Details */}
      <div className="space-y-3 font-body text-sm mb-6">
        <div className="flex justify-between text-white/60">
          <span>Subtotal</span><span>₹{totals.itemsTotal.toFixed(2)}</span>
        </div>
        {totals.discount > 0 && (
          <div className="flex justify-between text-emerald-400">
            <span>Discount</span><span>-₹{totals.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-white/60">
          <span>Delivery</span><span>₹{totals.deliveryCharge.toFixed(2)}</span>
        </div>
        {totals.packingCharge > 0 && (
          <div className="flex justify-between text-white/60">
            <span>Packing</span><span>₹{totals.packingCharge.toFixed(2)}</span>
          </div>
        )}
        {totals.gstEnabled && (
          <div className="flex justify-between text-white/60">
            <span>GST ({totals.gstPercentage}%)</span><span>₹{totals.gst.toFixed(2)}</span>
          </div>
        )}
      </div>

      <div className="flex justify-between items-end pt-5 border-t border-white/5 mb-6">
        <span className="font-bebas text-xl text-white/80 tracking-wide">Total Due</span>
        <span className="font-bebas text-4xl text-[var(--red)] tracking-wider leading-none">₹{totals.grandTotal.toFixed(2)}</span>
      </div>

      <button
        onClick={handlePlaceOrder}
        disabled={saving}
        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-black font-bebas text-2xl py-4 rounded-2xl flex items-center justify-center gap-3 tracking-[2px] transition-all shadow-[0_10px_30px_rgba(37,211,102,0.2)] disabled:opacity-50 disabled:grayscale uppercase"
      >
        {saving ? (
          <span className="animate-pulse">Processing...</span>
        ) : (
          <>
            Pay via WhatsApp
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82c1.516.903 3.09 1.38 4.711 1.381 5.452 0 9.889-4.437 9.892-9.889.002-2.646-1.027-5.132-2.9-6.999-1.874-1.868-4.363-2.896-7.005-2.897-5.451 0-9.888 4.437-9.89 9.889-.001 1.761.464 3.479 1.345 5.006l-1.022 3.733 3.869-1.014zm11.351-7.73c-.161-.081-1.12-.553-1.293-.617-.174-.064-.3-.097-.426.091-.125.189-.485.617-.595.744-.109.127-.218.143-.379.062-.161-.081-.679-.251-1.293-.8-.478-.426-.801-.951-.894-1.114-.093-.163-.01-.251.071-.331.073-.072.161-.189.242-.284.081-.094.108-.161.161-.27.053-.109.027-.204-.013-.284-.04-.081-.426-1.026-.584-1.405-.154-.373-.306-.322-.426-.328l-.364-.006c-.125 0-.329.047-.501.236-.172.189-.657.642-.657 1.565 0 .923.671 1.815.766 1.943.094.127 1.32 2.016 3.198 2.826.447.193.795.308 1.068.394.448.143.855.123 1.176.075.358-.053 1.12-.458 1.279-.901.16-.442.16-.821.112-.901-.049-.081-.177-.128-.338-.209z" /></svg>
          </>
        )}
      </button>
      
      {!isCustomerLoggedIn && (
        <p className="text-center text-[10px] text-red-400 mt-4 uppercase tracking-[1px]">Login required to place order</p>
      )}
    </div>
  );
}
