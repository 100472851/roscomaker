// Compartir un rosco por enlace: el rosco va comprimido dentro de la propia URL (después de #),
// así que no hace falta ningún servidor. La foto de fondo no viaja: haría el enlace enorme.

import { sanear, type Rosco } from './modelo.ts';

function aBase64Url(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(s: string): Uint8Array<ArrayBuffer> {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, c => c.charCodeAt(0));
}

async function transformar(bytes: Uint8Array<ArrayBuffer>, flujo: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  const salida = new Blob([bytes]).stream().pipeThrough(flujo);
  return new Uint8Array(await new Response(salida).arrayBuffer());
}

export async function codificar(rosco: Rosco): Promise<string> {
  const ligero = { ...rosco, tema: { ...rosco.tema, foto: null } };
  const json = new TextEncoder().encode(JSON.stringify(ligero));
  return aBase64Url(await transformar(json, new CompressionStream('deflate-raw')));
}

export async function decodificar(codigo: string): Promise<Rosco> {
  try {
    const json = await transformar(deBase64Url(codigo), new DecompressionStream('deflate-raw'));
    return sanear(JSON.parse(new TextDecoder().decode(json)));
  } catch (e) {
    throw new Error('El enlace está incompleto o dañado.', { cause: e });
  }
}
