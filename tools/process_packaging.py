"""Clean packaging artwork: trim white rim, paint out the print-registration mark, export WebP.

Usage: python tools/process_packaging.py
Originals are never modified. Output goes to assets/packaging/.
"""
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "作品集" / "包裝"
OUT = ROOT / "assets" / "packaging"
OUT.mkdir(parents=True, exist_ok=True)

# Only the "-沐泓印刷稿" files are the clean finals the user exported.
NAME_RE = re.compile(r"^(.*)-沐泓印刷稿-01\.jpg$")

FIXED_WIDTH = 1203  # artwork half has a white background, so bbox can't find the right edge


def trim_white(im: Image.Image, tol: int = 8) -> Image.Image:
    bg = Image.new("RGB", im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg).convert("L").point(lambda v: 255 if v > tol else 0)
    bbox = diff.getbbox()
    if not bbox:
        return im
    left, top, _, bottom = bbox
    return im.crop((left, top, min(im.width, left + FIXED_WIDTH), bottom))


def paint_out_marker(im: Image.Image) -> Image.Image:
    """The registration mark (black, or already whitened) sits at the bottom-left of the flat colour panel.

    Detect it as any deviation from the panel colour along the left edge, then repaint
    that block by extending the panel colour straight down from just above it.
    """
    w, h = im.size
    px = im.load()
    probe_x, tol = 3, 40

    def far(a, b):
        return sum(abs(a[i] - b[i]) for i in range(3)) > tol

    panel = px[probe_x, h - 90]
    top = next((y for y in range(h - 85, h) if far(px[probe_x, y], panel)), None)
    if top is None:
        return im
    right = 0
    for x in range(0, min(90, w)):
        if any(far(px[x, y], panel) for y in range(top, min(top + 6, h))):
            right = x + 1
        elif x > right + 2:
            break
    right = min(right + 3, w - 1)
    src_y = max(0, top - 2)
    for x in range(0, right):
        fill = px[x, src_y]
        for y in range(top, h):
            px[x, y] = fill
    return im


def main() -> int:
    count = 0
    for f in sorted(SRC.iterdir()):
        m = NAME_RE.match(f.name)
        if not m:
            continue
        im = Image.open(f).convert("RGB")
        im = trim_white(im)
        im = paint_out_marker(im)
        # Some files keep a thin white rim under the colour panel: trim rows that are white at the panel's x=100
        while im.height > 100 and min(im.getpixel((100, im.height - 1))) > 235 and min(im.getpixel((100, im.height - 40))) < 235:
            im = im.crop((0, 0, im.width, im.height - 1))
        # Remove any leftover 1px rim created by anti-aliasing
        im = im.crop((1, 1, im.width - 1, im.height - 1))
        im.save(OUT / f"{m.group(1)}.webp", "WEBP", quality=84, method=6)
        count += 1
    print(f"processed {count} files -> {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
