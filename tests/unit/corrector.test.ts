import { describe, expect, it } from 'vitest';
import { distancia, esCorrecta, normalizar, variantes } from '../../src/corrector.ts';

describe('normalizar', () => {
  it('quita tildes, mayúsculas y signos, pero conserva la ñ', () => {
    expect(normalizar('¡Amélie  POULAIN!')).toBe('amelie poulain');
    expect(normalizar('España')).toBe('españa');
    expect(normalizar('Jerusalén 445 a.C.')).toBe('jerusalen 445 a c');
  });
  it('quita el artículo inicial en las variantes', () => {
    expect(variantes('La casa de mis sueños')).toEqual(['lacasademissueños', 'casademissueños']);
  });
});

describe('distancia', () => {
  it('cuenta ediciones', () => {
    expect(distancia('gato', 'gato')).toBe(0);
    expect(distancia('gato', 'pato')).toBe(1);
    expect(distancia('', 'abc')).toBe(3);
    expect(distancia('kitten', 'sitting')).toBe(3);
  });
});

describe('esCorrecta', () => {
  it('acepta la respuesta sin tildes ni mayúsculas', () => {
    expect(esCorrecta('amelie poulain', ['Amélie Poulain'])).toBe(true);
    expect(esCorrecta('ESPANA', ['España'])).toBe(true); // la ñ cuenta como una errata y en 6 letras se perdona una
  });
  it('perdona una errata en palabras medianas y ninguna en cortas', () => {
    expect(esCorrecta('betsave', ['Betsabé'])).toBe(true);
    expect(esCorrecta('rot', ['Rut'])).toBe(false);
    expect(esCorrecta('up', ['Up'])).toBe(true);
  });
  it('acepta respuestas alternativas y sin artículo', () => {
    expect(esCorrecta('parasite', ['Parásitos', 'Parasite'])).toBe(true);
    expect(esCorrecta('casa de mis sueños', ['La casa de mis sueños'])).toBe(true);
  });
  it('rechaza lo vacío y lo claramente distinto', () => {
    expect(esCorrecta('   ', ['Algo'])).toBe(false);
    expect(esCorrecta('waterpolo', ['Voley Playa'])).toBe(false);
  });
});
