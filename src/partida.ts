// Estado de una partida de un rosco, sin nada de pantalla. La vista solo pinta y llama a estas funciones.

import { esCorrecta } from './corrector.ts';
import { enOrdenDeJuego, type Pregunta, type Rosco } from './modelo.ts';

export type EstadoLetra = 'pend' | 'pasada' | 'ok' | 'ko';
/** pregunta: esperando respuesta · duda: no coincide y alguien decide · bien/mal: resultado a la vista · fin */
export type Fase = 'pregunta' | 'duda' | 'bien' | 'mal' | 'fin';

export class Partida {
  readonly preguntas: Pregunta[];
  estado: EstadoLetra[];
  actual = 0;
  fase: Fase = 'pregunta';
  /** Lo último que se escribió (para enseñarlo en «¿Es válida?»). */
  escrita = '';
  /** Segundos que quedan; Infinity si no hay tiempo. */
  quedan: number;

  constructor(readonly rosco: Rosco) {
    this.preguntas = enOrdenDeJuego(rosco);
    this.estado = this.preguntas.map(() => 'pend');
    this.quedan = rosco.opciones.segundos > 0 ? rosco.opciones.segundos : Infinity;
  }

  get pregunta(): Pregunta { return this.preguntas[this.actual]; }
  get aciertos(): number { return this.estado.filter(e => e === 'ok').length; }
  get fallos(): number { return this.estado.filter(e => e === 'ko').length; }
  get pendientes(): number { return this.estado.length - this.aciertos - this.fallos; }
  get terminada(): boolean { return this.fase === 'fin'; }

  /** Comprueba lo escrito. Devuelve la fase nueva; si está vacío no hace nada. */
  responder(texto: string): Fase {
    if (this.fase !== 'pregunta' || !texto.trim()) return this.fase;
    this.escrita = texto.trim();
    if (esCorrecta(texto, this.pregunta.respuestas)) return this.marcar(true);
    this.fase = 'duda';
    return this.fase;
  }

  /** Bien o mal decidido por quien presenta (desde «¿Es válida?» o en modo presentación). */
  marcar(bien: boolean): Fase {
    if (this.fase !== 'pregunta' && this.fase !== 'duda') return this.fase;
    this.estado[this.actual] = bien ? 'ok' : 'ko';
    this.fase = bien ? 'bien' : 'mal';
    return this.fase;
  }

  pasar(): Fase {
    if (this.fase !== 'pregunta') return this.fase;
    this.estado[this.actual] = 'pasada';
    return this.siguiente();
  }

  /** Va a la siguiente letra sin contestar (dando la vuelta). Si no queda ninguna, termina. */
  siguiente(): Fase {
    if (this.fase === 'fin') return this.fase;
    const n = this.preguntas.length;
    for (let k = 1; k <= n; k++) {
      const j = (this.actual + k) % n;
      if (this.estado[j] === 'pend' || this.estado[j] === 'pasada') {
        this.actual = j;
        this.fase = 'pregunta';
        this.escrita = '';
        return this.fase;
      }
    }
    this.fase = 'fin';
    return this.fase;
  }

  /** Cambia una letra ya contestada de bien a mal o al revés (si alguien se equivocó al validar). */
  corregir(i: number): boolean {
    if (this.estado[i] !== 'ok' && this.estado[i] !== 'ko') return false;
    this.estado[i] = this.estado[i] === 'ok' ? 'ko' : 'ok';
    if (i === this.actual && (this.fase === 'bien' || this.fase === 'mal')) this.fase = this.estado[i] === 'ok' ? 'bien' : 'mal';
    return true;
  }

  /** Descuenta tiempo. Si se acaba, la partida termina. */
  tictac(segundos: number): void {
    if (this.fase === 'fin' || this.quedan === Infinity) return;
    this.quedan = Math.max(0, this.quedan - segundos);
    if (this.quedan === 0) this.fase = 'fin';
  }

  terminar(): void { this.fase = 'fin'; }

  /** Foto del estado para la vista de presentador (incluye respuestas: no se enseña en el proyector). */
  instantanea() {
    return {
      nombre: this.rosco.nombre,
      letras: this.preguntas.map(p => p.letra),
      estado: [...this.estado],
      actual: this.actual,
      fase: this.fase,
      escrita: this.escrita,
      pista: this.pregunta.pista,
      tipo: this.pregunta.tipo,
      respuestas: this.pregunta.respuestas,
      aciertos: this.aciertos,
      fallos: this.fallos,
      quedan: this.quedan === Infinity ? null : this.quedan,
    };
  }
}

export type Instantanea = ReturnType<Partida['instantanea']>;
