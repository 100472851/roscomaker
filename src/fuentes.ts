// Tipografías (licencia SIL OFL, paquetes @fontsource). Solo el subconjunto latino: cabe el español entero
// y el archivo final no engorda. Van dentro del HTML para que todo funcione sin internet.
import archivo from '@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2?url';
import anton from '@fontsource/anton/files/anton-latin-400-normal.woff2?url';
import space from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';
import fraunces from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url';
import type { FuenteId } from './modelo.ts';

export const FUENTES: Record<FuenteId, { nombre: string; familia: string; descripcion: string }> = {
  archivo: { nombre: 'Archivo', familia: "'RM Archivo'", descripcion: 'Ancha y contundente, la del cartel del WOW Fest' },
  anton: { nombre: 'Anton', familia: "'RM Anton'", descripcion: 'Estrecha y alta, de cartel de cine' },
  space: { nombre: 'Space Grotesk', familia: "'RM Space'", descripcion: 'Geométrica y técnica' },
  fraunces: { nombre: 'Fraunces', familia: "'RM Fraunces'", descripcion: 'Con remates, más clásica' },
};

let cargadas = false;
export function cargarFuentes(): void {
  if (cargadas || typeof FontFace === 'undefined') return;
  cargadas = true;
  const caras: [string, string, FontFaceDescriptors][] = [
    ['RM Archivo', archivo, { weight: '100 900', stretch: '62% 125%' }],
    ['RM Anton', anton, { weight: '400' }],
    ['RM Space', space, { weight: '300 700' }],
    ['RM Fraunces', fraunces, { weight: '100 900' }],
  ];
  for (const [familia, url, desc] of caras) {
    const f = new FontFace(familia, `url(${url})`, desc);
    document.fonts.add(f);
    f.load().catch(() => { /* si falla, se usa la de respaldo */ });
  }
}

/** Pila de fuentes CSS: la elegida para los títulos y Archivo para el texto corrido. */
export function pilaFuente(id: FuenteId): string {
  return `${FUENTES[id].familia}, 'RM Archivo', 'Arial Black', Arial, sans-serif`;
}
