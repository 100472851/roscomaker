// Preparar un duelo: dos equipos, un rosco cada uno, tiempo por equipo.

import * as almacen from '../almacen.ts';
import { exportarHTML } from '../exportar.ts';
import { revisar } from '../revision.ts';
import { aplicarTema } from '../tema.ts';
import { TEMA_WOW, type Rosco } from '../modelo.ts';
import { aviso, h } from '../ui.ts';
import { montarJuego } from './juego.ts';

const TIEMPOS: [number, string][] = [[0, 'Sin tiempo'], [120, '2:00 por equipo'], [150, '2:30 por equipo'], [180, '3:00 por equipo'], [240, '4:00 por equipo'], [300, '5:00 por equipo']];

export function montarDuelo(raiz: HTMLElement, ir: (ruta: string) => void): () => void {
  aplicarTema(TEMA_WOW);
  const roscos = almacen.listar();
  let jugando: (() => void) | null = null;

  const selector = (i: number) => h('select', null, ...roscos.map((r, k) => h('option', { value: r.id, selected: k === Math.min(i, roscos.length - 1) }, r.nombre)));
  const selA = selector(0), selB = selector(1);
  const nomA = h('input', { type: 'text', value: 'Equipo rojo', maxlength: 24 });
  const nomB = h('input', { type: 'text', value: 'Equipo azul', maxlength: 24 });
  const tiempo = h('select', null, ...TIEMPOS.map(([s, t]) => h('option', { value: String(s), selected: s === 150 }, t)));
  const avisos = h('p.contraste-mal');

  const elegidos = (): [Rosco, Rosco] | null => {
    const a = roscos.find(r => r.id === selA.value), b = roscos.find(r => r.id === selB.value);
    return a && b ? [a, b] : null;
  };
  const config = () => ({ nombres: [nomA.value.trim() || 'Equipo 1', nomB.value.trim() || 'Equipo 2'] as [string, string], segundos: Number(tiempo.value) });

  function comprobar() {
    const par = elegidos();
    if (!par) { avisos.textContent = ''; return; }
    const msgs: string[] = [];
    if (par[0].id === par[1].id) msgs.push('Los dos equipos tienen el mismo rosco.');
    const errores = revisar(par).filter(p => p.gravedad === 'error').length;
    if (errores) msgs.push(`Hay ${errores} huecos sin completar en estos roscos.`);
    avisos.textContent = msgs.join(' ');
  }
  [selA, selB].forEach(s => s.addEventListener('change', comprobar));

  function empezar() {
    const par = elegidos();
    if (!par) return;
    pagina.hidden = true;
    jugando = montarJuego(raiz, { roscos: par, duelo: config(), kiosko: false, alSalir: () => ir('#/') });
  }

  const pagina = h('main.app.formulario', null,
    h('header.cabecera', null,
      h('div.acciones', null, h('button.btn.fantasma', { onclick: () => ir('#/') }, '← Biblioteca'), h('h1.titulo', null, 'Duelo de equipos'))),
    h('p.lema', { style: 'margin-bottom:22px' }, 'Cada equipo juega su rosco. El turno pasa al otro equipo al fallar o al decir «Pasapalabra», y el reloj de cada equipo solo corre en su turno. Gana quien más acierta; si empatan, quien menos falla.'),
    roscos.length < 2 ? h('div.vacio-lista', null, 'Necesitas al menos dos roscos en la biblioteca.') : h('div', null,
      h('div.equipos', null,
        h('section.panel', null, h('h2.seccion', null, 'Equipo 1'), h('label.campo', null, h('span', null, 'Nombre'), nomA), h('label.campo', null, h('span', null, 'Rosco'), selA)),
        h('section.panel', null, h('h2.seccion', null, 'Equipo 2'), h('label.campo', null, h('span', null, 'Nombre'), nomB), h('label.campo', null, h('span', null, 'Rosco'), selB))),
      h('label.campo', { style: 'max-width:320px' }, h('span', null, 'Tiempo'), tiempo),
      avisos,
      h('div.acciones', { style: 'margin-top:18px' },
        h('button.btn.principal', { onclick: empezar }, 'Empezar duelo ▶'),
        h('button.btn.secundario', { onclick: () => { const par = elegidos(); if (par) try { exportarHTML(par, config()); } catch (e) { aviso((e as Error).message, 'error'); } } }, 'Descargar HTML del duelo'))));

  raiz.append(h('div.bg'), h('div.tint'), pagina);
  comprobar();
  return () => jugando?.();
}
