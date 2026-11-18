import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FOTO = fileURLToPath(new URL('./foto-prueba.png', import.meta.url));

async function limpio(page: Page, ruta = '/') {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto(ruta);
}

test.describe('biblioteca', () => {
  test('la primera vez aparecen los dos roscos de ejemplo, listos para jugar', async ({ page }) => {
    await limpio(page);
    await expect(page.locator('.tarjeta')).toHaveCount(2);
    await expect(page.locator('.tarjeta .estado.bien')).toHaveCount(2);
  });

  test('crear, renombrar, duplicar y borrar', async ({ page }) => {
    await limpio(page);
    await page.getByRole('button', { name: '+ Nuevo rosco' }).click();
    await expect(page).toHaveURL(/#\/editar\//);
    await page.getByLabel('Nombre del rosco').fill('Mi rosco');
    await page.getByRole('button', { name: '← Biblioteca' }).click();
    await expect(page.locator('.tarjeta h3', { hasText: 'Mi rosco' })).toBeVisible();
    await expect(page.locator('.tarjeta', { hasText: 'Mi rosco' }).locator('.estado')).toContainText('por completar');
    await page.locator('.tarjeta', { hasText: 'Mi rosco' }).getByRole('button', { name: 'Más ▾' }).click();
    await page.getByRole('button', { name: 'Duplicar' }).click();
    await expect(page.locator('.tarjeta')).toHaveCount(4);
    await page.locator('.tarjeta', { hasText: 'Mi rosco (copia)' }).getByRole('button', { name: 'Más ▾' }).click();
    await page.getByRole('button', { name: 'Borrar' }).click();
    await page.locator('.capa').getByRole('button', { name: 'Borrar' }).click();
    await expect(page.locator('.tarjeta')).toHaveCount(3);
  });
});

test.describe('juego', () => {
  test('partida entera con el teclado: acierto, duda, fallo y pasapalabra', async ({ page }) => {
    await limpio(page, '/#/jugar/ejemplo-cine');
    await page.keyboard.press('Enter');
    await expect(page.locator('.ficha.actual')).toHaveText('A');
    await page.keyboard.type('avatar'); await page.keyboard.press('Enter');
    await expect(page.locator('.fb-titulo')).toHaveText('¡Correcto!');
    await page.keyboard.press('Enter');                       // no esperar: Intro pasa a la siguiente
    await expect(page.locator('.ficha.actual')).toHaveText('B');
    await page.keyboard.type('james'); await page.keyboard.press('Enter');
    await expect(page.locator('.fb-titulo')).toHaveText('¿Es válida?');
    await expect(page.locator('.fb-dicho b')).toHaveText('JAMES');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    await expect(page.locator('.fb-titulo')).toHaveText('¡Nooo!');
    await expect(page.locator('.texto')).not.toContainText('BOND');   // la respuesta no se enseña (rebote)
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');   // pasapalabra en la C
    await expect(page.locator('.ficha.pasada')).toHaveText('C');
    await expect(page.locator('.tag.verde b')).toHaveText('1');
    await expect(page.locator('.tag.roja b')).toHaveText('1');
    // corregir la B tocándola
    await page.locator('.ficha.ko').click();
    await expect(page.locator('.tag.verde b')).toHaveText('2');
  });

  test('Esc pide confirmación y «No, seguir» vuelve a la partida', async ({ page }) => {
    await limpio(page, '/#/jugar/ejemplo-cine');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByText('¿Salir de la partida?')).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.getByText('¿Salir de la partida?')).toBeHidden();
    await page.keyboard.press('Escape'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#\/$/);
  });

  test('modo presentación: ✓ · Pasapalabra · ✗ con Pasapalabra por defecto', async ({ page }) => {
    await limpio(page);
    await page.evaluate(() => {
      const l = JSON.parse(localStorage.getItem('roscomaker:roscos')!);
      l.find((r: any) => r.id === 'ejemplo-cine').opciones.modo = 'presentacion';
      localStorage.setItem('roscomaker:roscos', JSON.stringify(l));
    });
    await page.goto('/#/jugar/ejemplo-cine');
    await page.keyboard.press('Enter');
    await expect(page.locator('#resp')).toBeHidden();
    await page.keyboard.press('Enter');
    await expect(page.locator('.ficha.pasada')).toHaveText('A');
    await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('Enter');
    await expect(page.locator('.ficha.ok')).toHaveText('B');
  });

  test('el rosco de ciencia va de la Z a la A y el tiempo se agota', async ({ page }) => {
    await limpio(page);
    await page.evaluate(() => {
      const l = JSON.parse(localStorage.getItem('roscomaker:roscos')!);
      l.find((r: any) => r.id === 'ejemplo-ciencia').opciones.segundos = 2;
      localStorage.setItem('roscomaker:roscos', JSON.stringify(l));
    });
    await page.goto('/#/jugar/ejemplo-ciencia');
    await page.keyboard.press('Enter');
    await expect(page.locator('.ficha.actual')).toHaveText('Z');
    await expect(page.locator('.fin-titulo')).toContainText('TIEMPO', { timeout: 5000 });
  });
});

