import { useEffect, useState } from "react";

// ─── Inline styles (no Tailwind / CSS file needed) ───────────────────────────
const S = {
  root: {
    position: "fixed",
    inset: 0,
    background: "#0a0a0a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Bebas Neue', 'Anton', 'Impact', sans-serif",
    overflow: "hidden",
    zIndex: 9999,
  },
  // radial ambient glow behind logo
  ambientGlow: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(200,30,30,0.18) 0%, rgba(200,30,30,0.06) 45%, transparent 70%)",
    animation: "pulse-glow 2.4s ease-in-out infinite",
    pointerEvents: "none",
  },
  // decorative thin orbit rings
  ring: (size, opacity, dur, delay) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    border: `1px solid rgba(220,50,50,${opacity})`,
    animation: `spin-ring ${dur}s linear infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: "none",
  }),
  ringDash: (size, opacity, dur, delay) => ({
    position: "absolute",
    width: size,
    height: size,
    borderRadius: "50%",
    border: `1px dashed rgba(255,255,255,${opacity})`,
    animation: `spin-ring-rev ${dur}s linear infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: "none",
  }),
  // center logo lockup
  logoWrap: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    animation: "logo-appear 0.9s cubic-bezier(0.22,1,0.36,1) forwards",
    opacity: 0,
  },
  logoTop: {
    fontSize: "clamp(52px, 9vw, 96px)",
    letterSpacing: "0.22em",
    lineHeight: 1,
    color: "#fff",
    textShadow: "0 0 40px rgba(220,60,60,0.7), 0 2px 0 rgba(0,0,0,0.8)",
    marginBottom: 0,
  },
  logoAccent: {
    color: "#e03030",
    textShadow: "0 0 60px rgba(220,40,40,0.9), 0 0 120px rgba(200,20,20,0.4)",
  },
  logoDivider: {
    width: 180,
    height: 1,
    background:
      "linear-gradient(90deg, transparent, rgba(220,60,60,0.8) 30%, rgba(255,80,80,1) 50%, rgba(220,60,60,0.8) 70%, transparent)",
    margin: "10px 0",
    animation: "divider-expand 0.6s 0.5s ease-out forwards",
    transformOrigin: "center",
    transform: "scaleX(0)",
  },
  logoBottom: {
    fontSize: "clamp(14px, 2.2vw, 20px)",
    letterSpacing: "0.55em",
    color: "rgba(255,255,255,0.55)",
    fontFamily: "'Montserrat', 'Trebuchet MS', sans-serif",
    fontWeight: 300,
    textTransform: "uppercase",
    marginTop: 4,
    animation: "fade-up 0.7s 0.7s ease-out forwards",
    opacity: 0,
  },
  // progress section
  progressSection: {
    position: "absolute",
    bottom: "12%",
    width: "min(340px, 72vw)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    animation: "fade-up 0.6s 1s ease-out forwards",
    opacity: 0,
  },
  progressLabel: {
    fontFamily: "'Montserrat', 'Trebuchet MS', sans-serif",
    fontSize: 11,
    letterSpacing: "0.35em",
    color: "rgba(255,255,255,0.35)",
    fontWeight: 500,
    textTransform: "uppercase",
  },
  progressTrack: {
    width: "100%",
    height: 2,
    background: "rgba(255,255,255,0.08)",
    borderRadius: 2,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: (pct) => ({
    height: "100%",
    width: `${pct}%`,
    background:
      "linear-gradient(90deg, #8b1010, #e03030, #ff6060)",
    borderRadius: 2,
    transition: "width 0.18s ease-out",
    boxShadow: "0 0 12px rgba(224,48,48,0.7)",
  }),
  progressPct: {
    fontFamily: "'Bebas Neue', 'Anton', 'Impact', sans-serif",
    fontSize: 13,
    letterSpacing: "0.2em",
    color: "rgba(220,80,80,0.8)",
  },
  // status message
  statusText: {
    fontFamily: "'Montserrat', 'Trebuchet MS', sans-serif",
    fontSize: 10,
    letterSpacing: "0.3em",
    color: "rgba(255,255,255,0.22)",
    textTransform: "uppercase",
    minHeight: 16,
    transition: "opacity 0.3s",
  },
  // corner decorations
  cornerTL: {
    position: "absolute",
    top: 28,
    left: 32,
    width: 40,
    height: 40,
    borderTop: "1px solid rgba(220,60,60,0.35)",
    borderLeft: "1px solid rgba(220,60,60,0.35)",
  },
  cornerBR: {
    position: "absolute",
    bottom: 28,
    right: 32,
    width: 40,
    height: 40,
    borderBottom: "1px solid rgba(220,60,60,0.35)",
    borderRight: "1px solid rgba(220,60,60,0.35)",
  },
  cornerTR: {
    position: "absolute",
    top: 28,
    right: 32,
    width: 40,
    height: 40,
    borderTop: "1px solid rgba(255,255,255,0.1)",
    borderRight: "1px solid rgba(255,255,255,0.1)",
  },
  cornerBL: {
    position: "absolute",
    bottom: 28,
    left: 32,
    width: 40,
    height: 40,
    borderBottom: "1px solid rgba(255,255,255,0.1)",
    borderLeft: "1px solid rgba(255,255,255,0.1)",
  },
  // dot cluster
  dot: (x, y, size, delay) => ({
    position: "absolute",
    left: x,
    top: y,
    width: size,
    height: size,
    borderRadius: "50%",
    background: "rgba(200,50,50,0.5)",
    animation: `twinkle 3s ${delay}s ease-in-out infinite`,
  }),
  // fade-out overlay
  fadeOut: (leaving) => ({
    position: "absolute",
    inset: 0,
    background: "#0a0a0a",
    opacity: leaving ? 1 : 0,
    transition: "opacity 0.6s ease-in",
    pointerEvents: "none",
  }),
};

