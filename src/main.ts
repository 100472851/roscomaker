import './copia.ts'; // la primera: guarda la página antes de que nada la cambie
import './estilos/base.css';
import './estilos/juego.css';
import './estilos/app.css';
import './estilos/soluciones.css';
import { cargarFuentes } from './fuentes.ts';
import { sanear, TEMA_WOW, type Rosco } from './modelo.ts';
import { aplicarTema } from './tema.ts';
import { montarJuego } from './vistas/juego.ts';
import { montarBiblioteca } from './vistas/biblioteca.ts';
import { montarEditor } from './vistas/editor.ts';
import { montarPresentador } from './vistas/presentador.ts';
import { montarSoluciones } from './vistas/soluciones.ts';
import { montarDuelo } from './vistas/duelo.ts';
import { montarCompartido } from './vistas/compartido.ts';
import * as almacen from './almacen.ts';
import { h } from './ui.ts';

cargarFuentes();
const app = document.getElementById('app')!;
document.body.append(h('div.grano'));

/** Roscos metidos dentro del HTML exportado (modo quiosco). */
function embebidos(): { roscos: Rosco[]; duelo?: { nombres: [string, string]; segundos: number } } | null {
  const el = document.getElementById('roscomaker-datos');
  if (!el?.textContent) return null;
  try {
    const d = JSON.parse(el.textContent);
    return { roscos: (d.roscos as unknown[]).map(sanear), duelo: d.duelo };
  } catch {
    return null;
  }
}

let desmontar: (() => void) | null = null;
function cambiar(montar: () => () => void) {
  desmontar?.();
  app.replaceChildren();
  document.querySelectorAll('body > .capa, body > .menu-mas, body > .toast').forEach(el => el.remove());
  window.scrollTo(0, 0);
  desmontar = montar();
}

const ir = (ruta: string) => { location.hash = ruta; };

function enrutar() {
  const kiosko = embebidos();
  const [, vista = '', arg = ''] = location.hash.split('/');
  aplicarTema(TEMA_WOW);

  if (kiosko && vista !== 'presentador' && vista !== 'soluciones') {
    return cambiar(() => montarJuego(app, { roscos: kiosko.roscos, duelo: kiosko.duelo, kiosko: true }));
  }
  const porIds = (ids: string) => ids.split(',').map(id => (kiosko?.roscos.find(r => r.id === id)) ?? almacen.obtener(decodeURIComponent(id))).filter((r): r is Rosco => !!r);

  switch (vista) {
    case 'jugar': {
      const roscos = porIds(arg);
      if (!roscos.length) return ir('#/');
      return cambiar(() => montarJuego(app, { roscos, kiosko: false, alSalir: () => ir('#/') }));
    }
    case 'editar': {
      const r = almacen.obtener(decodeURIComponent(arg));
      if (!r) return ir('#/');
      return cambiar(() => montarEditor(app, r, ir));
    }
    case 'duelo':
      return cambiar(() => montarDuelo(app, ir));
    case 'presentador':
      return cambiar(() => montarPresentador(app, arg));
    case 'soluciones': {
      const roscos = kiosko ? kiosko.roscos : porIds(arg);
      if (!roscos.length) return ir('#/');
      return cambiar(() => montarSoluciones(app, roscos, () => (kiosko ? ir('#/') : ir('#/'))));
    }
    case 'r':
      return cambiar(() => montarCompartido(app, arg, ir));
    default:
      return cambiar(() => montarBiblioteca(app, ir));
  }
}

addEventListener('hashchange', enrutar);
enrutar();
