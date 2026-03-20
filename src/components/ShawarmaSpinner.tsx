export function ShawarmaSpinner({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{
        fontSize: size,
        display: 'inline-block',
        animation: 'spinWrap 0.7s linear infinite',
        lineHeight: 1,
      }}>🌯</span>
      <style>{`
        @keyframes spinWrap {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
