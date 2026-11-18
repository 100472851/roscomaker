// Biblioteca de roscos guardada en el navegador (localStorage). Sin servidor y sin cuentas.

import { EJEMPLOS } from './ejemplos.ts';
import { nuevoId, sanear, type Rosco } from './modelo.ts';

const CLAVE = 'roscomaker:roscos';
const CLAVE_INICIADO = 'roscomaker:iniciado';

function leerTodo(): Rosco[] {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) ?? '[]');
    if (!Array.isArray(crudo)) return [];
    return crudo.flatMap(x => { try { return [sanear(x)]; } catch { return []; } });
  } catch {
    return [];
  }
}

function escribirTodo(lista: Rosco[]): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch (e) {
    throw new Error('No queda sitio en el navegador. Quita la foto de fondo de algún rosco o borra alguno que no uses.', { cause: e });
  }
}

/** La primera vez se cargan los ejemplos para que la biblioteca no esté vacía. */
function iniciar(): void {
  try {
    if (localStorage.getItem(CLAVE_INICIADO) === '1') return;
    localStorage.setItem(CLAVE_INICIADO, '1');
    escribirTodo([...EJEMPLOS.map(r => structuredClone(r)), ...leerTodo()]);
  } catch { /* sin almacenamiento: se trabaja en memoria */ }
}

export function listar(): Rosco[] {
  iniciar();
  const lista = leerTodo();
  return (lista.length || hayAlmacen() ? lista : EJEMPLOS.map(r => structuredClone(r))).sort((a, b) => b.editado - a.editado);
}

export function obtener(id: string): Rosco | null {
  iniciar();
  return leerTodo().find(r => r.id === id) ?? (hayAlmacen() ? null : EJEMPLOS.find(r => r.id === id) ?? null);
}

function hayAlmacen(): boolean {
  try { localStorage.setItem('roscomaker:prueba', '1'); localStorage.removeItem('roscomaker:prueba'); return true; } catch { return false; }
}

export function guardar(r: Rosco): void {
  const lista = leerTodo();
  const i = lista.findIndex(x => x.id === r.id);
  const copia = { ...r, editado: Date.now() };
  if (i >= 0) lista[i] = copia; else lista.unshift(copia);
  escribirTodo(lista);
}

export function borrar(id: string): void {
  escribirTodo(leerTodo().filter(r => r.id !== id));
}

export function duplicar(r: Rosco): Rosco {
  const copia: Rosco = { ...structuredClone(r), id: nuevoId(), nombre: `${r.nombre} (copia)`, editado: Date.now() };
  guardar(copia);
  return copia;
}

/** Guarda un rosco que viene de fuera (JSON o enlace) como uno nuevo. */
export function anadirImportado(r: Rosco): Rosco {
  const nuevo = { ...r, id: nuevoId(), editado: Date.now() };
  guardar(nuevo);
  return nuevo;
}
