// Pantalla de juego: portada, rosco circular, final. Funciona con uno o varios roscos o con un duelo.
// Todo se maneja con el teclado (← → eligen, Intro confirma, Esc sale) y también con el ratón.

import { abrirCanal, type Accion, type EstadoPresentador } from '../canal.ts';
import { Duelo } from '../duelo.ts';
import type { Rosco } from '../modelo.ts';
import { Partida } from '../partida.ts';
import { activarSonidos, sonar } from '../sonidos.ts';
import { aplicarTema } from '../tema.ts';
import { h, mmss } from '../ui.ts';

export interface OpcionesJuego {
  roscos: Rosco[];
  duelo?: { nombres: [string, string]; segundos: number };
  /** HTML exportado: no hay biblioteca a la que volver. */
  kiosko: boolean;
  alSalir?: () => void;
}

const ICO_BIEN = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12.5l5.5 5.5L20.5 6"/></svg>';
const ICO_MAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 5.5l13 13M18.5 5.5l-13 13"/></svg>';

type Grupo = 'portada' | 'preg' | 'pres' | 'rev' | 'aviso' | 'fin';

export function montarJuego(raiz: HTMLElement, op: OpcionesJuego): () => void {
  const esDuelo = !!op.duelo && op.roscos.length >= 2;
  const canalId = Math.random().toString(36).slice(2, 10);
  let partida: Partida | null = null;
  let duelo: Duelo | null = null;
  let elegido: Rosco = op.roscos[0];
  let timerSeguir = 0;
  let pantalla: 'portada' | 'juego' | 'fin' = 'portada';
  const sel: Record<Grupo, number> = { portada: 0, preg: 0, pres: 1, rev: 0, aviso: 0, fin: 1 };
  let fichas: HTMLElement[] = [];

  // ---------- DOM ----------
  const botonesPortada = esDuelo
    ? [h('button.rbtn', { 'data-i': 0 }, h('span.big', null, 'EMPEZAR'), h('span.sub', null, `${op.duelo!.nombres[0]} contra ${op.duelo!.nombres[1]}`))]
    : op.roscos.map((r, i) => h('button.rbtn', { 'data-i': i }, h('span.big', null, op.roscos.length > 1 ? `ROSCO ${i + 1}` : 'EMPEZAR'),
      h('span.sub', null, op.roscos.length > 1 ? r.nombre : r.opciones.sentido === 'za' ? 'De la Z a la A' : 'De la A a la Z')));
  const grupoPortada = h('div.botones-portada', null, ...botonesPortada);
  const portadaEl = h('section.pantalla.portada.on', null,
    op.kiosko ? null : h('button.tag.linea.volver-portada', { onclick: () => op.alSalir?.() }, '← Biblioteca'),
    h('p.pre.blurtxt', { 'data-k': 'linea' }),
    h('div.slab', null,
      h('span.grande.blurtxt', { 'data-k': 'grande' }),
      h('span.tag.oscura.fecha', { 'data-k': 'fecha' }),
      h('span.etiqueta', { 'data-k': 'etiqueta' })),
    h('p.escoge', null, esDuelo ? 'Duelo de dos equipos' : op.roscos.length > 1 ? 'Escoge un rosco.' : elegido.nombre),
    grupoPortada);

  const input = h('input', { id: 'resp', type: 'text', placeholder: 'Escribe y pulsa Intro', spellcheck: false, autocomplete: 'off', enterkeyhint: 'done' });
  const grupoPreg = h('div.btns.grupo-preg', null,
    h('button.b-resp', { onclick: () => responder() }, 'Responder'),
    h('button.b-pasa', { onclick: () => pasar() }, 'Pasapalabra'));
  const bBien = h('button.b-bien.ico', { 'aria-label': 'Bien', onclick: () => marcar(true) }); bBien.innerHTML = ICO_BIEN;
  const bMal = h('button.b-mal.ico', { 'aria-label': 'Mal', onclick: () => marcar(false) }); bMal.innerHTML = ICO_MAL;
  const grupoPres = h('div.btns.grupo-pres', null, bBien, h('button.b-pasa', { onclick: () => pasar() }, 'Pasapalabra'), bMal);
  const filaEl = h('div.fila', null, input, grupoPreg, grupoPres);

  const grupoRev = h('div.btns.grupo-rev', null,
    h('button.b-bien', { onclick: () => marcar(true) }, 'Sí, vale'),
    h('button.b-mal', { onclick: () => marcar(false) }, 'No, es fallo'));
  const bSeguir = h('button.b-seguir', { onclick: () => seguir() }, 'Seguir →');
  const fbTitulo = h('p.fb-titulo');
  const fbDicho = h('p.fb-dicho', null, 'Han puesto ', h('b'));
  const fbEl = h('div.fb', { hidden: true }, fbTitulo, fbDicho, grupoRev, h('div.btns', null, bSeguir));

  const grupoFin = h('div.btns.grupo-fin', null,
    h('button.b-pasa', { onclick: () => empezar(elegido) }, 'Otra vez'),
    h('button.b-resp', { onclick: () => irPortada() }, op.kiosko || op.roscos.length > 1 || esDuelo ? 'Inicio' : 'Biblioteca'));
  const finTitulo = h('p.fin-titulo');
  const finRes = h('div.res');
  const finEl = h('div.fin', { hidden: true }, finTitulo, finRes, h('p.nota', null, 'Toca una letra si hay que corregir algo.'), grupoFin);

  const pistaEl = h('p.pista');
  const miniEl = h('span.mini');
  const tipoEl = h('span.tag.oscura.tipo');
  const cabEl = h('div.cab', null, miniEl, tipoEl);
  const letraGrande = h('span.blurtxt', null, '¡FIN!');
  const mediaEl = h('div.media', { hidden: true }, h('div.letrona', null, letraGrande));
  const textoEl = h('div.texto', null, cabEl, pistaEl, filaEl, fbEl, finEl);
  const centroEl = h('div.centro', null, mediaEl, textoEl);
  const tableroEl = h('div.tablero', null, centroEl);

  const nombreEl = h('span.tag.oscura');
  const tiempoEl = h('span.tag.linea', { hidden: true });
  const marcadorEl = h('div.grupo');
  const barraEl = h('div.barra', null,
    h('div.grupo', null,
      h('button.tag.linea', { onclick: () => pedirSalir() }, '← Menú'),
      nombreEl,
      h('button.tag.linea', { title: 'Abre una ventana con las respuestas para quien presenta', onclick: () => abrirPresentador() }, 'Presentador')),
    marcadorEl);
  const juegoEl = h('section.pantalla.tablero-pantalla', null, barraEl, tableroEl);

  const grupoAviso = h('div.btns.grupo-aviso', null,
    h('button.b-pasa', { onclick: () => cerrarAviso() }, 'No, seguir'),
    h('button.b-resp', { onclick: () => irPortada() }, 'Sí, salir'));
  const avisoEl = h('div.capa', { hidden: true, onclick: (e: Event) => e.target === avisoEl && cerrarAviso() },
    h('div.aviso', null, h('h2', null, '¿Salir de la partida?'), h('p', null, 'Se pierde el rosco que está en marcha.'), grupoAviso));
  const turnoEl = h('div.turno', { hidden: true }, h('div'));

  const cont = h('div.juego', null, h('div.bg'), h('div.tint'), portadaEl, juegoEl, avisoEl, turnoEl);
  raiz.append(cont);

  // ---------- Presentador ----------
  const canal = abrirCanal(canalId, m => {
    if (m.tipo === 'hola') enviarEstado();
    if (m.tipo === 'accion') accionRemota(m.accion);
  });
  function abrirPresentador() {
    const url = location.href.split('#')[0] + '#/presentador/' + canalId;
    window.open(url, 'roscomaker-presentador-' + canalId, 'popup,width=980,height=720');
  }
  function enviarEstado() {
    const estado: EstadoPresentador = {
      pantalla,
      partida: partida ? partida.instantanea() : null,
      duelo: duelo ? {
        nombres: [duelo.equipos[0].nombre, duelo.equipos[1].nombre],
        turno: duelo.turno,
        marcador: duelo.equipos.map(e => [e.partida.aciertos, e.partida.fallos]) as [number, number][],
        quedan: duelo.equipos.map(e => (e.partida.quedan === Infinity ? null : e.partida.quedan)),
      } : null,
    };
    canal.enviar({ tipo: 'estado', estado });
  }
  function accionRemota(a: Accion) {
    if (!partida || pantalla !== 'juego') return;
    if (a === 'bien' || a === 'mal') marcar(a === 'bien');
    else if (a === 'pasa') pasar();
    else if (a === 'seguir') seguir();
  }

  // ---------- Portada ----------
  function pintarPortada() {
    const p = elegido.portada;
    aplicarTema(elegido.tema);
    (portadaEl.querySelector('[data-k=linea]') as HTMLElement).textContent = p.linea;
    (portadaEl.querySelector('[data-k=grande]') as HTMLElement).textContent = p.grande;
    const fecha = portadaEl.querySelector('[data-k=fecha]') as HTMLElement;
    fecha.textContent = p.fecha; fecha.hidden = !p.fecha;
    const et = portadaEl.querySelector('[data-k=etiqueta]') as HTMLElement;
    et.textContent = p.etiqueta; et.hidden = !p.etiqueta;
    elegir('portada', sel.portada);
  }
  botonesPortada.forEach((b, i) => b.addEventListener('click', () => empezar(op.roscos[esDuelo ? 0 : i])));

  function irPortada() {
    clearTimeout(timerSeguir);
    avisoEl.hidden = true;
    if (!op.kiosko && op.roscos.length === 1 && !esDuelo && pantalla !== 'portada') { op.alSalir?.(); return; }
    pantalla = 'portada';
    partida = null; duelo = null;
    // Propone el siguiente rosco que no se ha jugado.
    if (!esDuelo && op.roscos.length > 1) sel.portada = (op.roscos.indexOf(elegido) + 1) % op.roscos.length;
    elegido = op.roscos[esDuelo ? 0 : sel.portada];
    portadaEl.classList.add('on'); juegoEl.classList.remove('on');
    pintarPortada();
    enviarEstado();
    (document.activeElement as HTMLElement | null)?.blur();
  }

  // ---------- Partida ----------
  function empezar(r: Rosco) {
    clearTimeout(timerSeguir);
    elegido = r;
    if (esDuelo) {
      duelo = new Duelo(op.roscos[0], op.roscos[1], op.duelo!.nombres, op.duelo!.segundos);
      partida = duelo.activo.partida;
    } else {
      duelo = null;
      partida = new Partida(r);
    }
    activarSonidos(r.opciones.sonidos);
    aplicarTema(partida.rosco.tema);
    pantalla = 'juego';
    avisoEl.hidden = true;
    portadaEl.classList.remove('on'); juegoEl.classList.add('on');
    montarFichas();
    mostrar();
    if (duelo) anunciarTurno();
  }

  const esPres = () => partida?.rosco.opciones.modo === 'presentacion';

  function montarFichas() {
    fichas.forEach(f => f.remove());
    fichas = partida!.preguntas.map((p, i) => {
      const f = h('div.ficha', { onclick: () => corregir(i) }, p.letra);
      tableroEl.append(f);
      return f;
    });
    nombreEl.textContent = duelo ? 'Duelo' : `${partida!.rosco.nombre} · ${partida!.rosco.opciones.sentido === 'za' ? 'Z → A' : 'A → Z'}`;
    medir();
  }

  function mostrar() {
    const p = partida!;
    clearTimeout(timerSeguir);
    const q = p.pregunta;
    miniEl.textContent = q.letra;
    tipoEl.textContent = (q.tipo === 'contiene' ? 'Contiene la ' : 'Empieza por ') + q.letra;
    pistaEl.textContent = q.pista;
    pistaEl.hidden = !q.pista;
    cabEl.hidden = false; mediaEl.hidden = true;
    fbEl.hidden = true; finEl.hidden = true; filaEl.hidden = false;
    input.hidden = esPres(); grupoPreg.hidden = esPres(); grupoPres.hidden = !esPres();
    input.value = ''; input.classList.remove('vacio');
    if (esPres()) elegir('pres', 1); else elegir('preg', 0);
    pintar();
    ajustarPista();
    if (!esPres()) setTimeout(() => { if (pantalla === 'juego' && avisoEl.hidden) input.focus(); }, 30);
  }

  function pintar() {
    if (!partida) return;
    const p = partida;
    fichas.forEach((f, i) => {
      f.className = 'ficha' + (p.estado[i] === 'pasada' ? ' pasada' : p.estado[i] === 'ok' ? ' ok' : p.estado[i] === 'ko' ? ' ko' : '') +
        (i === p.actual && (p.fase === 'pregunta' || p.fase === 'duda') ? ' actual' : '');
    });
    marcadorEl.replaceChildren();
    if (duelo) {
      duelo.equipos.forEach((e, i) => {
        const q = e.partida.quedan;
        marcadorEl.append(h('span.tag.oscura.equipo-tag', { class: i === duelo!.turno ? 'activo' : '' },
          e.nombre, h('b', null, `${e.partida.aciertos}`), '✓', h('b', null, `${e.partida.fallos}`), '✗',
          q === Infinity ? null : h('b', null, mmss(q))));
      });
    } else {
      marcadorEl.append(
        h('span.tag.verde', null, 'Bien ', h('b', null, String(p.aciertos))),
        h('span.tag.roja', null, 'Mal ', h('b', null, String(p.fallos))),
        h('span.tag.linea', null, 'Quedan ', h('b', null, String(p.pendientes))));
      if (p.quedan !== Infinity) marcadorEl.append(h('span.tag.linea', null, '⏱ ', h('b', null, mmss(p.quedan))));
    }
    enviarEstado();
  }

  function verResultado(modo: 'bien' | 'mal' | 'duda') {
    filaEl.hidden = true; pistaEl.hidden = true;
    fbEl.hidden = false;
    fbEl.className = 'fb ' + modo;
    fbTitulo.textContent = modo === 'bien' ? '¡Correcto!' : modo === 'mal' ? '¡Nooo!' : '¿Es válida?';
    fbDicho.hidden = modo !== 'duda';
    (fbDicho.querySelector('b') as HTMLElement).textContent = partida!.escrita.toUpperCase();
    grupoRev.hidden = modo !== 'duda';
    bSeguir.parentElement!.hidden = modo !== 'mal';
    if (modo === 'duda') elegir('rev', 0);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function responder() {
    if (!partida || partida.fase !== 'pregunta') return;
    const txt = input.value.trim();
    if (!txt) { input.classList.add('vacio'); sacudir(input); input.focus(); return; }
    const f = partida.responder(txt);
    if (f === 'bien') trasBien(); else { verResultado('duda'); pintar(); }
  }

  function marcar(bien: boolean) {
    if (!partida || (partida.fase !== 'pregunta' && partida.fase !== 'duda')) return;
    partida.marcar(bien);
    if (bien) trasBien(); else trasMal();
  }

  function trasBien(titulo?: string) {
    sonar.bien();
    verResultado('bien');
    if (titulo) fbTitulo.textContent = titulo;
    pintar();
    timerSeguir = window.setTimeout(seguir, 1200);
  }

  function trasMal() {
    sonar.mal();
    verResultado('mal');
    pintar();
    sacudir(fichas[partida!.actual]);
  }

  function pasar() {
    if (!partida || partida.fase !== 'pregunta') return;
    sonar.pasa();
    partida.pasar();
    if (duelo) { duelo.trasJugada('pasa'); return cambioDeTurno(); }
    if (partida.terminada) return terminar();
    mostrar();
  }

  function seguir() {
    if (!partida || (partida.fase !== 'bien' && partida.fase !== 'mal')) return;
    clearTimeout(timerSeguir);
    const fue = partida.fase;
    partida.siguiente();
    if (duelo) { duelo.trasJugada(fue === 'bien' ? 'bien' : 'mal'); return cambioDeTurno(); }
    if (partida.terminada) return terminar();
    mostrar();
  }

  function cambioDeTurno() {
    const d = duelo!;
    if (d.terminado) return terminar();
    const antes = partida;
    partida = d.activo.partida;
    if (partida.terminada) return terminar();
    if (antes !== partida) { montarFichas(); anunciarTurno(); }
    mostrar();
  }

  function anunciarTurno() {
    const d = duelo!;
    (turnoEl.firstElementChild as HTMLElement).textContent = 'Turno de ' + d.activo.nombre;
    turnoEl.hidden = false;
    sonar.turno();
    setTimeout(() => { turnoEl.hidden = true; }, 1300);
  }

  function corregir(i: number) {
    if (!partida || !partida.corregir(i)) return;
    if (i === partida.actual && (partida.fase === 'bien' || partida.fase === 'mal')) {
      clearTimeout(timerSeguir);
      if (partida.fase === 'bien') trasBien('¡Vale, buena!'); else trasMal();
      return;
    }
    pintar();
    if (pantalla === 'fin') resumen();
  }

  function terminar() {
    clearTimeout(timerSeguir);
    partida?.terminar();
    pantalla = 'fin';
    sonar.fin();
    pintar();
    cabEl.hidden = true; pistaEl.hidden = true; filaEl.hidden = true; fbEl.hidden = true;
    finEl.hidden = false; mediaEl.hidden = false;
    resumen();
    medir();
    elegir('fin', 1);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function resumen() {
    finRes.replaceChildren();
    if (duelo) {
      const g = duelo.ganador();
      finTitulo.textContent = g ? `¡GANA ${g.nombre.toUpperCase()}!` : '¡EMPATE!';
      letraGrande.textContent = '¡FIN!';
      duelo.equipos.forEach(e => finRes.append(h('span.tag.oscura', null, e.nombre, h('b', null, String(e.partida.aciertos)), '✓', h('b', null, String(e.partida.fallos)), '✗')));
    } else {
      const p = partida!;
      finTitulo.innerHTML = p.quedan === 0 ? '¡SE ACABÓ<br>EL TIEMPO!' : '¡ROSCO<br>TERMINADO!';
      letraGrande.textContent = '¡FIN!';
      finRes.append(
        h('span.tag.verde', null, h('b', null, String(p.aciertos)), p.aciertos === 1 ? ' acierto' : ' aciertos'),
        h('span.tag.roja', null, h('b', null, String(p.fallos)), p.fallos === 1 ? ' fallo' : ' fallos'));
    }
    ajustarFin();
  }

  // ---------- Aviso de salir ----------
  function pedirSalir() {
    if (pantalla === 'fin') { irPortada(); return; }
    clearTimeout(timerSeguir);
    avisoEl.hidden = false;
    elegir('aviso', 0);
    (document.activeElement as HTMLElement | null)?.blur();
  }
  function cerrarAviso() {
    avisoEl.hidden = true;
    if (partida?.fase === 'pregunta' && !esPres()) input.focus();
    else if (partida?.fase === 'bien') timerSeguir = window.setTimeout(seguir, 600);
  }

  // ---------- Selección con flechas ----------
  const grupos: Record<Grupo, HTMLElement> = { portada: grupoPortada, preg: grupoPreg, pres: grupoPres, rev: grupoRev, aviso: grupoAviso, fin: grupoFin };
  function elegir(g: Grupo, i: number) {
    const bs = [...grupos[g].querySelectorAll('button')];
    const k = g === 'pres' ? Math.max(0, Math.min(bs.length - 1, i)) : ((i % bs.length) + bs.length) % bs.length;
    sel[g] = k;
    bs.forEach((b, j) => b.classList.toggle('sel', j === k));
    if (g === 'preg') grupoPreg.classList.toggle('pasa-sel', k === 1);
  }
  function grupoActivo(): Grupo | null {
    if (!avisoEl.hidden) return 'aviso';
    if (pantalla === 'portada') return 'portada';
    if (pantalla === 'fin') return 'fin';
    if (!partida) return null;
    if (partida.fase === 'pregunta') return esPres() ? 'pres' : 'preg';
    if (partida.fase === 'duda') return 'rev';
    return null;
  }

  function teclado(e: KeyboardEvent) {
    if (e.isComposing || !cont.isConnected) return;
    if (e.key === 'Escape') {
      if (!avisoEl.hidden) { e.preventDefault(); cerrarAviso(); }
      else if (pantalla !== 'portada') { e.preventDefault(); pedirSalir(); }
      return;
    }
    if (pantalla === 'juego' && partida?.fase === 'pregunta' && !esPres() && avisoEl.hidden && document.activeElement !== input &&
      (e.key.length === 1 || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey && !e.altKey) input.focus();
    const g = grupoActivo();
    if (g && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault();
      elegir(g, sel[g] + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (e.key === 'Enter') {
      if (g) {
        e.preventDefault();
        if (g === 'preg' && sel.preg === 0) { responder(); return; }
        (grupos[g].querySelectorAll('button')[sel[g]] as HTMLButtonElement | undefined)?.click();
        return;
      }
      if (partida && (partida.fase === 'bien' || partida.fase === 'mal')) { e.preventDefault(); seguir(); }
    }
  }
  addEventListener('keydown', teclado);

  // ---------- Tiempo ----------
  let ultimo = performance.now();
  const reloj = setInterval(() => {
    const ahora = performance.now(), dt = (ahora - ultimo) / 1000;
    ultimo = ahora;
    if (pantalla !== 'juego' || !partida || !avisoEl.hidden || partida.fase !== 'pregunta' || partida.quedan === Infinity) return;
    partida.tictac(dt);
    if (partida.terminada) {
      if (duelo) { sonar.mal(); duelo.cambiarTurno(); cambioDeTurno(); } else terminar();
    } else pintar();
  }, 250);

  // ---------- Medidas ----------
  function medir() {
    if (!fichas.length) return;
    const ancha = innerWidth > innerHeight * 1.15;
    juegoEl.style.paddingTop = ancha ? '0' : '';
    const barra = barraEl.getBoundingClientRect();
    const ah = ancha ? innerHeight * 0.97 : innerHeight - barra.bottom - innerHeight * 0.03;
    const S = Math.min(innerWidth * 0.96, ah);
    const n = fichas.length;
    const R0 = S / 2;
    const d = Math.min((Math.PI * S) / n * 0.84, R0 * 0.25);
    const R = R0 - d * 0.62;
    tableroEl.style.width = tableroEl.style.height = S + 'px';
    fichas.forEach((el, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      el.style.width = el.style.height = d + 'px';
      el.style.left = S / 2 + R * Math.cos(a) - d / 2 + 'px';
      el.style.top = S / 2 + R * Math.sin(a) - d / 2 + 'px';
      el.style.fontSize = d * 0.5 + 'px';
    });
    const Ri = R - d * 0.75, fh = 0.64;
    const ch = 2 * Ri * fh, cw = 2 * Ri * Math.sqrt(1 - fh * fh);
    Object.assign(centroEl.style, { left: (S - cw) / 2 + 'px', top: (S - ch) / 2 + 'px', width: cw + 'px', height: ch + 'px' });
    tableroEl.style.setProperty('--d', Math.min(cw / 4.4, ch / 3.8) + 'px');
    mediaEl.style.height = ch * 0.34 + 'px';
    ajustarLetra(); ajustarPista(); ajustarFin();
  }
  function ajustarLetra() {
    if (mediaEl.hidden) return;
    const w = mediaEl.clientWidth;
    let s = mediaEl.clientHeight * 0.62;
    letraGrande.style.fontSize = s + 'px';
    for (let g = 0; g < 80 && s > 12 && (letraGrande.parentElement as HTMLElement).offsetWidth > w * 0.92; g++) { s *= 0.94; letraGrande.style.fontSize = s + 'px'; }
  }
  function ajustarPista() {
    if (pistaEl.hidden || !pistaEl.textContent) return;
    const d = parseFloat(tableroEl.style.getPropertyValue('--d')) || 100;
    let f = d * 0.46;
    pistaEl.style.fontSize = f + 'px';
    for (let g = 0; g < 80 && f > 12 && textoEl.scrollHeight > textoEl.clientHeight + 1; g++) { f -= 1; pistaEl.style.fontSize = f + 'px'; }
  }
  function ajustarFin() {
    if (finEl.hidden) return;
    finTitulo.style.fontSize = '';
    let f = parseFloat(getComputedStyle(finTitulo).fontSize);
    for (let g = 0; g < 80 && f > 12 && (finTitulo.scrollWidth > textoEl.clientWidth || textoEl.scrollHeight > textoEl.clientHeight + 1); g++) {
      f *= 0.94; finTitulo.style.fontSize = f + 'px';
    }
  }
  function sacudir(el: HTMLElement) { el.classList.remove('sacude'); void el.offsetWidth; el.classList.add('sacude'); }

  addEventListener('resize', medir);
  document.fonts?.ready.then(medir);
  pintarPortada();
  enviarEstado();

  // Si solo hay un rosco y no es duelo, se puede saltar la portada desde fuera.
  (cont as any).empezar = () => empezar(op.roscos[0]);

  return () => {
    clearInterval(reloj);
    clearTimeout(timerSeguir);
    removeEventListener('keydown', teclado);
    removeEventListener('resize', medir);
    canal.cerrar();
    cont.remove();
  };
}
