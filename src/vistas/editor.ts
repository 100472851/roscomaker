// Editor de un rosco: letras, preguntas, partida, portada y tema. Guarda solo mientras escribes.

import * as almacen from '../almacen.ts';
import { exportarHTML } from '../exportar.ts';
import { leerFoto } from '../foto.ts';
import { FUENTES } from '../fuentes.ts';
import { importarTabla } from '../importar.ts';
import { ABECEDARIO, ordenar, preguntaVacia, TEMA_WOW, type FuenteId, type Pregunta, type Rosco, type Tema } from '../modelo.ts';
import { agrupar, aHex, repartir } from '../paleta.ts';
import { revisar, type Problema } from '../revision.ts';
import { aplicarTema, avisosContraste } from '../tema.ts';
import { aviso, confirmar, h } from '../ui.ts';

const TEMAS_BASE: { nombre: string; tema: Partial<Tema> }[] = [
  { nombre: 'WOW', tema: { fondo: '#1b171f', acento: '#ff3b1d', ficha: '#1d2a5c', resalte: '#dcf7a9' } },
  { nombre: 'Noche', tema: { fondo: '#0b1020', acento: '#f2b705', ficha: '#2b3a67', resalte: '#ffe8a3' } },
  { nombre: 'Bosque', tema: { fondo: '#0e1612', acento: '#2fa36b', ficha: '#3a2a55', resalte: '#e9f7c9' } },
  { nombre: 'Neón', tema: { fondo: '#120a1c', acento: '#e0218a', ficha: '#14405c', resalte: '#b9f3ff' } },
];

const TIEMPOS: [number, string][] = [[0, 'Sin tiempo'], [90, '1:30'], [120, '2:00'], [150, '2:30'], [180, '3:00'], [240, '4:00'], [300, '5:00']];

