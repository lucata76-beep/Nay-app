#!/usr/bin/env python3
"""Controlla che l'icona maskable stia nell'area sicura (T1).

Esce con codice 0 solo se il pixel del disegno piu' lontano dal centro di
icon-maskable-512.png e' a meno del 40% della larghezza (204,8 px su 512).
Il disegno e' ogni pixel la cui differenza dallo sfondo (pixel in 20,20),
sommata sui canali, supera 60. Misura indipendente da make_icons.py.

Uso: python3 tools/check_icons.py [percorso.png]   (serve Pillow)
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
DEFAULT = ROOT / "assets" / "icons" / "icon-maskable-512.png"
SAFE_RATIO = 0.40
THRESHOLD = 60


def farthest_drawing_pixel(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    bg = img.getpixel((20, 20))
    diff = ImageChops.difference(img, Image.new("RGB", img.size, bg))
    r, g, b = diff.split()
    total = ImageChops.add(ImageChops.add(r, g), b)
    data = total.point(lambda v: 255 if v > THRESHOLD else 0).tobytes()
    best = None
    for y in range(h):
        row = data[y * w:(y + 1) * w]
        first = row.find(b"\xff")
        if first < 0:
            continue
        for x in (first, row.rfind(b"\xff")):
            d = ((x + 0.5 - w / 2) ** 2 + (y + 0.5 - h / 2) ** 2) ** 0.5
            if best is None or d > best:
                best = d
    return w, best


def main(argv):
    path = Path(argv[1]) if len(argv) > 1 else DEFAULT
    if not path.exists():
        print(f"KO: file mancante: {path}")
        return 1
    width, farthest = farthest_drawing_pixel(path)
    if farthest is None:
        print(f"KO: nessun disegno trovato in {path.name}")
        return 1
    limit = SAFE_RATIO * width
    ok = farthest < limit
    print(f"{path.name}: pixel piu' lontano dal centro = {farthest:.1f} px "
          f"({100 * farthest / width:.1f}% della larghezza); "
          f"limite {limit:.1f} px ({SAFE_RATIO * 100:.0f}%) -> {'OK' if ok else 'KO'}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
