#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
import uuid
from collections import Counter

import requests

SLUG = "statistics11-counting-permutations-2026"
TOPIC_EXPECTED = {"FCP": 500, "P_SIMPLE": 500, "P_DIST": 500, "P_CIRC": 500}
ROSTER_EXPECTED = {"11A": 18, "11B": 20, "11C": 23}
QUESTIONS_PER_STUDENT = 18
INITIAL_SOURCE_KEY = "calificar_statistics11_2026_08_07"
REPORT_EMAIL = "juanperez238421@gmail.com"


def headers(key: str, count: bool = False):
    h = {"apikey": key, "Authorization": f"Bearer {key}"}
    if count:
        h["Prefer"] = "count=exact"
    return h


def get(url, key, table, params=None, range_header=None):
    h = headers(key)
    if range_header:
        h["Range"] = range_header
    r = requests.get(f"{url.rstrip('/')}/rest/v1/{table}", headers=h, params=params, timeout=60)
    if not r.ok:
        raise RuntimeError(f"GET {table}: {r.status_code} {r.text[:1000]}")
    return r.json()


def count(url, key, table, params=None):
    h = headers(key, True)
    h["Range"] = "0-0"
    p = {"select": "*", **(params or {})}
    r = requests.get(f"{url.rstrip('/')}/rest/v1/{table}", headers=h, params=p, timeout=60)
    if not r.ok:
        raise RuntimeError(f"COUNT {table}: {r.status_code} {r.text[:1000]}")
    cr = r.headers.get("content-range", "")
    if "/" not in cr:
        raise RuntimeError(f"No content-range for {table}")
    return int(cr.split("/")[-1])