// ─── Keyframe CSS injected once ──────────────────────────────────────────────
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@300;500&display=swap');

  @keyframes pulse-glow {
    0%, 100% { transform: scale(1);   opacity: 0.9; }
    50%       { transform: scale(1.1); opacity: 1; }
  }
  @keyframes spin-ring {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes spin-ring-rev {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes logo-appear {
    from { opacity: 0; transform: scale(0.88) translateY(12px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes divider-expand {
    to { transform: scaleX(1); }
  }
  @keyframes twinkle {
    0%, 100% { opacity: 0.15; transform: scale(1); }
    50%       { opacity: 0.7;  transform: scale(1.6); }
  }
`;

// Loading status messages that cycle during progress
const STATUS_MESSAGES = [
  "Preparing your experience",
  "Loading menu items",
  "Connecting to POS",
  "Syncing orders",
  "Almost ready",
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SplashScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Inject keyframes once
  useEffect(() => {
    if (!document.getElementById("splash-kf")) {
      const style = document.createElement("style");
      style.id = "splash-kf";
      style.textContent = KEYFRAMES;
      document.head.appendChild(style);
    }
  }, []);

  // Progress counter — non-linear easing for realism
  useEffect(() => {
    const steps = [
      { target: 30,  speed: 22 },
      { target: 65,  speed: 35 },
      { target: 85,  speed: 55 },
      { target: 97,  speed: 80 },
      { target: 100, speed: 30 },
    ];
    let current = 0;
    let stepIdx = 0;

    const tick = () => {
      if (stepIdx >= steps.length) return;
      const { target, speed } = steps[stepIdx];
      if (current < target) {
        current = Math.min(current + 1, target);
        setProgress(current);
        // Cycle status message at certain milestones
        if ([20, 45, 68, 88, 98].includes(current)) {
          setStatusIdx((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
        }
        setTimeout(tick, speed);
      } else {
        stepIdx++;
        setTimeout(tick, 200); // pause between phases
      }
    };
    setTimeout(tick, 900); // delay start for logo entrance
  }, []);

  // Trigger exit when done
  useEffect(() => {
    if (progress === 100) {
      setTimeout(() => {
        setLeaving(true);
        setTimeout(() => onComplete?.(), 700);
      }, 400);
    }
  }, [progress, onComplete]);

  return (
    <div style={S.root}>
      {/* Ambient radial glow */}
      <div style={S.ambientGlow} />

      {/* Orbit rings */}
      <div style={S.ring(380, 0.18, 18, 0)} />
      <div style={S.ring(280, 0.25, 12, -3)} />
      <div style={S.ringDash(460, 0.08, 28, -6)} />
      <div style={S.ring(200, 0.12, 8, -1)} />

      {/* Ambient particle dots */}
      <div style={S.dot("22%", "18%", 4, 0)} />
      <div style={S.dot("75%", "14%", 3, 1.2)} />
      <div style={S.dot("12%", "72%", 5, 0.6)} />
      <div style={S.dot("82%", "68%", 3, 2)} />
      <div style={S.dot("65%", "82%", 4, 0.4)} />
      <div style={S.dot("30%", "85%", 3, 1.8)} />

      {/* Corner frame decorations */}
      <div style={S.cornerTL} />
      <div style={S.cornerTR} />
      <div style={S.cornerBL} />
      <div style={S.cornerBR} />

      {/* Logo lockup */}
      <div style={S.logoWrap}>
        <div style={S.logoTop}>
          <span style={S.logoAccent}>S</span>HAWARMA
        </div>
        <div style={S.logoDivider} />
        <div style={S.logoTop}>
          <span style={S.logoAccent}>I</span>NN
        </div>
        <div style={S.logoBottom}>Point of Sale System</div>
      </div>

      {/* Progress bar + labels */}
      <div style={S.progressSection}>
        <div style={S.statusText}>{STATUS_MESSAGES[statusIdx]}</div>
        <div style={S.progressTrack}>
          <div style={S.progressFill(progress)} />
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={S.progressLabel}>Initializing</span>
          <span style={S.progressPct}>{progress}%</span>
        </div>
      </div>

      {/* Fade-out overlay */}
      <div style={S.fadeOut(leaving)} />
    </div>
  );
}
