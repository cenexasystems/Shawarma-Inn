import { useEffect, useState } from 'react';
import { useStoreSettings } from '../context/SettingsContext';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { settings } = useStoreSettings();
  const supportWhatsapp = settings.whatsapp_number || import.meta.env.VITE_SUPPORT_WHATSAPP || import.meta.env.VITE_OWNER_WHATSAPP || '916382877479';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setError('');

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError('Name, phone number, and message are all required.');
      return;
    }

    const text = [
      'Support Request',
      '',
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      `Message: ${message.trim()}`,
    ].join('\n');

    window.open(`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent(text)}`, '_blank');

    setName('');
    setPhone('');
    setMessage('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/98 backdrop-blur-md transition-all duration-300 overflow-y-auto overscroll-contain"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-[#111111] rounded-[28px] sm:rounded-[32px] overflow-y-auto max-h-[calc(100vh-24px)] sm:max-h-[calc(100vh-48px)] shadow-[0_40px_120px_rgba(0,0,0,1)] border border-white/5 p-6 sm:p-10 my-3 sm:my-6">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-white/30 hover:text-white transition-all duration-300 hover:rotate-90"
          aria-label="Close support form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[var(--red)]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[var(--red)]/20 shadow-[0_0_40px_rgba(214,43,43,0.1)]">
            <svg className="w-10 h-10 text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-bebas text-5xl uppercase tracking-[4px] text-white mb-2 leading-none">SUPPORT</h2>
          <p className="text-white/40 text-[10px] items-center uppercase tracking-[3px] font-body mt-4">
            Send us a message, we'll reply on WhatsApp
          </p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit();
          }}
        >
          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="9000000000"
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-[3px] font-body text-[var(--red)]">
              Message
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="How can we help?"
              className="w-full bg-black/50 border border-white/5 rounded-2xl p-4 text-sm text-white focus:border-[var(--red)] outline-none transition-all placeholder:text-white/10 font-body shadow-inner resize-none"
            />
          </div>

          {error && (
            <div className="text-center text-sm text-red-400 bg-red-950/30 border border-red-500/30 rounded-2xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--red)] text-white rounded-full py-5 text-lg font-bebas tracking-[4px] hover:shadow-[0_0_40px_rgba(214,43,43,0.4)] transition-all active:scale-[0.98] uppercase"
          >
            Send via WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
