import { MessageCircle } from 'lucide-react';

const WHATSAPP_PHONE = import.meta.env.VITE_OWNER_WHATSAPP || '919003195805';

export default function WhatsAppFab() {
  const targetUrl = WHATSAPP_PHONE
    ? `https://wa.me/${WHATSAPP_PHONE}`
    : undefined;

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
      className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[70] flex items-center gap-2 rounded-full bg-[#25D366] text-white px-4 py-3 shadow-[0_10px_25px_rgba(37,211,102,0.35)] hover:scale-[1.03] active:scale-[0.98] transition-transform"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold">WhatsApp Us</span>
    </a>
  );
}
