import React from 'react';

export interface AddressData {
  houseNo: string;
  street: string;
  area: string;
  landmark: string;
  city: string;
  pincode: string;
}

interface AddressSectionProps {
  isCustomerLoggedIn: boolean;
  deliveryMethod: 'self_delivery' | 'we_arrange' | 'pickup';
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  addressData: AddressData;
  setAddressData: React.Dispatch<React.SetStateAction<AddressData>>;
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
  addressData,
  setAddressData,
  fieldErrors,
  setFieldErrors
}: AddressSectionProps) {
  const updateAddress = (field: keyof AddressData, value: string) => {
    setAddressData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
  };
  return (
    <div className={`bg-[#111111] border border-white/5 rounded-[24px] p-4 sm:p-6 shadow-2xl transition-opacity duration-300 ${!isCustomerLoggedIn ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
      <h2 className="font-bebas text-2xl uppercase tracking-[2px] text-[var(--red)] mb-6 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-[var(--red)]/10 flex items-center justify-center text-[var(--red)]">3</span>
        {deliveryMethod === 'we_arrange' ? 'Delivery Details' : 'Contact Info'}
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
        {deliveryMethod === 'we_arrange' && (
          <div className="animate-in fade-in duration-300">
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-4 text-white/60 font-body">Delivery Address</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <input 
                  value={addressData.houseNo} 
                  onChange={e => updateAddress('houseNo', e.target.value)} 
                  placeholder="House / Flat Number *" 
                  className={`w-full bg-black/40 border ${fieldErrors.houseNo ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
                />
                {fieldErrors.houseNo && <p className="text-xs text-red-400 mt-1">{fieldErrors.houseNo}</p>}
              </div>
              <div className="md:col-span-2">
                <input 
                  value={addressData.street} 
                  onChange={e => updateAddress('street', e.target.value)} 
                  placeholder="Street Name *" 
                  className={`w-full bg-black/40 border ${fieldErrors.street ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
                />
                {fieldErrors.street && <p className="text-xs text-red-400 mt-1">{fieldErrors.street}</p>}
              </div>
              <div>
                <input 
                  value={addressData.area} 
                  onChange={e => updateAddress('area', e.target.value)} 
                  placeholder="Area / Locality *" 
                  className={`w-full bg-black/40 border ${fieldErrors.area ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
                />
                {fieldErrors.area && <p className="text-xs text-red-400 mt-1">{fieldErrors.area}</p>}
              </div>
              <div>
                <input 
                  value={addressData.landmark} 
                  onChange={e => updateAddress('landmark', e.target.value)} 
                  placeholder="Landmark (Optional)" 
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body" 
                />
              </div>
              <div>
                <input 
                  value={addressData.city} 
                  onChange={e => updateAddress('city', e.target.value)} 
                  placeholder="City *" 
                  className={`w-full bg-black/40 border ${fieldErrors.city ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
                />
                {fieldErrors.city && <p className="text-xs text-red-400 mt-1">{fieldErrors.city}</p>}
              </div>
              <div>
                <input 
                  value={addressData.pincode} 
                  onChange={e => updateAddress('pincode', e.target.value)} 
                  placeholder="Pincode *" 
                  className={`w-full bg-black/40 border ${fieldErrors.pincode ? 'border-red-500' : 'border-white/5'} rounded-2xl p-4 text-sm focus:border-[var(--red)] outline-none transition-all font-body`} 
                />
                {fieldErrors.pincode && <p className="text-xs text-red-400 mt-1">{fieldErrors.pincode}</p>}
              </div>
            </div>
          </div>
        )}

        {deliveryMethod === 'self_delivery' && (
          <div className="animate-in fade-in duration-300 bg-[var(--charcoal)] border border-[var(--border)] rounded-2xl p-5 mt-4">
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-3 text-white/60 font-body">Mathur Outlet Address</label>
            <p className="text-sm font-body text-white/80 leading-relaxed mb-4">
              Book Rapido/Porter from this address to your location. Add your delivery details in the partner app.
            </p>
            <div className="bg-black/50 p-4 rounded-xl mb-4 font-mono text-sm text-white/90">
              Shawarma Inn Mathur,<br/>
              Mathur MMDA,<br/>
              Chennai
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText("Shawarma Inn Mathur, Mathur MMDA, Chennai")}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-colors"
              >
                Copy Address
              </button>
              <a
                href="https://maps.google.com/?q=Shawarma+Inn+Mathur"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[var(--red)]/20 hover:bg-[var(--red)]/40 text-[var(--red)] border border-[var(--red)]/30 font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition-colors text-center"
              >
                Open Maps
              </a>
            </div>
          </div>
        )}

        {deliveryMethod === 'pickup' && (
          <div className="animate-in fade-in duration-300 bg-[var(--charcoal)] border border-[var(--border)] rounded-2xl p-5 mt-4">
            <label className="block text-[10px] font-bold uppercase tracking-[4px] mb-3 text-white/60 font-body">Store Pickup Information</label>
            <p className="text-sm font-body text-white/80 leading-relaxed mb-4">
              Your order will be ready at our Mathur outlet. Please collect it within 30 minutes of placing the order.
            </p>
            <div className="bg-black/50 p-4 rounded-xl font-mono text-sm text-white/90">
              Shawarma Inn Mathur,<br/>
              Mathur MMDA,<br/>
              Chennai
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
