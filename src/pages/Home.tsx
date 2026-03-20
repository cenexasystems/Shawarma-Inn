import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import BranchMap from '../components/BranchMap';

const branches = [
  { 
    name: 'KOLATHUR MAIN', 
    address: '12/4, Main Road, Kolathur, Chennai', 
    mapUrl: 'https://maps.google.com/maps?q=Shawarma+Inn+Kolathur+Chennai&output=embed'
  },
  { 
    name: 'MADHAVAVARAM', 
    address: 'Grand Northern Trunk Rd, Madhavaram, Chennai',
    mapUrl: 'https://maps.google.com/maps?q=Shawarma+Inn+Madhavaram+Chennai&output=embed'
  },
  { 
    name: 'KKD NAGAR', 
    address: 'KKD Nagar Main Road, Chennai',
    mapUrl: 'https://maps.google.com/maps?q=Shawarma+Inn+KKD+Nagar+Chennai&output=embed'
  },
  { 
    name: 'THIRUMULLAIVOYIL', 
    address: 'Thirumullaivoyal Main Road, Chennai',
    mapUrl: 'https://maps.google.com/maps?q=Shawarma+Inn+Thirumullaivoyal+Chennai&output=embed'
  },
  { 
    name: 'MATHUR BRANCH', 
    address: 'Mathur Main Road, Chennai',
    mapUrl: 'https://maps.google.com/maps?q=Shawarma+Inn+Mathur+Chennai&output=embed'
  },
];


const swiggyUrl = import.meta.env.VITE_SWIGGY_URL || 'https://www.swiggy.com/city/chennai';
const zomatoUrl = import.meta.env.VITE_ZOMATO_URL || 'https://www.zomato.com/chennai';

