import rotisserieImg from '../assets/shawarma_rotisserie.png';

export function ShawarmaSpinner({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '9999px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 0 24px rgba(214,43,43,0.28)',
      }}
    >
      <img
        src={rotisserieImg}
        alt="Loading shawarma"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          animation: 'shawarmaSpin 1.15s linear infinite',
        }}
      />
      <style>{`
        @keyframes shawarmaSpin {
          from { transform: rotate(0deg) scale(1.05); }
          to { transform: rotate(360deg) scale(1.05); }
        }
      `}</style>
    </div>
  );
}
