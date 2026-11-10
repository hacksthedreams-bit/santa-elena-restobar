"""Genera miniaturas livianas y la imagen para compartir en redes.

Herramienta de desarrollo (no corre en producción). Requiere Pillow:
    python scripts/make-thumbs.py

- public/assets/sm/<archivo>.webp: copia de 560 px de ancho de cada imagen de producto, para las listas
  (la ficha de detalle y el hero siguen usando la imagen completa).
- public/assets/og-image.jpg: 1200x630 para previsualizaciones al compartir el enlace.
No se modifica ninguna imagen original.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path('public/assets')
SM = ASSETS / 'sm'
MAX_W = 560


def thumbs() -> None:
    SM.mkdir(exist_ok=True)
    menu = json.load(open('public/menu.json', encoding='utf8'))
    names = {Path(p['image']).name for p in menu['products'] if p.get('image', '').startswith('assets/')}
    # Imágenes que usa la interfaz fuera de los productos (miniaturas de categorías, hero, etc.).
    names |= {n.name for n in ASSETS.glob('*.webp') if n.stem.isdigit() or n.stem.startswith(('ref-', 'ambient', 'brand-', 'stage-', 'wine-'))}
    saved = total_a = total_b = 0
    for name in sorted(names):
        src = ASSETS / name
        if not src.exists():
            continue
        im = Image.open(src)
        im.load()
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        im.save(SM / name, 'WEBP', quality=78, method=6)
        total_a += src.stat().st_size
        total_b += (SM / name).stat().st_size
        saved += 1
    print(f'Miniaturas: {saved}. Peso {total_a/1e6:.1f} MB -> {total_b/1e6:.1f} MB')


def og_image() -> None:
    W, H = 1200, 630
    base = Image.new('RGB', (W, H), (20, 19, 21))
    d = ImageDraw.Draw(base)
    glow = Image.new('RGB', (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-200, -250, 700, 450), fill=(88, 30, 50))
    gd.ellipse((650, 150, 1350, 800), fill=(120, 76, 40))
    glow = glow.filter(ImageFilter.GaussianBlur(130))
    base = Image.blend(base, Image.eval(glow, lambda v: v), 0.0)
    from PIL import ImageChops
    base = ImageChops.add(base, glow)

    # Foto principal en arco (Tabla La Segunda).
    photo = Image.open(ASSETS / '472.webp').convert('RGB')
    ph = 540
    pw = round(ph * 0.78)
    photo = photo.resize((round(photo.width * ph / photo.height), ph), Image.LANCZOS)
    left = (photo.width - pw) // 2
    photo = photo.crop((left, 0, left + pw, ph))
    mask = Image.new('L', (pw, ph), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, pw, ph), radius=24, fill=255)
    md.ellipse((0, 0, pw, pw), fill=255)
    md.rectangle((0, pw // 2, pw, ph - 24), fill=255)
    md.rounded_rectangle((0, pw // 2, pw, ph), radius=24, fill=255)
    px, py = W - pw - 70, (H - ph) // 2
    base.paste(photo, (px, py), mask)
    ring = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    rd = ImageDraw.Draw(ring)
    rd.rounded_rectangle((px, py, px + pw, py + ph), radius=24, outline=(223, 190, 134, 120), width=2)
    base = Image.alpha_composite(base.convert('RGBA'), ring).convert('RGB')

    # Logo rectangular original.
    logo = Image.open(ASSETS / 'logo-wide.webp').convert('RGB')
    lw = 520
    logo = logo.resize((lw, lw // 2), Image.LANCZOS)
    base.paste(logo, (70, 96))
    d = ImageDraw.Draw(base)
    d.line((70, 400, 130, 400), fill=(223, 190, 134), width=3)
    try:
        from PIL import ImageFont
        f1 = ImageFont.truetype(str(ASSETS / 'outfit-regular.ttf'), 40)
        f2 = ImageFont.truetype(str(ASSETS / 'outfit-regular.ttf'), 26)
    except Exception:
        f1 = f2 = None
    d.text((70, 424), 'Carta digital', fill=(249, 245, 238), font=f1)
    d.text((70, 482), 'Batuco, Lampa  ·  Cocina, música y bar', fill=(223, 190, 134), font=f2)
    base.save(ASSETS / 'og-image.jpg', quality=88, optimize=True)
    print('og-image.jpg', (ASSETS / 'og-image.jpg').stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    thumbs()
    og_image()
