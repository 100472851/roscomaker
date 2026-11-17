import { describe, expect, it } from 'vitest';
import { importarTabla } from '../../src/importar.ts';

describe('importarTabla', () => {
  it('lee lo pegado desde una hoja de cálculo con cabecera', () => {
    const txt = 'Letra\tTipo\tPregunta / pista\tRespuesta\tOtras respuestas válidas\n' +
      'A\tEmpieza por\tUna pista\tAmélie\tAmeli / Amélie P.\n' +
      'Ñ\tContiene\tOtra\tEspaña\t\n';
    const { preguntas, ignoradas } = importarTabla(txt);
    expect(ignoradas).toEqual([]);
    expect(preguntas).toHaveLength(2);
    expect(preguntas[0]).toEqual({ letra: 'A', tipo: 'empieza', pista: 'Una pista', respuestas: ['Amélie', 'Ameli', 'Amélie P.'] });
    expect(preguntas[1].tipo).toBe('contiene');
  });
  it('lee CSV con comillas y punto y coma', () => {
    const txt = 'letra;pista;respuesta\nb;"Una pista; con punto y coma";"Barco"\n';
    expect(importarTabla(txt).preguntas[0]).toMatchObject({ letra: 'B', pista: 'Una pista; con punto y coma', respuestas: ['Barco'] });
  });
  it('sin cabecera y con tres columnas asume letra, pista y respuesta', () => {
    const { preguntas } = importarTabla('X,Algo con equis,Taxi\nZ,Animal,Zorro');
    expect(preguntas.map(p => [p.letra, p.tipo])).toEqual([['X', 'contiene'], ['Z', 'empieza']]);
  });
  it('ignora filas sin letra válida y letras repetidas', () => {
    const { preguntas, ignoradas } = importarTabla('A,p,Asa\n?,p,Nada\nA,p,Otra');
    expect(preguntas).toHaveLength(1);
    expect(ignoradas).toHaveLength(2);
  });
});
