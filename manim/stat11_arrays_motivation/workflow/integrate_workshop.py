#!/usr/bin/env python3
"""Idempotently embed the rendered arrays-motivation video in Class 01 setup."""

from __future__ import annotations

import re
import sys
from pathlib import Path


HTML_MARKER = "<!-- arrays-motivation-video:v1 -->"
CSS_MARKER = "/* arrays-motivation-video:v1 */"

CARD = r'''
        <!-- arrays-motivation-video:v1 -->
        <section class="array-motivation-card" aria-label="Why arrays and lists are needed">
          <div class="array-motivation-copy">
            <div class="array-motivation-kicker">BEFORE ARRAYS · WHY FIRST</div>
            <h3>Why store several values in one variable?</h3>
            <p>You already know <code>variable = value</code>. This short animation starts there, lets that idea grow into a dataset, and introduces a Python list only when separate variables become impractical.</p>
            <div class="array-motivation-scope">
              <span>variables</span><span>related values</span><span>ordered list</span><span>index 0</span>
            </div>
            <p class="array-motivation-note"><strong>Scope:</strong> no loops, functions, conditions, NumPy or Pandas are needed.</p>
          </div>
          <div class="array-motivation-media">
            <video controls preload="metadata" playsinline
              poster="assets/arrays-motivation/Stat11ArraysMotivation_poster.jpg">
              <source src="assets/arrays-motivation/Stat11ArraysMotivation.mp4" type="video/mp4">
              Your browser does not support embedded MP4 video.
            </video>
          </div>
        </section>
'''.rstrip()

CSS = r'''
/* arrays-motivation-video:v1 */
.array-motivation-card{margin:22px 0 24px;padding:20px;border:1px solid #d7e5fb;border-radius:14px;background:#fff;display:grid;grid-template-columns:minmax(0,.88fr) minmax(420px,1.12fr);gap:22px;align-items:center;box-shadow:0 1px 2px rgba(60,64,67,.08)}
.array-motivation-copy{min-width:0}.array-motivation-kicker{font-size:.73rem;font-weight:800;letter-spacing:.11em;color:#1a73e8;text-transform:uppercase;margin-bottom:7px}.array-motivation-copy h3{margin:0 0 10px;color:#202124;font-size:1.32rem;line-height:1.25}.array-motivation-copy p{margin:0 0 12px;color:#3c4043;line-height:1.55}.array-motivation-copy code{font-family:Consolas,"Liberation Mono",monospace;background:#e8f0fe;color:#174ea6;padding:2px 5px;border-radius:5px}.array-motivation-scope{display:flex;flex-wrap:wrap;gap:7px;margin:10px 0 12px}.array-motivation-scope span{border:1px solid #dadce0;background:#f8f9fa;color:#3c4043;border-radius:999px;padding:5px 9px;font-size:.78rem;font-weight:700}.array-motivation-note{font-size:.88rem!important;color:#5f6368!important;margin-bottom:0!important}.array-motivation-media{min-width:0}.array-motivation-media video{display:block;width:100%;aspect-ratio:16/9;background:#000;border:1px solid #dadce0;border-radius:10px;object-fit:contain}
@media(max-width:980px){.array-motivation-card{grid-template-columns:1fr}.array-motivation-media{order:-1}}
@media(max-width:600px){.array-motivation-card{padding:14px;gap:15px}.array-motivation-copy h3{font-size:1.14rem}}
'''.strip()


def integrate(index_path: Path, css_path: Path) -> None:
    html = index_path.read_text(encoding="utf-8")
    css = css_path.read_text(encoding="utf-8")

    if HTML_MARKER not in html:
        anchor = '\n        <div class="grading-policy">'
        if anchor not in html:
            raise RuntimeError("Could not find grading-policy anchor in workshop HTML")
        html = html.replace(anchor, "\n" + CARD + "\n\n        <div class=\"grading-policy\">", 1)

    # Always bump the dedicated class stylesheet query string so the new card
    # styling is not hidden by an older browser/service-worker cache entry.
    html = re.sub(
        r'class1-v10\.css\?v=[^"\']+',
        'class1-v10.css?v=20260826-arrays-motivation-v1',
        html,
        count=1,
    )

    if CSS_MARKER not in css:
        css = css.rstrip() + "\n\n" + CSS + "\n"

    index_path.write_text(html, encoding="utf-8")
    css_path.write_text(css, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: integrate_workshop.py <index.html> <class1.css>")
        raise SystemExit(2)
    integrate(Path(sys.argv[1]), Path(sys.argv[2]))
    print("PASS: workshop video card integration is present and idempotent")
