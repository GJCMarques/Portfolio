#!/usr/bin/env python3
"""
Generate favicon.ico from assets/favicon.svg using Playwright (Chromium).

Renders each ICO size in a real browser engine — pixel-perfect, identical
to what the header logo looks like on screen.

Usage:
    python scripts/gen_favicon.py

Requires: playwright, Pillow  (pip install playwright Pillow && playwright install chromium)
"""

import io
import os
import struct
from playwright.sync_api import sync_playwright
from PIL import Image

ROOT  = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))
SVG   = os.path.join(ROOT, "assets", "favicon.svg")
OUT   = os.path.join(ROOT, "assets", "favicon.ico")
SIZES = [16, 32, 48, 64, 128, 256]

# Inline HTML: white background so the dark ink symbol is visible.
# The SVG fills the entire viewport — zero padding, exact 1:1 with the file.
HTML = """<!DOCTYPE html>
<html><head><style>
  * {{ margin:0; padding:0; }}
  html, body {{ width:{s}px; height:{s}px; overflow:hidden; background:transparent; }}
  img {{ width:{s}px; height:{s}px; display:block; }}
</style></head>
<body><img src="file:///{svg}"></body></html>"""


def render(size: int, browser) -> Image.Image:
    SCALE = 4  # render at 4× then downscale for anti-aliasing
    S = size * SCALE
    page = browser.new_page(viewport={"width": S, "height": S})
    html = HTML.format(s=S, svg=SVG.replace("\\", "/"))
    page.set_content(html)
    page.wait_for_load_state("networkidle")
    png = page.screenshot(omit_background=True)
    page.close()
    img = Image.open(io.BytesIO(png)).convert("RGBA")
    return img.resize((size, size), Image.LANCZOS)


def make_ico(images: list) -> bytes:
    blobs = []
    for img in images:
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        blobs.append(buf.getvalue())

    count      = len(images)
    header     = struct.pack("<HHH", 0, 1, count)
    data_start = 6 + count * 16

    directory = b""
    offset    = data_start
    for img, blob in zip(images, blobs):
        w, h = img.size
        directory += struct.pack(
            "<BBBBHHII",
            0 if w >= 256 else w,
            0 if h >= 256 else h,
            0, 0, 1, 32,
            len(blob), offset,
        )
        offset += len(blob)

    return header + directory + b"".join(blobs)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        images  = [render(s, browser) for s in SIZES]
        browser.close()

    ico = make_ico(images)
    with open(OUT, "wb") as f:
        f.write(ico)
    print(f"Saved: {OUT}  ({len(ico) // 1024} KB,  sizes: {SIZES})")


if __name__ == "__main__":
    main()
