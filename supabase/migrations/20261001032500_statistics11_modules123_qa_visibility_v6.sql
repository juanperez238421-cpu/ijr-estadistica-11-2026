-- Statistics 11 · Modules 01–03 Evaluation V6
-- Keep the dedicated QA account explicitly flagged as QA early access
-- through the full 11A evaluation window so the UI remains stable while
-- production behavior is validated. No other account receives this override.

update private.python_hub_eval_early_access
set enabled=true,
    expires_at='2026-10-01 12:45:00-05'::timestamptz
where evaluation_slug='modules-1-3-2026-10-01'
  and institutional_email='qa.student11@ijr.edu.co';
