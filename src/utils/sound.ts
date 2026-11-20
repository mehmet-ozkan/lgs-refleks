let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextCtor) {
      audioCtx = new AudioContextCtor();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.08,
  delay = 0
) {
  const ctx = getCtx();
  if (!ctx) return;

  const now = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export function playCorrectSound(enabled: boolean, streak = 1) {
  if (!enabled) return;
  const pitchBoost = Math.min(streak - 1, 8) * 28;
  playTone(540 + pitchBoost, 0.09, 'triangle', 0.09, 0);
  playTone(720 + pitchBoost, 0.12, 'triangle', 0.07, 0.055);
}

export function playWrongSound(enabled: boolean) {
  if (!enabled) return;
  playTone(230, 0.14, 'sawtooth', 0.055, 0);
  playTone(180, 0.18, 'sawtooth', 0.05, 0.08);
}

export function playTickSound(enabled: boolean) {
  if (!enabled) return;
  playTone(880, 0.04, 'sine', 0.035, 0);
}

export function playRecordSound(enabled: boolean) {
  if (!enabled) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((n, i) => {
    playTone(n, 0.18, 'triangle', 0.09, i * 0.085);
  });
}
