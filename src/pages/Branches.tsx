import { useState } from 'react';
import Footer from '../components/Footer';
import branchesData from '../data/branches.json';
import type { Branch } from '../types';

const branches = branchesData as Branch[];

export default function Branches() {
  const [activeBranch, setActiveBranch] = useState<Branch>(branches.find(b => b.isFlagship) || branches[0]);

  return (
    <main className="pt-[80px] min-h-screen bg-[var(--black)]">
      <section className="max-w-7xl mx-auto px-8 py-16">
        <h1 className="font-bebas text-6xl md:text-8xl tracking-wide uppercase mb-4 text-[var(--white)] text-center">
          OUR LOCATIONS
        </h1>
        <p className="text-center font-body text-[var(--white)]/60 text-lg md:text-xl max-w-2xl mx-auto mb-16">
          Find the nearest Shawarma Inn sanctuary for your nocturnal cravings.
        </p>

        {/* 3 columns grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {branches.map(branch => (
            <div
              key={branch.id}
              onClick={() => setActiveBranch(branch)}
              className={`cursor-pointer group bg-[var(--card-bg)] rounded-[16px] overflow-hidden border transition-all duration-300 ${
                activeBranch.id === branch.id ? 'border-[var(--red)] ring-1 ring-[var(--red)]' : 'border-[var(--border)] hover:border-[var(--white)]/30'
              }`}
            >
              {/* Branch photo */}
              <div className="relative h-48 overflow-hidden bg-[var(--charcoal)]">
                <img 
                  src={branch.imageUrl || branch.image} 
                  alt={branch.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6">
                  {branch.isFlagship && (
                    <span className="w-max bg-[var(--red)] text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-sm mb-2">
                       FLAGSHIP STORE
                    </span>
                  )}
                  <h3 className="font-bebas text-2xl tracking-wide text-white">{branch.name}</h3>
                </div>
              </div>
              
              <div className="p-6 font-body">
                <p className="text-[var(--white)]/70 text-sm mb-4 leading-relaxed line-clamp-2 min-h-[40px]">{branch.address}</p>
                <div className="flex flex-col gap-2 text-sm text-[var(--white)]">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {branch.hours}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {branch.phone}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map iframe at bottom */}
        <div className="mt-16 bg-[var(--card-bg)] rounded-xl border border-[var(--border)] overflow-hidden shadow-2xl w-full h-[400px]">
           {activeBranch ? (
             <iframe 
               src={`https://maps.google.com/maps?q=${encodeURIComponent(activeBranch.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
               width="100%" 
               height="100%" 
               style={{ border: 0 }} 
               allowFullScreen 
               loading="lazy" 
               referrerPolicy="no-referrer-when-downgrade"
             />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-[var(--white)]/40 font-bebas text-2xl">
               Map Unavailable
             </div>
           )}
        </div>

      </section>
      <Footer />
    </main>
  );
}
