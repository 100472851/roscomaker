// Sonidos generados al momento con Web Audio: no hay archivos de audio ni licencias de por medio.

let ctx: AudioContext | null = null;
let activo = true;

export function activarSonidos(si: boolean): void { activo = si; }

function contexto(): AudioContext | null {
  if (!activo || typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function nota(frec: number, inicio: number, dur: number, forma: OscillatorType = 'square', vol = 0.08): void {
  const c = contexto();
  if (!c) return;
  const t = c.currentTime + inicio;
  const o = c.createOscillator(), g = c.createGain();
  o.type = forma;
  o.frequency.setValueAtTime(frec, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sonar = {
  bien: () => { nota(659, 0, 0.12); nota(988, 0.1, 0.22); },
  mal: () => { nota(196, 0, 0.18, 'sawtooth', 0.06); nota(147, 0.16, 0.32, 'sawtooth', 0.06); },
  pasa: () => { nota(523, 0, 0.07, 'triangle', 0.1); nota(523, 0.1, 0.07, 'triangle', 0.1); },
  turno: () => { nota(392, 0, 0.1, 'triangle', 0.1); nota(587, 0.1, 0.16, 'triangle', 0.1); },
  fin: () => { [523, 659, 784, 1047].forEach((f, i) => nota(f, i * 0.11, 0.25)); },
};
