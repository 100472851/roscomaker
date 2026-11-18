// Mide el corrector de respuestas y el reparto de colores, y escribe results/medidas.md y results/medidas.json.
// Uso: npm run medir   (las cifras del README salen de aquí; no se escriben a mano)

import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { esCorrecta, normalizar } from '../src/corrector.ts';
import { EJEMPLOS } from '../src/ejemplos.ts';
import { agrupar, contraste, deHex, repartir, type RGB } from '../src/paleta.ts';

// Generador con semilla: las cifras son siempre las mismas.
let semilla = 20261121;
const azar = () => { semilla = (semilla * 1664525 + 1013904223) >>> 0; return semilla / 2 ** 32; };
const elige = <T>(xs: T[]) => xs[Math.floor(azar() * xs.length)];
const LETRAS = 'abcdefghijklmnopqrstuvwxyz';
// Quita tildes pero deja la ñ, como escribe la gente con un teclado español.
const sinTilde = (s: string) => s.replace(/ñ/g, '\u0000').replace(/Ñ/g, '\u0001').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/\u0000/g, 'ñ').replace(/\u0001/g, 'Ñ');

/** Una errata de teclado: cambia, quita, mete o intercambia una letra (nunca un espacio). */
function errata(s: string): string {
  const pos = [...s].map((c, i) => (c === ' ' ? -1 : i)).filter(i => i >= 0);
  const i = elige(pos);
  switch (Math.floor(azar() * 4)) {
    case 0: return s.slice(0, i) + elige([...LETRAS]) + s.slice(i + 1);
    case 1: return s.slice(0, i) + s.slice(i + 1);
    case 2: return s.slice(0, i) + elige([...LETRAS]) + s.slice(i);
    default: return i + 1 < s.length && s[i + 1] !== ' ' ? s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2) : s.slice(0, i) + elige([...LETRAS]) + s.slice(i + 1);
  }
}

// ---------- Corrector ----------
const preguntas = EJEMPLOS.flatMap(r => r.preguntas);
const pct = (a: number, b: number) => Math.round((1000 * a) / b) / 10;

let bienEscritas = 0;
for (const p of preguntas) {
  const r = p.respuestas[0];
  for (const v of [r, r.toLowerCase(), r.toUpperCase(), sinTilde(r).toLowerCase()]) if (esCorrecta(v, p.respuestas)) bienEscritas++;
}

const largas = preguntas.filter(p => normalizar(p.respuestas[0]).replace(/ /g, '').length >= 5);
const INTENTOS = 20;
let unaErrata = 0;
for (const p of largas) for (let k = 0; k < INTENTOS; k++) if (esCorrecta(errata(sinTilde(p.respuestas[0]).toLowerCase()), p.respuestas)) unaErrata++;

const cortas = preguntas.filter(p => normalizar(p.respuestas[0]).replace(/ /g, '').length <= 4);
let cortasConErrata = 0;
for (const p of cortas) for (let k = 0; k < INTENTOS; k++) if (esCorrecta(errata(sinTilde(p.respuestas[0]).toLowerCase()), p.respuestas)) cortasConErrata++;

// Respuestas equivocadas de verdad: la respuesta de otra letra del mismo rosco.
let falsasAceptadas = 0, falsas = 0;
for (const rosco of EJEMPLOS) for (const p of rosco.preguntas) for (const q of rosco.preguntas) {
  if (p === q) continue;
  falsas++;
  if (esCorrecta(q.respuestas[0], p.respuestas)) falsasAceptadas++;
}

// ---------- Colores a partir de una foto ----------
const FOTOS = 500;
let legibles = 0;
for (let f = 0; f < FOTOS; f++) {
  const px: number[] = [];
  const bloques = 2 + Math.floor(azar() * 4);
  for (let b = 0; b < bloques; b++) {
    const c: RGB = [azar() * 255, azar() * 255, azar() * 255];
    const n = 200 + Math.floor(azar() * 800);
    for (let i = 0; i < n; i++) px.push(c[0] + (azar() - 0.5) * 30, c[1] + (azar() - 0.5) * 30, c[2] + (azar() - 0.5) * 30, 255);
  }
  const p = repartir(agrupar(px.map(v => Math.max(0, Math.min(255, Math.round(v)))), 6));
  const blanco: RGB = [255, 255, 255];
  const ok = contraste(deHex(p.fondo), blanco) >= 4.5 && contraste(deHex(p.acento), blanco) >= 3 &&
    contraste(deHex(p.ficha), blanco) >= 4.5 && contraste(deHex(p.resalte), deHex(p.acento)) >= 3;
  if (ok) legibles++;
}

const tam = existsSync('dist/index.html') ? Math.round(statSync('dist/index.html').size / 1024) : null;

const m = {
  respuestas: preguntas.length,
  bien_escritas_aceptadas_pct: pct(bienEscritas, preguntas.length * 4),
  una_errata_aceptadas_pct: pct(unaErrata, largas.length * INTENTOS),
  una_errata_intentos: largas.length * INTENTOS,
  cortas_con_errata_aceptadas_pct: pct(cortasConErrata, cortas.length * INTENTOS),
  respuestas_de_otra_letra_aceptadas_pct: pct(falsasAceptadas, falsas),
  respuestas_de_otra_letra: falsas,
  fotos_sinteticas: FOTOS,
  fotos_con_colores_legibles_pct: pct(legibles, FOTOS),
  tamano_html_kb: tam,
};

mkdirSync('results', { recursive: true });
writeFileSync('results/medidas.json', JSON.stringify(m, null, 2) + '\n');
writeFileSync('results/medidas.md', `# Medidas

Generado con \`npm run medir\` sobre los ${m.respuestas} respuestas de los roscos de ejemplo. Semilla fija: siempre salen las mismas cifras.

| Qué se mide | Resultado |
| --- | --- |
| Respuestas bien escritas aceptadas (tal cual, minúsculas, mayúsculas y sin tildes) | ${m.bien_escritas_aceptadas_pct} % |
| Respuestas de 5 letras o más con una errata aceptadas sin preguntar (${m.una_errata_intentos} intentos) | ${m.una_errata_aceptadas_pct} % |
| Respuestas de 4 letras o menos con una errata aceptadas sin preguntar | ${m.cortas_con_errata_aceptadas_pct} % (a propósito: en palabras cortas una errata cambia la palabra) |
| Respuestas de otra letra del mismo rosco aceptadas por error (${m.respuestas_de_otra_letra} pares) | ${m.respuestas_de_otra_letra_aceptadas_pct} % |
| Fotos sintéticas aleatorias cuyo reparto de colores cumple los contrastes mínimos (${m.fotos_sinteticas} fotos) | ${m.fotos_con_colores_legibles_pct} % |
| Tamaño de la app compilada (un solo HTML con tipografías) | ${m.tamano_html_kb ?? '—'} KB |

Lo que el corrector no acepta no se da por malo: la partida pregunta «¿Es válida?» a quien presenta.
`);
console.log(m);
