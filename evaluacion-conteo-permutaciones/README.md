# Statistics 11 · Secure Counting & Permutations Assessment

## Production routes

- Student: `https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/`
- Teacher: `https://juanperez238421-cpu.github.io/ijr-estadistica-11-2026/evaluacion-conteo-permutaciones/teacher/`

## Production assessment

- 18 questions.
- 40 minutes.
- Maximum raw score: 15 points.
- Reported grade: 1.0–5.0.
- Passing grade: 3.0.
- Grade formula: `1 + 4 × correct/18`; therefore 9/18 = 3.0.
- Question quota: 5 FCP, 5 simple permutations, 4 distinguishable permutations, 4 circular permutations.
- Three confirmed tab-switch strikes automatically invalidate the attempt, with teacher audit/override possible.

## Student identification

The student-facing form no longer asks for a student code and no longer calls Supabase Anonymous Sign-In.

Students enter only:

1. group (`11A`, `11B`, or `11C`);
2. full name.

The backend validates the normalized name against the institutional `student_registry`. Source names that were truncated with `...` are kept exactly as supplied and matched by prefix; missing name characters are never guessed.

The error `Anonymous sign-ins are disabled` is therefore removed from the student flow.

After a valid roster match, PostgreSQL generates a random opaque attempt token. Only the SHA-256 hash is stored in the database. The browser keeps the raw token in session storage for the active attempt and must present it for every answer, event and finish request.

## Institutional roster and academic sources

The database now separates stable roster identity from academic snapshots:

- `student_registry`
- `academic_sources`
- `academic_records`

Current supplied roster:

- 11A: 18 students
- 11B: 20 students
- 11C: 23 students
- Total: 61 students

The initial academic source is stored as:

`calificar_statistics11_2026_08_07`

Blank values are stored as SQL `NULL`, not zero. Historical snapshots are additive: a new source creates a new `academic_sources` row and does not overwrite previous snapshots.

See `docs/ROSTER_AND_ACADEMIC_SOURCES.md`.

## Production question bank v2

The production baseline is **2,000 validated questions**:

- 500 Fundamental Counting Principle (`FCP`).
- 500 Simple Permutations (`P_SIMPLE`).
- 500 Distinguishable Permutations (`P_DIST`).
- 500 Circular Permutations (`P_CIRC`).

Validation completed against the canonical bank:

- 2,000 unique IDs.
- 2,000 unique Spanish prompts.
- 2,000 unique English prompts.
- 2,000 unique fingerprints.
- 100% mathematical answer recomputation passed.
- 4 unique multiple-choice options per question.
- 0 assignment collisions in the 90-student / 18-question simulation.
- 1,620 unique assigned question IDs for 90 students.
- Question-bank SHA-256: `8c5f08d519f5213ca070aa04a5ac92e76c3b151e60c830d30f60ee63abb9e2e7`.

With the 5/5/4/4 quota, 500 questions per topic give a strict capacity of **100 students** without globally reusing a question.

The canonical 2,000-question bank contains answer keys and solutions, so it **must not be committed to this public repository**. Keep it private and import it into Supabase. Publishing the canonical answer bank in GitHub Pages would expose the exam.

## Architecture

GitHub Pages serves the public frontend. Supabase/PostgreSQL is authoritative for roster validation, question assignment, responses, scoring, event history and teacher data.

Student assessment requests use controlled PostgreSQL RPCs rather than anonymous Supabase Auth:

- `student_start_attempt`
- `student_resume_attempt`
- `student_submit_answer`
- `student_log_event`
- `student_finish_attempt`

The private question table remains inaccessible to the public browser. Correct answers are evaluated server-side.

Teacher/admin access continues to use Supabase Auth and RLS.

## Required backend migrations

Apply migrations in repository order, including:

- `20260807_secure_statistics11_assessment.sql`
- `20260808_dynamic_question_allocation.sql`
- `20260808_roster_multisource_student_rpc.sql`

The last migration seeds the 61-row institutional roster and the supplied Calificar academic snapshot.

## Future academic sources

A reusable importer is available:

```bash
python tools/import_academic_source.py \
  --file snapshot.csv \
  --source-key calificar_statistics11_2026_08_21 \
  --source-system Calificar \
  --source-date 2026-08-21 \
  --title "Statistics 11 · Calificar · 2026-08-21"
```

The import aborts on unmatched or ambiguous students.

## Integrity telemetry

The browser records observable events such as:

- tab hidden/visible;
- window blur/focus;
- fullscreen enter/exit;
- copy/cut/paste attempts;
- context menu;
- Print command;
- online/offline;
- page hide/unload;
- duplicate tabs in the same browser;
- heartbeat activity.

A standard web page cannot reliably detect or block every operating-system screenshot, a photograph taken with another device, a second physical monitor, or Alt+Tab itself. The assessment therefore uses a personalized watermark and logs only browser-observable evidence.

## Traceability

For every attempt the teacher can reconstruct:

- roster identity and entered name;
- group;
- server start/end times;
- exact question IDs and displayed option order;
- answer submitted for each question;
- server-computed correctness;
- response time;
- score /15 and grade /5;
- tab-switch strikes;
- fullscreen exits;
- copy/paste and observable screenshot-key attempts;
- connectivity events;
- teacher review actions.

## Privacy

Historical grades are teacher-only through RLS and are never returned by student RPCs. The public browser does not receive the class grade table or private answer key.
