import { describe, expect, it } from 'vitest';
import { EJEMPLOS } from '../../src/ejemplos.ts';
import { revisar } from '../../src/revision.ts';
import { esCorrecta } from '../../src/corrector.ts';
import { avisosContraste } from '../../src/tema.ts';
import { sanear } from '../../src/modelo.ts';

describe('roscos de ejemplo', () => {
  it('tienen las 27 letras y pasan la revisión sin avisos, también jugados seguidos', () => {
    for (const r of EJEMPLOS) expect(r.preguntas).toHaveLength(27);
    expect(revisar(EJEMPLOS)).toEqual([]);
    expect(revisar([...EJEMPLOS].reverse())).toEqual([]);
  });
  it('sus respuestas se aceptan escritas sin tildes ni mayúsculas', () => {
    for (const r of EJEMPLOS) for (const p of r.preguntas) {
      const llana = p.respuestas[0].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      expect(esCorrecta(llana, p.respuestas), `${r.nombre} ${p.letra}`).toBe(true);
    }
  });
  it('sus temas se leen bien', () => {
    for (const r of EJEMPLOS) expect(avisosContraste(r.tema)).toEqual([]);
  });
  it('sobreviven a sanear (export → import)', () => {
    for (const r of EJEMPLOS) expect(sanear(JSON.parse(JSON.stringify(r)))).toEqual(r);
  });
});
