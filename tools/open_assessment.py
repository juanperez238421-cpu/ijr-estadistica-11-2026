#!/usr/bin/env python3
from __future__ import annotations
import argparse, datetime as dt, json, subprocess, sys
import requests

SLUG='statistics11-counting-permutations-2026'


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--url',required=True)
    ap.add_argument('--service-role-key',required=True)
    ap.add_argument('--close-at',default=None,help='ISO-8601 closing timestamp; optional')
    args=ap.parse_args()

    cmd=[sys.executable,'tools/check_backend_readiness.py','--url',args.url,'--service-role-key',args.service_role_key,'--expected-status','draft','--require-teacher']
    subprocess.run(cmd,check=True)

    now=dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()
    payload={'status':'open','starts_at':now}
    if args.close_at: payload['ends_at']=args.close_at
    headers={'apikey':args.service_role_key,'Authorization':f'Bearer {args.service_role_key}','Content-Type':'application/json','Prefer':'return=representation'}
    r=requests.patch(f"{args.url.rstrip('/')}/rest/v1/assessments",headers=headers,params={'slug':f'eq.{SLUG}'},json=payload,timeout=60)
    if not r.ok: raise SystemExit(f'Failed to open assessment: {r.status_code} {r.text[:1000]}')
    rows=r.json()
    if len(rows)!=1: raise SystemExit(f'Expected one updated assessment, got {len(rows)}')
    print(json.dumps({'opened':True,'assessment':rows[0]},ensure_ascii=False,indent=2))

if __name__=='__main__': main()