export default function Home() {
  const navigate = useNavigate();
  const [activeBranch, setActiveBranch] = useState(branches[0]);

  return (
    <main>
      {/* ... previous content ... */}
      <section className="py-32 mt-20 bg-[#0e0e0e] overflow-hidden border-t border-white/5">
        <div className="px-8 mb-16 flex flex-col items-center text-center">
          <h2 className="text-4xl font-headline font-black tracking-[4px] text-white uppercase mb-4">
            ORDER ON DELIVERY APPS
          </h2>
          <div className="h-1 w-24 bg-[#d62b2b]" />
        </div>
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href={swiggyUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#f97316] hover:shadow-[0_20px_60px_rgba(249,115,22,0.28)]"
          >
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-[#f97316]/20 blur-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
            <p className="text-[11px] uppercase tracking-[3px] text-white/40">Fast Delivery Partner</p>
            <h3 className="font-bebas text-5xl text-[#f97316] tracking-[3px] mt-2">Swiggy</h3>
            <p className="text-white/70 font-body mt-4 leading-relaxed">
              Very fresh shawarma store, grilled hot, packed clean, and delivered quick to your door.
            </p>
            <span className="inline-flex mt-6 text-[11px] uppercase tracking-[3px] text-white/90 bg-[#f97316]/20 px-4 py-2 rounded-full border border-[#f97316]/30 group-hover:translate-x-2 transition-transform">
              Open Shawarma Inn on Swiggy
            </span>
          </a>

          <a
            href={zomatoUrl}
            target="_blank"
            rel="noreferrer"
            className="group relative bg-[#1a1a1a] border border-white/10 rounded-3xl p-8 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] hover:border-[#ef4444] hover:shadow-[0_20px_60px_rgba(239,68,68,0.28)]"
          >
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-[#ef4444]/20 blur-2xl scale-0 group-hover:scale-100 transition-transform duration-500" />
            <p className="text-[11px] uppercase tracking-[3px] text-white/40">Customer Favorite</p>
            <h3 className="font-bebas text-5xl text-[#ef4444] tracking-[3px] mt-2">Zomato</h3>
            <p className="text-white/70 font-body mt-4 leading-relaxed">
              Freshly sliced shawarma, juicy wraps, and signature sauces, all from Shawarma Inn kitchens.
            </p>
            <span className="inline-flex mt-6 text-[11px] uppercase tracking-[3px] text-white/90 bg-[#ef4444]/20 px-4 py-2 rounded-full border border-[#ef4444]/30 group-hover:translate-x-2 transition-transform">
              Open Shawarma Inn on Zomato
            </span>
          </a>
        </div>
      </section>

      {/* ─── Bento Grid Menu Preview ─────────────────────────── */}
      <section className="py-24 px-8 container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[800px]">
          {/* Main featured card */}
          <div className="md:col-span-2 md:row-span-2 bg-[#201f1f] rounded-xl overflow-hidden relative group">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_YQdx_Qr1P26o5IQ8ku2g0KTxfFffaaOV_jTLJ-tI_YOzCUs8f0vUJ9uOyyTuM4ahGBmaEiDMgKqOmE1iR6PiPSCxD17N4QaGY-15ZtUqIpMYqgzYLwHU3qCW1HNrPe8dcujm5WiRI62sm8pZ58bvpf5GMexFCnxtTVRGjfFoQcJ4gynhLG22YR1-4BrjKNcAoGpX_jLkBUcOsx2sM03WJpkX7y11Vu447qo3TCiANvYyZ1RGWOiulM-sl6PzSuw36Fo9S6sZkos"
              alt="Shawarma Platter"
              className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute bottom-10 left-10">
              <span className="text-[#d62b2b] font-headline font-bold tracking-[2px] uppercase mb-2 block">BESTSELLER</span>
              <h3 className="text-5xl font-bebas text-white mb-4">THE NOCTURNE PLATTER</h3>
              <button
                onClick={() => navigate('/menu')}
                className="bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-full font-headline text-xs tracking-widest uppercase hover:bg-white hover:text-black transition-all"
              >
                VIEW ITEM
              </button>
            </div>
          </div>

          <div className="bg-[#201f1f] rounded-xl overflow-hidden relative group">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYa_34fVR6dxH1CIhq2Gn1QGWd5WucA7ilXtUrYZaD8NqPTvZtpMreZqOrjpOwTpBqfHYCPn9IC3BQJ8HQzkQbtwN-V7EFJeB5COq1QmVRrblIgO3L8d7r70o2fkvZdbYTl2qb8KYIYiBHvIbw7ptLRlgTKmX9ifUmYuWVUlftCYiamltTngKP-fs56UoXj39iwW0vUxID34N46Vvchn_7Vqoq3_GxmSwX7Spp_uAiAIjBzGYmPKvGduEHZWYMXFPIsgaXwyjH440"
              alt="Flaming Wings"
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center">
              <h3 className="text-2xl font-bebas text-white tracking-widest">FLAMING WINGS</h3>
              <p className="text-[#d62b2b] font-bold">₹220</p>
            </div>
          </div>

          <div className="bg-[#d62b2b] rounded-xl flex flex-col justify-center items-center p-8 text-center hover:scale-[1.02] transition-transform duration-500">
            <svg className="w-16 h-16 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <h3 className="text-2xl font-bebas text-white tracking-widest mb-2">FULL MENU</h3>
            <p className="text-white/80 text-sm mb-6">Explore 50+ Lebanese delicacies</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-white text-[#d62b2b] px-6 py-2 rounded-full font-headline font-bold text-[10px] tracking-widest uppercase"
            >
              BROWSE
            </button>
          </div>

          <div className="md:col-span-2 bg-[#201f1f] rounded-xl overflow-hidden relative group">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBytTRExfNN7TCDZNOl8IpgqbIbYzJgu8ow_svQVa2kqFaTD4r4AnCdXHAEXFrkeEYOql1l6KwIToPKuQXWSNDczC13vJxT05mBlGl5Lt0krHp1TrZSgxJZ4H98LDef3u9oyP91AX7F9RsnO2l5EXDDtaUXGC6x1OCHYh7zcVXe3VWCETKDJfTT7IsqByC-35o3Fee7-_7f8RzHDqA0CK7iipszNi0fUS98trdokrW60ZM8lhh5IkIOnKBteqYYV2YVmPmhRW0zGMw"
              alt="Cold Mezze Box"
              className="w-full h-full object-cover brightness-50"
            />
            <div className="absolute inset-0 flex flex-col justify-center p-12">
              <h3 className="text-4xl font-bebas text-white mb-2">COLD MEZZE BOX</h3>
              <p className="text-white/60 max-w-xs mb-6 font-light">The perfect companion to our flame-grilled meats.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Branch Map Preview ──────────────────────────────── */}
      <section className="py-24 bg-[#0a0a0a] border-t border-white/5">
        <div className="container mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-6xl font-bebas text-white mb-8 tracking-wider">
              OUR NOCTURNE <span className="text-[#d62b2b]">DOMAINS</span>
            </h2>
            <div className="space-y-4">
              {branches.map(branch => (
                <div 
                  key={branch.name} 
                  onClick={() => setActiveBranch(branch)}
                  className={`flex gap-6 items-start p-6 rounded-2xl cursor-pointer transition-all duration-300 group ${activeBranch.name === branch.name ? 'bg-white/5 border border-white/10 ring-1 ring-white/10' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <svg 
                    className={`w-8 h-8 transition-colors ${activeBranch.name === branch.name ? 'text-[#d62b2b]' : 'text-white/20 group-hover:text-white/40'}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <h4 className={`font-headline font-bold tracking-[2px] uppercase transition-colors ${activeBranch.name === branch.name ? 'text-white' : 'text-white/40'}`}>
                      {branch.name}
                    </h4>
                    <p className={`text-sm font-light mt-1 transition-colors ${activeBranch.name === branch.name ? 'text-[#e5e2e1]/60' : 'text-[#e5e2e1]/20'}`}>
                      {branch.address}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/branches')}
              className="mt-12 border border-white/10 text-white px-8 py-4 rounded-full font-headline font-bold text-xs tracking-widest uppercase hover:bg-white/5 transition-all"
            >
              VIEW ALL 5 BRANCHES
            </button>
          </div>
          <div className="relative group">
            <div className="absolute -inset-4 bg-[#d62b2b]/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            <BranchMap mapUrl={activeBranch.mapUrl} className="relative z-10" />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

