import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, MapPin, Zap } from 'lucide-react';

const AnimatedCounter = ({ from = 0, to, duration = 2, inView }: { from?: number, to: number, duration?: number, inView: boolean }) => {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (!inView) return;
    
    let startTime: number;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      
      // Easing out function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * (to - from) + from));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };

    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [from, to, duration, inView]);

  return <span>{count}</span>;
};

export default function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const stats = [
    {
      value: 1000,
      suffix: '+',
      label: 'Happy Customers',
      icon: Users
    },
    {
      value: 6,
      suffix: '',
      label: 'Locations Across Chennai',
      icon: MapPin
    },
    {
      value: 100, // percentage for "Fast & Fresh" abstract representation or just text. The design requested "Fast & Fresh Service"
      isText: true,
      textValue: 'FAST',
      label: '& Fresh Service',
      icon: Zap
    }
  ];

  return (
    <section className="py-20 bg-[var(--black)] relative z-10">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="max-w-[1200px] mx-auto px-6" ref={ref}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/5 rounded-3xl p-8 lg:p-12 relative overflow-hidden"
        >
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--red)]/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
            
            {stats.map((stat, idx) => (
              <div key={idx} className={`flex flex-col items-center justify-center text-center ${idx !== 0 ? 'pt-8 md:pt-0' : ''}`}>
                <div className="w-14 h-14 rounded-full bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl shadow-[var(--red)]/5">
                  <stat.icon className="w-6 h-6 text-[var(--red)]" />
                </div>
                
                <h3 className="font-bebas text-5xl lg:text-6xl tracking-[2px] text-white mb-2 flex items-center justify-center min-h-[60px]">
                  {stat.isText ? (
                    <span>{stat.textValue}</span>
                  ) : (
                    <>
                      <AnimatedCounter to={stat.value as number} inView={isInView} />
                      {stat.suffix}
                    </>
                  )}
                </h3>
                
                <p className="font-body text-white/50 text-xs tracking-[4px] uppercase font-bold">
                  {stat.label}
                </p>
              </div>
            ))}

          </div>
        </motion.div>
      </div>
    </section>
  );
}
