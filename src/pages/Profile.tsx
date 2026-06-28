import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import { useOrders } from '../hooks/useOrders';
import Footer from '../components/Footer';

// Icons as SVGs for reliability
const Icons = {
  Person: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Location: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Receipt: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  Settings: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Delete: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Logout: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { profile, addresses, loading, updateProfile, addAddress, deleteAddress, setDefaultAddress } = useProfile();
  const { orders, loading: ordersLoading } = useOrders();

  const [activeTab, setActiveTab] = useState<'info' | 'addresses' | 'orders' | 'settings'>('info');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrText, setNewAddrText] = useState('');
  const [addingAddr, setAddingAddr] = useState(false);

  // Auth gate
  if (!user) {
    return (
      <main className="pt-32 min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--black)] px-6 text-center">
        <Icons.Person />
        <h1 className="font-bebas text-5xl text-[var(--white)] tracking-wide uppercase">Sign In Required</h1>
        <p className="text-[var(--white)]/60 font-body max-w-sm">
          Please sign in to view your profile, order history, and saved addresses.
        </p>
        <button onClick={() => navigate('/')} className="border border-[var(--border)] text-[var(--white)] px-8 py-3 rounded-full font-bebas text-xl hover:bg-white/5 transition-colors">
          Return Home
        </button>
      </main>
    );
  }

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      name: editName || profile?.name || '',
      phone: editPhone || profile?.phone || '',
      avatar_url: editAvatarUrl || profile?.avatar_url || '',
      status: 'Customer',
    });
    setSaving(false);
    setSavedMsg('Saved!');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleAddAddress = async () => {
    if (!newAddrLabel || !newAddrText) return;
    setAddingAddr(true);
    await addAddress(newAddrLabel, newAddrText);
    setNewAddrLabel('');
    setNewAddrText('');
    setAddingAddr(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const tabs = [
    { id: 'info', label: 'Profile', icon: Icons.Person },
    { id: 'addresses', label: 'Addresses', icon: Icons.Location },
    { id: 'orders', label: 'Orders', icon: Icons.Receipt },
    { id: 'settings', label: 'Settings', icon: Icons.Settings },
  ] as const;

  const STATUS_COLORS: Record<string, string> = {
    pending:     'text-amber-400 bg-amber-400/10 border-amber-400/20',
    accepted:    'text-blue-400 bg-blue-400/10 border-blue-400/20',
    processing:  'text-blue-400 bg-blue-400/10 border-blue-400/20',
    preparing:   'text-orange-400 bg-orange-400/10 border-orange-400/20',
    ready:       'text-[#ef8f2f] bg-[#ef8f2f]/10 border-[#ef8f2f]/20',
    in_transit:  'text-purple-400 bg-purple-400/10 border-purple-400/20',
    completed:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    delivered:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    cancelled:   'text-[var(--red)] bg-[var(--red)]/10 border-[var(--red)]/20',
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending', accepted: 'Accepted', processing: 'Processing',
    preparing: 'Preparing', ready: 'Ready for Pickup',
    in_transit: 'Out for Delivery', completed: 'Delivered', cancelled: 'Cancelled',
  };

  return (
    <main className="pt-[88px] min-h-screen bg-[var(--black)] text-[var(--white)]">
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Page header */}
        <div className="flex items-center gap-6 mb-12">
          {/* Avatar */}
          <div className="relative w-20 h-20 flex-shrink-0">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-[var(--red)]" />
              : (
                <div className="w-20 h-20 rounded-full bg-[var(--card-bg)] border-2 border-[var(--red)] flex items-center justify-center text-4xl font-bebas text-[var(--red)]">
                  {(user.name || user.email || 'S').charAt(0).toUpperCase()}
                </div>
              )
            }
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[var(--black)]" title="Online" />
          </div>
          <div>
            <h1 className="font-bebas text-4xl md:text-5xl tracking-wide">{user.name || 'MY PROFILE'}</h1>
            <p className="font-body text-sm text-[var(--white)]/50 mt-1">{user.email}</p>
            <span className="inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-body text-emerald-400 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {user.provider === 'google' ? 'Google Account' : 'Phone Account'}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-10 bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--border)] overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bebas text-lg tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--red)] text-white shadow-[0_0_20px_rgba(214,43,43,0.4)]'
                  : 'text-[var(--white)]/60 hover:text-[var(--white)] hover:bg-white/5'
              }`}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Profile Info ── */}
        {activeTab === 'info' && (
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="font-bebas text-3xl text-[var(--red)] tracking-wide uppercase">Profile Information</h2>
            {loading ? <p className="font-body text-[var(--white)]/40 animate-pulse">Loading...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--white)]/50 font-body">Full Name</label>
                  <input
                    type="text"
                    defaultValue={profile?.name || user.name || ''}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-[var(--black)] border border-[var(--border)] rounded-xl p-4 text-sm font-body text-[var(--white)] focus:border-[var(--red)] outline-none transition-all placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--white)]/50 font-body">Phone</label>
                  <div className="flex items-center bg-[var(--black)] border border-[var(--border)] rounded-xl focus-within:border-[var(--red)] transition-all overflow-hidden">
                    <span className="pl-4 pr-3 text-sm text-[var(--white)]/40 font-body select-none border-r border-[var(--border)] py-4">+91</span>
                    <input
                      type="tel"
                      defaultValue={profile?.phone || ''}
                      onChange={e => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9000000000"
                      maxLength={10}
                      className="flex-1 bg-transparent px-3 py-4 text-sm font-body text-[var(--white)] outline-none placeholder:text-white/20"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--white)]/50 font-body">Email</label>
                  <input type="email" value={user.email || ''} disabled className="w-full bg-[var(--black)] border border-[var(--border)] rounded-xl p-4 text-sm font-body text-[var(--white)]/40 cursor-not-allowed outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--white)]/50 font-body">Avatar URL (Optional)</label>
                  <input
                    type="url"
                    defaultValue={profile?.avatar_url || user.avatar_url || ''}
                    onChange={e => setEditAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[var(--black)] border border-[var(--border)] rounded-xl p-4 text-sm font-body text-[var(--white)] focus:border-[var(--red)] outline-none transition-all placeholder:text-white/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-[var(--white)]/50 font-body">Status</label>
                  <div className="w-full bg-[var(--black)]/40 border border-[var(--border)] rounded-xl p-4 text-sm font-body text-[var(--white)]/40 flex items-center gap-2 cursor-not-allowed">
                    <svg className="w-3.5 h-3.5 text-[var(--white)]/30 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Customer
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <button onClick={handleSaveProfile} disabled={saving} className="bg-[var(--red)] text-white px-8 py-3 rounded-full font-bebas text-lg tracking-widest hover:shadow-[0_0_20px_rgba(214,43,43,0.4)] transition-all disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  {savedMsg && <span className="font-body text-sm text-emerald-400 animate-pulse">{savedMsg}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Saved Addresses ── */}
        {activeTab === 'addresses' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-8">
              <h2 className="font-bebas text-3xl text-[var(--red)] tracking-wide uppercase mb-6">Saved Addresses</h2>
              {addresses.length === 0 ? <p className="font-body text-[var(--white)]/40 text-sm">No saved addresses yet.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`flex flex-col gap-4 p-5 rounded-2xl border ${addr.is_default ? 'border-[var(--red)] bg-[var(--red)]/5' : 'border-[var(--border)] bg-[var(--black)]'}`}>
                      <div className="flex justify-between items-start">
                        <Icons.Location />
                        <button onClick={() => deleteAddress(addr.id)} className="text-[var(--red)] hover:opacity-80 transition-opacity"><Icons.Delete /></button>
                      </div>
                      <div>
                        <p className="font-bebas text-xl tracking-wide text-[var(--white)] mb-1">
                          {addr.label}
                          {addr.is_default && <span className="ml-2 text-[10px] bg-[var(--red)] text-white px-2 py-0.5 rounded-full font-body align-middle">DEFAULT</span>}
                        </p>
                        <p className="font-body text-sm text-[var(--white)]/60 leading-relaxed">{addr.address}</p>
                      </div>
                      {!addr.is_default && (
                        <button onClick={() => setDefaultAddress(addr.id)} className="text-[10px] font-body text-[var(--white)]/40 hover:text-[var(--white)] uppercase tracking-widest text-left mt-auto">Set as default</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-8">
              <h3 className="font-bebas text-2xl text-[var(--white)] tracking-wide uppercase mb-6">Add New Address</h3>
              <div className="space-y-4">
                <input type="text" value={newAddrLabel} onChange={e => setNewAddrLabel(e.target.value)} placeholder='Label (e.g. "Home", "Office")' className="w-full bg-[var(--black)] border border-[var(--border)] rounded-xl p-4 text-sm font-body text-[var(--white)] focus:border-[var(--red)] outline-none transition-all placeholder:text-white/20" />
                <textarea value={newAddrText} onChange={e => setNewAddrText(e.target.value)} rows={3} placeholder="Full street address..." className="w-full bg-[var(--black)] border border-[var(--border)] rounded-xl p-4 text-sm font-body text-[var(--white)] focus:border-[var(--red)] outline-none transition-all placeholder:text-white/20 resize-none" />
                <button onClick={handleAddAddress} disabled={addingAddr || !newAddrLabel || !newAddrText} className="bg-[var(--red)] text-white px-8 py-3 rounded-full font-bebas text-lg tracking-widest hover:shadow-[0_0_20px_rgba(214,43,43,0.4)] transition-all disabled:opacity-40">
                  {addingAddr ? 'Adding...' : 'Add Address'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Order History ── */}
        {activeTab === 'orders' && (
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="font-bebas text-3xl text-[var(--red)] tracking-wide uppercase mb-6">Order History</h2>
            {ordersLoading ? <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}</div> : 
              orders.length === 0 ? (
                <div className="text-center py-12 flex flex-col items-center">
                  <Icons.Receipt />
                  <p className="font-body text-[var(--white)]/40 mt-4">No orders yet. Go grab some shawarma!</p>
                  <button onClick={() => navigate('/menu')} className="mt-6 bg-[var(--red)] text-white px-8 py-3 rounded-full font-bebas text-lg tracking-widest hover:shadow-[0_0_20px_rgba(214,43,43,0.4)] transition-all">Browse Menu</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-[var(--black)] rounded-xl border border-[var(--border)] p-6 hover:border-white/10 transition-colors">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          {order.order_number && (
                            <p className="font-bebas text-lg text-[var(--red)] tracking-wider">Order #{order.order_number}</p>
                          )}
                          <p className="font-body text-xs text-[var(--white)]/40 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          {order.delivery_type && (
                            <span className={`inline-block mt-1 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                              order.delivery_type === 'home_delivery'
                                ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                                : 'text-white/40 bg-white/5 border-white/10'
                            }`}>{order.delivery_type === 'home_delivery' ? '🚀 Home Delivery' : '🏪 Store Pickup'}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-body text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}>{STATUS_LABELS[order.status] || order.status}</span>
                          <span className="font-bebas text-2xl text-[var(--white)]">₹{order.total.toFixed(0)}</span>
                        </div>
                      </div>
                      {order.order_items?.length > 0 && (
                        <div className="space-y-1 pt-4 border-t border-white/5">
                          {order.order_items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm font-body text-[var(--white)]/60">
                              <span>{item.quantity}× {item.name}</span>
                              <span>₹{item.subtotal}</span>
                            </div>
                          ))}
                          {(Number(order.discount_amount) > 0 || Number(order.gst_amount) > 0) && (
                            <div className="pt-2 mt-1 border-t border-white/5 space-y-1">
                              {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-xs text-green-400">
                                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                                  <span>-₹{Number(order.discount_amount).toLocaleString()}</span>
                                </div>
                              )}
                              {Number(order.gst_amount) > 0 && (
                                <div className="flex justify-between text-xs text-white/40">
                                  <span>GST</span>
                                  <span>₹{Number(order.gst_amount).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          )}
                          {order.notes && (
                            <p className="text-xs text-yellow-400/70 pt-2 italic">"{order.notes}"</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ── TAB: Settings ── */}
        {activeTab === 'settings' && (
          <div className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="font-bebas text-3xl text-[var(--red)] tracking-wide uppercase">Account Settings</h2>
            <div className="space-y-4">
              <button onClick={handleLogout} className="w-full flex items-center gap-4 p-6 rounded-2xl border border-[var(--border)] bg-[var(--black)] hover:border-white/20 transition-all text-left group">
                <Icons.Logout />
                <div>
                  <p className="font-bebas text-2xl tracking-wide text-[var(--white)]">SIGN OUT</p>
                  <p className="font-body text-xs text-[var(--white)]/40">Log out of your account on this device</p>
                </div>
              </button>
              <div className="p-6 rounded-2xl border border-[var(--red)]/20 bg-[var(--red)]/5">
                <p className="font-bebas text-2xl tracking-wide text-[var(--red)] mb-1">DELETE ACCOUNT</p>
                <p className="font-body text-xs text-[var(--white)]/40 mb-5 leading-relaxed">Permanently delete your account and all data. This cannot be undone.</p>
                <button
                  onClick={() => {/* Request deletion toggle */}}
                  className="border border-[var(--red)]/40 text-[var(--red)] px-8 py-2.5 rounded-full font-bebas text-sm tracking-widest hover:bg-[var(--red)] hover:text-white transition-all uppercase"
                >
                  Request Deletion
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <Footer />
    </main>
  );
}
