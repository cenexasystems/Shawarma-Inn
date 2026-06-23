import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
import BranchMap from './BranchMap';
import branchesData from '../data/branches.json';
import type { Branch } from '../types';

const branches: Branch[] = branchesData as Branch[];

const buildEmbedMapUrl = (address: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

export default function MapsSection() {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState(branches[0]);

  return (
    <section id="branch" className="py-20 md:py-24 bg-[#0a0a0a] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12 text-center">
          <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">Find Us</p>
          <h2 className="mt-3 text-4xl md:text-5xl font-bebas text-white tracking-[3px] uppercase">
            OUR <span className="text-[#d62b2b]">BRANCHES</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10 lg:gap-12 items-start">
          {/* Left: branch navigation */}
          <div className="space-y-2">
            {branches.map((branch) => {
              const isActive = activeBranch.id === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => setActiveBranch(branch)}
                  className={`w-full flex gap-4 items-start p-4 rounded-2xl text-left transition-all duration-300 group ${
                    isActive
                      ? 'bg-white/5 border border-white/10 ring-1 ring-[#d62b2b]/40 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <MapPin
                    className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${
                      isActive ? 'text-[#d62b2b]' : 'text-white/25 group-hover:text-white/40'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-headline font-bold tracking-[1.5px] uppercase text-sm transition-colors ${
                          isActive ? 'text-white' : 'text-white/40'
                        }`}
                      >
                        {branch.name}
                      </h4>
                      {branch.isFlagship && (
                        <span className="text-[9px] font-bold uppercase tracking-[1.5px] text-[#d62b2b] bg-[#d62b2b]/10 border border-[#d62b2b]/30 rounded-full px-2 py-0.5">
                          Flagship
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs leading-relaxed mt-1.5 transition-colors ${
                        isActive ? 'text-white/60' : 'text-white/25'
                      }`}
                    >
                      {branch.address}
                    </p>
                    <p className={`text-[11px] mt-1.5 ${isActive ? 'text-white/40' : 'text-white/20'}`}>
                      {branch.hours}
                    </p>
                    {isActive && (
                      <a
                        href={branch.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-bold uppercase tracking-[2px] text-[#d62b2b] hover:text-white transition-colors"
                      >
                        Get Directions
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </button>
              );
            })}

            <button
              onClick={() => navigate('/branches')}
              className="mt-6 border border-white/10 text-white px-7 py-3 rounded-full font-headline font-bold text-xs tracking-widest uppercase hover:bg-white/5 hover:border-white/30 transition-all"
            >
              VIEW ALL {branches.length} BRANCHES
            </button>
          </div>

          {/* Right: interactive map */}
          <div className="relative group lg:sticky lg:top-24">
            <div className="absolute -inset-4 bg-[#d62b2b]/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBranch.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35 }}
                className="relative z-10"
              >
                <BranchMap mapUrl={buildEmbedMapUrl(activeBranch.address)} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
