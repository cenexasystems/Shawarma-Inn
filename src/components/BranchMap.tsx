interface BranchMapProps {
  mapUrl: string;
  className?: string;
}

export default function BranchMap({ mapUrl, className = '' }: BranchMapProps) {
  return (
    <div className={`w-full h-[500px] rounded-xl overflow-hidden shadow-2xl grayscale brightness-50 contrast-125 hover:grayscale-0 transition-all duration-1000 border border-white/10 ${className}`}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Shawarma Inn Location Map"
      />
    </div>
  );
}
