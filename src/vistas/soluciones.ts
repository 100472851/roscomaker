// Hoja de soluciones para quien presenta: se imprime o se guarda como PDF desde el navegador.

import { enOrdenDeJuego, type Rosco } from '../modelo.ts';
import { aplicarTema } from '../tema.ts';
import { h } from '../ui.ts';

export function montarSoluciones(raiz: HTMLElement, roscos: Rosco[], volver: () => void): () => void {
  aplicarTema(roscos[0].tema);
  const pag = h('div.hoja-soluciones');

  pag.append(h('section.sol-portada', null,
    h('span.tag.linea', null, 'Solo para quien presenta'),
    h('div.slab', null, h('span.grande.blurtxt', null, roscos[0].portada.grande || 'ROSCO'), roscos[0].portada.etiqueta ? h('span.etiqueta', null, roscos[0].portada.etiqueta) : null),
    h('p.sol-titulo', null, 'SOLUCIONES'),
    h('p.sol-sub', null, roscos.map(r => `${r.nombre} (${r.opciones.sentido === 'za' ? 'Z → A' : 'A → Z'})`).join(' · '))));

  for (const r of roscos) {
    const lista = enOrdenDeJuego(r);
    const trozos = lista.length > 14 ? [lista.slice(0, Math.ceil(lista.length / 2)), lista.slice(Math.ceil(lista.length / 2))] : [lista];
    trozos.forEach((t, k) => pag.append(h('section.sol-rosco', null,
      h('div.sol-cab', null, h('h1', null, h('span', null, r.nombre.toUpperCase())),
        h('div.sentido', null, (r.opciones.sentido === 'za' ? 'De la Z a la A' : 'De la A a la Z') + (trozos.length > 1 ? ` · ${k + 1}/${trozos.length}` : ''))),
      h('table', null,
        h('thead', null, h('tr', null, h('th'), h('th', null, 'Pista'), h('th', null, 'Respuesta'), h('th.c', null, '✓'))),
        h('tbody', null, ...t.map(p => h('tr', null,
          h('td.l', null, h('span.bola', null, p.letra), p.tipo === 'contiene' ? h('span.cont', null, 'contiene') : null),
          h('td.p', null, p.pista),
          h('td.r', null, p.respuestas[0], p.respuestas.length > 1 ? h('small', null, 'También: ' + p.respuestas.slice(1).join(' · ')) : null),
          h('td.c', null, h('span.caja'))))))
    )));
  }

  pag.append(h('section.sol-chuleta', null,
    h('div.sol-cab', null, h('h1', null, h('span', null, 'CHULETA')), h('div.sentido', null, 'Solo respuestas')),
    h('div.cols', { style: `grid-template-columns:repeat(${Math.min(roscos.length, 3)},1fr)` }, ...roscos.map(r => h('div', null,
      h('h2', null, r.nombre),
      h('ol', null, ...enOrdenDeJuego(r).map(p => h('li', null, h('span.bola.s', null, p.letra), h('b', null, p.respuestas[0]))))))),
    h('div.marcadores', null, ...roscos.map(r => h('div', null, `${r.nombre} · marcador`, h('span', null, h('em', null, 'Bien ______'), h('em', null, 'Mal ______')))))));

  const barra = h('div.sol-barra', null,
    h('button.btn.fantasma', { onclick: volver }, '← Volver'),
    h('span', null, 'En el diálogo de imprimir elige «Guardar como PDF». Activa «Gráficos de fondo» para ver los colores.'),
    h('button.btn.principal', { onclick: () => print() }, 'Imprimir / Guardar PDF'));

  document.body.classList.add('modo-soluciones');
  raiz.append(barra, pag);
  return () => document.body.classList.remove('modo-soluciones');
}
