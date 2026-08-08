begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  student_id text unique,
  full_name text,
  group_code text check (group_code in ('11A','11B','11C') or group_code is null),
  role text not null default 'student' check (role in ('student','teacher','admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft','scheduled','open','paused','closed','released')),
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer not null default 40,
  questions_per_student integer not null default 18,
  max_raw_points numeric(6,2) not null default 15,
  grade_min numeric(4,2) not null default 1,
  grade_max numeric(4,2) not null default 5,
  passing_grade numeric(4,2) not null default 3,
  globally_disjoint boolean not null default true,
  require_fullscreen boolean not null default true,
  tab_strike_limit integer not null default 3,
  release_solutions boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.questions_private (
  id text primary key,
  topic_code text not null,
  difficulty integer not null check (difficulty between 1 and 3),
  prompt_es text not null,
  prompt_en text,
  options jsonb not null,
  correct_answer text not null,
  formula_latex text,
  solution_steps_es jsonb,
  solution_steps_en jsonb,
  diagram jsonb,
  fingerprint text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id text not null,
  question_id text not null references public.questions_private(id),
  question_order integer not null,
  option_order jsonb,
  created_at timestamptz not null default now(),
  unique (assessment_id, student_id, question_order),
  unique (assessment_id, student_id, question_id),
  unique (assessment_id, question_id)
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  auth_user_id uuid not null references auth.users(id) on delete restrict,
  student_id text not null,
  group_code text not null,
  session_id uuid not null,
  status text not null default 'active' check (status in ('created','active','paused','submitted','force_submitted','auto_invalidated','invalidated')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_activity_at timestamptz not null default now(),
  submitted_at timestamptz,
  raw_points numeric(6,2),
  grade numeric(4,2),
  correct_count integer,
  incorrect_count integer,
  answered_count integer not null default 0,
  integrity_strikes integer not null default 0,
  ip_hash text,
  user_agent text,
  finish_reason text,
  created_at timestamptz not null default now(),
  unique (assessment_id, student_id)
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id text not null references public.questions_private(id),
  question_order integer not null,
  displayed_option_order jsonb not null,
  first_viewed_at timestamptz not null default now(),
  first_selected_at timestamptz,
  submitted_at timestamptz,
  selected_option text,
  selection_changes integer not null default 0,
  response_time_ms integer,
  is_correct boolean,
  server_received_at timestamptz,
  unique(attempt_id,question_id),
  unique(attempt_id,question_order)
);

create table if not exists public.attempt_events (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  student_id text not null,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  question_id text,
  event_sequence bigint not null,
  event_type text not null,
  client_timestamp timestamptz,
  server_timestamp timestamptz not null default now(),
  elapsed_ms integer,
  visibility_state text,
  fullscreen_state boolean,
  metadata jsonb not null default '{}'::jsonb,
  prev_event_hash text,
  event_hash text not null,
  unique(attempt_id,event_sequence)
);

create table if not exists public.teacher_actions (
  id bigint generated always as identity primary key,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  attempt_id uuid references public.attempts(id) on delete cascade,
  teacher_user_id uuid not null references auth.users(id),
  action_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_attempt_events_attempt on public.attempt_events(attempt_id,server_timestamp);
create index if not exists idx_attempts_assessment on public.attempts(assessment_id,status);
create index if not exists idx_responses_attempt on public.responses(attempt_id,question_order);
create index if not exists idx_assignments_student on public.assignments(assessment_id,student_id,question_order);

create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles p where p.auth_user_id=auth.uid() and p.role in ('teacher','admin') and p.active=true);
$$;

alter table public.profiles enable row level security;
alter table public.assessments enable row level security;
alter table public.questions_private enable row level security;
alter table public.assignments enable row level security;
alter table public.attempts enable row level security;
alter table public.responses enable row level security;
alter table public.attempt_events enable row level security;
alter table public.teacher_actions enable row level security;

create policy "profile self read" on public.profiles for select using (auth_user_id=auth.uid() or public.is_teacher());
create policy "teacher profiles write" on public.profiles for all using (public.is_teacher()) with check (public.is_teacher());
create policy "authenticated assessments read" on public.assessments for select to authenticated using (true);
create policy "teacher assessments write" on public.assessments for all using (public.is_teacher()) with check (public.is_teacher());
create policy "teacher private questions read" on public.questions_private for select using (public.is_teacher());
create policy "teacher private questions write" on public.questions_private for all using (public.is_teacher()) with check (public.is_teacher());
create policy "teacher assignments read" on public.assignments for select using (public.is_teacher());
create policy "teacher assignments write" on public.assignments for all using (public.is_teacher()) with check (public.is_teacher());
create policy "attempt owner read" on public.attempts for select using (auth_user_id=auth.uid() or public.is_teacher());
create policy "teacher attempts write" on public.attempts for all using (public.is_teacher()) with check (public.is_teacher());
create policy "responses owner read" on public.responses for select using (exists(select 1 from public.attempts a where a.id=attempt_id and (a.auth_user_id=auth.uid() or public.is_teacher())));
create policy "teacher responses write" on public.responses for all using (public.is_teacher()) with check (public.is_teacher());
create policy "events owner read" on public.attempt_events for select using (exists(select 1 from public.attempts a where a.id=attempt_id and (a.auth_user_id=auth.uid() or public.is_teacher())));
create policy "teacher events read" on public.attempt_events for select using (public.is_teacher());
create policy "teacher actions read" on public.teacher_actions for select using (public.is_teacher());
create policy "teacher actions write" on public.teacher_actions for insert with check (public.is_teacher() and teacher_user_id=auth.uid());

insert into public.assessments(slug,title,status,duration_minutes,questions_per_student,max_raw_points,grade_min,grade_max,passing_grade,globally_disjoint,require_fullscreen,tab_strike_limit)
values('statistics11-counting-permutations-2026','Statistics 11 · Counting & Permutations','draft',40,18,15,1,5,3,true,true,3)
on conflict(slug) do nothing;

commit;
