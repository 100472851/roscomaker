// Duelo de dos equipos, cada uno con su rosco. El turno pasa al otro equipo al fallar o al decir «Pasapalabra»,
// como en la tele. Un equipo deja de jugar cuando completa su rosco o se queda sin tiempo.

import { Partida } from './partida.ts';
import type { Rosco } from './modelo.ts';

export interface Equipo { nombre: string; partida: Partida }

export class Duelo {
  equipos: [Equipo, Equipo];
  turno: 0 | 1 = 0;

  constructor(a: Rosco, b: Rosco, nombres: [string, string], segundos: number) {
    const conTiempo = (r: Rosco): Rosco => ({ ...r, opciones: { ...r.opciones, segundos } });
    this.equipos = [
      { nombre: nombres[0] || 'Equipo 1', partida: new Partida(conTiempo(a)) },
      { nombre: nombres[1] || 'Equipo 2', partida: new Partida(conTiempo(b)) },
    ];
  }

  get activo(): Equipo { return this.equipos[this.turno]; }
  get terminado(): boolean { return this.equipos.every(e => e.partida.terminada); }

  /** Cambia de turno si el otro equipo aún puede jugar. Devuelve true si ha cambiado. */
  cambiarTurno(): boolean {
    const otro = (1 - this.turno) as 0 | 1;
    if (this.equipos[otro].partida.terminada) return false;
    this.turno = otro;
    return true;
  }

  /**
   * Llamar tras cada jugada del equipo activo. Si ha fallado o ha pasado (o se ha quedado sin tiempo),
   * el turno pasa al otro equipo.
   */
  trasJugada(jugada: 'bien' | 'mal' | 'pasa'): void {
    const p = this.activo.partida;
    if (jugada === 'bien' && !p.terminada) return;
    this.cambiarTurno();
  }

  /** Ganador: más aciertos; si empatan, menos fallos. null si sigue empatado. */
  ganador(): Equipo | null {
    const [a, b] = this.equipos;
    if (a.partida.aciertos !== b.partida.aciertos) return a.partida.aciertos > b.partida.aciertos ? a : b;
    if (a.partida.fallos !== b.partida.fallos) return a.partida.fallos < b.partida.fallos ? a : b;
    return null;
  }
}
