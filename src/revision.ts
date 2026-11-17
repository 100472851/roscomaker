// Revisión de un rosco antes de jugarlo: huecos, letras que no cuadran y pistas que destripan respuestas.

import { normalizar } from './corrector.ts';
import { enOrdenDeJuego, type Rosco } from './modelo.ts';

export type Gravedad = 'error' | 'aviso';

export interface Problema {
  gravedad: Gravedad;
  letra: string;
  /** Índice del rosco dentro de la lista revisada (para avisos entre roscos). */
  rosco: number;
  mensaje: string;
}

// Palabras demasiado comunes para considerar que destripan nada.
const VACIAS = new Set(('de del la las el los un una unos unas y o en con por para que se al lo su sus es son fue ' +
  'como más mas pero sin sobre entre este esta estos estas ese esa eso nombre título titulo apellido').split(' '));

function contieneFrase(textoNorm: string, fraseNorm: string): boolean {
  return (' ' + textoNorm + ' ').includes(' ' + fraseNorm + ' ');
}

/** Palabras con peso de una respuesta (para ver si la propia pista la regala). */
function palabrasClave(respuesta: string): string[] {
  return normalizar(respuesta).split(' ').filter(w => w.length >= 5 && !VACIAS.has(w));
}

/**
 * Revisa uno o varios roscos que se van a jugar seguidos.
 * Una pista «destripa» si nombra la respuesta de una letra que todavía no ha salido,
 * en ese rosco o en uno que se juega después.
 */
export function revisar(roscos: Rosco[]): Problema[] {
  const out: Problema[] = [];
  const secuencia: { r: number; letra: string; pista: string; respuesta: string }[] = [];

  roscos.forEach((rosco, r) => {
    for (const p of enOrdenDeJuego(rosco)) {
      const resp = p.respuestas[0]?.trim() ?? '';
      const n = normalizar(resp).replace(/ /g, '');
      const l = normalizar(p.letra) || 'ñ';
      if (!p.pista.trim()) out.push({ gravedad: 'error', letra: p.letra, rosco: r, mensaje: 'Falta la pista.' });
      if (!resp) {
        out.push({ gravedad: 'error', letra: p.letra, rosco: r, mensaje: 'Falta la respuesta.' });
      } else if (p.tipo === 'empieza' && !n.startsWith(l)) {
        out.push({ gravedad: 'error', letra: p.letra, rosco: r, mensaje: `«${resp}» no empieza por ${p.letra}.` });
      } else if (p.tipo === 'contiene' && !n.includes(l)) {
        out.push({ gravedad: 'error', letra: p.letra, rosco: r, mensaje: `«${resp}» no contiene la ${p.letra}.` });
      } else if (p.tipo === 'contiene' && n.startsWith(l)) {
        out.push({ gravedad: 'aviso', letra: p.letra, rosco: r, mensaje: `«${resp}» empieza por ${p.letra}: puedes marcarla como «Empieza por».` });
      }
      const pistaN = normalizar(p.pista);
      const propia = palabrasClave(resp).filter(w => contieneFrase(pistaN, w));
      if (propia.length) {
        out.push({ gravedad: 'aviso', letra: p.letra, rosco: r, mensaje: `La pista contiene parte de su propia respuesta («${propia[0]}»).` });
      }
      secuencia.push({ r, letra: p.letra, pista: pistaN, respuesta: resp });
    }
  });

  secuencia.forEach((a, i) => {
    for (let j = i + 1; j < secuencia.length; j++) {
      const b = secuencia[j];
      const frase = normalizar(b.respuesta);
      if (frase.replace(/ /g, '').length < 4) continue;
      if (contieneFrase(a.pista, frase)) {
        const donde = b.r === a.r ? `la ${b.letra}` : `la ${b.letra} del rosco «${roscos[b.r].nombre}»`;
        out.push({ gravedad: 'aviso', letra: a.letra, rosco: a.r, mensaje: `Destripa ${donde}: la pista dice «${b.respuesta}», que todavía no ha salido.` });
      }
    }
  });

  return out;
}
