// Colores a partir de una foto: k-means sobre los píxeles y reparto de papeles (fondo, acento, fichas, resalte)
// cuidando que el texto se lea. Funciones puras: reciben píxeles RGBA y devuelven colores en hexadecimal.

export type RGB = [number, number, number];

export interface Cumulo { color: RGB; peso: number }

export const aHex = ([r, g, b]: RGB): string =>
  '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

export function deHex(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Luminancia relativa (WCAG 2.x). */
export function luminancia([r, g, b]: RGB): number {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** Contraste entre dos colores (1 a 21). 4,5 es lo mínimo para texto normal; 3 para texto grande. */
export function contraste(a: RGB, b: RGB): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

export function aHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

export function deHsl(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const mezclar = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const NEGRO: RGB = [0, 0, 0];
const BLANCO: RGB = [255, 255, 255];

/** Oscurece un color lo justo para que el texto blanco encima tenga al menos ese contraste. */
export function oscurecerHasta(c: RGB, minimo: number): RGB {
  let t = 0, out = c;
  while (contraste(out, BLANCO) < minimo && t < 1) { t += 0.04; out = mezclar(c, NEGRO, t); }
  return out;
}

/** Generador pseudoaleatorio con semilla, para que la misma foto dé siempre los mismos colores. */
function azar(semilla: number) {
  return () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 2 ** 32; };
}

/**
 * Agrupa los píxeles en k colores (k-means++). `pixeles` es RGBA como el de un canvas.
 * Se salta los píxeles casi transparentes.
 */
export function agrupar(pixeles: ArrayLike<number>, k = 6, vueltas = 12): Cumulo[] {
  const puntos: RGB[] = [];
  for (let i = 0; i + 3 < pixeles.length; i += 4) {
    if (pixeles[i + 3] < 128) continue;
    puntos.push([pixeles[i], pixeles[i + 1], pixeles[i + 2]]);
  }
  if (!puntos.length) return [];
  const rnd = azar(puntos.length);
  const d2 = (a: RGB, b: RGB) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

  // Arranque k-means++: cada centro nuevo, lejos de los anteriores.
  const centros: RGB[] = [puntos[Math.floor(rnd() * puntos.length)]];
  while (centros.length < k) {
    const dist = puntos.map(p => Math.min(...centros.map(c => d2(p, c))));
    const total = dist.reduce((a, b) => a + b, 0);
    if (total === 0) break;
    let r = rnd() * total, i = 0;
    while (r > dist[i] && i < dist.length - 1) r -= dist[i++];
    centros.push(puntos[i]);
  }

  let asign = new Array(puntos.length).fill(0);
  for (let v = 0; v < vueltas; v++) {
    asign = puntos.map(p => { let mejor = 0, md = Infinity; centros.forEach((c, j) => { const d = d2(p, c); if (d < md) { md = d; mejor = j; } }); return mejor; });
    const suma = centros.map(() => [0, 0, 0, 0]);
    puntos.forEach((p, i) => { const s = suma[asign[i]]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; });
    suma.forEach((s, j) => { if (s[3]) centros[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
  }
  const cuenta = centros.map(() => 0);
  asign.forEach(j => cuenta[j]++);
  return centros.map((c, j) => ({ color: c.map(Math.round) as RGB, peso: cuenta[j] / puntos.length }))
    .filter(c => c.peso > 0)
    .sort((a, b) => b.peso - a.peso);
}

export interface Papeles { fondo: string; acento: string; ficha: string; resalte: string }

const distanciaTono = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/** Reparte los colores de la foto en papeles, ajustándolos para que el texto se lea. */
export function repartir(cumulos: Cumulo[]): Papeles {
  if (!cumulos.length) return { fondo: '#1b171f', acento: '#ff3b1d', ficha: '#1d2a5c', resalte: '#dcf7a9' };
  const info = cumulos.map(c => { const [h, s, l] = aHsl(c.color); return { ...c, h, s, l, lum: luminancia(c.color) }; });

  // Fondo: el más oscuro de los que tienen presencia; muy oscuro para que todo destaque encima.
  const fondoC = [...info].filter(c => c.peso > 0.04).sort((a, b) => a.lum - b.lum)[0] ?? info[0];
  const fondo = oscurecerHasta(mezclar(fondoC.color, NEGRO, 0.35), 15);

  // Acento: el más vivo (saturado y con algo de luz), pesando un poco cuánto aparece.
  const vivos = info.filter(c => c !== fondoC);
  const acentoC = [...(vivos.length ? vivos : info)]
    .sort((a, b) => (b.s * (1 - Math.abs(b.l - 0.5) * 1.4) * b.peso ** 0.25) - (a.s * (1 - Math.abs(a.l - 0.5) * 1.4) * a.peso ** 0.25))[0];
  let acento = acentoC.color;
  if (acentoC.s < 0.25) acento = deHsl(acentoC.h, 0.75, 0.5); // foto apagada: se aviva el tono
  acento = oscurecerHasta(acento, 3);
  const hAcento = aHsl(acento)[0];

  // Fichas: un tono distinto del acento, oscuro para que la letra blanca se lea.
  const otros = info.filter(c => c !== acentoC && c !== fondoC && c.s > 0.12 && distanciaTono(c.h, hAcento) > 40);
  const fichaBase = otros.length ? otros.sort((a, b) => b.peso - a.peso)[0].color : deHsl(hAcento + 200, 0.5, 0.3);
  const [hf, sf] = aHsl(fichaBase);
  const ficha = oscurecerHasta(deHsl(hf, Math.max(sf, 0.35), Math.min(aHsl(fichaBase)[2], 0.32)), 7);

  // Resalte: claro y con un toque de color; se usa de fondo de botones con el acento como texto.
  const claro = [...info].sort((a, b) => b.lum - a.lum)[0];
  const hr = claro.s > 0.15 ? claro.h : hAcento + 90;
  let resalte = deHsl(hr, 0.75, 0.86);
  if (contraste(resalte, acento) < 3) resalte = deHsl(hr, 0.6, 0.93);

  return { fondo: aHex(fondo), acento: aHex(acento), ficha: aHex(ficha), resalte: aHex(resalte) };
}
