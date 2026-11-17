import { describe, expect, it } from 'vitest';
import { Partida } from '../../src/partida.ts';
import { roscoNuevo } from '../../src/modelo.ts';

function rosco(letras = ['A', 'B', 'C'], sentido: 'az' | 'za' = 'az') {
  const r = roscoNuevo('Prueba', letras);
  r.preguntas.forEach(p => { p.pista = 'Pista ' + p.letra; p.respuestas = [p.letra + 'bcdef']; });
  r.opciones.sentido = sentido;
  return r;
}

describe('Partida', () => {
  it('acierta, falla y termina', () => {
    const p = new Partida(rosco());
    expect(p.pregunta.letra).toBe('A');
    expect(p.responder('abcdef')).toBe('bien');
    p.siguiente();
    expect(p.responder('nada que ver')).toBe('duda');
    expect(p.marcar(false)).toBe('mal');
    p.siguiente();
    p.marcar(true);
    expect(p.siguiente()).toBe('fin');
    expect([p.aciertos, p.fallos, p.pendientes]).toEqual([2, 1, 0]);
  });
  it('pasapalabra vuelve en la siguiente vuelta', () => {
    const p = new Partida(rosco());
    p.pasar();                     // A pasada → B
    p.marcar(true); p.siguiente(); // B bien → C
    p.marcar(true); p.siguiente(); // C bien → vuelve a A
    expect(p.pregunta.letra).toBe('A');
    expect(p.fase).toBe('pregunta');
  });
  it('respeta el sentido Z→A', () => {
    expect(new Partida(rosco(['A', 'B', 'C'], 'za')).pregunta.letra).toBe('C');
  });
  it('no hace nada con una respuesta vacía', () => {
    const p = new Partida(rosco());
    expect(p.responder('   ')).toBe('pregunta');
  });
  it('corrige una letra ya contestada', () => {
    const p = new Partida(rosco());
    p.marcar(true);
    expect(p.corregir(0)).toBe(true);
    expect(p.estado[0]).toBe('ko');
    expect(p.fase).toBe('mal');
    expect(p.corregir(1)).toBe(false);
  });
  it('se acaba con el tiempo', () => {
    const r = rosco(); r.opciones.segundos = 10;
    const p = new Partida(r);
    p.tictac(4); expect(p.quedan).toBe(6);
    p.tictac(7); expect(p.fase).toBe('fin');
  });
});
