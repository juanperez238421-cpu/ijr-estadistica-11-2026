"""Runtime bridge to the canonical reconstructed JP classroom style.

Manim adds the scene's src/ directory to sys.path. This module therefore lives
under src/library and loads the canonical project-level library file that the
render workflow reconstructs from the existing style fragments.
"""

from __future__ import annotations

import importlib.util
from pathlib import Path

_STYLE_PATH = Path(__file__).resolve().parents[2] / "library" / "jp_classroom_style.py"
_spec = importlib.util.spec_from_file_location("_jp_classroom_style_canonical", _STYLE_PATH)
if _spec is None or _spec.loader is None:
    raise ImportError(f"Could not load JP classroom style from {_STYLE_PATH}")
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)

for _name in dir(_module):
    if not _name.startswith("_"):
        globals()[_name] = getattr(_module, _name)
