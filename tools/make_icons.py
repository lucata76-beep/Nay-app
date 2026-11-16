#!/usr/bin/env python3
"""Ricava le tre icone dell'app dal logo (T1).

  icon-512.png           logo intero ridotto a 512x512
  icon-192.png           icon-512 ridotta a 192x192
  icon-maskable-512.png  disegno centrato su tela 512x512 crema, ridotto in modo
                         che il pixel piu' lontano dal centro stia entro il 36%
                         della larghezza (90% del limite del 40% di web.dev)

Uso: python3 tools/make_icons.py     (serve Pillow)
"""
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "assets" / "logo" / "cuffia_03_oro.png"
OUT = ROOT / "assets" / "icons"

CREAM = (0xFD, 0xF6, 0xEF)  # #fdf6ef, come da piano
THRESHOLD = 60              # differenza dallo sfondo, somma dei canali
SIZE = 512
TARGET_RATIO = 0.36         # 90% del limite 0,40


def drawing_mask(img):
    """Maschera L: 255 dove la somma delle differenze dei canali dallo sfondo
    (pixel in 20,20) supera THRESHOLD."""
    rgb = img.convert("RGB")
    bg = rgb.getpixel((20, 20))
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, bg))
    r, g, b = diff.split()
    total = ImageChops.add(ImageChops.add(r, g), b)
    return total.point(lambda v: 255 if v > THRESHOLD else 0)


def farthest_from(mask, cx, cy):
    """Distanza del pixel acceso piu' lontano da (cx, cy), in pixel.
    Per ogni riga basta guardare il primo e l'ultimo pixel acceso."""
    w, h = mask.size
    data = mask.tobytes()
    best = 0.0
    for y in range(h):
        row = data[y * w:(y + 1) * w]
        first = row.find(b"\xff")
        if first < 0:
            continue
        last = row.rfind(b"\xff")
        for x in (first, last):
            d = ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2) ** 0.5
            best = max(best, d)
    return best


def make_maskable(logo):
    mask = drawing_mask(logo)
    box = mask.getbbox()
    if box is None:
        raise SystemExit("nessun disegno trovato nel logo")
    cx, cy = (box[0] + box[2]) / 2, (box[1] + box[3]) / 2
    r_max = farthest_from(mask, cx, cy)
    scale = (TARGET_RATIO * SIZE) / r_max
    crop = logo.convert("RGB").crop(box)
    new_w, new_h = round(crop.width * scale), round(crop.height * scale)
    small = crop.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), CREAM)
    canvas.paste(small, (round(SIZE / 2 - new_w / 2), round(SIZE / 2 - new_h / 2)))
    return canvas


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    logo = Image.open(LOGO)
    icon512 = logo.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    icon192 = icon512.resize((192, 192), Image.LANCZOS)
    maskable = make_maskable(logo)
    icon512.save(OUT / "icon-512.png", optimize=True)
    icon192.save(OUT / "icon-192.png", optimize=True)
    maskable.save(OUT / "icon-maskable-512.png", optimize=True)
    print("scritte:", ", ".join(sorted(p.name for p in OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
