// Utilidades pequeñas para construir la interfaz sin framework.

type Hijo = Node | string | null | undefined | false;
type Props = Record<string, unknown> & { class?: string; style?: string };

/** h('button.tag', { onclick }, 'Texto') → elemento. Clases con puntos tras la etiqueta. */
export function h<K extends keyof HTMLElementTagNameMap>(sel: K | `${K}.${string}`, props: Props | null = null, ...hijos: Hijo[]): HTMLElementTagNameMap[K] {
  const [tag, ...clases] = sel.split('.');
  const el = document.createElement(tag as K);
  if (clases.length) el.className = clases.join(' ');
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = [el.className, v].filter(Boolean).join(' ');
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
    else if (k === 'style') el.setAttribute('style', String(v));
    else if (k in el && k !== 'list') (el as any)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of hijos) if (c !== null && c !== undefined && c !== false) el.append(c);
  return el;
}

export const $ = <T extends HTMLElement = HTMLElement>(sel: string, raiz: ParentNode = document) => raiz.querySelector(sel) as T;

/** Aviso breve abajo de la pantalla. */
export function aviso(texto: string, tipo: 'ok' | 'error' = 'ok'): void {
  document.querySelector('.toast')?.remove();
  const t = h('div.toast', { class: tipo, role: 'status' }, texto);
  document.body.append(t);
  setTimeout(() => t.classList.add('fuera'), 2600);
  setTimeout(() => t.remove(), 3100);
}

/** Confirmación en la propia página (los diálogos del navegador están bloqueados en algunas vistas previas). */
export function confirmar(titulo: string, texto: string, si = 'Sí', no = 'Cancelar'): Promise<boolean> {
  return new Promise(resolve => {
    const cerrar = (v: boolean) => { capa.remove(); removeEventListener('keydown', tecla, true); resolve(v); };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(false); }
      if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); cerrar(true); }
    };
    const capa = h('div.capa', { onclick: (e: Event) => e.target === capa && cerrar(false) },
      h('div.aviso', null,
        h('h2', null, titulo),
        h('p', null, texto),
        h('div.fila-botones', null,
          h('button.btn.secundario', { onclick: () => cerrar(false) }, no),
          h('button.btn.principal', { onclick: () => cerrar(true) }, si))));
    document.body.append(capa);
    addEventListener('keydown', tecla, true);
  });
}

export function descargar(nombre: string, contenido: BlobPart, tipo: string): void {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = h('a', { href: url, download: nombre });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function nombreArchivo(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'rosco';
}

export function mmss(seg: number): string {
  const s = Math.ceil(seg);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
