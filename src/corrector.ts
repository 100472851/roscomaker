// Decide si una respuesta escrita vale. Pensado para gente escribiendo deprisa delante de un público:
// no importan mayúsculas, tildes, espacios, signos ni el artículo inicial, y se perdona alguna errata.
// Lo que no encaja no se da por malo: la partida pregunta a quien presenta.

/** Pasa a minúsculas sin tildes ni signos. La ñ se conserva (no es una n con tilde). */
export function normalizar(s: string): string {
  return s.toLowerCase()
    .replace(/ñ/g, '\u0000')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'ñ')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARTICULO = /^(el|la|los|las|lo|un|una|unos|unas) /;

/** Formas comparables de un texto: entero y sin artículo inicial, siempre sin espacios. */
export function variantes(s: string): string[] {
  const n = normalizar(s);
  return [...new Set([n, n.replace(ARTICULO, '')].map(x => x.replace(/ /g, '')))].filter(Boolean);
}

/**
 * Distancia de edición entre dos cadenas (Damerau–Levenshtein restringida): cambiar, quitar o meter una letra
 * cuenta uno, y también intercambiar dos letras seguidas («cmaino» por «camino»), la errata más típica al teclear deprisa.
 */
export function distancia(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let antes: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], antes[j - 2] + 1);
    }
    antes = prev;
    prev = cur;
  }
  return prev[b.length];
}

/** Erratas permitidas según el largo de la respuesta: ninguna en palabras cortas. */
export function tolerancia(largo: number): number {
  return largo <= 4 ? 0 : largo <= 8 ? 1 : 2;
}

export function esCorrecta(escrita: string, respuestas: string[]): boolean {
  const entrada = variantes(escrita);
  if (!entrada.length) return false;
  return respuestas.some(r => variantes(r).some(v => entrada.some(e => distancia(e, v) <= tolerancia(v.length))));
}
