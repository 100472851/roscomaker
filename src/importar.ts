// Lee preguntas pegadas desde una hoja de cálculo (Excel, Google Sheets, Numbers) o un CSV.
// Columnas esperadas, en cualquier orden si hay cabecera: letra · tipo · pista · respuesta · otras respuestas.

import { normalizar } from './corrector.ts';
import { ABECEDARIO, tipoPorDefecto, type Pregunta, type Tipo } from './modelo.ts';

export interface ResultadoImportacion {
  preguntas: Pregunta[];
  ignoradas: string[];
}

/** Separa una línea CSV respetando comillas («"Hola, qué tal"»). */
function partirCsv(linea: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '', dentro = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (dentro) {
      if (c === '"' && linea[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') dentro = false;
      else cur += c;
    } else if (c === '"') dentro = true;
    else if (c === sep) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map(s => s.trim());
}

function detectarSeparador(lineas: string[]): string {
  const muestra = lineas.slice(0, 5).join('\n');
  if (muestra.includes('\t')) return '\t';
  return (muestra.match(/;/g)?.length ?? 0) > (muestra.match(/,/g)?.length ?? 0) ? ';' : ',';
}

const CABECERAS: Record<string, keyof Columnas> = {
  letra: 'letra', tipo: 'tipo', pista: 'pista', pregunta: 'pista', definicion: 'pista', 'pregunta pista': 'pista',
  respuesta: 'respuesta', solucion: 'respuesta', otras: 'otras', 'otras respuestas validas': 'otras',
  'otras respuestas': 'otras', alternativas: 'otras',
};
interface Columnas { letra: number; tipo: number; pista: number; respuesta: number; otras: number }

function leerTipo(s: string, letra: string): Tipo {
  const n = normalizar(s);
  if (n.startsWith('cont')) return 'contiene';
  if (n.startsWith('emp') || n === 'con') return 'empieza';
  return tipoPorDefecto(letra);
}

export function importarTabla(texto: string): ResultadoImportacion {
  const lineas = texto.replace(/\r/g, '').split('\n').filter(l => l.trim());
  const ignoradas: string[] = [];
  if (!lineas.length) return { preguntas: [], ignoradas };
  const sep = detectarSeparador(lineas);
  const filas = lineas.map(l => partirCsv(l, sep));

  // ¿La primera fila es una cabecera?
  let col: Columnas = { letra: 0, tipo: 1, pista: 2, respuesta: 3, otras: 4 };
  const primera = filas[0].map(c => normalizar(c));
  if (primera.some(c => c in CABECERAS)) {
    const c: Partial<Columnas> = {};
    primera.forEach((t, i) => { const k = CABECERAS[t]; if (k && c[k] === undefined) c[k] = i; });
    col = { letra: c.letra ?? -1, tipo: c.tipo ?? -1, pista: c.pista ?? -1, respuesta: c.respuesta ?? -1, otras: c.otras ?? -1 };
    filas.shift();
  } else if (filas[0].length === 3) {
    col = { letra: 0, tipo: -1, pista: 1, respuesta: 2, otras: -1 }; // letra · pista · respuesta
  }

  const vistas = new Set<string>();
  const preguntas: Pregunta[] = [];
  for (const f of filas) {
    const celda = (i: number) => (i >= 0 ? f[i] ?? '' : '');
    const letra = celda(col.letra).trim().toUpperCase().slice(0, 1);
    if (!ABECEDARIO.includes(letra)) { ignoradas.push(f.join(' · ')); continue; }
    if (vistas.has(letra)) { ignoradas.push(`${letra}: repetida`); continue; }
    vistas.add(letra);
    const otras = celda(col.otras).split(/[\/|]/).map(s => s.trim()).filter(Boolean);
    const principal = celda(col.respuesta).trim();
    preguntas.push({
      letra,
      tipo: col.tipo >= 0 ? leerTipo(celda(col.tipo), letra) : tipoPorDefecto(letra),
      pista: celda(col.pista).trim(),
      respuestas: [principal, ...otras].filter(Boolean).length ? [principal, ...otras].filter(Boolean) : [''],
    });
  }
  preguntas.sort((a, b) => ABECEDARIO.indexOf(a.letra) - ABECEDARIO.indexOf(b.letra));
  return { preguntas, ignoradas };
}
