import { describe, expect, it } from 'vitest';
import { Duelo } from '../../src/duelo.ts';
import { roscoNuevo } from '../../src/modelo.ts';

const r = () => { const x = roscoNuevo('R', ['A', 'B']); x.preguntas.forEach(p => { p.pista = 'p'; p.respuestas = [p.letra + 'xxxx']; }); return x; };

describe('Duelo', () => {
  it('el turno pasa al fallar o pasar, no al acertar', () => {
    const d = new Duelo(r(), r(), ['Rojos', 'Azules'], 0);
    d.activo.partida.marcar(true); d.trasJugada('bien');
    expect(d.turno).toBe(0);
    d.activo.partida.siguiente(); d.activo.partida.marcar(false); d.trasJugada('mal');
    expect(d.turno).toBe(1);
    d.activo.partida.pasar(); d.trasJugada('pasa');
    expect(d.turno).toBe(0);
  });
  it('si un equipo ha terminado, sigue jugando el otro', () => {
    const d = new Duelo(r(), r(), ['A', 'B'], 0);
    d.equipos[1].partida.terminar();
    d.activo.partida.marcar(false); d.trasJugada('mal');
    expect(d.turno).toBe(0);
  });
  it('gana quien más acierta; si empatan, quien menos falla', () => {
    const d = new Duelo(r(), r(), ['A', 'B'], 0);
    d.equipos[0].partida.estado = ['ok', 'ko'];
    d.equipos[1].partida.estado = ['ok', 'pasada'];
    expect(d.ganador()?.nombre).toBe('B');
    d.equipos[1].partida.estado = ['ok', 'ko'];
    expect(d.ganador()).toBeNull();
  });
  it('cada equipo tiene su propio tiempo', () => {
    const d = new Duelo(r(), r(), ['A', 'B'], 90);
    expect(d.equipos[0].partida.quedan).toBe(90);
    expect(d.equipos[1].partida.quedan).toBe(90);
  });
});
