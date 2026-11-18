// Rosco que llega por enlace: se puede jugar sin guardarlo o añadirlo a la biblioteca.

import * as almacen from '../almacen.ts';
import { decodificar } from '../compartir.ts';
import { aplicarTema } from '../tema.ts';
import { aviso, h } from '../ui.ts';
import { miniRosco } from './biblioteca.ts';
import { montarJuego } from './juego.ts';

export function montarCompartido(raiz: HTMLElement, codigo: string, ir: (ruta: string) => void): () => void {
  let jugando: (() => void) | null = null;
  const pagina = h('main.app.formulario', null, h('p', null, 'Abriendo el rosco…'));
  raiz.append(h('div.bg'), h('div.tint'), pagina);

  decodificar(codigo).then(r => {
    aplicarTema(r.tema);
    pagina.replaceChildren(
      h('header.cabecera', null, h('div.acciones', null, h('button.btn.fantasma', { onclick: () => ir('#/') }, '← Biblioteca'))),
      h('section.panel', { style: 'display:flex;gap:24px;align-items:center;flex-wrap:wrap' },
        h('div', { style: `background:${r.tema.fondo};padding:10px` }, Object.assign(miniRosco(r), { style: 'width:140px;height:140px' })),
        h('div', { style: 'flex:1;min-width:240px' },
          h('h2.seccion', null, 'Te han compartido un rosco'),
          h('h1.titulo', null, r.nombre),
          h('p.lema', { style: 'margin:10px 0 18px' }, `${r.preguntas.length} letras · ${r.opciones.sentido === 'za' ? 'de la Z a la A' : 'de la A a la Z'}`),
          h('div.acciones', null,
            h('button.btn.principal', { onclick: () => { pagina.hidden = true; jugando = montarJuego(raiz, { roscos: [r], kiosko: false, alSalir: () => ir('#/') }); } }, 'Jugar ahora'),
            h('button.btn.secundario', { onclick: () => { const g = almacen.anadirImportado(r); aviso('Guardado en tu biblioteca.'); ir('#/editar/' + encodeURIComponent(g.id)); } }, 'Guardar en mi biblioteca')))));
  }).catch((e: Error) => {
    pagina.replaceChildren(h('h1.titulo', null, 'No se puede abrir'), h('p.lema', { style: 'margin:12px 0 20px' }, e.message),
      h('button.btn.principal', { onclick: () => ir('#/') }, 'Ir a la biblioteca'));
  });

  return () => jugando?.();
}
