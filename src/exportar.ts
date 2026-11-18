// Exportar e importar roscos: JSON para pasarlos de un ordenador a otro, HTML que funciona sin internet
// y enlace para compartir.

import { COPIA_PAGINA } from './copia.ts';
import { codificar } from './compartir.ts';
import { sanear, type Rosco } from './modelo.ts';
import { descargar, nombreArchivo } from './ui.ts';

export function exportarJSON(roscos: Rosco[]): void {
  const datos = roscos.length === 1 ? roscos[0] : { roscomaker: 1, roscos };
  descargar(`${nombreArchivo(roscos.length === 1 ? roscos[0].nombre : 'roscos')}.json`, JSON.stringify(datos, null, 2), 'application/json');
}

/** Lee un .json exportado (uno o varios roscos). */
export async function importarArchivo(archivo: File): Promise<Rosco[]> {
  let datos: unknown;
  try {
    datos = JSON.parse(await archivo.text());
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  const lista = Array.isArray((datos as any)?.roscos) ? (datos as any).roscos : Array.isArray(datos) ? datos : [datos];
  return (lista as unknown[]).map(sanear);
}

/** ¿Estamos en la versión compilada (un solo archivo)? En desarrollo la página carga módulos sueltos. */
export function puedeExportarHTML(): boolean {
  return !/<script[^>]+type="module"[^>]+src=/.test(COPIA_PAGINA);
}

/**
 * Construye el HTML autónomo: la app entera con los roscos dentro, arrancando directamente en el juego.
 * Se trabaja sobre el DOM de la copia y no con búsquedas de texto: el propio código de la app va dentro de la
 * página y contiene cadenas como «</head>», así que buscarlas en el texto podría partir el código.
 */
export function htmlAutonomo(roscos: Rosco[], duelo?: { nombres: [string, string]; segundos: number }): string {
  const doc = new DOMParser().parseFromString(COPIA_PAGINA, 'text/html');
  doc.getElementById('roscomaker-datos')?.remove();
  doc.title = `${roscos.length === 1 ? roscos[0].nombre : duelo ? 'Duelo de roscos' : 'Roscos'} · RoscoMaker`;
  const datos = doc.createElement('script');
  datos.id = 'roscomaker-datos';
  datos.type = 'application/json';
  // «<» escapado: así el JSON nunca puede cerrar la etiqueta por accidente.
  datos.textContent = JSON.stringify({ roscos, duelo }).replace(/</g, '\\u003c');
  doc.head.append(datos);
  return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
}

export function exportarHTML(roscos: Rosco[], duelo?: { nombres: [string, string]; segundos: number }): void {
  if (!puedeExportarHTML()) throw new Error('El HTML sin internet solo se puede exportar desde la versión compilada (npm run build).');
  const nombre = roscos.length === 1 ? roscos[0].nombre : duelo ? `duelo ${duelo.nombres.join(' ')}` : 'roscos';
  descargar(`${nombreArchivo(nombre)}.html`, htmlAutonomo(roscos, duelo), 'text/html');
}

export async function enlaceCompartir(r: Rosco): Promise<string> {
  return location.href.split('#')[0] + '#/r/' + (await codificar(r));
}
