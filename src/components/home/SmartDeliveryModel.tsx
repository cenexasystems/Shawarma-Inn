import { motion } from 'framer-motion';
import { MonitorSmartphone, ChefHat, Bike, Home } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function SmartDeliveryModel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      step: "01",
      title: "Place Your Order",
      desc: "Choose your favorite Shawarma, customize your meal and place the order directly from our website.",
      icon: MonitorSmartphone
    },
    {
      step: "02",
      title: "We Prepare Fresh",
      desc: "Our chefs immediately begin preparing your food using freshly grilled ingredients.",
      icon: ChefHat
    },
    {
      step: "03",
      title: "Book Rapido / Porter",
      desc: "Book a Rapido or Porter pickup from our Mathur outlet to your delivery location.",
      icon: Bike
    },
    {
      step: "04",
      title: "Enjoy Your Shawarma",
      desc: "Your freshly prepared Shawarma reaches you quickly while maintaining maximum freshness and taste.",
      icon: Home
    }
  ];

  // Optimized GSAP scroll animation
  useEffect(() => {
    if (!containerRef.current || !progressRef.current || !timelineRef.current) return;

    const progressBar = progressRef.current;
    const stepsArray = stepsRef.current.filter(Boolean);

    if (stepsArray.length === 0) return;

    // Main timeline progress with smooth scroll linkage
    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3,
      onUpdate: (self) => {
        const progress = self.progress * 100;
        const scaleY = (progress / 100) * stepsArray.length;

        gsap.to(progressBar, {
          scaleY: scaleY,
          ease: "power2.out",
          duration: 0.2,
          transformOrigin: "top"
        });
      }
    });

    // Individual step animations
    stepsArray.forEach((stepElement, index) => {
      if (!stepElement) return;

      // Create timeline for this step
      const stepTl = gsap.timeline({
        scrollTrigger: {
          trigger: stepElement,
          start: "center center",
          end: "center center",
          scrub: 0.5,
          toggleActions: "play none none reverse"
        }
      });

      // Animate timeline dot
      stepTl.to(`.timeline-dot-${index}`, {
        scale: 1.5,
        boxShadow: '0 0 30px rgba(214, 43, 43, 0.8)',
        duration: 0.3,
        ease: "back.out(1.7)"
      }, 0);

      // Animate step card with stagger
      stepTl.to(stepElement, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out"
      }, 0);

      // Previous steps fade out with scale
      if (index > 0) {
        const prevSteps = stepsArray.slice(0, index);
        stepTl.to(prevSteps, {
          opacity: 0.3,
          scale: 0.95,
          duration: 0.5,
          ease: "power2.out"
        }, 0);
      }

      // Glow effect for active step
      stepTl.to(`.timeline-dot-${index}`, {
        boxShadow: '0 0 50px rgba(214, 43, 43, 1)',
        duration: 0.5
      }, 0.3);

      // Rotate icon for fun animation
      stepTl.to(`.step-icon-${index}`, {
        rotation: 360,
        duration: 1,
        ease: "back.out(1.7)"
      }, 0);

      // Floating animation for step card
      gsap.to(stepElement, {
        y: -10,
        duration: 2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        scrollTrigger: {
          trigger: stepElement,
          start: "center center",
          end: "center center",
          scrub: true
        }
      });
    });

    return () => {
      st.kill();
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger !== containerRef.current) trigger.kill();
      });
    };
  }, [steps.length]);

  // Mouse move parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const x = clientX / window.innerWidth - 0.5;
      const y = clientY / window.innerHeight - 0.5;

      gsap.to(containerRef.current, {
        backgroundPositionX: `${x * 20}px`,
        backgroundPositionY: `${y * 20}px`,
        duration: 0.5,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // CSS for charcoal texture (inline to avoid issues with template literals)
  const charcoalTextureStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat',
    backgroundSize: '200px 200px'
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full min-h-screen bg-[var(--black)] border-t border-white/5 overflow-hidden"
    >
      {/* Cinematic Background with dynamic gradients */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--black)] via-[var(--charcoal)] to-[var(--black)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--red)_0%,_transparent_70%)] opacity-20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--orange)_0%,_transparent_50%)] opacity-10" />
      </div>

      {/* Charcoal Texture with animated opacity */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={charcoalTextureStyle} />
      </div>

      <div ref={containerRef} className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 min-h-screen flex items-center">
        <div className="w-full py-32">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-32"
          >
            <motion.p
              className="text-[11px] uppercase tracking-[4px] text-[var(--red)] font-bold mb-4 drop-shadow-[0_0_20px_rgba(214,43,43,0.5)]"
              initial={{ opacity: 0, letterSpacing: '10px' }}
              whileInView={{ opacity: 1, letterSpacing: '4px' }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Mathur Exclusive
            </motion.p>
            <motion.h2
              className="text-5xl md:text-7xl font-bebas text-white tracking-[3px] uppercase drop-shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            >
              Smart <span className="text-white/40">Delivery Model</span>
            </motion.h2>
            <motion.p
              className="mt-8 text-xl text-white/60 max-w-2xl mx-auto font-body"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Watch your order journey unfold in real-time as you scroll through our seamless ordering experience
            </motion.p>
          </motion.div>

          {/* Main Content with Timeline */}
          <div className="relative">
            {/* Vertical Timeline - Left Side Desktop, Center Mobile */}
            <div
              ref={timelineRef}
              className="hidden lg:block absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-transparent via-[var(--red)]/50 to-transparent z-20"
            >
              {/* Active Progress Line */}
              <div
                ref={progressRef}
                className="absolute top-0 left-0 w-full origin-top bg-gradient-to-b from-[var(--red)] via-[var(--orange)] to-transparent shadow-[0_0_30px_rgba(214,43,43,0.6)]"
                style={{ transformOrigin: 'top' }}
              />
              <div className="absolute -left-2 top-0 w-1 h-2 rounded-full bg-[var(--red)] shadow-[0_0_20px_rgba(214,43,43,0.8)]" />
            </div>

            {/* Steps Container */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-12">
              {steps.map((s, idx) => (
                <motion.div
                  key={idx}
                  ref={(el) => {
                    stepsRef.current[idx] = el;
                  }}
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.8,
                    delay: idx * 0.2,
                    ease: "easeOut"
                  }}
                  className="relative pl-0 lg:pl-16 step-card"
                >
                  {/* Timeline Dot */}
                  <motion.div
                    className={`step-icon-${idx} timeline-dot-${idx} hidden lg:block absolute left-0 w-6 h-6 rounded-full border-2 border-[var(--red)] bg-[var(--black)] z-30 transition-all duration-300 ${idx === 0 ? 'shadow-[0_0_20px_rgba(214,43,43,0.6)]' : ''}`}
                    whileHover={{ scale: 1.2 }}
                  />

                  {/* Step Card */}
                  <motion.div
                    className="group relative bg-[#0f0f0f]/80 backdrop-blur-md border border-white/10 rounded-[32px] p-8 md:p-10 overflow-hidden hover:border-[var(--red)]/30 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(214,43,43,0.2)]"
                    whileHover={{
                      scale: 1.02,
                      boxShadow: '0 0 50px rgba(214,43,43,0.3)'
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Hover Gradient */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-[var(--red)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

                    {/* Phase Number with animated line */}
                    <motion.div
                      className="text-xs font-bebas tracking-[4px] text-[var(--red)] mb-4 uppercase flex items-center gap-2"
                      whileHover={{ scale: 1.05, x: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <span className="w-8 h-0.5 bg-gradient-to-r from-[var(--red)] to-transparent" />
                      Phase {s.step}
                    </motion.div>

                    {/* Icon Circle with hover effects */}
                    <motion.div
                      className="relative w-20 h-20 rounded-3xl bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[var(--red)] mb-8 shadow-2xl group-hover:border-[var(--red)]/50 group-hover:shadow-[0_0_30px_rgba(214,43,43,0.4)] transition-all duration-500 overflow-hidden"
                      whileHover={{
                        scale: 1.1,
                        rotate: 5,
                        boxShadow: '0 0 30px rgba(214,43,43,0.5)'
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-[var(--red)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <s.icon className="w-10 h-10 relative z-10" />
                    </motion.div>

                    {/* Text Content with hover effects */}
                    <motion.h3
                      className="font-bebas text-3xl tracking-[1px] text-white uppercase mb-4"
                      whileHover={{ color: 'rgba(255,255,255,0.9)' }}
                      transition={{ duration: 0.3 }}
                    >
                      {s.title}
                    </motion.h3>
                    <motion.p
                      className="font-body text-white/50 text-base leading-relaxed"
                      whileHover={{ color: 'rgba(255,255,255,0.7)' }}
                      transition={{ duration: 0.3 }}
                    >
                      {s.desc}
                    </motion.p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
