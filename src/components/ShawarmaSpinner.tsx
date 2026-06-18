export function ShawarmaSpinner({ size = 40 }: { size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: '9999px',
        border: '2px solid rgba(255,255,255,0.18)',
        borderTopColor: 'rgba(214,43,43,0.9)',
        borderRightColor: 'rgba(214,43,43,0.6)',
        display: 'inline-block',
        animation: 'shawarmaSpinnerRing 0.95s linear infinite',
        boxShadow: '0 0 18px rgba(214,43,43,0.22)',
      }}
    >
      <style>{`
        @keyframes shawarmaSpinnerRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </span>
  );
}
