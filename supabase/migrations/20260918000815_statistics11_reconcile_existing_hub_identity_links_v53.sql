-- Statistics 11 · reconcile existing Hub identity links v53
-- Mirrors production migration 20260918000815.
-- Idempotent catch-up for historical Hub rows that stored institutional email
-- but not student_registry_id. Only unique deterministic roster matches are applied.

create temporary table tmp_python_hub_email_roster_map on commit drop as
with source_emails as (
  select distinct lower(trim(m.institutional_email)) as email
  from public.python_hub_registration_members m
  where m.student_registry_id is null
    and split_part(lower(trim(m.institutional_email)),'@',2)='ijr.edu.co'
),
parts as (
  select
    email,
    regexp_replace(
      translate(split_part(split_part(email,'@',1),'.',1),'áéíóúüñ','aeiouun'),
      '[^a-z0-9]','','g'
    ) as p1,
    regexp_replace(
      translate(
        (string_to_array(split_part(email,'@',1),'.'))[
          array_length(string_to_array(split_part(email,'@',1),'.'),1)
        ],
        'áéíóúüñ','aeiouun'
      ),
      '[^a-z0-9]','','g'
    ) as p2
  from source_emails
),
roster as (
  select
    sr.id as student_registry_id,
    sr.group_code,
    sr.display_name,
    regexp_replace(
      translate(lower(sr.display_name),'áéíóúüñ','aeiouun'),
      '[^a-z0-9]','','g'
    ) as compact
  from public.student_registry sr
  where sr.active=true
    and sr.group_code in ('11A','11B','11C')
),
matches as (
  select p.email,r.student_registry_id,r.group_code,r.display_name
  from parts p
  join roster r
    on length(p.p1)>=3
   and length(p.p2)>=3
   and r.compact like '%'||p.p1||'%'
   and r.compact like '%'||p.p2||'%'
),
unique_matches as (
  select email,max(student_registry_id::text)::uuid as student_registry_id
  from matches
  group by email
  having count(distinct student_registry_id)=1
)
select u.email,u.student_registry_id,sr.group_code,sr.display_name
from unique_matches u
join public.student_registry sr on sr.id=u.student_registry_id;

select private.python_hub_ensure_student_identity_v29(
  m.email,
  m.display_name,
  m.student_registry_id
)
from tmp_python_hub_email_roster_map m;

update public.python_hub_registration_members rm
set student_registry_id = m.student_registry_id,
    display_name = m.display_name,
    student_identity_id = coalesce(
      rm.student_identity_id,
      (select i.id
       from public.python_hub_student_identities i
       where lower(trim(i.institutional_email))=m.email
       limit 1)
    )
from tmp_python_hub_email_roster_map m
where lower(trim(rm.institutional_email))=m.email
  and rm.student_registry_id is null;

update public.python_hub_workshop_session_members sm
set student_registry_id = m.student_registry_id,
    display_name = m.display_name,
    normalized_name = m.display_name,
    student_identity_id = coalesce(
      sm.student_identity_id,
      (select i.id
       from public.python_hub_student_identities i
       where lower(trim(i.institutional_email))=m.email
       limit 1)
    )
from tmp_python_hub_email_roster_map m
where lower(trim(coalesce(sm.institutional_email,sm.email_normalized,'')))=m.email
  and sm.student_registry_id is null;

update public.python_hub_student_accounts a
set student_registry_id = m.student_registry_id,
    display_name = m.display_name,
    group_code = m.group_code,
    identity_status = 'verified_roster',
    last_verified_at = clock_timestamp(),
    updated_at = clock_timestamp()
from tmp_python_hub_email_roster_map m
where lower(trim(a.institutional_email))=m.email
  and (a.student_registry_id is null or a.student_registry_id=m.student_registry_id);
