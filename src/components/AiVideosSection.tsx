import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function AiVideosSection() {
  const navigate = useNavigate();

  return (
    <section id="ai-videos" className="py-16 px-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
        className="mb-10 text-center"
      >
        <p className="text-[11px] uppercase tracking-[3px] text-[#d62b2b]">In Motion</p>
        <h2 className="mt-3 text-4xl md:text-5xl font-bebas text-white tracking-[3px] uppercase">
          AI <span className="text-[#d62b2b]">VIDEOS</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-5 h-auto md:h-[680px]">
        <div className="md:col-span-2 md:row-span-2 bg-[#201f1f] rounded-xl overflow-hidden relative group">
          <video
            src="/Chicken_pieces_falling_202603202345.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            onContextMenu={(event) => event.preventDefault()}
            className="w-full h-full object-cover brightness-75"
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
          <video
            src="/Gourmet_burger_on_202603210021.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            onContextMenu={(event) => event.preventDefault()}
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-center">
            <h3 className="text-2xl font-bebas text-white tracking-widest">FLAMING WINGS</h3>
            <p className="text-[#d62b2b] font-bold">₹220</p>
          </div>
        </div>

        <div className="bg-[#d62b2b] rounded-xl flex flex-col justify-center items-center p-6 text-center hover:scale-[1.02] transition-transform duration-500">
          <svg className="w-14 h-14 text-white mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h3 className="text-xl font-bebas text-white tracking-widest mb-2">FULL MENU</h3>
          <p className="text-white/80 text-sm mb-5">Explore 50+ Lebanese delicacies</p>
          <button
            onClick={() => navigate('/menu')}
            className="bg-white text-[#d62b2b] px-6 py-2 rounded-full font-headline font-bold text-[10px] tracking-widest uppercase"
          >
            BROWSE
          </button>
        </div>

        <div className="md:col-span-2 bg-[#201f1f] rounded-xl overflow-hidden relative group">
          <video
            src="/Prepare_and_cut_202603202328.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            controlsList="nodownload noplaybackrate nofullscreen"
            onContextMenu={(event) => event.preventDefault()}
            className="w-full h-full object-cover brightness-50"
          />
          <div className="absolute inset-0 flex flex-col justify-center p-12">
            <h3 className="text-4xl font-bebas text-white mb-2">COLD MEZZE BOX</h3>
            <p className="text-white/60 max-w-xs mb-6 font-light">The perfect companion to our flame-grilled meats.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
