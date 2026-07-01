import React from 'react';

interface AddressSectionProps {
  isCustomerLoggedIn: boolean;
  deliveryMethod: 'delivery' | 'pickup';
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export default function AddressSection({
  isCustomerLoggedIn,
  deliveryMethod,
  name,
  setName,
  phone,
  setPhone,
  address,
  setAddress,
  fieldErrors,
  setFieldErrors
}: AddressSectionProps) {
  return (
    <div className={`bg-[#111111] border border-white/5 rounded-[24px] p-6 shadow-2xl transition-opacity duration-300 ${!isCustomerLoggedIn ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
      <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-[var(--red)]/10 flex items-center justify-center text-[var(--red)]">3</span>
        {deliveryMethod === 'delivery' ? 'Delivery Details' : 'Contact Info'}
      </h2>
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-2 text-white/60 font-body">Full Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => { setName(e.target.value); setFieldErrors(p => ({...p, name: ''})) }} 
              className={`w-full bg-black/40 border ${fieldErrors.name ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
              placeholder="John Doe" 
            />
            {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-2 text-white/60 font-body">WhatsApp Phone</label>
            <div className="flex gap-2">
              <div className="bg-black/60 p-4 rounded-2xl border border-white/5 text-sm font-bold text-white/80">+91</div>
              <input 
                type="tel" 
                value={phone} 
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setFieldErrors(p => ({...p, phone: ''})) }} 
                placeholder="9876543210" 
                className={`flex-1 bg-black/40 border ${fieldErrors.phone ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-red-400 mt-1">{fieldErrors.phone}</p>}
          </div>
        </div>
        {deliveryMethod === 'delivery' && (
          <div className="animate-in fade-in duration-300">
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-2 text-white/60 font-body">Delivery Address</label>
            <textarea 
              value={address} 
              onChange={e => { setAddress(e.target.value); setFieldErrors(p => ({...p, address: ''})) }} 
              rows={3} 
              placeholder="Street, Landmark, City..." 
              className={`w-full bg-black/40 border ${fieldErrors.address ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body resize-none`} 
            />
            {fieldErrors.address && <p className="text-xs text-red-400 mt-1">{fieldErrors.address}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
