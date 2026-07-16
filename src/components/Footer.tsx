import { Link } from 'react-router-dom';
import { Instagram, Phone, Mail, Facebook, Twitter } from 'lucide-react';
import branchesData from '../data/branches.json';
import type { Branch } from '../types';
import { useStoreSettings } from '../context/SettingsContext';

const branches: Branch[] = branchesData as Branch[];
const flagship = branches.find((branch) => branch.isFlagship) || branches[0];
const supportEmail = 'sharath.creator2210@gmail.com';

export default function Footer() {
  const { settings } = useStoreSettings();

  return (
    <footer className="w-full py-16 md:py-20 px-4 md:px-8 xl:px-12 bg-[#0a0a0a] border-t border-[var(--border)] relative z-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

        {/* Column 1: Brand & Social */}
        <div className="space-y-6">
          <Link to="/" className="text-4xl font-bebas tracking-widest logo-shimmer inline-block">
            SHAWARMA INN
          </Link>
          <p className="text-white/50 text-sm font-body leading-relaxed max-w-xs">
            Authentic Lebanese flame-grilled perfection. Serving Mathur's finest shawarma since 2018.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={`tel:${flagship.phone.replace(/\s+/g, '')}`}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[var(--red)] transition-all duration-300"
              aria-label="Call us"
            >
              <Phone size={18} />
            </a>
            <a
              href={`mailto:${supportEmail}`}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[var(--red)] transition-all duration-300"
              aria-label="Email us"
            >
              <Mail size={18} />
            </a>
            {settings.social_links?.instagram && (
              <a
                href={settings.social_links.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[var(--red)] transition-all duration-300"
              >
                <Instagram size={18} />
              </a>
            )}
            {settings.social_links?.facebook && (
              <a
                href={settings.social_links.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[var(--red)] transition-all duration-300"
              >
                <Facebook size={18} />
              </a>
            )}
            {settings.social_links?.twitter && (
              <a
                href={settings.social_links.twitter}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-[var(--red)] transition-all duration-300"
              >
                <Twitter size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Column 2: The Experience */}
        <div className="space-y-6 lg:pl-10">
          <h4 className="text-[var(--red)] font-bebas text-xl tracking-[4px] uppercase">THE EXPERIENCE</h4>
          <ul className="flex flex-col gap-4">
            <li>
              <Link to="/menu" className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors">
                Menu
              </Link>
            </li>
            <li>
              <Link to="/branches" className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors">
                Branches
              </Link>
            </li>
            <li>
              <Link to="/#reviews" className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors">
                Reviews
              </Link>
            </li>
            <li>
              <Link to="/#franchise" className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors">
                Franchise
              </Link>
            </li>
            <li>
              <Link to="/offers" className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors">
                Offers
              </Link>
            </li>
            <li>
              <Link to="/contact" className="text-white/40 hover:text-white font-bebas text-lg tracking-widest transition-colors">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Branches on Instagram */}
        <div className="space-y-6 lg:pl-10">
          <h4 className="text-[var(--red)] font-bebas text-xl tracking-[4px] uppercase">FOLLOW OUR BRANCHES</h4>
          <ul className="flex flex-col gap-4">
            {branches
              .filter((branch) => branch.instagram)
              .map((branch) => (
                <li key={branch.id}>
                  <a
                    href={branch.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-white/40 hover:text-white font-body text-sm tracking-wide transition-colors"
                  >
                    <Instagram size={14} className="shrink-0" />
                    {branch.name}
                  </a>
                </li>
              ))}
          </ul>
        </div>

        {/* Column 4: Contact Info */}
        <div className="space-y-6 lg:pl-10">
          <h4 className="text-[var(--red)] font-bebas text-xl tracking-[4px] uppercase">CONNECT</h4>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-[2px] mb-1">{flagship.name}</p>
              <p className="text-white/60 text-sm font-body">{flagship.address}</p>
              <a href={`tel:${flagship.phone.replace(/\s+/g, '')}`} className="text-white/60 text-sm font-body hover:text-white transition-colors">
                {flagship.phone}
              </a>
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
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-2 text-center">
        <p className="text-white text-[11px] font-body tracking-[2px] uppercase">
          © 2026 SHAWARMA INN. ALL RIGHTS RESERVED.
        </p>
        <p className="text-white/40 text-[10px] font-body tracking-[1.5px] uppercase max-w-2xl">
          This is the official website of Shawarma Inn's Mathur branch only. Other Shawarma Inn outlets
          are independently operated and not affiliated with this website.
        </p>
        <p className="text-white text-[11px] font-body tracking-[2px] uppercase">
          Powered by Cenexa Systems © 2026
        </p>
      </div>
    </footer>
  );
}
