

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
        <div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={couponInput} 
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())} 
              placeholder="Discount Code" 
              className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 text-sm uppercase tracking-wider text-white outline-none focus:border-[var(--red)] transition-all font-body" 
            />
            <button 
              onClick={() => { void handleApplyCoupon(); }} 
              disabled={couponLoading || !couponInput} 
              className="bg-white/10 hover:bg-white/20 text-white font-bebas text-base px-5 rounded-xl uppercase tracking-[2px] transition-all disabled:opacity-50"
            >
              {couponLoading ? '...' : 'Apply'}
            </button>
          </div>
          {couponMessage.text && (
            <p className={`text-[10px] uppercase tracking-[1px] mt-2 ${couponMessage.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {couponMessage.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
