// Biblioteca: todos los roscos guardados en este navegador.

import * as almacen from '../almacen.ts';
import { enlaceCompartir, exportarHTML, exportarJSON, importarArchivo } from '../exportar.ts';
import { roscoNuevo, type Rosco } from '../modelo.ts';
import { revisar } from '../revision.ts';
import { aplicarTema } from '../tema.ts';
import { TEMA_WOW } from '../modelo.ts';
import { aviso, confirmar, h } from '../ui.ts';

/** Dibujo pequeño del rosco con sus colores, para la tarjeta. */
export function miniRosco(r: Rosco): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  const n = r.preguntas.length;
  r.preguntas.forEach((_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', String(50 + 42 * Math.cos(a)));
    c.setAttribute('cy', String(50 + 42 * Math.sin(a)));
    c.setAttribute('r', String(Math.min(6.5, 120 / n)));
    c.setAttribute('fill', i === 0 ? '#ffffff' : r.tema.ficha);
    c.setAttribute('stroke', i === 0 ? r.tema.acento : 'rgba(255,255,255,.35)');
    c.setAttribute('stroke-width', i === 0 ? '2' : '0.8');
    svg.append(c);
  });
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', '30'); rect.setAttribute('y', '40'); rect.setAttribute('width', '40'); rect.setAttribute('height', '16');
  rect.setAttribute('fill', r.tema.acento); rect.setAttribute('transform', 'rotate(-4 50 48)');
  const rect2 = document.createElementNS(ns, 'rect');
  rect2.setAttribute('x', '42'); rect2.setAttribute('y', '53'); rect2.setAttribute('width', '22'); rect2.setAttribute('height', '8');
  rect2.setAttribute('fill', r.tema.resalte); rect2.setAttribute('transform', 'rotate(-6 53 57)');
  svg.append(rect, rect2);
  return svg;
}

/** Enseña el enlace en la página (prompt() está bloqueado en algunas vistas previas) e intenta copiarlo. */
function mostrarEnlace(url: string, conFoto: boolean) {
  const campo = h('input.entrada', { value: url, readonly: true, 'aria-label': 'Enlace para compartir', onfocus: () => campo.select() });
  const estado = h('p', null, conFoto ? 'La foto de fondo no viaja en el enlace: el resto del rosco, sí.' : 'Quien lo abra podrá jugarlo o guardarlo en su biblioteca.');
  const copiar = async () => {
    campo.select();
    try { await navigator.clipboard.writeText(url); estado.textContent = 'Copiado.'; }
    catch { estado.textContent = 'Selecciona el enlace y cópialo con Ctrl+C (⌘C en Mac).'; }
  };
  const capa = h('div.capa', { onclick: (e: Event) => e.target === capa && capa.remove() },
    h('div.aviso', { style: 'max-width:680px;width:100%' },
      h('h2', null, 'Enlace para compartir'), estado, campo,
      h('div.fila-botones', { style: 'margin-top:14px' },
        h('button.btn.secundario', { onclick: () => capa.remove() }, 'Cerrar'),
        h('button.btn.principal', { onclick: copiar }, 'Copiar'))));
  document.body.append(capa);
  void copiar();
}

