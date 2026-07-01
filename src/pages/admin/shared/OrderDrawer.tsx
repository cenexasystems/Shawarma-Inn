import { resolveMenuImage, getRecoveryImage } from '../../../utils/menuImages';
import { ADMIN_ORDER_STATUSES, STATUS_LABELS, getStatusColor } from './constants';

export default function OrderDrawer({
  order,
  history,
  loading,
  onClose,
  onUpdateStatus,
  onDuplicate,
  onNotify,
}: {
  order: any;
  history: any[];
  loading: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: number | string, status: string) => Promise<void> | void;
  onDuplicate: (orderId: number | string) => Promise<void> | void;
  onNotify?: (message: string) => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#141414] border-l border-white/10 z-50 flex flex-col shadow-2xl overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 sticky top-0 bg-[#141414]">
          <div>
            <h3 className="font-bebas text-3xl tracking-wider text-[#ef8f2f]">Order #{order.order_number}</h3>
            <p className="text-xs text-white/40 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {loading && (
          <div className="p-6 text-center text-white/30 text-sm animate-pulse">Loading order details…</div>
        )}

        {!loading && (
          <div className="flex-1 p-6 space-y-6">
            <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-3">
              <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-3">Customer</h4>
              <p className="font-semibold text-lg">{order.customer_name || 'Guest'}</p>
              {order.customer_phone && <p className="text-sm text-white/60">{order.customer_phone}</p>}
              {order.customer_email && <p className="text-xs text-white/40">{order.customer_email}</p>}
              {order.delivery_address && (
                <p className="text-xs text-white/50 border-t border-white/5 pt-3">
                  <span className="text-white/30 uppercase text-[10px] tracking-wider block mb-1">{order.delivery_type?.replace('_', ' ')}</span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {order.delivery_address}
                  </a>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {order.customer_phone && (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="flex flex-col items-center gap-1.5 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl text-green-400 text-xs font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  Call
                </a>
              )}
              {order.customer_phone && (
                <a
                  href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${order.customer_name || ''}, your order #${order.order_number} update:`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-1.5 p-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl text-[#25D366] text-xs font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
              {order.delivery_address && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.delivery_address).catch(() => {});
                    onNotify?.('Address copied to clipboard');
                  }}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  Copy Address
                </button>
              )}
              <button
                onClick={() => onNotify?.('Kitchen Slip printing architecture prepared.')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-xl text-gray-400 text-xs font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Kitchen Slip
              </button>
              <button
                onClick={() => onNotify?.('Invoice printing architecture prepared.')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-xl text-gray-400 text-xs font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Invoice
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('Duplicate this order as a new pending order?')) return;
                  await onDuplicate(order.id);
                }}
                className="flex flex-col items-center gap-1.5 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Duplicate
              </button>
              <button
                onClick={() => window.print()}
                className="flex flex-col items-center gap-1.5 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 text-xs font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('Cancel this order?')) return;
                  await onUpdateStatus(order.id, 'cancelled');
                }}
                className="flex flex-col items-center gap-1.5 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Cancel
              </button>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-3">Update Status</h4>
              <select
                value={order.status}
                onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                className={`w-full appearance-none px-4 py-3 border rounded-xl text-sm font-bold uppercase tracking-wider cursor-pointer outline-none transition-colors ${getStatusColor(order.status)}`}
              >
                {ADMIN_ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-[#101010] text-white">{STATUS_LABELS[s] || s}</option>
                ))}
              </select>
            </div>

            <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
              <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-4">Items</h4>
              <div className="space-y-3">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-sm bg-black/20 p-2 rounded-xl">
                    <div className="flex items-center gap-3">
                      <img
                        src={resolveMenuImage({ name: item.name, category: 'Shawarma' })}
                        onError={(e) => { e.currentTarget.src = getRecoveryImage({ name: item.name, category: 'Shawarma' }); }}
                        alt={item.name}
                        className="w-10 h-10 object-cover rounded-lg bg-[#181818]"
                      />
                      <span className="text-white/80">{item.name} <span className="text-[#ef8f2f] ml-1 font-bold">×{item.quantity}</span></span>
                    </div>
                    <span className="font-bebas text-lg tracking-wide pr-2">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 mt-4 pt-4 space-y-1.5 text-xs text-white/50">
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                    <span>-₹{Number(order.discount_amount).toLocaleString()}</span>
                  </div>
                )}
                {Number(order.gst_amount) > 0 && (
                  <div className="flex justify-between"><span>GST</span><span>₹{Number(order.gst_amount).toLocaleString()}</span></div>
                )}
                {Number(order.packing_charge) > 0 && (
                  <div className="flex justify-between"><span>Packing</span><span>₹{Number(order.packing_charge).toLocaleString()}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-white/5 text-white font-bold text-sm">
                  <span>Total</span>
                  <span className="font-bebas text-xl text-[#ef8f2f]">₹{Number(order.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4">
                <h4 className="text-[10px] uppercase tracking-[2px] text-yellow-400/70 mb-1">Order Notes</h4>
                <p className="text-sm text-white/70">{order.notes}</p>
              </div>
            )}

            {history.length > 0 && (
              <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                <h4 className="text-[10px] uppercase tracking-[2px] text-white/40 mb-4">Status Timeline</h4>
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${
                          h.status === 'completed' ? 'bg-green-400' :
                          h.status === 'cancelled' ? 'bg-red-400' :
                          h.status === 'pending' ? 'bg-yellow-400' : 'bg-[#ef8f2f]'
                        }`} />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1.5 min-h-[20px]" />}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{STATUS_LABELS[h.status] || h.status}</span>
                          <span className="text-[10px] text-white/30">{new Date(h.created_at).toLocaleTimeString()}</span>
                        </div>
                        {h.previous_status && (
                          <span className="text-[10px] text-white/30">from {STATUS_LABELS[h.previous_status] || h.previous_status}</span>
                        )}
                        {h.note && <p className="text-xs text-white/50 mt-0.5">{h.note}</p>}
                        {h.admin_name && <p className="text-[10px] text-white/30">by {h.admin_name}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
