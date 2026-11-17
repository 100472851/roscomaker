import { describe, expect, it } from 'vitest';
import { agrupar, contraste, deHex, repartir, type RGB } from '../../src/paleta.ts';

/** Imagen sintética: bloques de colores con proporciones conocidas. */
function imagen(bloques: [RGB, number][]): number[] {
  const px: number[] = [];
  for (const [[r, g, b], n] of bloques) for (let i = 0; i < n; i++) px.push(r + (i % 3), g, b, 255);
  return px;
}

describe('agrupar', () => {
  it('encuentra los colores principales y su peso', () => {
    const c = agrupar(imagen([[[20, 20, 30], 600], [[250, 60, 30], 300], [[30, 40, 100], 100]]), 3);
    expect(c[0].peso).toBeCloseTo(0.6, 1);
    expect(c.map(x => x.color[0] > 200)).toContain(true);
  });
  it('se salta los píxeles transparentes', () => {
    expect(agrupar([255, 0, 0, 0, 255, 0, 0, 0], 2)).toEqual([]);
  });
});

describe('repartir', () => {
  it('reparte papeles legibles: texto blanco sobre fondo, acento y fichas', () => {
    const p = repartir(agrupar(imagen([[[40, 30, 45], 500], [[255, 70, 40], 250], [[40, 60, 140], 150], [[220, 245, 180], 100]]), 4));
    const blanco: RGB = [255, 255, 255];
    expect(contraste(deHex(p.fondo), blanco)).toBeGreaterThanOrEqual(15);
    expect(contraste(deHex(p.acento), blanco)).toBeGreaterThanOrEqual(3);
    expect(contraste(deHex(p.ficha), blanco)).toBeGreaterThanOrEqual(7);
    expect(contraste(deHex(p.resalte), deHex(p.acento))).toBeGreaterThanOrEqual(3);
  });
  it('con una foto en blanco y negro se inventa un acento con color', () => {
    const p = repartir(agrupar(imagen([[[10, 10, 10], 500], [[200, 200, 200], 500]]), 2));
    expect(p.acento).not.toMatch(/^#(\w\w)\1\1$/);
  });
});
