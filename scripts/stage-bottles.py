"""Compone las botellas de marca sobre un escenario de barra coherente con el resto de la carta.

Herramienta de desarrollo (no se ejecuta en producción). Requiere Pillow y numpy:
    python scripts/stage-bottles.py

Entrada: botellas recortadas (public/assets/wine-*.webp con canal alfa) y la imagen publicada de la
botella 290 (fondo blanco). Salida: public/assets/stage-*.webp (800x1000), con luz cálida, sombra de
contacto y reflejo. No se inventa ningún producto: solo se cambia el fondo de la imagen existente.
"""
import random
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ASSETS = Path('public/assets')
W, H = 800, 1000
SURFACE_Y = 705  # línea donde apoyan las botellas (la ficha recorta al centro: la botella debe caber ahí)


def stage(seed: int) -> Image.Image:
    rnd = random.Random(seed)
    yy = np.linspace(0, 1, H)[:, None, None]
    top = np.array([13, 9, 8], dtype=np.float32)
    mid = np.array([28, 16, 12], dtype=np.float32)
    base = top * (1 - yy) + mid * yy
    img = Image.fromarray(np.broadcast_to(base, (H, W, 3)).astype(np.uint8), 'RGB')

    # Bokeh de estantería: círculos ámbar desenfocados detrás de la botella.
    bokeh = Image.new('RGB', (W, H), (0, 0, 0))
    d = ImageDraw.Draw(bokeh)
    for _ in range(46):
        r = rnd.randint(14, 46)
        x, y = rnd.randint(0, W), rnd.randint(40, SURFACE_Y - 120)
        c = rnd.choice([(255, 170, 70), (255, 140, 50), (255, 205, 120), (200, 110, 50), (120, 150, 255)])
        k = rnd.uniform(0.18, 0.5) * (0.35 if c[2] > 200 else 1)
        d.ellipse((x - r, y - r, x + r, y + r), fill=tuple(int(v * k) for v in c))
    bokeh = bokeh.filter(ImageFilter.GaussianBlur(11))
    img = ImageChops.add(img, bokeh)

    # Luz cálida detrás de la botella.
    glow = Image.new('RGB', (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((130, 130, 670, 800), fill=(120, 70, 28))
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    img = ImageChops.add(img, glow)

    # Superficie de la barra: madera oscura con brillo horizontal y veta suave.
    surf = np.zeros((H - SURFACE_Y, W, 3), dtype=np.float32)
    t = np.linspace(0, 1, H - SURFACE_Y)[:, None]
    surf[..., 0] = 70 - 40 * t
    surf[..., 1] = 38 - 24 * t
    surf[..., 2] = 22 - 14 * t
    grain = np.array([rnd.gauss(0, 1) for _ in range(H - SURFACE_Y)])[:, None]
    grain = np.convolve(grain[:, 0], np.ones(5) / 5, mode='same')[:, None]
    surf += grain[..., None] * 5
    surface = Image.fromarray(np.clip(surf, 0, 255).astype(np.uint8), 'RGB')
    img.paste(surface, (0, SURFACE_Y))
    line = Image.new('RGB', (W, 3), (200, 130, 70))
    img.paste(Image.blend(img.crop((0, SURFACE_Y - 1, W, SURFACE_Y + 2)), line, 0.45), (0, SURFACE_Y - 1))

    # Viñeta.
    vig = Image.new('L', (W, H), 0)
    vd = ImageDraw.Draw(vig)
    vd.ellipse((-160, -120, W + 160, H + 120), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(150))
    dark = Image.new('RGB', (W, H), (6, 4, 4))
    return Image.composite(img, dark, vig)


def cutout_from_white(path: Path, tol: int = 28) -> Image.Image:
    """Quita un fondo blanco continuo desde los bordes (relleno por inundación)."""
    im = Image.open(path).convert('RGB')
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape
    seen = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        q.extend([(0, x), (h - 1, x)])
    for y in range(h):
        q.extend([(y, 0), (y, w - 1)])
    while q:
        y, x = q.popleft()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x]:
            continue
        if (255 - a[y, x]).max() > tol:
            continue
        seen[y, x] = True
        q.extend([(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)])
    alpha = Image.fromarray(np.where(seen, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(0.8))
    out = im.convert('RGBA')
    out.putalpha(alpha)
    return out


def cutout_from_alpha(path: Path) -> Image.Image:
    im = Image.open(path).convert('RGBA')
    return im


def compose(name: str, bottle: Image.Image, seed: int, height: int = 440) -> None:
    bbox = bottle.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    bottle = bottle.crop(bbox)
    scale = min(height / bottle.height, 1.9)
    bottle = bottle.resize((max(1, round(bottle.width * scale)), max(1, round(bottle.height * scale))), Image.LANCZOS)
    if bottle.width > 460:  # cajas anchas
        s = 460 / bottle.width
        bottle = bottle.resize((460, round(bottle.height * s)), Image.LANCZOS)

    canvas = stage(seed).convert('RGBA')
    x = (W - bottle.width) // 2
    y = SURFACE_Y - bottle.height + 6

    # Sombra de contacto.
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((x - 10, SURFACE_Y - 14, x + bottle.width + 10, SURFACE_Y + 26), fill=(0, 0, 0, 190))
    canvas = Image.alpha_composite(canvas, sh.filter(ImageFilter.GaussianBlur(14)))

    # Reflejo atenuado sobre la barra.
    refl = bottle.transpose(Image.FLIP_TOP_BOTTOM)
    rh = min(refl.height, H - SURFACE_Y - 6)
    refl = refl.crop((0, 0, refl.width, rh))
    fade = Image.linear_gradient('L').resize((refl.width, rh)).transpose(Image.FLIP_TOP_BOTTOM)
    a = ImageChops.multiply(refl.getchannel('A'), fade.point(lambda v: int(v * 0.30)))
    refl.putalpha(a)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(refl, (x, SURFACE_Y + 6), refl)
    canvas = Image.alpha_composite(canvas, layer)

    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(bottle, (x, y), bottle)
    canvas = Image.alpha_composite(canvas, layer)

    # Ligero grano para igualar la textura de las imágenes ambientadas.
    rnd = np.random.default_rng(seed)
    noise = rnd.normal(0, 3.2, (H, W, 1))
    arr = np.clip(np.asarray(canvas.convert('RGB')).astype(np.float32) + noise, 0, 255).astype(np.uint8)
    Image.fromarray(arr, 'RGB').save(ASSETS / f'{name}.webp', quality=86, method=6)
    print('OK', name, f'{bottle.width}x{bottle.height}')


if __name__ == '__main__':
    compose('stage-crystal', cutout_from_alpha(ASSETS / 'wine-crystal.webp'), 11)
    compose('stage-purple', cutout_from_alpha(ASSETS / 'wine-purple.webp'), 12)
    compose('stage-brut', cutout_from_alpha(ASSETS / 'wine-brut.webp'), 13, height=430)
    compose('stage-gold', cutout_from_alpha(ASSETS / 'wine-gold.webp'), 14)
    compose('stage-mistral-manzana', cutout_from_white(ASSETS / '290.webp'), 15, height=400)
