// Aplica un tema a la página con variables CSS y calcula los colores de texto que se leen encima de cada color.

import { contraste, deHex, type RGB } from './paleta.ts';
import { pilaFuente } from './fuentes.ts';
import type { Tema } from './modelo.ts';

const BLANCO: RGB = [255, 255, 255];

/** Texto que mejor se lee sobre un color: blanco o el color oscuro indicado. */
export function textoSobre(fondo: string, oscuro = '#0d0b10'): string {
  return contraste(deHex(fondo), BLANCO) >= contraste(deHex(fondo), deHex(oscuro)) ? '#ffffff' : oscuro;
}

export function aplicarTema(tema: Tema, raiz: HTMLElement = document.documentElement): void {
  const s = raiz.style;
  s.setProperty('--fondo', tema.fondo);
  s.setProperty('--acento', tema.acento);
  s.setProperty('--ficha', tema.ficha);
  s.setProperty('--resalte', tema.resalte);
  s.setProperty('--ok', tema.ok);
  s.setProperty('--ko', tema.ko);
  // Sobre el resalte va el acento si se lee; si no, el fondo.
  s.setProperty('--sobre-resalte', contraste(deHex(tema.resalte), deHex(tema.acento)) >= 3 ? tema.acento : tema.fondo);
  s.setProperty('--sobre-acento', textoSobre(tema.acento));
  s.setProperty('--sobre-ficha', textoSobre(tema.ficha));
  s.setProperty('--sobre-ok', textoSobre(tema.ok, '#06240f'));
  s.setProperty('--sobre-ko', textoSobre(tema.ko));
  s.setProperty('--titulos', pilaFuente(tema.fuente));
  s.setProperty('--foto', tema.foto ? `url("${tema.foto}")` : 'none');
}

export interface AvisoContraste { papel: string; valor: number; minimo: number }

/** Comprueba que el texto de cada papel se lee (WCAG: 3 para texto grande). */
export function avisosContraste(t: Tema): AvisoContraste[] {
  const pares: [string, string, string, number][] = [
    ['Fondo', t.fondo, textoSobre(t.fondo), 4.5],
    ['Acento', t.acento, textoSobre(t.acento), 3],
    ['Fichas', t.ficha, textoSobre(t.ficha), 4.5],
    ['Resalte', t.resalte, contraste(deHex(t.resalte), deHex(t.acento)) >= 3 ? t.acento : t.fondo, 3],
    ['Acierto', t.ok, textoSobre(t.ok, '#06240f'), 3],
    ['Fallo', t.ko, textoSobre(t.ko), 3],
  ];
  return pares
    .map(([papel, a, b, minimo]) => ({ papel, valor: Math.round(contraste(deHex(a), deHex(b)) * 10) / 10, minimo }))
    .filter(x => x.valor < x.minimo);
}
