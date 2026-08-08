#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, sys
from collections import Counter
import requests

SLUG = "statistics11-counting-permutations-2026"
TOPIC_EXPECTED = {"FCP":500,"P_SIMPLE":500,"P_DIST":500,"P_CIRC":500}
QUESTIONS_PER_STUDENT = 18


def headers(key:str, count:bool=False):
    h={"apikey":key,"Authorization":f"Bearer {key}"}
    if count: h["Prefer"]="count=exact"
    return h


def get(url,key,table,params=None,range_header=None):
    h=headers(key)
    if range_header: h["Range"]=range_header
    r=requests.get(f"{url.rstrip('/')}/rest/v1/{table}",headers=h,params=params,timeout=60)
    if not r.ok: raise RuntimeError(f"GET {table}: {r.status_code} {r.text[:1000]}")
    return r.json()


def count(url,key,table,params=None):
    h=headers(key,True); h["Range"]="0-0"
    p={"select":"*",**(params or {})}
    r=requests.get(f"{url.rstrip('/')}/rest/v1/{table}",headers=h,params=p,timeout=60)
    if not r.ok: raise RuntimeError(f"COUNT {table}: {r.status_code} {r.text[:1000]}")
    cr=r.headers.get("content-range","")
    if "/" not in cr: raise RuntimeError(f"No content-range for {table}")
    return int(cr.split("/")[-1])


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--url",required=True)
    ap.add_argument("--service-role-key",required=True)
    ap.add_argument("--expected-status",default=None)
    ap.add_argument("--require-teacher",action="store_true")
    args=ap.parse_args()
    url=args.url; key=args.service_role_key

    assessments=get(url,key,"assessments",{"slug":f"eq.{SLUG}","select":"id,slug,status,duration_minutes,questions_per_student,max_raw_points,passing_grade,globally_disjoint,tab_strike_limit"})
    if len(assessments)!=1: raise SystemExit(f"Expected one assessment, found {len(assessments)}")
    a=assessments[0]
    errors=[]
    if args.expected_status and a["status"]!=args.expected_status: errors.append(f"status={a['status']} expected={args.expected_status}")
    if a["duration_minutes"]!=40: errors.append("duration_minutes must be 40")
    if a["questions_per_student"]!=18: errors.append("questions_per_student must be 18")
    if float(a["max_raw_points"])!=15: errors.append("max_raw_points must be 15")
    if float(a["passing_grade"])!=3: errors.append("passing_grade must be 3")
    if not a["globally_disjoint"]: errors.append("globally_disjoint must be true")
    if a["tab_strike_limit"]!=3: errors.append("tab_strike_limit must be 3")

    qtotal=count(url,key,"questions_private",{"active":"eq.true"})
    if qtotal!=2000: errors.append(f"active question count={qtotal}; expected=2000")
    topic_counts={t:count(url,key,"questions_private",{"active":"eq.true","topic_code":f"eq.{t}"}) for t in TOPIC_EXPECTED}
    for t,expected in TOPIC_EXPECTED.items():
        if topic_counts[t]!=expected: errors.append(f"{t}={topic_counts[t]}; expected={expected}")

    assignments=get(url,key,"assignments",{"assessment_id":f"eq.{a['id']}","select":"student_id,question_id,question_order"},"0-4999")
    by_student=Counter(x["student_id"] for x in assignments)
    bad_students={s:n for s,n in by_student.items() if n!=QUESTIONS_PER_STUDENT}
    if bad_students: errors.append(f"students without 18 assignments: {bad_students}")
    qids=[x["question_id"] for x in assignments]
    if len(qids)!=len(set(qids)): errors.append("assignment question reuse detected")
    if len(by_student)>100: errors.append(f"strict capacity exceeded: {len(by_student)} students > 100")

    teacher_count=count(url,key,"profiles",{"role":"in.(teacher,admin)","active":"eq.true"})
    if args.require_teacher and teacher_count<1: errors.append("no active teacher/admin profile")

    report={
        "ready":not errors,
        "assessment":a,
        "question_count":qtotal,
        "topic_counts":topic_counts,
        "assigned_students":len(by_student),
        "assignment_rows":len(assignments),
        "global_unique_assignment_questions":len(set(qids)),
        "active_teacher_admin_profiles":teacher_count,
        "errors":errors,
    }
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if errors: sys.exit(2)

if __name__=="__main__": main()
