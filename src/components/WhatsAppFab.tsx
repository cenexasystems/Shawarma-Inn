import { MessageCircle } from 'lucide-react';

const WHATSAPP_PHONE = import.meta.env.VITE_OWNER_WHATSAPP || '918778024010';

interface WhatsAppFabProps {
  /** When true (cart bar visible), lift the FAB above the cart bar */
  liftedUp?: boolean;
}

export default function WhatsAppFab({ liftedUp = false }: WhatsAppFabProps) {
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
      aria-label="Contact us on WhatsApp"
      style={{
        position: 'fixed',
        right: 'max(1rem, env(safe-area-inset-right, 1rem))',
        // When liftedUp: sit above the 72px cart bar + safe area
        // When not: sit above safe area only
        bottom: liftedUp
          ? 'calc(4.5rem + max(1rem, env(safe-area-inset-bottom, 1rem)))'
          : 'max(1rem, env(safe-area-inset-bottom, 1rem))',
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: '9999px',
        backgroundColor: '#25D366',
        color: 'white',
        // 56px min touch target on mobile, expand on desktop
        minWidth: '56px',
        minHeight: '56px',
        padding: '0 1rem',
        boxShadow: '0 10px 25px rgba(37,211,102,0.4)',
        transition: 'transform 0.2s ease, bottom 0.3s ease',
        textDecoration: 'none',
      }}
      onTouchStart={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'; }}
      onTouchEnd={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
    >
      <MessageCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm font-semibold hidden md:inline whitespace-nowrap">WhatsApp Us</span>
    </a>
  );
}