export function montarEditor(raiz: HTMLElement, original: Rosco, ir: (ruta: string) => void): () => void {
  const r: Rosco = structuredClone(original);
  const apartadas = new Map<string, Pregunta>(); // letras quitadas: se recuperan si se vuelven a poner
  let espera = 0;
  let ultimaPaleta: string[] = [];

  aplicarTema(r.tema);

  // ---------- Guardado ----------
  const estadoGuardado = h('span.tag.linea', null, 'Guardado');
  function cambio(repintarFilas = false) {
    estadoGuardado.textContent = 'Guardando…';
    clearTimeout(espera);
    espera = window.setTimeout(() => {
      try { almacen.guardar(r); estadoGuardado.textContent = 'Guardado'; }
      catch (e) { estadoGuardado.textContent = 'Sin guardar'; aviso((e as Error).message, 'error'); }
    }, 350);
    if (repintarFilas) pintarFilas();
    pintarRevision();
  }
  function guardarYa() { clearTimeout(espera); try { almacen.guardar(r); } catch (e) { aviso((e as Error).message, 'error'); } }

  // ---------- Cabecera ----------
  const nombre = h('input.entrada', { value: r.nombre, 'aria-label': 'Nombre del rosco', style: 'font-size:22px;font-weight:900;max-width:520px',
    oninput: () => { r.nombre = nombre.value.trim() || 'Rosco sin nombre'; cambio(); } });
  const cabecera = h('header.cabecera', null,
    h('div.acciones', { style: 'flex:1;min-width:280px' },
      h('button.btn.fantasma', { onclick: () => { guardarYa(); ir('#/'); } }, '← Biblioteca'),
      nombre),
    h('div.acciones', null,
      estadoGuardado,
      h('button.btn.secundario', { onclick: () => { guardarYa(); ir('#/soluciones/' + encodeURIComponent(r.id)); } }, 'Soluciones'),
      h('button.btn.secundario', { onclick: () => { guardarYa(); try { exportarHTML([r]); } catch (e) { aviso((e as Error).message, 'error'); } } }, 'Descargar HTML'),
      h('button.btn.principal', { onclick: () => { guardarYa(); ir('#/jugar/' + encodeURIComponent(r.id)); } }, 'Probar ▶')));

  // ---------- Letras ----------
  const chips = h('div.chips');
  const cuentaLetras = h('span');
  function pintarChips() {
    const activas = new Set(r.preguntas.map(p => p.letra));
    chips.replaceChildren(...ABECEDARIO.map(l => h('button.chip', {
      class: activas.has(l) ? 'on' : '', 'aria-pressed': String(activas.has(l)), title: activas.has(l) ? `Quitar la ${l}` : `Añadir la ${l}`,
      onclick: () => alternarLetra(l),
    }, l)));
    cuentaLetras.textContent = `${r.preguntas.length} letras`;
  }
  function ponerLetras(letras: string[]) {
    const quedan = ordenar(letras);
    if (!quedan.length) { aviso('Un rosco necesita al menos una letra.', 'error'); return; }
    for (const p of r.preguntas) if (!quedan.includes(p.letra)) apartadas.set(p.letra, p);
    r.preguntas = quedan.map(l => r.preguntas.find(p => p.letra === l) ?? apartadas.get(l) ?? preguntaVacia(l));
    pintarChips();
    cambio(true);
  }
  function alternarLetra(l: string) {
    const act = r.preguntas.map(p => p.letra);
    ponerLetras(act.includes(l) ? act.filter(x => x !== l) : [...act, l]);
  }
  const panelLetras = h('section.panel', null,
    h('h2.seccion', null, 'Letras ', cuentaLetras),
    chips,
    h('div.mini-acciones', null,
      h('button.btn.fantasma.pequeno', { onclick: () => ponerLetras(ABECEDARIO) }, 'Todas (27)'),
      h('button.btn.fantasma.pequeno', { onclick: () => ponerLetras(ABECEDARIO.filter(l => l !== 'Ñ')) }, 'Sin Ñ'),
      h('button.btn.fantasma.pequeno', { onclick: () => ponerLetras(ABECEDARIO.filter(l => !'ÑKWXY'.includes(l))) }, 'Sin Ñ, K, W, X, Y')));

  // ---------- Partida ----------
  function segmentado<T extends string>(opciones: [T, string][], actual: () => T, poner: (v: T) => void) {
    const cont = h('div.segmentado');
    const pintarS = () => cont.replaceChildren(...opciones.map(([v, t]) =>
      h('button', { class: actual() === v ? 'on' : '', onclick: () => { poner(v); pintarS(); cambio(); } }, t)));
    pintarS();
    return cont;
  }
  const tiempo = h('select', { onchange: () => { r.opciones.segundos = Number(tiempo.value); cambio(); } },
    ...TIEMPOS.map(([s, t]) => h('option', { value: String(s), selected: r.opciones.segundos === s }, t)));
  if (!TIEMPOS.some(([s]) => s === r.opciones.segundos)) tiempo.append(h('option', { value: String(r.opciones.segundos), selected: true }, `${r.opciones.segundos} s`));
  const sonidos = h('input', { type: 'checkbox', checked: r.opciones.sonidos, onchange: () => { r.opciones.sonidos = sonidos.checked; cambio(); } });
  const panelPartida = h('section.panel', null,
    h('h2.seccion', null, 'Partida'),
    h('div.campo', null, h('span', null, 'Cómo se responde'),
      segmentado([['juego', 'Se escribe la respuesta'], ['presentacion', 'Presentador: ✓ · ✗']], () => r.opciones.modo, v => { r.opciones.modo = v; })),
    h('div.campo', null, h('span', null, 'Orden'),
      segmentado([['az', 'De la A a la Z'], ['za', 'De la Z a la A']], () => r.opciones.sentido, v => { r.opciones.sentido = v; })),
    h('div.dos', null,
      h('label.campo', null, h('span', null, 'Tiempo'), tiempo),
      h('label.interruptor', { style: 'margin-top:22px' }, sonidos, 'Sonidos')));

  // ---------- Portada ----------
  const campoTexto = (etq: string, k: keyof Rosco['portada'], max: number, ayuda = '') => {
    const i = h('input', { type: 'text', value: r.portada[k], maxlength: max, placeholder: ayuda, oninput: () => { r.portada[k] = i.value; cambio(); } });
    return h('label.campo', null, h('span', null, etq), i);
  };
  const panelPortada = h('section.panel', null,
    h('h2.seccion', null, 'Portada'),
    campoTexto('Primera línea', 'linea', 60, '¡BIENVENIDOS AL ROSCO DEL'),
    h('div.dos', null, campoTexto('Palabra grande', 'grande', 14, 'WOW'), campoTexto('Etiqueta', 'etiqueta', 20, 'FEST!')),
    campoTexto('Fecha (opcional)', 'fecha', 30, 'Sábado 21/11'));

  // ---------- Tema ----------
  const entradaFoto = h('input', { type: 'file', accept: 'image/*', hidden: true });
  const paletaFoto = h('div.paleta-foto');
  const avisoContraste = h('div.contraste-mal');
  const coloresEl = h('div.muestras');
  const fuente = h('select', { onchange: () => { r.tema.fuente = fuente.value as FuenteId; aplicarTema(r.tema); cambio(); pintarVista(); } },
    ...(Object.keys(FUENTES) as FuenteId[]).map(id => h('option', { value: id, selected: r.tema.fuente === id }, `${FUENTES[id].nombre} — ${FUENTES[id].descripcion}`)));
  const quitarFoto = h('button.btn.fantasma.pequeno', { onclick: () => { r.tema.foto = null; temaCambiado(); } }, 'Quitar foto de fondo');
  const vista = h('div.vista-previa');

  const PAPELES: [keyof Tema, string][] = [['fondo', 'Fondo'], ['acento', 'Acento'], ['ficha', 'Fichas'], ['resalte', 'Resalte'], ['ok', 'Acierto'], ['ko', 'Fallo']];
  function pintarColores() {
    coloresEl.replaceChildren(...PAPELES.map(([k, t]) => {
      const inp = h('input', { type: 'color', value: r.tema[k] as string, 'aria-label': t, oninput: () => { (r.tema as any)[k] = inp.value; temaCambiado(false); } });
      return h('label.color', null, t, inp);
    }));
  }
  function pintarVista() {
    vista.style.background = r.tema.foto ? `center/cover url("${r.tema.foto}")` : r.tema.fondo;
    vista.replaceChildren(
      h('div', { style: `position:absolute;inset:0;background:${r.tema.fondo};opacity:${r.tema.foto ? 0.55 : 1}` }),
      h('span', { style: `position:relative;background:var(--acento);color:var(--sobre-acento);font-family:var(--titulos);font-weight:900;font-size:30px;padding:0 8px;transform:rotate(-3deg)` }, r.portada.grande || 'ROSCO'),
      h('span', { style: 'position:relative;width:38px;height:38px;border-radius:50%;background:var(--ficha);color:var(--sobre-ficha);display:flex;align-items:center;justify-content:center;font-weight:900;border:2px solid rgba(255,255,255,.4)' }, 'A'),
      h('span', { style: 'position:relative;background:var(--resalte);color:var(--sobre-resalte);font-weight:900;padding:6px 10px;font-size:13px' }, 'RESPONDER'));
  }
  function temaCambiado(repintarColores = true) {
    aplicarTema(r.tema);
    if (repintarColores) pintarColores();
    const malos = avisosContraste(r.tema);
    avisoContraste.textContent = malos.length ? 'Se lee mal: ' + malos.map(m => `${m.papel} (${m.valor}:1, mínimo ${m.minimo}:1)`).join(' · ') : '';
    quitarFoto.hidden = !r.tema.foto;
    pintarVista();
    cambio();
  }
  entradaFoto.addEventListener('change', async () => {
    const f = entradaFoto.files?.[0];
    entradaFoto.value = '';
    if (!f) return;
    try {
      const { fondo, pixeles } = await leerFoto(f);
      const cumulos = agrupar(pixeles, 6);
      ultimaPaleta = cumulos.map(c => aHex(c.color));
      Object.assign(r.tema, repartir(cumulos), { foto: fondo });
      paletaFoto.replaceChildren(...ultimaPaleta.map(c => h('span', { style: `background:${c}`, title: c })));
      temaCambiado();
      aviso('Colores sacados de la foto. Puedes retocar cualquiera.');
    } catch (e) {
      aviso((e as Error).message, 'error');
    }
  });
  const panelTema = h('section.panel', null,
    h('h2.seccion', null, 'Diseño'),
    h('button.btn.principal', { style: 'width:100%;margin-bottom:10px', onclick: () => entradaFoto.click() }, 'Sacar colores de una foto'),
    paletaFoto,
    h('div.temas-base', null, ...TEMAS_BASE.map(t => h('button', { title: `Tema ${t.nombre}`, onclick: () => { Object.assign(r.tema, t.tema); temaCambiado(); } },
      ...['fondo', 'acento', 'ficha', 'resalte'].map(k => h('span', { style: `background:${(t.tema as any)[k]}` }))))),
    coloresEl,
    h('label.campo', { style: 'margin-top:12px' }, h('span', null, 'Tipografía de los títulos'), fuente),
    quitarFoto,
    avisoContraste,
    vista,
    entradaFoto);

  // ---------- Revisión ----------
  const listaRevision = h('div.lista-avisos');
  let problemas: Problema[] = [];
  function pintarRevision() {
    problemas = revisar([r]);
    listaRevision.replaceChildren(...(problemas.length
      ? problemas.map(p => h('button', { class: p.gravedad, onclick: () => irALetra(p.letra) }, `${p.letra}: ${p.mensaje}`))
      : [h('p.todo-bien', null, 'Todo en orden: listo para jugar.')]));
    for (const fila of filas.querySelectorAll<HTMLElement>('.fila-letra')) {
      const l = fila.dataset.letra!;
      const suyos = problemas.filter(p => p.letra === l);
      fila.classList.toggle('con-error', suyos.some(p => p.gravedad === 'error'));
      fila.classList.toggle('con-aviso', !suyos.some(p => p.gravedad === 'error') && suyos.length > 0);
      fila.querySelector('.problemas')!.replaceChildren(...suyos.map(p => h('span.problema', { class: p.gravedad }, p.mensaje)));
    }
  }
  function irALetra(l: string) {
    const fila = filas.querySelector<HTMLElement>(`[data-letra="${l}"]`);
    fila?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    fila?.querySelector('textarea')?.focus({ preventScroll: true });
  }
  const panelRevision = h('section.panel.pegajoso', null, h('h2.seccion', null, 'Revisión'), listaRevision);

  // ---------- Filas de preguntas ----------
  const filas = h('div.filas');
  function filaPregunta(p: Pregunta): HTMLElement {
    const tipoBtn = h('button.tipo-sel', {
      class: p.tipo, title: 'Cambiar entre «Empieza por» y «Contiene»',
      onclick: () => { p.tipo = p.tipo === 'empieza' ? 'contiene' : 'empieza'; tipoBtn.className = 'tipo-sel ' + p.tipo; tipoBtn.textContent = p.tipo === 'empieza' ? 'Empieza' : 'Contiene'; cambio(); },
    }, p.tipo === 'empieza' ? 'Empieza' : 'Contiene');
    const pista = h('textarea.entrada', { placeholder: `Pista de la ${p.letra}`, rows: 2, oninput: () => { p.pista = pista.value; cambio(); } });
    pista.value = p.pista;
    const resp = h('input.entrada', { type: 'text', value: p.respuestas[0] ?? '', placeholder: 'Respuesta', oninput: () => { p.respuestas[0] = resp.value; cambio(); } });
    const otras = h('input.entrada', { type: 'text', value: p.respuestas.slice(1).join(' / '), placeholder: 'Otras que valen (separadas por /)',
      oninput: () => { p.respuestas = [p.respuestas[0] ?? '', ...otras.value.split('/').map(s => s.trim()).filter(Boolean)]; cambio(); } });
    return h('div.fila-letra', { 'data-letra': p.letra },
      h('div', null, h('div.bola', null, p.letra), tipoBtn),
      h('div', null, pista, h('div.respuestas', null, resp, otras), h('div.problemas')));
  }
  function pintarFilas() { filas.replaceChildren(...r.preguntas.map(filaPregunta)); }

  async function pegarTabla() {
    const area = h('textarea.entrada', { rows: 10, placeholder: 'Letra	Tipo	Pista	Respuesta	Otras respuestas\nA	Empieza por	Ciudad del Oso y el Madroño	Madrid' }) as HTMLTextAreaElement;
    const cerrar = () => capa.remove();
    const aplicar = async () => {
      const { preguntas, ignoradas } = importarTabla(area.value);
      if (!preguntas.length) { aviso('No he encontrado ninguna fila con una letra válida.', 'error'); return; }
      const pisa = preguntas.filter(n => { const v = r.preguntas.find(p => p.letra === n.letra); return v && (v.pista || v.respuestas[0]); }).length;
      if (pisa && !(await confirmar('¿Sustituir lo que ya hay?', `${pisa} letras ya tienen pista o respuesta y se van a sustituir por lo pegado.`, 'Sustituir'))) return;
      for (const n of preguntas) {
        const i = r.preguntas.findIndex(p => p.letra === n.letra);
        if (i >= 0) r.preguntas[i] = n; else r.preguntas.push(n);
      }
      r.preguntas = ordenar(r.preguntas.map(p => p.letra)).map(l => r.preguntas.find(p => p.letra === l)!);
      cerrar();
      pintarChips();
      cambio(true);
      aviso(`${preguntas.length} letras importadas` + (ignoradas.length ? ` · ${ignoradas.length} filas ignoradas` : '') + '.');
    };
    const capa = h('div.capa', null, h('div.aviso', { style: 'max-width:760px;width:100%' },
      h('h2', null, 'Pegar desde una hoja de cálculo'),
      h('p', null, 'Copia las filas en Excel, Google Sheets o Numbers y pégalas aquí. Columnas: letra, tipo, pista, respuesta y otras respuestas (separadas por /). Si la primera fila tiene esos títulos, el orden da igual.'),
      area,
      h('div.fila-botones', { style: 'margin-top:14px' },
        h('button.btn.secundario', { onclick: cerrar }, 'Cancelar'),
        h('button.btn.principal', { onclick: aplicar }, 'Importar'))));
    document.body.append(capa);
    area.focus();
  }

  const columnaDer = h('div', null,
    h('div.acciones', { style: 'justify-content:space-between;margin-bottom:12px' },
      h('h2.seccion', { style: 'margin:0' }, 'Preguntas'),
      h('button.btn.secundario.pequeno', { onclick: pegarTabla }, 'Pegar desde hoja de cálculo')),
    filas);

  const pagina = h('main.app', null, cabecera,
    h('div.editor', null,
      h('div', null, panelRevision, panelLetras, panelPartida, panelPortada, panelTema),
      columnaDer));
  raiz.append(h('div.bg'), h('div.tint'), pagina);

  pintarChips();
  pintarFilas();
  pintarColores();
  temaCambiado();
  clearTimeout(espera); estadoGuardado.textContent = 'Guardado';
  pintarRevision();

  const alSalir = () => guardarYa();
  addEventListener('beforeunload', alSalir);
  return () => { guardarYa(); removeEventListener('beforeunload', alSalir); document.querySelectorAll('body > .capa').forEach(c => c.remove()); aplicarTema(TEMA_WOW); };
}
