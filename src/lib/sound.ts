// Lightweight Web Audio sound effects — no asset files needed.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

type Tone = { freq: number; start: number; dur: number; type?: OscillatorType; vol?: number };

function play(tones: Tone[]) {
  const c = getCtx();
  if (!c) return;
  tones.forEach(({ freq, start, dur, type = 'sine', vol = 0.25 }) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = freq;
    osc.type = type;
    const t0 = c.currentTime + start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  });
}

export const sfx = {
  click: () => play([{ freq: 600, start: 0, dur: 0.06, type: 'triangle', vol: 0.12 }]),
  tap: () => play([{ freq: 800, start: 0, dur: 0.04, type: 'triangle', vol: 0.1 }]),
  add: () => {
    play([
      { freq: 660, start: 0, dur: 0.08, type: 'sine', vol: 0.2 },
      { freq: 990, start: 0.07, dur: 0.1, type: 'sine', vol: 0.2 },
    ]);
  },
  remove: () => play([{ freq: 300, start: 0, dur: 0.12, type: 'sine', vol: 0.18 }]),
  success: () => {
    play([
      { freq: 523, start: 0, dur: 0.1, type: 'sine', vol: 0.22 },
      { freq: 659, start: 0.09, dur: 0.1, type: 'sine', vol: 0.22 },
      { freq: 784, start: 0.18, dur: 0.16, type: 'sine', vol: 0.22 },
    ]);
  },
  error: () => {
    play([
      { freq: 392, start: 0, dur: 0.14, type: 'sawtooth', vol: 0.18 },
      { freq: 311, start: 0.12, dur: 0.2, type: 'sawtooth', vol: 0.18 },
    ]);
  },
  warning: () => play([{ freq: 440, start: 0, dur: 0.1, type: 'square', vol: 0.15 }]),
  info: () => play([{ freq: 700, start: 0, dur: 0.08, type: 'sine', vol: 0.15 }]),
  notification: () => {
    play([
      { freq: 880, start: 0, dur: 0.18, type: 'sine', vol: 0.3 },
      { freq: 1175, start: 0.16, dur: 0.22, type: 'sine', vol: 0.3 },
    ]);
  },
  order: () => {
    play([
      { freq: 523, start: 0, dur: 0.12, type: 'sine', vol: 0.25 },
      { freq: 659, start: 0.1, dur: 0.12, type: 'sine', vol: 0.25 },
      { freq: 784, start: 0.2, dur: 0.12, type: 'sine', vol: 0.25 },
      { freq: 1047, start: 0.3, dur: 0.25, type: 'sine', vol: 0.25 },
    ]);
  },
  status: () => play([{ freq: 880, start: 0, dur: 0.1, type: 'sine', vol: 0.2 }]),
};