export function montarBiblioteca(raiz: HTMLElement, ir: (ruta: string) => void): () => void {
  aplicarTema(TEMA_WOW);
  const elegidos = new Set<string>();
  let menuAbierto: HTMLElement | null = null;

  const entradaArchivo = h('input', { type: 'file', accept: '.json,application/json', multiple: true, hidden: true });
  const rejilla = h('div.rejilla');
  const barraSel = h('div.barra-seleccion', { hidden: true });

  const pagina = h('main.app', null,
    h('header.cabecera', null,
      h('div', null,
        h('div.logo', null, h('span.slab-mini', null, 'ROSCO'), h('span.etq', null, 'MAKER')),
        h('p.lema', { style: 'margin-top:14px' }, 'Crea roscos tipo concurso con el diseño de tu evento y juégalos en el proyector. Todo se guarda en este navegador.')),
      h('div.acciones', null,
        h('button.btn.principal', { onclick: nuevo }, '+ Nuevo rosco'),
        h('button.btn.secundario', { onclick: () => entradaArchivo.click() }, 'Importar archivo'),
        h('button.btn.fantasma', { onclick: () => ir('#/duelo') }, 'Duelo de equipos'))),
    h('h2.seccion', null, 'Tus roscos'),
    rejilla,
    barraSel,
    entradaArchivo);
  raiz.append(h('div.bg'), h('div.tint'), pagina);

  function nuevo() {
    const r = roscoNuevo('Rosco nuevo');
    almacen.guardar(r);
    ir('#/editar/' + encodeURIComponent(r.id));
  }

  async function importar(archivos: FileList | File[]) {
    let n = 0;
    for (const f of Array.from(archivos)) {
      try {
        for (const r of await importarArchivo(f)) { almacen.anadirImportado(r); n++; }
      } catch (e) {
        aviso(`${f.name}: ${(e as Error).message}`, 'error');
      }
    }
    if (n) { aviso(n === 1 ? 'Rosco importado.' : `${n} roscos importados.`); pintar(); }
  }
  entradaArchivo.addEventListener('change', () => { if (entradaArchivo.files) void importar(entradaArchivo.files); entradaArchivo.value = ''; });

  // Arrastrar y soltar un .json en cualquier sitio de la página.
  const sobre = (e: DragEvent) => { e.preventDefault(); pagina.classList.add('soltar'); };
  const fuera = () => pagina.classList.remove('soltar');
  const soltar = (e: DragEvent) => { e.preventDefault(); fuera(); if (e.dataTransfer?.files.length) void importar(e.dataTransfer.files); };
  addEventListener('dragover', sobre); addEventListener('dragleave', fuera); addEventListener('drop', soltar);

  function cerrarMenu() { menuAbierto?.remove(); menuAbierto = null; }
  const clicFuera = (e: MouseEvent) => { if (menuAbierto && !menuAbierto.contains(e.target as Node)) cerrarMenu(); };
  addEventListener('mousedown', clicFuera);

  function abrirMenu(boton: HTMLElement, r: Rosco) {
    cerrarMenu();
    const op = (texto: string, fn: () => void | Promise<void>, clase = '') =>
      h('button', { class: clase, onclick: async () => { cerrarMenu(); try { await fn(); } catch (e) { aviso((e as Error).message, 'error'); } } }, texto);
    const menu = h('div.menu-mas', { role: 'menu' },
      op('Duplicar', () => { almacen.duplicar(r); pintar(); aviso('Rosco duplicado.'); }),
      op('Descargar HTML para jugar sin internet', () => exportarHTML([r])),
      op('Hoja de soluciones (PDF)', () => ir('#/soluciones/' + encodeURIComponent(r.id))),
      op('Copiar enlace para compartir', async () => mostrarEnlace(await enlaceCompartir(r), !!r.tema.foto)),
      op('Descargar archivo (.json)', () => exportarJSON([r])),
      op('Borrar', async () => {
        if (await confirmar('¿Borrar este rosco?', `«${r.nombre}» desaparecerá de este navegador. No se puede deshacer.`, 'Borrar')) {
          almacen.borrar(r.id); elegidos.delete(r.id); pintar(); aviso('Rosco borrado.');
        }
      }, 'peligro'));
    const caja = boton.getBoundingClientRect();
    menu.style.left = Math.min(caja.left + scrollX, innerWidth - 250) + 'px';
    menu.style.top = caja.bottom + scrollY + 4 + 'px';
    document.body.append(menu);
    menuAbierto = menu;
    (menu.firstElementChild as HTMLElement).focus();
  }

  function tarjeta(r: Rosco): HTMLElement {
    const problemas = revisar([r]);
    const errores = problemas.filter(p => p.gravedad === 'error').length;
    const avisos = problemas.length - errores;
    const check = h('input', { type: 'checkbox', checked: elegidos.has(r.id), onchange: () => { if (check.checked) elegidos.add(r.id); else elegidos.delete(r.id); pintarSeleccion(); t.classList.toggle('elegida', check.checked); } });
    const masBtn = h('button.btn.fantasma', { 'aria-haspopup': 'menu', onclick: () => abrirMenu(masBtn, r) }, 'Más ▾');
    const t = h('article.tarjeta', { class: elegidos.has(r.id) ? 'elegida' : '' },
      h('label.marcar', { title: 'Elegir para jugar o exportar varios a la vez' }, check, 'Elegir'),
      h('div.muestra', { style: `background:${r.tema.fondo}` },
        r.tema.foto ? h('div.foto', { style: `background-image:url("${r.tema.foto}")` }) : null,
        miniRosco(r)),
      h('div.cuerpo', null,
        h('h3', null, r.nombre),
        h('p.meta', null, `${r.preguntas.length} letras · ${r.opciones.sentido === 'za' ? 'Z → A' : 'A → Z'} · ${r.opciones.modo === 'presentacion' ? 'presentación' : 'se escribe la respuesta'}`),
        h('p.estado', { class: problemas.length ? 'mal' : 'bien' },
          errores ? `${errores} por completar` + (avisos ? ` · ${avisos} avisos` : '') : avisos ? `${avisos} avisos` : 'Listo para jugar'),
        h('div.botonera', null,
          h('button.btn.principal', { onclick: () => ir('#/jugar/' + encodeURIComponent(r.id)) }, 'Jugar'),
          h('button.btn.secundario', { onclick: () => ir('#/editar/' + encodeURIComponent(r.id)) }, 'Editar'),
          masBtn)));
    return t;
  }

  function pintarSeleccion() {
    const lista = almacen.listar().filter(r => elegidos.has(r.id));
    barraSel.hidden = lista.length < 2;
    if (barraSel.hidden) return;
    const ids = lista.map(r => encodeURIComponent(r.id)).join(',');
    barraSel.replaceChildren(
      h('strong', null, `${lista.length} roscos elegidos`),
      h('button.btn.principal.pequeno', { onclick: () => ir('#/jugar/' + ids) }, 'Jugarlos seguidos'),
      h('button.btn.secundario.pequeno', { onclick: () => { try { exportarHTML(lista); } catch (e) { aviso((e as Error).message, 'error'); } } }, 'Un HTML con todos'),
      h('button.btn.secundario.pequeno', { onclick: () => ir('#/soluciones/' + ids) }, 'Soluciones de todos'),
      h('button.btn.fantasma.pequeno', { onclick: () => exportarJSON(lista) }, 'Descargar .json'),
      h('button.btn.fantasma.pequeno', { onclick: () => { elegidos.clear(); pintar(); } }, 'Quitar selección'));
  }

  function pintar() {
    const lista = almacen.listar();
    rejilla.replaceChildren(...(lista.length ? lista.map(tarjeta) : [h('div.vacio-lista', null, 'No hay roscos. Crea uno nuevo o importa un archivo .json.')]));
    pintarSeleccion();
  }
  pintar();

  return () => {
    cerrarMenu();
    removeEventListener('mousedown', clicFuera);
    removeEventListener('dragover', sobre); removeEventListener('dragleave', fuera); removeEventListener('drop', soltar);
  };
}
