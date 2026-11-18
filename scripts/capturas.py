"""Capturas de cada pantalla para revisar el diseño a ojo (no forman parte de las pruebas)."""
import asyncio, sys
from playwright.async_api import async_playwright

URL = 'file:///home/claude/roscomaker/dist/index.html'
SALIDA = sys.argv[1] if len(sys.argv) > 1 else '/tmp/rm'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width': 1600, 'height': 900})
        errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
        await pg.goto(URL); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{SALIDA}-1-biblioteca.png')
        await pg.goto(URL + '#/editar/ejemplo-cine'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{SALIDA}-2-editor.png')
        await pg.screenshot(path=f'{SALIDA}-2b-editor-largo.png', full_page=True)
        await pg.goto(URL + '#/jugar/ejemplo-cine'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{SALIDA}-3-portada.png')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{SALIDA}-4-juego.png')
        await pg.keyboard.type('avatar'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(1500)
        await pg.keyboard.type('james'); await pg.keyboard.press('Enter'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{SALIDA}-5-duda.png')
        await pg.goto(URL + '#/jugar/ejemplo-ciencia'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{SALIDA}-6-portada-ciencia.png')
        await pg.goto(URL + '#/duelo'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{SALIDA}-7-duelo.png')
        await pg.goto(URL + '#/soluciones/ejemplo-cine'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{SALIDA}-8-soluciones.png')
        print('errores:', errs or 'ninguno')
        await b.close()

asyncio.run(main())
