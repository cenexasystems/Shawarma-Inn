import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Megaphone, GraduationCap, Handshake, CheckCircle2 } from 'lucide-react';
import { franchiseApi } from '../lib/api';

const WHATSAPP_PHONE = import.meta.env.VITE_OWNER_WHATSAPP || '916382877479';

const highlights = [
  {
    icon: TrendingUp,
    title: 'Mathur Pilot',
    desc: 'Our flagship branch proves the model works with consistent high volume and local loyalty.',
  },
  {
    icon: Megaphone,
    title: 'Direct Ordering Model',
    desc: 'We bypass heavy aggregator commissions with our own robust direct ordering platform.',
  },
  {
    icon: GraduationCap,
    title: 'Rapido Delivery Model',
    desc: 'Optimized delivery utilizing Rapido and Porter for fast, low-cost fulfillment.',
  },
  {
    icon: Handshake,
    title: 'Scalable Operations',
    desc: 'Simple, repeatable kitchen processes designed for rapid training and consistent quality.',
  },
];

const benefits = [
  'High Demand for authentic flame-grilled Lebanese cuisine',
  'Simple Operations with standardized central recipes',
  'Scalable Model designed for high ROI and fast expansion',
  'Complete training and ongoing operational support',
];

const branches = [
  'Mathur (Pilot)',
  'Madhavaram',
  'Kolathur',
  'Retteri',
  'Thirumullaivoyal',
  'Kodungaiyur'
];

export default function FranchiseSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [investment, setInvestment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const redirectToWhatsApp = () => {
    const text = [
      `Name: ${name}`,
      `Phone: ${phone}`,
      `City: ${city}`,
      `Investment Range: ${investment}`,
    ]
      .filter(Boolean)
      .join('\n');

    window.location.assign(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`);
  };

  const submitFranchiseLead = async () => {
    setError('');
    setSuccess('');

    if (!name.trim() || !phone.trim() || !city.trim() || !investment.trim()) {
      setError('Name, phone number, city, and investment range are required.');
      return;
    }



    try {
      setSaving(true);
      await franchiseApi.submitLead({
        name: name.trim(),
        phone: phone.trim(),
        email: 'franchise@shawarmainn.com',
        city: city.trim(),
        message: `Investment range: ${investment.trim()}`,
      });
      redirectToWhatsApp();
      setName('');
      setPhone('');
      setCity('');
      setInvestment('');
    } catch {
      // WhatsApp is the primary handoff. A temporary lead API failure must not
      // prevent the founder from receiving the enquiry.
      redirectToWhatsApp();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="franchise" className="bg-[#0b0b0b] border-t border-white/5">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-8 pt-24 pb-8 text-center"
      >
        <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">Franchise Opportunity</p>
        <h2 className="mt-3 text-5xl md:text-6xl font-bebas tracking-[3px] uppercase leading-none">
          Start Your Own <span className="hero-brand">Shawarma Inn</span>
        </h2>
        <p className="mt-5 max-w-2xl mx-auto text-white/70 font-body leading-relaxed">
          Join our proven business model that combines authentic flame-grilled Lebanese recipes with a highly optimized direct-ordering and Rapido delivery system.
        </p>
      </motion.div>

      {/* Business highlight cards */}
      <div className="max-w-6xl mx-auto px-8 pb-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {highlights.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
            className="bg-[#151515] border border-white/10 rounded-2xl p-6 hover:border-[#d62b2b]/40 transition-colors"
          >
            <item.icon className="w-8 h-8 text-[#d62b2b]" />
            <h3 className="mt-4 font-headline font-bold text-white text-sm uppercase tracking-[1.5px]">
              {item.title}
            </h3>
            <p className="mt-2 text-sm text-white/60 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Benefits + Application form */}
      <div className="max-w-6xl mx-auto px-8 pb-24 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="bg-[#151515] border border-white/10 rounded-3xl p-8"
        >
          <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-5">Why Franchise</h3>
          <a
            href="/Shawarma Inn - Franchise Brochure.pdf"
            download
            className="mb-6 inline-flex w-full items-center justify-center rounded-2xl border border-[#d62b2b] px-4 py-3 text-center text-xs font-bold uppercase tracking-[2px] text-white transition-colors hover:bg-[#d62b2b]"
          >
            Download Franchise Brochure
          </a>
          <ul className="space-y-4 mb-8">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#d62b2b] shrink-0 mt-0.5" />
                <span className="text-sm text-white/70 leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
          
          <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-5 mt-8">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-black/50 border border-white/5 p-4 rounded-xl text-center">
              <span className="block text-[10px] text-[var(--red)] uppercase tracking-[2px] font-bold mb-1">Investment Range</span>
              <span className="text-lg font-bebas tracking-wide text-white">₹8L - ₹15L</span>
            </div>
            <div className="bg-black/50 border border-white/5 p-4 rounded-xl text-center">
              <span className="block text-[10px] text-[var(--red)] uppercase tracking-[2px] font-bold mb-1">Space Required</span>
              <span className="text-lg font-bebas tracking-wide text-white">150 - 300 sq.ft</span>
            </div>
            <div className="bg-black/50 border border-white/5 p-4 rounded-xl text-center">
              <span className="block text-[10px] text-[var(--red)] uppercase tracking-[2px] font-bold mb-1">ROI Estimate</span>
              <span className="text-lg font-bebas tracking-wide text-white">12 - 18 Months</span>
            </div>
          </div>
          
          <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-5">Existing Outlets</h3>
          <div className="flex flex-wrap gap-2">
            {branches.map(branch => (
              <span key={branch} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white/80 uppercase tracking-widest">
                {branch}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="bg-[#151515] border border-white/10 rounded-3xl p-8"
        >
          <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-5">Apply For Franchise</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your Name"
              className="w-full appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Phone Number"
              className="w-full appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
            />
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className="w-full appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
            />
            <select
              value={investment}
              onChange={(event) => setInvestment(event.target.value)}
              className="w-full appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white/50 outline-none focus:border-[#d62b2b] cursor-pointer"
            >
              <option value="" disabled>Select Investment Range</option>
              <option value="₹8L - ₹10L" className="text-black">₹8L - ₹10L</option>
              <option value="₹10L - ₹15L" className="text-black">₹10L - ₹15L</option>
              <option value="Above ₹15L" className="text-black">Above ₹15L</option>
            </select>
          </div>



          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          {success && <p className="mt-3 text-sm text-emerald-400">{success}</p>}

          <button
            type="button"
            onClick={() => {
              void submitFranchiseLead();
            }}
            disabled={saving}
            className="w-full mt-5 bg-[#d62b2b] text-white rounded-2xl py-4 font-headline font-bold uppercase tracking-[2px] hover:bg-[#bf2323] transition-colors disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Talk to Founder'}
          </button>
          <p className="mt-3 text-[11px] text-white/40 text-center">
            Submit your details to continue directly to WhatsApp with the founder.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