test.describe('editor', () => {
  test('quitar letras, editar, avisos de revisión y guardado automático', async ({ page }) => {
    await limpio(page, '/#/editar/ejemplo-cine');
    await expect(page.getByText('Todo en orden')).toBeVisible();
    await page.getByRole('button', { name: 'Sin Ñ', exact: true }).click();
    await expect(page.locator('.fila-letra')).toHaveCount(26);
    const filaA = page.locator('.fila-letra[data-letra="A"]');
    await filaA.locator('textarea').fill('Película de 2009; ojo, en la D sale Dune');
    await filaA.locator('input').first().fill('Bávaro');
    await expect(page.locator('.lista-avisos')).toContainText('«Bávaro» no empieza por A');
    await expect(page.locator('.lista-avisos')).toContainText('Destripa la D');
    await page.waitForTimeout(600);
    await page.reload();
    await expect(page.locator('.fila-letra')).toHaveCount(26);
    await expect(page.locator('.fila-letra[data-letra="A"] input').first()).toHaveValue('Bávaro');
    // volver a poner la Ñ recupera lo que tenía
    await page.locator('.chip', { hasText: 'Ñ' }).click();
    await expect(page.locator('.fila-letra[data-letra="Ñ"] input').first()).toHaveValue('');
  });

  test('pegar desde una hoja de cálculo', async ({ page }) => {
    await limpio(page);
    await page.getByRole('button', { name: '+ Nuevo rosco' }).click();
    await page.getByRole('button', { name: 'Pegar desde hoja de cálculo' }).click();
    await page.locator('.capa textarea').fill('Letra\tTipo\tPista\tRespuesta\tOtras\nA\tEmpieza por\tCapital de Grecia\tAtenas\t\nX\tContiene\tCoche de alquiler con conductor\tTaxi\tTaxis');
    await page.locator('.capa').getByRole('button', { name: 'Importar' }).click();
    await expect(page.locator('.fila-letra[data-letra="A"] textarea')).toHaveValue('Capital de Grecia');
    await expect(page.locator('.fila-letra[data-letra="X"] input').nth(1)).toHaveValue('Taxis');
  });

  test('sacar colores de una foto cambia el tema y lo deja legible', async ({ page }) => {
    await limpio(page, '/#/editar/ejemplo-cine');
    const antes = await page.locator('input[aria-label="Acento"]').inputValue();
    await page.locator('input[type=file][accept="image/*"]').setInputFiles(FOTO);
    await expect(page.locator('.paleta-foto span')).toHaveCount(6);
    await expect(page.locator('input[aria-label="Acento"]')).not.toHaveValue(antes);
    await expect(page.locator('.contraste-mal')).toHaveText('');
    await expect(page.getByRole('button', { name: 'Quitar foto de fondo' })).toBeVisible();
  });
});

