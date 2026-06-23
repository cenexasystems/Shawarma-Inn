let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) {
    sharedContext = new Ctor();
  }
  return sharedContext;
}

/**
 * Plays a short two-tone confirmation chime (~350ms) using the Web Audio API.
 * No external asset is loaded, so it works identically on desktop and mobile
 * and fires synchronously inside the user gesture (required by mobile browsers).
 */
export function playCheckoutSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const notes: Array<{ freq: number; start: number; duration: number }> = [
      { freq: 880, start: 0, duration: 0.12 },
      { freq: 1318.5, start: 0.1, duration: 0.18 },
    ];

    notes.forEach(({ freq, start, duration }) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.2, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.02);
    });
  } catch {
    // Audio is a non-critical enhancement — never block checkout if it fails.
  }
}
