-- Seminar 11 specialized diagnostic practical V6
-- 1) Normalize current V5 code-question line breaks stored as literal \n text.
-- 2) Allow audited practical terminal run events without changing the protected MCQ score.

update public.seminar_track_diagnostic_questions
set prompt = replace(prompt, E'\\n', E'\n')
where bank_version = '2026-09-16-v5'
  and position between 1 and 12
  and strpos(prompt, E'\\n') > 0;

alter table public.seminar_track_diagnostic_events
  drop constraint if exists seminar_track_diagnostic_events_event_type_check;

alter table public.seminar_track_diagnostic_events
  add constraint seminar_track_diagnostic_events_event_type_check
  check (event_type = any (array['STARTED'::text,'COMPLETED'::text,'RESUMED'::text,'PRACTICAL_RUN'::text]));
