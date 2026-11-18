// Comunicación entre la ventana del rosco (proyector) y la vista de presentador (portátil),
// dentro del mismo navegador y sin servidor: BroadcastChannel.

import type { Instantanea } from './partida.ts';

export type Accion = 'bien' | 'mal' | 'pasa' | 'seguir';

export interface EstadoPresentador {
  partida: Instantanea | null;
  pantalla: 'portada' | 'juego' | 'fin';
  duelo: { nombres: [string, string]; turno: 0 | 1; marcador: [number, number][]; quedan: (number | null)[] } | null;
}

export type Mensaje =
  | { tipo: 'estado'; estado: EstadoPresentador }
  | { tipo: 'accion'; accion: Accion }
  | { tipo: 'hola' };

export function abrirCanal(id: string, alRecibir: (m: Mensaje) => void): { enviar: (m: Mensaje) => void; cerrar: () => void } {
  if (typeof BroadcastChannel === 'undefined') return { enviar: () => {}, cerrar: () => {} };
  const bc = new BroadcastChannel('roscomaker-' + id);
  bc.onmessage = e => alRecibir(e.data as Mensaje);
  return { enviar: m => bc.postMessage(m), cerrar: () => bc.close() };
}
