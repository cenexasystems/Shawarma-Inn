import { useNavigate } from 'react-router-dom';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartData: any;
}

export default function CartDrawer({ isOpen, onClose, cartData }: CartDrawerProps) {
  const { cart, updateQty, removeItem } = cartData;
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed right-0 top-0 h-[100dvh] w-full max-w-sm md:w-96 bg-[var(--black)] z-[70] shadow-[-20px_0_40px_rgba(0,0,0,0.8)] flex flex-col border-l border-[var(--border)] transition-transform duration-500 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-8 border-b border-[var(--border)] flex justify-between items-center">
          <div>
            <h2 className="font-bebas text-3xl text-[var(--white)] uppercase tracking-wide">
              Your Order
            </h2>
            <p className="text-[var(--white)]/40 text-xs font-body mt-1 uppercase tracking-widest">
              The Culinary Nocturne
            </p>
          </div>
          <button
            id="cart-close-btn"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg className="w-16 h-16 text-[var(--red)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-[var(--white)]/40 text-sm font-label uppercase tracking-widest">Your cart is empty</p>
            </div>
          ) : (
            cart.map((ci: any) => (
              <div key={ci.id} className="flex items-center gap-4 group">
                <div className="w-16 h-16 bg-[var(--card-bg)] rounded-xl overflow-hidden border border-[var(--border)] flex-shrink-0">
                  {ci.image ? (
                    <img
                      src={ci.image}
                      alt={ci.name}
                      className="w-full h-full object-cover"
                      onError={({ currentTarget }) => {
                        const parent = currentTarget.parentElement;
                        currentTarget.style.display = 'none';
                        if (parent) {
                          parent.textContent = '🌯';
                          parent.className = 'w-full h-full flex items-center justify-center text-2xl';
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🌯</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bebas text-lg text-[var(--white)] uppercase tracking-wide truncate">
                    {ci.name}
                  </h4>
                  <p className="text-[var(--white)]/40 text-xs font-body">₹{ci.price} each</p>
                  <p className="text-[var(--red)] font-bebas text-lg leading-none">₹{(ci.price * ci.qty).toFixed(2)}</p>
                </div>
                <div className="flex items-center bg-white/5 rounded-full px-2 py-1 gap-3 flex-shrink-0">
                  <button
                    id={`cart-decrease-${ci.id}`}
                    onClick={() => updateQty(ci.id, ci.qty - 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-xs text-white"
                  >
                    −
                  </button>
                  <span className="text-xs font-bold w-4 text-center text-white">{ci.qty}</span>
                  <button
                    id={`cart-increase-${ci.id}`}
                    onClick={() => updateQty(ci.id, ci.qty + 1)}
                    className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/10 text-xs text-white"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(ci.id)}
                  className="text-[var(--white)]/20 hover:text-[var(--red)] transition-colors ml-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer actions */}
        {cart.length > 0 && (
          <div
            className="p-8 bg-[var(--charcoal)] border-t border-[var(--border)] space-y-4 flex-shrink-0"
            style={{ paddingBottom: 'max(2rem, calc(env(safe-area-inset-bottom) + 1rem))' }}
          >
            <button
              id="cart-checkout-btn"
              onClick={handleCheckout}
              className="w-full bg-[var(--red)] text-[var(--white)] font-bebas text-xl py-4 rounded-full flex items-center justify-center gap-3 tracking-widest hover:shadow-[0_0_20px_rgba(214,43,43,0.4)] active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              REVIEW ORDER
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
