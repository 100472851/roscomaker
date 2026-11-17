// Modelo de datos de un rosco. Todo lo que se guarda, se exporta o se comparte tiene esta forma.

export const ABECEDARIO = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

export type Tipo = 'empieza' | 'contiene';
export type Modo = 'juego' | 'presentacion';
export type Sentido = 'az' | 'za';
export type FuenteId = 'archivo' | 'anton' | 'space' | 'fraunces';

export interface Pregunta {
  letra: string;
  tipo: Tipo;
  pista: string;
  /** La primera es la principal; el resto también se dan por buenas. */
  respuestas: string[];
}

export interface Portada {
  linea: string;    // «¡BIENVENIDOS AL ROSCO DEL»
  grande: string;   // «WOW»
  etiqueta: string; // «FEST!»
  fecha: string;    // «Sábado 21/11» (puede ir vacía)
}

export interface Tema {
  fondo: string;
  acento: string;   // bloques rojos, letra actual
  ficha: string;    // círculos de las letras, etiquetas
  resalte: string;  // botón principal, etiqueta grande
  ok: string;
  ko: string;
  fuente: FuenteId;
  /** Foto de fondo (data URL reducida) o null. */
  foto: string | null;
}

export interface Opciones {
  modo: Modo;
  sentido: Sentido;
  sonidos: boolean;
  /** Tiempo total en segundos; 0 = sin tiempo. */
  segundos: number;
}

export interface Rosco {
  v: 1;
  id: string;
  nombre: string;
  editado: number;
  preguntas: Pregunta[];
  portada: Portada;
  tema: Tema;
  opciones: Opciones;
}

export const TEMA_WOW: Tema = {
  fondo: '#1b171f', acento: '#ff3b1d', ficha: '#1d2a5c', resalte: '#dcf7a9',
  ok: '#22c55e', ko: '#e5231a', fuente: 'archivo', foto: null,
};

export const OPCIONES_BASE: Opciones = { modo: 'juego', sentido: 'az', sonidos: true, segundos: 0 };

export function nuevoId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Tipo por defecto: la Ñ y la X casi nunca van al principio de una palabra. */
export function tipoPorDefecto(letra: string): Tipo {
  return letra === 'Ñ' || letra === 'X' ? 'contiene' : 'empieza';
}

export function preguntaVacia(letra: string): Pregunta {
  return { letra, tipo: tipoPorDefecto(letra), pista: '', respuestas: [''] };
}

export function roscoNuevo(nombre = 'Rosco sin nombre', letras: string[] = ABECEDARIO): Rosco {
  return {
    v: 1,
    id: nuevoId(),
    nombre,
    editado: Date.now(),
    preguntas: ordenar(letras).map(preguntaVacia),
    portada: { linea: '¡BIENVENIDOS AL', grande: 'ROSCO', etiqueta: '¡A JUGAR!', fecha: '' },
    tema: { ...TEMA_WOW },
    opciones: { ...OPCIONES_BASE },
  };
}

/** Ordena letras según el abecedario español (la Ñ va tras la N). */
export function ordenar(letras: string[]): string[] {
  return [...new Set(letras)].filter(l => ABECEDARIO.includes(l))
    .sort((a, b) => ABECEDARIO.indexOf(a) - ABECEDARIO.indexOf(b));
}

/** Preguntas en el orden en que se juegan. */
export function enOrdenDeJuego(r: Rosco): Pregunta[] {
  const lista = [...r.preguntas].sort((a, b) => ABECEDARIO.indexOf(a.letra) - ABECEDARIO.indexOf(b.letra));
  return r.opciones.sentido === 'za' ? lista.reverse() : lista;
}

const COLOR = /^#[0-9a-f]{6}$/i;
const texto = (x: unknown, def = '') => (typeof x === 'string' ? x : def);

/**
 * Convierte cualquier cosa leída de fuera (JSON importado, enlace compartido, localStorage)
 * en un Rosco válido. Lanza un error con un mensaje legible si no se puede.
 */
export function sanear(x: unknown): Rosco {
  if (!x || typeof x !== 'object') throw new Error('El archivo no contiene un rosco.');
  const o = x as Record<string, any>;
  if (!Array.isArray(o.preguntas)) throw new Error('El rosco no tiene preguntas.');
  const vistas = new Set<string>();
  const preguntas: Pregunta[] = [];
  for (const p of o.preguntas) {
    const letra = texto(p?.letra).toUpperCase();
    if (!ABECEDARIO.includes(letra) || vistas.has(letra)) continue;
    vistas.add(letra);
    let resp: string[] = Array.isArray(p.respuestas) ? p.respuestas.map((r: unknown) => texto(r)) : [texto(p.respuesta)];
    resp = resp.map(r => r.trim()).filter(Boolean);
    preguntas.push({
      letra,
      tipo: p.tipo === 'contiene' ? 'contiene' : 'empieza',
      pista: texto(p.pista).trim(),
      respuestas: resp.length ? resp : [''],
    });
  }
  if (!preguntas.length) throw new Error('El rosco no tiene ninguna letra válida.');
  preguntas.sort((a, b) => ABECEDARIO.indexOf(a.letra) - ABECEDARIO.indexOf(b.letra));
  const t = (o.tema ?? {}) as Record<string, unknown>;
  const c = (k: keyof Tema) => (typeof t[k] === 'string' && COLOR.test(t[k] as string) ? (t[k] as string) : (TEMA_WOW[k] as string));
  const fuentes: FuenteId[] = ['archivo', 'anton', 'space', 'fraunces'];
  const op = (o.opciones ?? {}) as Record<string, unknown>;
  const por = (o.portada ?? {}) as Record<string, unknown>;
  return {
    v: 1,
    id: texto(o.id) || nuevoId(),
    nombre: texto(o.nombre, 'Rosco importado').slice(0, 80) || 'Rosco importado',
    editado: typeof o.editado === 'number' ? o.editado : Date.now(),
    preguntas,
    portada: {
      linea: texto(por.linea, '¡BIENVENIDOS AL').slice(0, 60),
      grande: texto(por.grande, 'ROSCO').slice(0, 14),
      etiqueta: texto(por.etiqueta).slice(0, 20),
      fecha: texto(por.fecha).slice(0, 30),
    },
    tema: {
      fondo: c('fondo'), acento: c('acento'), ficha: c('ficha'), resalte: c('resalte'), ok: c('ok'), ko: c('ko'),
      fuente: fuentes.includes(t.fuente as FuenteId) ? (t.fuente as FuenteId) : 'archivo',
      foto: typeof t.foto === 'string' && t.foto.startsWith('data:image/') ? t.foto : null,
    },
    opciones: {
      modo: op.modo === 'presentacion' ? 'presentacion' : 'juego',
      sentido: op.sentido === 'za' ? 'za' : 'az',
      sonidos: op.sonidos !== false,
      segundos: typeof op.segundos === 'number' && op.segundos > 0 ? Math.min(Math.round(op.segundos), 3600) : 0,
    },
  };
}
