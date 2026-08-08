#!/usr/bin/env python3
"""Import the private Statistics 11 bank into Supabase and create globally disjoint 18-question assignments.

Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  python tools/import_secure_statistics11_assessment.py \
    --bank /path/to/question_bank.json --roster roster.csv

The service-role key is local/admin only. Never commit it and never place it in GitHub Pages JavaScript.
"""
from __future__ import annotations
import argparse,csv,json,os,random,sys
from collections import defaultdict
from pathlib import Path
import requests

SLUG="statistics11-counting-permutations-2026"
QUOTAS={"FCP":5,"P_SIMPLE":5,"P_DIST":4,"P_CIRC":4}

def api(method,path,payload=None,params=None,prefer=None):
    url=os.environ["SUPABASE_URL"].rstrip("/")+"/rest/v1/"+path
    key=os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    headers={"apikey":key,"Authorization":f"Bearer {key}","Content-Type":"application/json"}
    if prefer: headers["Prefer"]=prefer
    r=requests.request(method,url,headers=headers,json=payload,params=params,timeout=60)
    if not r.ok: raise RuntimeError(f"{method} {path}: {r.status_code} {r.text[:1000]}")
    return r.json() if r.text.strip() else None

def load_bank(path):
    data=json.loads(Path(path).read_text(encoding="utf-8")); qs=data.get("questions",data)
    out=[]
    for q in qs:
        out.append({"id":q["id"],"topic_code":q["topic_code"],"difficulty":q["difficulty"],"prompt_es":q["prompt_es"],"prompt_en":q.get("prompt_en"),"options":q["options"],"correct_answer":str(q["correct_answer"]),"formula_latex":q.get("formula_latex"),"solution_steps_es":q.get("solution_steps_es"),"solution_steps_en":q.get("solution_steps_en"),"diagram":q.get("diagram"),"fingerprint":q.get("fingerprint"),"active":True})
    return out

def load_roster(path):
    rows=list(csv.DictReader(Path(path).open(encoding="utf-8-sig")))
    clean=[]
    for r in rows:
        sid=(r.get("student_id") or r.get("codigo") or "").strip().upper(); group=(r.get("group") or r.get("group_code") or r.get("grupo") or "").strip().upper()
        if not sid or group not in {"11A","11B","11C"}: raise ValueError(f"Invalid roster row: {r}")
        clean.append({"student_id":sid,"group_code":group})
    if len({r['student_id'] for r in clean})!=len(clean): raise ValueError("Duplicate student_id in roster")
    return clean

def chunks(seq,n=200):
    for i in range(0,len(seq),n): yield seq[i:i+n]

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--bank",required=True);ap.add_argument("--roster",required=True);ap.add_argument("--seed",type=int,default=11082026);args=ap.parse_args()
    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_ROLE_KEY"): sys.exit("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    bank=load_bank(args.bank); roster=load_roster(args.roster); required=len(roster)*sum(QUOTAS.values())
    print(f"Bank={len(bank)} students={len(roster)} required={required}")
    if len(bank)<required:
        raise SystemExit(f"Insufficient globally-disjoint bank: need {required}, have {len(bank)}. At 18 questions the 1600-item bank supports at most {len(bank)//18} students. Expand the private bank before importing.")
    by_topic=defaultdict(list)
    for q in bank: by_topic[q["topic_code"]].append(q)
    for t,q in QUOTAS.items():
        need=len(roster)*q
        if len(by_topic[t])<need: raise SystemExit(f"Topic {t} needs {need}, has {len(by_topic[t])}. Expand this topic.")
    for batch in chunks(bank): api("POST","questions_private",batch,prefer="resolution=merge-duplicates")
    assessment=api("GET","assessments",params={"slug":f"eq.{SLUG}","select":"id,questions_per_student"})[0]
    rng=random.Random(args.seed)
    pools={t:[q["id"] for q in items] for t,items in by_topic.items()}
    for p in pools.values(): rng.shuffle(p)
    assignments=[]
    for student in roster:
        selected=[]
        for topic,n in QUOTAS.items(): selected.extend((topic,pools[topic].pop()) for _ in range(n))
        rng.shuffle(selected)
        for order,(_,qid) in enumerate(selected,1):
            option_order=[0,1,2,3];rng.shuffle(option_order)
            assignments.append({"assessment_id":assessment["id"],"student_id":student["student_id"],"question_id":qid,"question_order":order,"option_order":option_order})
    ids=[x["question_id"] for x in assignments]
    assert len(ids)==len(set(ids)),"Global question reuse detected"
    api("DELETE","assignments",params={"assessment_id":f"eq.{assessment['id']}"})
    for batch in chunks(assignments): api("POST","assignments",batch)
    print(json.dumps({"assessment_id":assessment["id"],"students":len(roster),"assignments":len(assignments),"global_unique_questions":len(set(ids)),"quotas":QUOTAS,"seed":args.seed},indent=2))

if __name__=="__main__": main()
