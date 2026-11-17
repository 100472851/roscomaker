import { describe, expect, it } from 'vitest';
import { ABECEDARIO, enOrdenDeJuego, ordenar, roscoNuevo, sanear } from '../../src/modelo.ts';
import { codificar, decodificar } from '../../src/compartir.ts';

describe('modelo', () => {
  it('el abecedario tiene 27 letras con la Ñ tras la N', () => {
    expect(ABECEDARIO).toHaveLength(27);
    expect(ABECEDARIO.indexOf('Ñ')).toBe(ABECEDARIO.indexOf('N') + 1);
  });
  it('ordena y quita repetidas', () => {
    expect(ordenar(['Z', 'Ñ', 'A', 'N', 'A'])).toEqual(['A', 'N', 'Ñ', 'Z']);
  });
  it('un rosco nuevo tiene la Ñ y la X como «contiene»', () => {
    const r = roscoNuevo();
    expect(r.preguntas.filter(p => p.tipo === 'contiene').map(p => p.letra)).toEqual(['Ñ', 'X']);
  });
  it('el sentido Z→A invierte el orden de juego', () => {
    const r = roscoNuevo('x', ['A', 'B']); r.opciones.sentido = 'za';
    expect(enOrdenDeJuego(r).map(p => p.letra)).toEqual(['B', 'A']);
  });
  it('sanear limpia lo importado y rechaza lo que no es un rosco', () => {
    const r = sanear({ nombre: 'X', preguntas: [{ letra: 'a', respuesta: 'Asa', pista: 'p' }, { letra: 'a' }, { letra: '7' }], tema: { acento: 'rojo', fondo: '#000000' } });
    expect(r.preguntas).toHaveLength(1);
    expect(r.preguntas[0].respuestas).toEqual(['Asa']);
    expect(r.tema.acento).toBe('#ff3b1d');
    expect(r.tema.fondo).toBe('#000000');
    expect(() => sanear({})).toThrow();
    expect(() => sanear('hola')).toThrow();
  });
});

describe('compartir', () => {
  it('un rosco codificado en el enlace vuelve igual (sin la foto)', async () => {
    const r = roscoNuevo('Compartido'); r.preguntas[0].pista = 'Ñandú y acentos: áéí'; r.tema.foto = 'data:image/jpeg;base64,AAAA';
    const codigo = await codificar(r);
    expect(codigo).toMatch(/^[\w-]+$/);
    const vuelta = await decodificar(codigo);
    expect(vuelta.preguntas[0].pista).toBe('Ñandú y acentos: áéí');
    expect(vuelta.tema.foto).toBeNull();
  });
  it('un enlace dañado da un error legible', async () => {
    await expect(decodificar('esto-no-vale')).rejects.toThrow('El enlace está incompleto o dañado.');
  });
});
