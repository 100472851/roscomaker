"""Graba la demo del README (results/demo.gif) recorriendo la app compilada con Playwright.

Uso: npm run build && python3 scripts/demo.py
Necesita: pip install playwright pillow && playwright install chromium; y ffmpeg en el PATH.
"""
import asyncio, math, shutil, subprocess, tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from playwright.async_api import async_playwright

RAIZ = Path(__file__).resolve().parent.parent
APP = (RAIZ / 'dist' / 'index.html').as_uri()
SALIDA = RAIZ / 'results' / 'demo.gif'
ANCHO, ALTO = 1280, 720


def foto_demo(ruta: Path) -> None:
    """Una «foto» abstracta generada aquí mismo: luces de escenario en tonos cálidos y morados."""
    im = Image.new('RGB', (900, 600), (24, 16, 34))
    d = ImageDraw.Draw(im)
    for i, (x, y, r, c) in enumerate([(160, 120, 220, (255, 120, 40)), (720, 160, 260, (120, 40, 180)),
                                      (450, 520, 300, (250, 200, 80)), (820, 520, 160, (30, 140, 200))]):
        d.ellipse([x - r, y - r, x + r, y + r], fill=c)
    for k in range(9):
        a = math.radians(200 + k * 14)
        d.line([(450, 620), (450 + 900 * math.cos(a), 620 + 900 * math.sin(a))], fill=(255, 235, 200), width=6)
    im.filter(ImageFilter.GaussianBlur(28)).save(ruta)


async def grabar(carpeta: Path) -> None:
    foto = carpeta / 'foto.png'
    foto_demo(foto)
    n = 0

    async def toma(pagina, veces=1):
        nonlocal n
        for _ in range(veces):
            await pagina.screenshot(path=str(carpeta / f'f{n:04d}.png'))
            n += 1

    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': ANCHO, 'height': ALTO})
        pg = await ctx.new_page()
        await pg.goto(APP)
        await pg.wait_for_timeout(500)
        await toma(pg, 4)                                        # biblioteca
        await pg.goto(APP + '#/editar/ejemplo-cine')
        await pg.wait_for_timeout(400)
        await pg.locator('.panel', has_text='Diseño').scroll_into_view_if_needed()
        await toma(pg, 3)
        await pg.locator('input[type=file][accept="image/*"]').set_input_files(str(foto))
        await pg.wait_for_timeout(600)
        await toma(pg, 4)                                        # colores sacados de la foto
        await pg.get_by_role('button', name='Probar ▶').click()
        await pg.wait_for_timeout(500)
        await toma(pg, 4)                                        # portada con el tema nuevo
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(400)
        await toma(pg, 3)
        for letra in 'avatr':                                   # con una errata: se acepta igual
            await pg.keyboard.type(letra)
            await toma(pg)
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(150)
        await toma(pg, 3)
        await pg.wait_for_timeout(1200)
        for letra in 'james':
            await pg.keyboard.type(letra)
            await toma(pg)
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(150)
        await toma(pg, 4)                                        # ¿Es válida?
        await pg.keyboard.press('ArrowRight')
        await toma(pg, 2)
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(150)
        await toma(pg, 4)                                        # ¡Nooo! sin enseñar la respuesta
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(200)
        await toma(pg, 2)
        # Vista de presentador
        async with ctx.expect_page() as nueva:
            await pg.get_by_role('button', name='Presentador').click()
        pres = await nueva.value
        await pres.set_viewport_size({'width': ANCHO, 'height': ALTO})
        await pres.wait_for_timeout(800)
        await toma(pres, 5)
        await pres.get_by_role('button', name='✓ Bien').click()
        await pg.wait_for_timeout(300)
        await toma(pg, 4)
        await b.close()


def a_gif(carpeta: Path) -> None:
    SALIDA.parent.mkdir(exist_ok=True)
    # 2 fotogramas por segundo, 800 px de ancho, paleta propia para que los colores no se ensucien.
    filtro = 'fps=2,scale=800:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '2', '-i', str(carpeta / 'f%04d.png'),
                    '-vf', filtro, '-loop', '0', str(SALIDA)], check=True)


if __name__ == '__main__':
    if not shutil.which('ffmpeg'):
        raise SystemExit('Falta ffmpeg.')
    with tempfile.TemporaryDirectory() as t:
        asyncio.run(grabar(Path(t)))
        a_gif(Path(t))
    print(f'{SALIDA.relative_to(RAIZ)}: {SALIDA.stat().st_size // 1024} KB')
