#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate a reproducible synthetic large classroom dataset for the Class 4 V2 demo.

The generated file is intentionally NOT committed to GitHub. It exists only when
a teacher wants to reproduce the 1,000,000-row Colab demonstration.

Usage:
    python generate_estudiantes_big.py --rows 1000000 --output estudiantes_big.csv
"""
from __future__ import annotations

import argparse
import csv
from pathlib import Path

BASE = [
    ("17", "4.2", "0.96", "6.5"),
    ("16", "3.8", "0.88", "4.0"),
    ("17", "3.5", "0.91", "3.5"),
    ("16", "4.0", "0.94", "5.5"),
    ("17", "2.9", "0.78", "2.5"),
    ("16", "3.8", "0.90", "4.2"),
    ("17", "4.5", "0.97", "7.0"),
    ("16", "3.2", "0.84", "3.0"),
    ("17", "1.8", "0.71", "1.5"),
    ("16", "3.8", "0.92", "4.8"),
]


def generate(rows: int, output: Path) -> None:
    if rows <= 0:
        raise ValueError("rows must be positive")

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            ["student_id", "age", "grade", "attendance", "study_hours", "passed"]
        )
        for i in range(rows):
            age, grade, attendance, study_hours = BASE[i % len(BASE)]
            writer.writerow(
                [
                    i + 1,
                    age,
                    grade,
                    attendance,
                    study_hours,
                    float(grade) >= 3.0,
                ]
            )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=1_000_000)
    parser.add_argument("--output", type=Path, default=Path("estudiantes_big.csv"))
    args = parser.parse_args()
    generate(args.rows, args.output)
    print(f"generated {args.rows:,} rows -> {args.output}")


if __name__ == "__main__":
    main()
