-- Explicit user override: open the Modules 01-03 evaluation immediately for all groups.
-- Fixed one-shot dates ensure a later deploy does not reopen the examination.
update public.python_hub_eval_assessments
set allowed_groups=array['11A','11B','11C']::text[],status='scheduled'
where slug='modules-1-3-2026-10-01';

insert into public.python_hub_eval_windows(evaluation_id,group_code,opens_at,closes_at)
select a.id,w.group_code,w.opens_at,w.closes_at
from public.python_hub_eval_assessments a
cross join (values
 ('11A','2026-10-01 09:57:44.014496-05'::timestamptz,'2026-10-01 12:45:00-05'::timestamptz),
 ('11B','2026-10-01 09:57:44.014641-05'::timestamptz,'2026-10-01 13:40:00-05'::timestamptz),
 ('11C','2026-10-01 09:57:44.014653-05'::timestamptz,'2026-10-01 10:57:44.014653-05'::timestamptz)
) w(group_code,opens_at,closes_at)
where a.slug='modules-1-3-2026-10-01'
on conflict(evaluation_id,group_code) do update
set opens_at=excluded.opens_at,closes_at=excluded.closes_at;
