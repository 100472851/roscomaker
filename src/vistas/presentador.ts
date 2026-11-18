// Vista de presentador: otra ventana (en el portátil) con la respuesta de cada letra y el mando.
// Se comunica con la ventana del rosco (en el proyector) por BroadcastChannel, sin servidor.

import { abrirCanal, type Accion, type EstadoPresentador } from '../canal.ts';
import { h, mmss } from '../ui.ts';

export function montarPresentador(raiz: HTMLElement, canalId: string): () => void {
  let ultimo: EstadoPresentador | null = null;
  let sel = 1; // 0 ✓ · 1 Pasapalabra · 2 ✗
  const cont = h('main.presentador');
  raiz.append(cont);
  document.title = 'Presentador · RoscoMaker';

  const canal = abrirCanal(canalId, m => { if (m.tipo === 'estado') { ultimo = m.estado; pintar(); } });
  canal.enviar({ tipo: 'hola' });
  const reintento = setInterval(() => { if (!ultimo) canal.enviar({ tipo: 'hola' }); }, 1000);
  const mandar = (accion: Accion) => canal.enviar({ tipo: 'accion', accion });

  function pintar() {
    const e = ultimo;
    if (!e || !e.partida || e.pantalla !== 'juego') {
      cont.replaceChildren(h('div.espera', null,
        h('h1.titulo', null, e?.pantalla === 'fin' ? 'Partida terminada' : 'Esperando al rosco'),
        h('p', null, e?.pantalla === 'fin'
          ? 'El resultado está en la pantalla del rosco.'
          : 'Empieza la partida en la otra ventana. Aquí verás la respuesta de cada letra y podrás marcar ✓, ✗ o Pasapalabra.')));
      return;
    }
    const p = e.partida;
    const letra = p.letras[p.actual];
    const decidiendo = p.fase === 'pregunta' || p.fase === 'duda';
    const botones = [
      h('button.b-bien', { onclick: () => mandar('bien'), disabled: !decidiendo }, '✓ Bien'),
      h('button.b-pasa', { onclick: () => mandar('pasa'), disabled: p.fase !== 'pregunta' }, 'Pasapalabra'),
      h('button.b-mal', { onclick: () => mandar('mal'), disabled: !decidiendo }, '✗ Mal'),
    ];
    botones.forEach((b, i) => { b.style.opacity = i === sel ? '1' : '.55'; b.style.boxShadow = i === sel ? 'inset 0 0 0 4px #fff' : ''; });
    cont.replaceChildren(...([
      h('div.arriba', null,
        h('div.acciones', null,
          h('span.tag.oscura', null, p.nombre),
          e.duelo ? h('span.tag.resalte', null, 'Turno de ', h('b', null, e.duelo.nombres[e.duelo.turno])) : null),
        h('div.acciones', null,
          h('span.tag.verde', null, 'Bien ', h('b', null, String(p.aciertos))),
          h('span.tag.roja', null, 'Mal ', h('b', null, String(p.fallos))),
          p.quedan !== null ? h('span.tag.linea', null, '⏱ ', h('b', null, mmss(p.quedan))) : null)),
      h('div.letra-actual', null,
        h('div.bola', null, letra),
        h('div', null,
          h('span.tag.oscura', null, (p.tipo === 'contiene' ? 'Contiene la ' : 'Empieza por ') + letra),
          h('p.pista-grande', { style: 'margin-top:10px' }, p.pista || '(sin pista)'))),
      h('div.solucion', null,
        h('small', null, 'Respuesta'),
        h('strong', null, p.respuestas[0] || '—'),
        p.respuestas.length > 1 ? h('em', null, 'También vale: ' + p.respuestas.slice(1).join(' · ')) : null),
      p.fase === 'duda' ? h('p.escrito', null, 'Han escrito: ', h('b', null, p.escrita), ' — decide si vale.') : null,
      p.fase === 'bien' ? h('p.escrito', { style: 'color:var(--ok)' }, '✓ Correcto') : null,
      p.fase === 'mal' ? h('p.escrito', { style: 'color:#ff8b80' }, '✗ Fallo (la respuesta no se ha enseñado en pantalla)') : null,
      h('div.mando', null, ...botones,
        h('button.b-seguir.seguir', { onclick: () => mandar('seguir'), disabled: p.fase !== 'bien' && p.fase !== 'mal' }, 'Siguiente letra →')),
      h('div.letras', null, ...p.letras.map((l, i) => h('span', {
        class: (p.estado[i] === 'pend' ? '' : p.estado[i]) + (i === p.actual && decidiendo ? ' actual' : ''),
      }, l))),
      h('p', { style: 'opacity:.6;font-size:14px' }, 'Teclado: ← → para elegir, Intro para confirmar.'),
    ].filter(Boolean) as Node[]));
  }

  function teclado(e: KeyboardEvent) {
    const p = ultimo?.partida;
    if (!p || ultimo?.pantalla !== 'juego') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); sel = Math.max(0, Math.min(2, sel + (e.key === 'ArrowRight' ? 1 : -1))); pintar(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (p.fase === 'bien' || p.fase === 'mal') { mandar('seguir'); sel = 1; return; }
      mandar((['bien', 'pasa', 'mal'] as Accion[])[sel]);
      sel = 1;
    }
  }
  addEventListener('keydown', teclado);
  pintar();

  return () => { clearInterval(reintento); removeEventListener('keydown', teclado); canal.cerrar(); };
}
