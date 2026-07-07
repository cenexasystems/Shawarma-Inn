

interface CouponSectionProps {
  appliedCoupon: { code: string; discount: number } | null;
  couponInput: string;
  setCouponInput: (val: string) => void;
  couponLoading: boolean;
  couponMessage: { text: string; type: string };
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
}

export default function CouponSection({
  appliedCoupon,
  couponInput,
  setCouponInput,
  couponLoading,
  couponMessage,
  handleApplyCoupon,
  handleRemoveCoupon
}: CouponSectionProps) {
  return (
    <div className="mb-6">
      {appliedCoupon ? (
        <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-xl">
          <div>
            <p className="font-bold text-sm text-emerald-400 font-body">{appliedCoupon.code} applied</p>
            <p className="text-[10px] text-emerald-400/70 uppercase tracking-[1px] mt-1">-₹{appliedCoupon.discount.toFixed(2)}</p>
          </div>
          <button onClick={handleRemoveCoupon} className="text-[10px] font-bold uppercase tracking-[2px] text-white/40 hover:text-white transition-colors">
            Remove
          </button>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/10">
          <label className="block text-xs font-bold text-white/50 uppercase tracking-[2px] mb-3">Have a Coupon?</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponInput} 
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())} 
              placeholder="ENTER CODE" 
              className="flex-1 bg-black/60 border border-white/20 rounded-xl px-4 py-3 text-lg font-bold uppercase tracking-widest text-white outline-none focus:border-[var(--red)] focus:bg-black transition-all placeholder:text-white/20" 
            />
            <button 
              onClick={() => { void handleApplyCoupon(); }} 
              disabled={couponLoading || !couponInput} 
              className="bg-[var(--red)] hover:bg-red-600 text-white font-bebas text-xl px-6 rounded-xl uppercase tracking-[2px] transition-all disabled:opacity-50 disabled:hover:bg-[var(--red)]"
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
          {couponMessage.text && (
            <p className={`text-xs font-bold uppercase tracking-[1px] mt-3 ${couponMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {couponMessage.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
