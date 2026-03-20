import rotisserieImg from '../assets/shawarma_rotisserie.png';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0a] z-[200] flex flex-col items-center justify-center overflow-hidden font-body">
      {/* Horizontal Path */}
      <div className="absolute bottom-[20%] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#d62b2b]/20 to-transparent" />
      
      {/* Physical Rolling Rotisserie */}
      <div className="animate-roll w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-2 border-white/5 shadow-[0_0_40px_rgba(214,43,43,0.3)] bg-black">
          <img 
            src={rotisserieImg} 
            alt="Rolling Shawarma" 
            className="w-full h-full object-cover scale-110"
          />
      </div>

      <div className="flex flex-col items-center gap-4 mt-20 z-10">
        <p className="font-bebas text-5xl md:text-7xl uppercase tracking-[20px] text-white/90 drop-shadow-2xl">
          LOADING
        </p>
        <div className="flex gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-bounce [animation-delay:-0.3s] shadow-[0_0_10px_rgba(214,43,43,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-bounce [animation-delay:-0.15s] shadow-[0_0_10px_rgba(214,43,43,0.6)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[var(--red)] animate-bounce shadow-[0_0_10px_rgba(214,43,43,0.6)]" />
        </div>
      </div>
    </div>
  );
}