test.describe('exportar y compartir', () => {
  test('el HTML descargado funciona solo, sin servidor', async ({ page, browser }) => {
    await limpio(page);
    await page.locator('.tarjeta', { hasText: 'Rosco de cine' }).getByRole('button', { name: 'Más ▾' }).click();
    const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Descargar HTML/ }).click()]);
    const ruta = test.info().outputPath('rosco.html');
    await descarga.saveAs(ruta);
    const html = readFileSync(ruta, 'utf8');
    expect(html).toContain('roscomaker-datos');
    expect(html).not.toMatch(/<script[^>]+src=/);           // todo dentro: nada que descargar
    const otra = await browser.newPage();
    await otra.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue())); // sin red
    await otra.goto('file://' + ruta);
    await expect(otra.locator('.grande')).toHaveText('CINE');
    await otra.keyboard.press('Enter');
    await expect(otra.locator('.ficha.actual')).toHaveText('A');
    await otra.close();
  });

  test('JSON: exportar e importar un rosco', async ({ page }) => {
    await limpio(page);
    await page.locator('.tarjeta', { hasText: 'Rosco de ciencia' }).getByRole('button', { name: 'Más ▾' }).click();
    const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /\.json/ }).click()]);
    await page.locator('input[type=file][accept*=json]').setInputFiles(await descarga.path()!);
    await expect(page.locator('.tarjeta h3', { hasText: 'Rosco de ciencia' })).toHaveCount(2);
  });

  test('enlace para compartir', async ({ page }) => {
    await limpio(page);
    await page.locator('.tarjeta', { hasText: 'Rosco de cine' }).getByRole('button', { name: 'Más ▾' }).click();
    await page.getByRole('button', { name: 'Copiar enlace para compartir' }).click();
    const url = await page.getByLabel('Enlace para compartir').inputValue();
    expect(url).toMatch(/#\/r\/[\w-]+$/);
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Rosco de cine' })).toBeVisible();
    await page.getByRole('button', { name: 'Guardar en mi biblioteca' }).click();
    await expect(page).toHaveURL(/#\/editar\//);
  });

  test('hoja de soluciones con todas las respuestas en orden de juego', async ({ page }) => {
    await limpio(page, '/#/soluciones/ejemplo-ciencia');
    await expect(page.locator('.sol-rosco td.r').first()).toHaveText('Luz');      // Z→A: empieza por la Z
    await expect(page.locator('.sol-rosco tbody tr')).toHaveCount(27);
    await expect(page.locator('.sol-chuleta li')).toHaveCount(27);
  });
});

test('vista de presentador: ve la respuesta y manda en el rosco', async ({ page, context }) => {
  await limpio(page, '/#/jugar/ejemplo-cine');
  await page.keyboard.press('Enter');
  const [pres] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: 'Presentador' }).click()]);
  await expect(pres.locator('.solucion strong')).toHaveText('Avatar');
  await pres.getByRole('button', { name: '✓ Bien' }).click();
  await expect(page.locator('.ficha.ok')).toHaveText('A');
  await pres.getByRole('button', { name: 'Siguiente letra →' }).click();
  await expect(pres.locator('.solucion strong')).toHaveText('Bond');
  await pres.keyboard.press('ArrowRight'); await pres.keyboard.press('Enter');   // ✗
  await expect(page.locator('.ficha.ko')).toHaveText('B');
  await expect(page.locator('.texto')).not.toContainText('Bond');
});

test('duelo: el turno pasa al fallar y cada equipo tiene su rosco', async ({ page }) => {
  await limpio(page, '/#/duelo');
  await page.getByRole('button', { name: 'Empezar duelo ▶' }).click();
  await page.keyboard.press('Enter');
  await expect(page.locator('.equipo-tag.activo')).toContainText('Equipo rojo');
  await expect(page.locator('.ficha.actual')).toHaveText('A');      // cine, A→Z
  await page.keyboard.type('avatar'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await expect(page.locator('.equipo-tag.activo')).toContainText('Equipo rojo');   // acertar no pasa el turno
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Enter');     // pasapalabra
  await expect(page.locator('.equipo-tag.activo')).toContainText('Equipo azul');
  await expect(page.locator('.ficha.actual')).toHaveText('Z');      // ciencia, Z→A
});
