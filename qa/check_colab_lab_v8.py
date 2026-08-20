#!/usr/bin/env python3
"""Static + curriculum QA gate for Statistics 11 Colab Lab 01 V8."""
from __future__ import annotations

import ast
import csv
import io
import re
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "actividad-colab-01" / "app.js").read_text(encoding="utf-8")
INDEX = (ROOT / "actividad-colab-01" / "index.html").read_text(encoding="utf-8")
CONFIG = (ROOT / "actividad-colab-01" / "config.js").read_text(encoding="utf-8")
DATA = ROOT / "actividad-colab-01" / "data.csv"
MIGRATION = ROOT / "supabase" / "migrations" / "20260819223500_colab_v8_python_basics_40min.sql"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


# 1) Pacing must genuinely occupy one class period.
minute_pairs = re.findall(r"\b(A[1-8]):\{minutes:(\d+)", APP)
require([key for key, _ in minute_pairs] == [f"A{i}" for i in range(1, 9)], f"Unexpected lesson keys/minutes: {minute_pairs}")
minutes = [int(value) for _, value in minute_pairs]
require(35 <= sum(minutes) <= 40, f"Guided lesson time must be 35–40 min, got {sum(minutes)}")
require(sum(minutes) == 39, f"V8 pacing contract is 39 guided minutes, got {sum(minutes)}")
require("39 GUIDED MIN" in INDEX, "Student landing page must disclose the 39-minute guided plan")
require("targetMinutes: 40" in CONFIG, "Overall class timer must stay at 40 minutes")

# 2) Basic command coverage. This is the minimum command vocabulary for Lab 01.
required_fragments = {
    "assignment": "a = WRITE_HERE",
    "print": "print(\"type of a:\", type(a))",
    "type": "type(a)",
    "addition": "a + b",
    "subtraction": "a - b",
    "multiplication": "a * b",
    "division": "a / b",
    "power": "a ** 2",
    "string": 'label = "scores"',
    "list indexing first": "numbers[0]",
    "list indexing last": "numbers[-1]",
    "len": "len(numbers)",
    "for loop": "for value in numbers:",
    "accumulator": "total = total + value",
    "function": "def mean(values):",
    "return": "return total / count",
    "import": "import pandas as pd",
    "read_csv": 'pd.read_csv("data.csv")',
    "head": "df.head(3)",
    "columns": "df.columns.tolist()",
    "dtypes": "df.dtypes",
    "shape": "df.shape[0]",
    "series": 'df["score"]',
    "mean": "scores.mean()",
    "describe": "scores.describe()",
    "boolean comparison": 'df["score"] >= 4',
    "filter": "df[condition]",
    "if": "if passed_count >= 8:",
    "else": "else:",
}
for label, fragment in required_fragments.items():
    require(fragment in APP, f"Missing required Python concept: {label} -> {fragment}")

require(APP.count("requirements:[") == 8, "Every stage must have a required-command structure gate")
require(APP.count("WRITE_HERE") >= 24, "V8 must require multiple student edits, not one-line stages")
require("guided-v8" in APP, "Telemetry must identify the V8 workspace")

# 3) The visible roadmap must match the curriculum.
for fragment in ("print()", "type()", "len()", "for", "def", "if", "Pandas", "describe"):
    require(fragment in INDEX, f"Landing-page command roadmap is missing {fragment}")
require("resilience-v7.js" in INDEX, "Nine-PC resilience layer must remain enabled")
require("requireFullscreen: false" in CONFIG, "Fullscreen must remain optional")

# 4) Parse all eight revealed Python solutions as valid Python syntax.
solution_pairs = re.findall(r"\b(A[1-8]):\{.*?solution:`(.*?)`\}", APP, flags=re.S)
require(len(solution_pairs) == 8, f"Expected 8 solution blocks, found {len(solution_pairs)}")
solutions: dict[str, str] = {}
for key, encoded in solution_pairs:
    code = encoded.replace("\\n", "\n")
    ast.parse(code, filename=f"{key}-solution.py")
    solutions[key] = code

# 5) Execute the pure-Python half and verify the existing backend answers remain valid.
pure_expected = {"A1": 17.0, "A2": 60.0, "A3": 5.0, "A4": 54.0, "A5": 10.8}
for key, expected in pure_expected.items():
    namespace: dict[str, object] = {}
    stream = io.StringIO()
    with redirect_stdout(stream):
        exec(compile(solutions[key], f"{key}-solution.py", "exec"), namespace, namespace)
    lines = [line.strip() for line in stream.getvalue().splitlines() if line.strip()]
    require(lines, f"{key} solution produced no output")
    actual = float(lines[-1])
    require(abs(actual - expected) < 1e-9, f"{key} final output changed: expected {expected}, got {actual}")

# 6) Independently verify the CSV-dependent backend answers without needing Pandas in CI.
with DATA.open(newline="", encoding="utf-8") as fh:
    rows = list(csv.DictReader(fh))
require(len(rows) == 12, f"A6 expected 12 rows, got {len(rows)}")
scores = [float(row["score"]) for row in rows]
require(abs(sum(scores) / len(scores) - 4.0) < 1e-9, "A7 expected score mean 4.0")
require(sum(score >= 4 for score in scores) == 9, "A8 expected 9 scores >= 4")

# 7) Backend metadata migration must not alter scoring/expected answers.
require(MIGRATION.exists(), "V8 checkpoint metadata migration is missing")
migration_text = MIGRATION.read_text(encoding="utf-8")
require(not re.search(r"set\s+expected_text\s*=", migration_text, re.I), "V8 must not change checkpoint expected answers")
require(not re.search(r"set\s+points\s*=", migration_text, re.I), "V8 must not change checkpoint points")
require("statistics11-colab-basics-01-2026" in migration_text, "Migration must target the existing Lab 01 activity")

print("COLAB V8 QA PASS")
print(f"stages=8 guided_minutes={sum(minutes)} total_timer=40")
print("basic_commands=PASS python_solutions=PASS dataset_answers=PASS resilience=PASS scoring_unchanged=PASS")
