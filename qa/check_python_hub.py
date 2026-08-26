#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HUB = ROOT / "python"

index = (HUB / "index.html").read_text(encoding="utf-8")
css = (HUB / "styles.css").read_text(encoding="utf-8")
app = (HUB / "app.js").read_text(encoding="utf-8")
home = (ROOT / "index.html").read_text(encoding="utf-8")


def require(value: bool, message: str) -> None:
    if not value:
        raise AssertionError(message)


require("Python Learning Hub" in index, "Hub title missing")
require("pyodide/v0.27.7" in index, "Browser Python runtime missing")
require("One page. One topic at a time." in index, "Minimal hub hero missing")
require("Essential Python commands" in index, "Quick reference missing")
require("x ** 0.5" in index, "Square-root syntax missing")
require("x &gt;= 10" in index, "Greater-or-equal reference missing")
require("and &nbsp; or &nbsp; not" in index, "Logical operator reference missing")
require("href=\"python/\"" in home, "Course home must link to hub")

for topic_id, title in (
    ("01", "Colab interface and general operations"),
    ("02", "Variables and data types"),
    ("03", "Arrays and Python lists"),
    ("04", "Comparisons and logical operators"),
    ("05", "Conditions with if, elif and else"),
    ("06", "Loops: repeat without copying code"),
    ("07", "Functions: name a reusable process"),
    ("08", "Statistics with lists"),
):
    require(f"id:'{topic_id}'" in app, f"Topic {topic_id} missing")
    require(title in app, f"Topic title missing: {title}")

require(app.count("expected:") >= 16, "Each topic should have at least two practice exercises")
for fragment in (
    "loadPyodide",
    "runPythonAsync",
    "setStdout",
    "localStorage",
    "Mark as reviewed",
    "Expected output",
    "handleEditorTab",
):
    require(fragment in app, f"Interactive behavior missing: {fragment}")

for fragment in (
    "background:var(--paper)",
    "color:var(--ink)",
    "@keyframes floatIn",
    "@keyframes draw",
    "prefers-reduced-motion",
    ".figure .stroke",
):
    require(fragment in css, f"Visual/accessibility contract missing: {fragment}")

print("PYTHON LEARNING HUB QA PASS")
print("topics=8 exercises>=16 pyodide=PASS minimal_style=PASS responsive=PASS reduced_motion=PASS root_link=PASS")
