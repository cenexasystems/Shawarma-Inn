import { motion } from 'framer-motion';
import { MonitorSmartphone, ChefHat, Bike, Home } from 'lucide-react';

export default function SmartDeliveryModel() {
  const steps = [
    {
      step: "01",
      title: "Order Online",
      desc: "Place your order directly on our website from the Mathur Menu.",
      icon: MonitorSmartphone
    },
    {
      step: "02",
      title: "We Prepare",
      desc: "We flame-grill and pack your food fresh and hot at our Mathur outlet.",
      icon: ChefHat
    },
    {
      step: "03",
      title: "Book Rapido/Porter",
      desc: "Book a local delivery partner from our outlet to your location.",
      icon: Bike
    },
    {
      step: "04",
      title: "Delivered",
      desc: "Enjoy authentic Lebanese shawarma delivered right to your door.",
      icon: Home
    }
  ];

  return (
    <section className="py-32 bg-[var(--black)] border-t border-white/5 relative overflow-hidden">
      {/* Cinematic Red Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1000px] h-[400px] bg-[var(--red)]/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="text-center mb-24">
          <p className="text-[11px] uppercase tracking-[4px] text-[var(--red)] font-bold mb-4">Mathur Exclusive</p>
          <h2 className="text-5xl md:text-6xl font-bebas text-white tracking-[3px] uppercase drop-shadow-lg">
            Smart <span className="text-white/40">Delivery Model</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connecting Line Desktop */}
          <div className="hidden lg:block absolute top-[100px] left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {steps.map((s, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="relative group flex flex-col items-center text-center"
              >
                {/* Connecting Line Mobile/Tablet */}
                {idx !== steps.length - 1 && (
                  <div className="block lg:hidden absolute top-[200px] left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-white/20 to-transparent" />
                )}

                {/* Animated Number Badge */}
                <span className="text-xs font-bebas tracking-[4px] text-[var(--red)] mb-4 uppercase">Phase {s.step}</span>

                {/* Icon Circle */}
                <div className="relative w-28 h-28 rounded-3xl bg-[#0f0f0f] border border-white/10 flex items-center justify-center text-white/50 mb-8 shadow-2xl group-hover:border-white/30 group-hover:text-white transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <s.icon className="w-10 h-10 relative z-10 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-500" />
                </div>
                
                {/* Text Content */}
                <h3 className="font-bebas text-3xl tracking-[1px] text-white uppercase mb-4">
                  {s.title}
                </h3>
                <p className="font-body text-white/50 text-base leading-relaxed max-w-[240px]">
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
