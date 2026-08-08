#!/usr/bin/env python3
"""Import an additional Statistics 11 academic snapshot into Supabase.

The canonical roster lives in public.student_registry. Each import creates or
updates one public.academic_sources row and upserts public.academic_records.

Expected CSV columns:
  group_code,student_name,definitiva_periodo,definitiva_por_area,
  acumulado_asig_ano,acumulado_seguimiento

Environment (admin machine only):
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Example:
  python tools/import_academic_source.py \
    --file snapshot.csv \
    --source-key calificar_statistics11_2026_08_21 \
    --source-system Calificar \
    --source-date 2026-08-21 \
    --title "Statistics 11 · Calificar · 2026-08-21"
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import re
import sys
import unicodedata
from pathlib import Path

import requests


def normalize_name(value: str) -> str:
    value = unicodedata.normalize("NFD", value or "")
    value = "".join(c for c in value if unicodedata.category(c) != "Mn")
    value = re.sub(r"[^A-Z0-9]+", " ", value.upper()).strip()
    return value


def parse_num(value: str | None):
    if value is None:
        return None
    text = str(value).strip().replace(",", ".")
    if text in {"", "-", "—", "NULL", "null", "None"}:
        return None
    return float(text)


class SupabaseRest:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL", "").rstrip("/")
        self.key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
        if not self.url or not self.key:
            raise SystemExit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }

    def request(self, method: str, table: str, *, params=None, payload=None, prefer=None):
        headers = dict(self.headers)
        if prefer:
            headers["Prefer"] = prefer
        r = requests.request(
            method,
            f"{self.url}/rest/v1/{table}",
            headers=headers,
            params=params,
            json=payload,
            timeout=60,
        )
        if not r.ok:
            raise RuntimeError(f"{method} {table}: {r.status_code} {r.text[:1200]}")
        return r.json() if r.text.strip() else None


def load_csv(path: Path):
    with path.open(encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    required = {"group_code", "student_name"}
    if not rows:
        raise SystemExit("Input CSV is empty")
    missing = required - set(rows[0])
    if missing:
        raise SystemExit(f"Missing required columns: {sorted(missing)}")
    return rows


def match_student(row, roster):
    group = str(row.get("group_code") or "").strip().upper()
    name = str(row.get("student_name") or "").strip()
    n = normalize_name(name)
    candidates = []
    for student in roster:
        if student["group_code"] != group or not student.get("active", True):
            continue
        stored = student["normalized_name"]
        if student.get("name_is_truncated"):
            if n.startswith(stored):
                candidates.append(student)
        elif n == stored:
            candidates.append(student)
    return candidates


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True, type=Path)
    ap.add_argument("--source-key", required=True)
    ap.add_argument("--source-system", required=True)
    ap.add_argument("--source-kind", default="grade_snapshot")
    ap.add_argument("--source-date", required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--description", default="Imported academic snapshot")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    rows = load_csv(args.file)
    api = SupabaseRest()
    roster = api.request(
        "GET",
        "student_registry",
        params={
            "select": "id,internal_key,group_code,display_name,normalized_name,name_is_truncated,active",
            "order": "group_code.asc,source_position.asc",
        },
    )

    matched = []
    unmatched = []
    ambiguous = []
    for row_no, row in enumerate(rows, 2):
        candidates = match_student(row, roster)
        if len(candidates) == 1:
            matched.append((row_no, row, candidates[0]))
        elif not candidates:
            unmatched.append({"row": row_no, "group": row.get("group_code"), "name": row.get("student_name")})
        else:
            ambiguous.append({
                "row": row_no,
                "group": row.get("group_code"),
                "name": row.get("student_name"),
                "matches": [x["display_name"] for x in candidates],
            })

    report = {
        "input_rows": len(rows),
        "matched": len(matched),
        "unmatched": unmatched,
        "ambiguous": ambiguous,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if unmatched or ambiguous:
        raise SystemExit("Import aborted: resolve unmatched/ambiguous roster rows first")
    if args.dry_run:
        return

    source_payload = {
        "source_key": args.source_key,
        "source_system": args.source_system,
        "source_kind": args.source_kind,
        "title": args.title,
        "source_date": args.source_date,
        "description": args.description,
        "metadata": {"import_file": args.file.name, "row_count": len(rows)},
    }
    api.request(
        "POST",
        "academic_sources",
        payload=source_payload,
        prefer="resolution=merge-duplicates,return=representation",
    )
    source = api.request(
        "GET",
        "academic_sources",
        params={"source_key": f"eq.{args.source_key}", "select": "id"},
    )[0]

    records = []
    for row_no, row, student in matched:
        records.append({
            "source_id": source["id"],
            "student_registry_id": student["id"],
            "definitiva_periodo": parse_num(row.get("definitiva_periodo")),
            "definitiva_por_area": parse_num(row.get("definitiva_por_area")),
            "acumulado_asig_ano": parse_num(row.get("acumulado_asig_ano")),
            "acumulado_seguimiento": parse_num(row.get("acumulado_seguimiento")),
            "raw_payload": {"source_row": row_no, "original": row},
        })

    for start in range(0, len(records), 200):
        api.request(
            "POST",
            "academic_records",
            payload=records[start:start + 200],
            prefer="resolution=merge-duplicates",
        )

    print(json.dumps({
        "source_key": args.source_key,
        "source_id": source["id"],
        "records_upserted": len(records),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
