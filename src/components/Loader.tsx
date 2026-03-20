import rotisserieImg from '../assets/shawarma_rotisserie.png';
import { ShawarmaSpinner } from './ShawarmaSpinner';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[200] flex flex-col items-center justify-center overflow-hidden font-body">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(214,43,43,0.22),rgba(10,10,10,0.92)_55%)]" />

      <div className="relative z-10 flex flex-col items-center gap-7">
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-full overflow-hidden border border-white/10 shadow-[0_0_80px_rgba(214,43,43,0.28)] bg-black">
          <img
            src={rotisserieImg}
            alt="Shawarma rotisserie"
            className="w-full h-full object-cover scale-110 animate-[shawarmaPulse_2s_ease-in-out_infinite]"
          />
        </div>

        <div className="flex items-center gap-4">
          <p className="font-bebas text-4xl md:text-6xl uppercase tracking-[12px] text-white/90 drop-shadow-2xl">
            LOADING
          </p>
          <ShawarmaSpinner size={44} />
        </div>

        <div className="flex gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_rgba(214,43,43,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_rgba(214,43,43,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-bounce shadow-[0_0_10px_rgba(214,43,43,0.6)]" />
        </div>
      </div>

      <style>{`
        @keyframes shawarmaPulse {
          0%, 100% { transform: scale(1.08); }
          50% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}





