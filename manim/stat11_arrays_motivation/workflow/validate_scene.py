#!/usr/bin/env python3
"""Static pre-render checks for the Statistics 11 arrays-motivation scene."""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path


REQUIRED_SNIPPETS = [
    "class Stat11ArraysMotivation(JPMathClassroomScene)",
    "def validate_lesson_data",
    "self.set_header(",
    "self.clear_stage(",
    "self.assert_content_safe(",
    "scores = [4.2, 3.8, 4.5, 3.2, 4.0]",
    "temperatures = [22.1, 22.8, 23.0, 22.6]",
    "heights = [161, 168, 173, 159, 176, 170]",
]

FORBIDDEN_CONCEPTS = [
    r"\bfor\s+\w+\s+in\s+",  # lesson code shown to students must not require loops
    r"\bwhile\s+",
    r"\bif\s+.*:",
    r"\bimport\s+numpy\b",
    r"\bimport\s+pandas\b",
]

ABSOLUTE_PATHS = [
    re.compile(r"[A-Za-z]:[\\/]"),
    re.compile(r"/Users/"),
    re.compile(r"/home/[^/]+/"),
]


def main(path_string: str) -> int:
    path = Path(path_string)
    if not path.is_file():
        print(f"FAIL: missing scene file: {path}")
        return 2

    source = path.read_text(encoding="utf-8")
    try:
        tree = ast.parse(source, filename=str(path))
    except SyntaxError as exc:
        print(f"FAIL: syntax error: {exc}")
        return 2

    failures: list[str] = []
    warnings: list[str] = []

    for snippet in REQUIRED_SNIPPETS:
        if snippet not in source:
            failures.append(f"required lesson element missing: {snippet}")

    for pattern in ABSOLUTE_PATHS:
        if pattern.search(source):
            failures.append("absolute system/user path detected")
            break

    # Search only literal strings passed to our displayed-code helper, not Python
    # implementation loops used to construct Manim objects.
    displayed_literals = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
            if node.func.attr == "code_panel" and node.args:
                arg = node.args[0]
                if isinstance(arg, ast.List):
                    displayed_literals.extend(
                        elt.value for elt in arg.elts
                        if isinstance(elt, ast.Constant) and isinstance(elt.value, str)
                    )
    displayed_code = "\n".join(displayed_literals)
    for pattern in FORBIDDEN_CONCEPTS:
        if re.search(pattern, displayed_code):
            failures.append(f"out-of-scope concept found in displayed learner code: {pattern}")

    # Structural checks.
    class_names = {node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)}
    if "Stat11ArraysMotivation" not in class_names:
        failures.append("scene class Stat11ArraysMotivation not found")

    section_methods = {
        "opening",
        "one_variable_one_value",
        "dataset_grows",
        "extract_the_need",
        "introduce_list",
        "indexing_bridge",
        "mini_workshop",
        "summary",
    }
    method_names = {
        node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)
    }
    missing = sorted(section_methods - method_names)
    if missing:
        failures.append("missing section methods: " + ", ".join(missing))

    if re.search(r"\b(?:RED|BLUE|GREEN)\b", source):
        warnings.append("colored emphasis detected; verify against monochrome style")

    print(f"STATIC SCENE QA: {path}")
    for message in failures:
        print(f"FAIL: {message}")
    for message in warnings:
        print(f"WARN: {message}")
    if failures:
        return 1
    print("PASS: syntax, lesson scope, portability, and structural checks")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: validate_scene.py <scene.py>")
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1]))
