import { MapPin, Phone, MessageCircle } from 'lucide-react';
import Footer from '../components/Footer';
import { useStoreSettings } from '../context/SettingsContext';

const branches = [
  '📍 Mathur'
];

const CONTACT_PHONE = '6382877479';

export default function ContactPage() {
  const { settings } = useStoreSettings();
  const whatsappPhone = settings.whatsapp_number || import.meta.env.VITE_OWNER_WHATSAPP || '916382877479';
  return (
    <main className="min-h-screen bg-[var(--black)] text-white pt-24 pb-12 flex flex-col">
      <div className="flex-1 max-w-6xl mx-auto px-6 w-full">
        <div className="text-center mb-16">
          <p className="text-[11px] uppercase tracking-[4px] text-[var(--red)] font-bold mb-3">Get In Touch</p>
          <h1 className="font-bebas text-5xl md:text-7xl uppercase tracking-[4px]">
            Contact <span className="text-[var(--red)]">Us</span>
          </h1>
          <p className="mt-4 text-white/60 font-body text-lg max-w-xl mx-auto">
            Have questions, feedback, or need help with your order? Reach out to us instantly via WhatsApp or visit our flagship Mathur outlet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 lg:p-12">
            <h2 className="font-bebas text-3xl tracking-[2px] uppercase mb-6">Contact Info</h2>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5 text-[var(--red)]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-[2px] text-white/50 mb-1">Phone</h3>
                  <a href={`tel:+91${CONTACT_PHONE}`} className="text-xl font-bebas tracking-[1px] hover:text-[var(--red)] transition-colors">
                    +91 {CONTACT_PHONE}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[var(--red)]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-[2px] text-white/50 mb-1">Mathur Outlet</h3>
                  <p className="text-white/80 font-body text-sm leading-relaxed max-w-[250px]">
                    Shawarma Inn Mathur,<br/>
                    Mathur MMDA,<br/>
                    Chennai, Tamil Nadu
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/10">
              <h3 className="font-bebas text-2xl tracking-[2px] uppercase mb-4">Message Us</h3>
              <p className="text-white/60 text-sm mb-6">Get instant support for your orders on WhatsApp.</p>
              <a
                href={`https://wa.me/${whatsappPhone}?text=Hi%20Shawarma%20Inn!`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bebas text-xl tracking-[2px] py-4 rounded-xl uppercase transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div>
            <h2 className="font-bebas text-3xl tracking-[2px] uppercase mb-6">Our Locations</h2>
            <div className="bg-[#111111] border border-white/10 rounded-3xl p-8 mb-8">
              <p className="text-sm text-white/60 mb-6">We are currently operating directly from our Mathur branch. Check out our other locations across Chennai!</p>
              <div className="grid grid-cols-2 gap-4">
                {branches.map(branch => (
                  <div key={branch} className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-[var(--red)]" />
                    <span className="font-bold text-xs uppercase tracking-[1px]">{branch}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="font-bebas text-3xl tracking-[2px] uppercase mb-6">Find Us</h2>
            <div className="h-[300px] bg-[#111111] border border-white/10 rounded-3xl overflow-hidden relative">
              <iframe
                title="Shawarma Inn Mathur"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15540.380721757398!2d80.2458428131333!3d13.156350325451999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5265ab7b4097f5%3A0xc6c4f5ea7c92b952!2sMathur%2C%20Chennai%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1714578912345!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'grayscale(1) contrast(1.2) opacity(0.8)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
