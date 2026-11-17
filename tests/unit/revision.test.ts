import { describe, expect, it } from 'vitest';
import { revisar } from '../../src/revision.ts';
import { roscoNuevo, type Rosco } from '../../src/modelo.ts';

function con(datos: [string, string, string, ('empieza' | 'contiene')?][], sentido: 'az' | 'za' = 'az', nombre = 'R'): Rosco {
  const r = roscoNuevo(nombre, datos.map(d => d[0]));
  r.opciones.sentido = sentido;
  datos.forEach(([l, pista, resp, tipo]) => {
    const p = r.preguntas.find(q => q.letra === l)!;
    p.pista = pista; p.respuestas = [resp]; if (tipo) p.tipo = tipo;
  });
  return r;
}

describe('revisar', () => {
  it('avisa de huecos y de respuestas que no cuadran con su letra', () => {
    const msgs = revisar([con([['A', '', 'Avión'], ['B', 'Algo', 'Coche'], ['X', 'Algo', 'Taxi', 'contiene'], ['C', 'Algo', '']])]).map(p => p.letra + ': ' + p.mensaje);
    expect(msgs).toContain('A: Falta la pista.');
    expect(msgs).toContain('B: «Coche» no empieza por B.');
    expect(msgs).toContain('C: Falta la respuesta.');
    expect(msgs.some(m => m.startsWith('X'))).toBe(false);
  });
  it('detecta una pista que nombra una respuesta que aún no ha salido', () => {
    const r = con([['A', 'Película con Kevin McCallister', 'Algo'], ['K', 'Niño de «Solo en casa»', 'Kevin McCallister']]);
    expect(revisar([r]).some(p => p.letra === 'A' && p.mensaje.includes('Destripa la K'))).toBe(true);
  });
  it('no avisa si la respuesta nombrada ya salió (depende del sentido)', () => {
    const r = con([['A', 'Película con Kevin McCallister', 'Algo'], ['K', 'Niño de «Solo en casa»', 'Kevin McCallister']], 'za');
    expect(revisar([r]).some(p => p.mensaje.includes('Destripa'))).toBe(false);
  });
  it('detecta destripes entre roscos que se juegan seguidos', () => {
    const r1 = con([['B', 'Serie de mujeres de la Biblia', 'Betsabé']], 'az', 'Uno');
    const r2 = con([['B', 'Libro sagrado', 'Biblia']], 'za', 'Dos');
    expect(revisar([r1, r2]).some(p => p.rosco === 0 && p.mensaje.includes('rosco «Dos»'))).toBe(true);
  });
  it('avisa si la pista contiene parte de su propia respuesta', () => {
    const r = con([['D', '¿Qué se hizo con los disfraces?', 'Desfile de disfraces']]);
    expect(revisar([r]).some(p => p.mensaje.includes('propia respuesta'))).toBe(true);
  });
});
