import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Megaphone, GraduationCap, Handshake, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { franchiseApi } from '../lib/api';

const WHATSAPP_PHONE = import.meta.env.VITE_OWNER_WHATSAPP || '919003195805';

const highlights = [
  {
    icon: TrendingUp,
    title: 'Growing Brand',
    desc: 'Backed by a fast-expanding Lebanese QSR brand with a loyal, repeat customer base across Chennai.',
  },
  {
    icon: Megaphone,
    title: 'Marketing Support',
    desc: 'Launch campaigns, social media playbooks, and local marketing assets provided for every new outlet.',
  },
  {
    icon: GraduationCap,
    title: 'Operations Training',
    desc: 'Hands-on kitchen, hygiene, and service training for your team before and after launch day.',
  },
  {
    icon: Handshake,
    title: 'Business Assistance',
    desc: 'Site selection guidance, vendor connects, and ongoing support from our franchise success team.',
  },
];

const benefits = [
  'Proven flame-grilled kitchen model with standardized recipes',
  'Dedicated onboarding manager for your first 90 days',
  'Centralized recipe and supply chain support',
  'Access to delivery partner integrations (Swiggy, Zomato, Porter)',
];

export default function FranchiseSection() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Shawarma Inn — Franchise Enquiry', 14, 20);
    doc.setDrawColor(214, 43, 43);
    doc.setLineWidth(0.8);
    doc.line(14, 24, 196, 24);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lines: [string, string][] = [
      ['Name', name],
      ['Phone Number', phone],
      ['Email', email],
      ['City', city],
      ['Message', message || '—'],
      ['Submitted On', new Date().toLocaleString('en-IN')],
    ];

    let y = 38;
    lines.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      const wrapped = doc.splitTextToSize(value, 130);
      doc.text(wrapped, 60, y);
      y += 10 * wrapped.length;
    });

    doc.save(`shawarma-inn-franchise-enquiry-${Date.now()}.pdf`);
  };

  const openWhatsApp = () => {
    const text = [
      'Hi Shawarma Inn, I am interested in a franchise opportunity.',
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Email: ${email}`,
      `City: ${city}`,
      message ? `Message: ${message}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const submitFranchiseLead = async () => {
    setError('');
    setSuccess('');

    if (!name.trim() || !phone.trim() || !email.trim() || !city.trim()) {
      setError('Name, phone number, email, and city are required.');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setSaving(true);
      await franchiseApi.submitLead({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        message: `City: ${city.trim()}${message.trim() ? ` | Message: ${message.trim()}` : ''}`,
      });

      generatePdf();
      openWhatsApp();

      setSuccess('Thanks! Your franchise enquiry PDF has been downloaded and our WhatsApp chat is opening.');
      setName('');
      setPhone('');
      setEmail('');
      setCity('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your details. Please try again.');
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
        className="max-w-6xl mx-auto px-8 pt-24 pb-12 text-center"
      >
        <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">Franchise Opportunity</p>
        <h2 className="mt-3 text-5xl md:text-6xl font-bebas tracking-[3px] uppercase leading-none">
          <span className="hero-brand">Shawarma Inn</span> Is Open For Franchise
        </h2>
        <p className="mt-5 max-w-2xl mx-auto text-white/70 font-body leading-relaxed">
          Expand with our proven kitchen model and growing customer base. Partner with us and bring authentic,
          flame-grilled Lebanese food to your city.
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
          <h3 className="font-bebas text-2xl tracking-[2px] uppercase text-white mb-5">Franchise Benefits</h3>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#d62b2b] shrink-0 mt-0.5" />
                <span className="text-sm text-white/70 leading-relaxed">{benefit}</span>
              </li>
            ))}
          </ul>
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
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email Address"
              className="w-full appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
            />
            <input
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="City"
              className="w-full appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b]"
            />
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder="Message (optional)"
            className="w-full mt-4 appearance-none bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white outline-none focus:border-[#d62b2b] resize-none"
          />

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
            {saving ? 'Submitting...' : 'Submit Franchise Application'}
          </button>
          <p className="mt-3 text-[11px] text-white/40 text-center">
            Submitting downloads a PDF copy of your enquiry and opens WhatsApp to chat with our franchise team.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
