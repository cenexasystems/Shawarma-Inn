import { Link } from 'react-router-dom';
import { Instagram, Youtube } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full py-20 px-8 bg-[#0a0a0a] border-t border-[var(--border)] relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
        
        {/* Column 1: Brand & Social */}
        <div className="space-y-6">
          <Link to="/" className="text-4xl font-bebas tracking-widest logo-shimmer inline-block">
            SHAWARMA INN
          </Link>
          <p className="text-[var(--white)]/50 text-sm font-body leading-relaxed max-w-xs">
            Authentic Lebanese flame-grilled perfection. Serving Chennai's finest shawarma across 5 domains since 2018.
          </p>
          <div className="flex items-center gap-5 pt-4">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--white)] hover:bg-[var(--red)] transition-all duration-300">
              <Instagram size={20} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[var(--white)] hover:bg-[var(--red)] transition-all duration-300">
              <Youtube size={20} />
            </a>
          </div>
        </div>

        {/* Column 2: The Experience */}
        <div className="space-y-6 lg:pl-10">
          <h4 className="text-[var(--red)] font-bebas text-xl tracking-[4px] uppercase">THE EXPERIENCE</h4>
          <ul className="flex flex-col gap-4">
            {['Menu', 'Branches', 'Gallery', 'Reviews'].map(item => (
              <li key={item}>
                <Link 
                  to={item === 'Menu' ? '/menu' : item === 'Branches' ? '/branches' : '/'} 
                  className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Quick Links */}
        <div className="space-y-6 lg:pl-10">
          <h4 className="text-[var(--red)] font-bebas text-xl tracking-[4px] uppercase">QUICK LINKS</h4>
          <ul className="flex flex-col gap-4">
            {['My Account', 'Order History', 'Franchise', 'Careers'].map(item => (
              <li key={item}>
                <Link 
                  to={item === 'My Account' ? '/profile' : item === 'Franchise' ? '/' : '/'} 
                  className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors"
                >
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact Info */}
        <div className="space-y-6 lg:pl-10">
          <h4 className="text-[var(--red)] font-bebas text-xl tracking-[4px] uppercase">CONNECT</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[2px] mb-1">HQ KOLATHUR</p>
              <p className="text-white/60 text-sm font-body">12/4, Main Road, Kolathur, Chennai - 600099</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[2px] mb-1">DELIVERED BY</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-white/60 text-sm font-body uppercase tracking-widest text-[11px]">Porter x Rapido</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] text-white/20 font-body tracking-[2px] uppercase">
          © {new Date().getFullYear()} SHAWARMA INN. ALL RIGHTS RESERVED.
        </p>
        <div className="flex gap-8">
          <Link to="/" className="text-[10px] text-white/20 hover:text-white uppercase tracking-[2px] transition-colors">Privacy Policy</Link>
          <Link to="/" className="text-[10px] text-white/20 hover:text-white uppercase tracking-[2px] transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
