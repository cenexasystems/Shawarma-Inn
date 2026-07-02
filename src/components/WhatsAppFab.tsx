import { MessageCircle } from 'lucide-react';

const WHATSAPP_PHONE = import.meta.env.VITE_OWNER_WHATSAPP || '918778024010';

interface WhatsAppFabProps {
  /** Lifts the button above the floating "CHECKOUT" bar so they never overlap. */
  liftedUp?: boolean;
}

export default function WhatsAppFab({ liftedUp = false }: WhatsAppFabProps) {
  const targetUrl = WHATSAPP_PHONE
    ? `https://wa.me/${WHATSAPP_PHONE}`
    : undefined;

  const bottomClass = liftedUp ? 'bottom-24 md:bottom-28' : 'bottom-4 md:bottom-6';

  return (
    <a
      href={targetUrl || '#'}
      target={targetUrl ? '_blank' : undefined}
      rel={targetUrl ? 'noreferrer' : undefined}
      title={targetUrl ? 'WhatsApp Us' : 'Coming soon'}
      onClick={(event) => {
        if (!targetUrl) {
          event.preventDefault();
          window.alert('WhatsApp contact is coming soon.');
        }
      }}
      className={`fixed right-4 md:right-6 z-[70] flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white p-3 md:px-4 md:py-3 shadow-[0_10px_25px_rgba(37,211,102,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-transform ${bottomClass}`}
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden md:inline">WhatsApp Us</span>
    </a>
  );
}