def rpc_exists(url: str, key: str, name: str, payload: dict) -> tuple[bool, str]:
    r = requests.post(
        f"{url.rstrip('/')}/rest/v1/rpc/{name}",
        headers={**headers(key), "Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )
    text = r.text[:800]
    missing = r.status_code == 404 or "PGRST202" in text or "Could not find the function" in text
    return (not missing), f"HTTP {r.status_code}: {text}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--service-role-key", required=True)
    ap.add_argument("--expected-status", default=None)
    ap.add_argument("--require-teacher", action="store_true")
    args = ap.parse_args()
    url = args.url
    key = args.service_role_key
    errors: list[str] = []

    assessments = get(url, key, "assessments", {
        "slug": f"eq.{SLUG}",
        "select": "id,slug,status,duration_minutes,questions_per_student,max_raw_points,passing_grade,globally_disjoint,tab_strike_limit",
    })
    if len(assessments) != 1:
        raise SystemExit(f"Expected one assessment, found {len(assessments)}")
    a = assessments[0]

    if args.expected_status and a["status"] != args.expected_status:
        errors.append(f"status={a['status']} expected={args.expected_status}")
    if a["duration_minutes"] != 40:
        errors.append("duration_minutes must be 40")
    if a["questions_per_student"] != 18:
        errors.append("questions_per_student must be 18")
    if float(a["max_raw_points"]) != 15:
        errors.append("max_raw_points must be 15")
    if float(a["passing_grade"]) != 3:
        errors.append("passing_grade must be 3")
    if not a["globally_disjoint"]:
        errors.append("globally_disjoint must be true")
    if a["tab_strike_limit"] != 3:
        errors.append("tab_strike_limit must be 3")

    qtotal = count(url, key, "questions_private", {"active": "eq.true"})
    if qtotal < 2000:
        errors.append(f"active question count={qtotal}; expected>=2000")
    topic_counts = {
        t: count(url, key, "questions_private", {"active": "eq.true", "topic_code": f"eq.{t}"})
        for t in TOPIC_EXPECTED
    }
    for topic, minimum in TOPIC_EXPECTED.items():
        if topic_counts[topic] < minimum:
            errors.append(f"{topic}={topic_counts[topic]}; expected>={minimum}")

    roster_counts = {
        group: count(url, key, "student_registry", {"active": "eq.true", "group_code": f"eq.{group}"})
        for group in ROSTER_EXPECTED
    }
    for group, expected in ROSTER_EXPECTED.items():
        if roster_counts[group] < expected:
            errors.append(f"roster {group}={roster_counts[group]}; expected>={expected}")
    roster_total = sum(roster_counts.values())
    if roster_total < 61:
        errors.append(f"roster total={roster_total}; expected>=61")

    # Fail if the new private audit columns are not queryable.
    try:
        get(url, key, "attempts", {"select": "id,student_email,student_email_normalized", "limit": "1"})
    except RuntimeError as exc:
        errors.append(f"student email audit columns unavailable: {exc}")

    source_rows = get(url, key, "academic_sources", {
        "source_key": f"eq.{INITIAL_SOURCE_KEY}",
        "select": "id,source_key,source_system,source_date",
    })
    if len(source_rows) != 1:
        errors.append(f"initial academic source rows={len(source_rows)}; expected=1")
        source_record_count = 0
    else:
        source_record_count = count(url, key, "academic_records", {"source_id": f"eq.{source_rows[0]['id']}"})
        if source_record_count < 61:
            errors.append(f"initial academic records={source_record_count}; expected>=61")

    assignments = get(
        url,
        key,
        "assignments",
        {"assessment_id": f"eq.{a['id']}", "select": "student_id,question_id,question_order"},
        "0-4999",
    )
    by_student = Counter(x["student_id"] for x in assignments)
    bad_students = {s: n for s, n in by_student.items() if n != QUESTIONS_PER_STUDENT}
    if bad_students:
        errors.append(f"students without 18 assignments: {bad_students}")
    qids = [x["question_id"] for x in assignments]
    if len(qids) != len(set(qids)):
        errors.append("assignment question reuse detected")
    production_students = [s for s in by_student if not s.startswith("TEST-")]
    if len(production_students) > 100:
        errors.append(f"strict capacity exceeded: {len(production_students)} students > 100")

    report_settings = get(url, key, "assessment_report_settings", {
        "assessment_id": f"eq.{a['id']}",
        "select": "recipient_email,enabled",
    })
    if len(report_settings) != 1 or report_settings[0]["recipient_email"] != REPORT_EMAIL or not report_settings[0]["enabled"]:
        errors.append(f"report email is not configured as {REPORT_EMAIL}")

    rpc_probes = {
        "student_start_attempt_v2": {
            "p_assessment_slug": SLUG,
            "p_student_name": "BACKEND PROBE",
            "p_student_email": "probe@example.invalid",
            "p_group_code": "INVALID",
            "p_session_id": str(uuid.uuid4()),
            "p_user_agent": "readiness-probe",
        },
        "student_resume_attempt": {"p_attempt_id": str(uuid.uuid4()), "p_attempt_token": "probe"},
        "student_submit_answer": {"p_attempt_id": str(uuid.uuid4()), "p_attempt_token": "probe", "p_question_id": "PROBE", "p_selected_option": "A"},
        "student_log_event": {"p_attempt_id": str(uuid.uuid4()), "p_attempt_token": "probe", "p_question_id": None, "p_event_type": "PROBE"},
        "student_finish_attempt": {"p_attempt_id": str(uuid.uuid4()), "p_attempt_token": "probe", "p_reason": "probe"},
        "teacher_code_login": {"p_code": "0000", "p_user_agent": "readiness-probe"},
        "teacher_dashboard_snapshot": {"p_teacher_token": "probe", "p_assessment_slug": SLUG},
        "teacher_attempt_detail": {"p_teacher_token": "probe", "p_attempt_id": str(uuid.uuid4())},
        "teacher_code_action": {"p_teacher_token": "probe", "p_assessment_slug": SLUG, "p_action": "PROBE", "p_attempt_id": None},
        "teacher_start_smoke_test": {"p_teacher_token": "probe", "p_assessment_slug": SLUG, "p_group_code": "11A", "p_session_id": str(uuid.uuid4()), "p_user_agent": "readiness-probe"},
    }
    rpc_status = {}
    for name, payload in rpc_probes.items():
        exists, diagnostic = rpc_exists(url, key, name, payload)
        rpc_status[name] = {"exists": exists, "diagnostic": diagnostic}
        if not exists:
            errors.append(f"RPC missing from PostgREST schema cache: {name}")

    if args.require_teacher and not rpc_status["teacher_code_login"]["exists"]:
        errors.append("teacher code mode is unavailable")

    report = {
        "ready": not errors,
        "assessment": a,
        "question_count": qtotal,
        "topic_counts": topic_counts,
        "roster_counts": roster_counts,
        "roster_total": roster_total,
        "student_email_capture": rpc_status["student_start_attempt_v2"]["exists"],
        "academic_source": INITIAL_SOURCE_KEY,
        "academic_source_record_count": source_record_count,
        "assigned_students": len(production_students),
        "assignment_rows": len(assignments),
        "global_unique_assignment_questions": len(set(qids)),
        "report_email": REPORT_EMAIL,
        "rpc_status": rpc_status,
        "errors": errors,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if errors:
        sys.exit(2)


if __name__ == "__main__":
    main()
