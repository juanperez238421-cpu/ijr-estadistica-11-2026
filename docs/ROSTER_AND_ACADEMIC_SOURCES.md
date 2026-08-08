# Statistics 11 · Roster and academic-source model

## Purpose

The student assessment no longer asks students for a manually assigned student code. The student enters:

1. Group: `11A`, `11B`, or `11C`.
2. Full name.

The backend normalizes accents, capitalization and spacing, then matches the entry against `student_registry`.

Names that were truncated in the supplied source are stored exactly as supplied, with `name_is_truncated = true`. For those records, the backend uses prefix matching so a student can type the complete name even though the original teacher snapshot displayed only a truncated prefix. Missing name characters are **not guessed**.

## Current roster snapshot

- 11A: 18 students.
- 11B: 20 students.
- 11C: 23 students.
- Total: 61 students.

The hidden `internal_key` values such as `11A-001` are database identifiers only. They are not requested from students and are not presented as an access credential.

## Data provenance

Three tables separate identity from academic snapshots:

### `student_registry`

Stable roster identity.

Important fields:

- `internal_key`
- `group_code`
- `source_position`
- `display_name`
- `normalized_name`
- `name_is_truncated`
- `active`
- `metadata`

### `academic_sources`

One row per imported source or snapshot.

Examples:

- a Calificar snapshot;
- an Excel export;
- a manually verified teacher record;
- a future SIS export.

Important fields:

- `source_key`
- `source_system`
- `source_kind`
- `title`
- `source_date`
- `captured_at`
- `description`
- `metadata`

### `academic_records`

Values from one source for one student.

Fields:

- `definitiva_periodo`
- `definitiva_por_area`
- `acumulado_asig_ano`
- `acumulado_seguimiento`
- `raw_payload`

A new snapshot creates a new `academic_sources` row and a new set of `academic_records`. Previous snapshots are not overwritten.

## Current supplied source

Source key:

`calificar_statistics11_2026_08_07`

The supplied page showed the columns:

- Definitiva período
- Definitiva Por Área
- Acumulado Asig Año
- Acumulado seguimiento

In the supplied rows, `Definitiva período` and `Acumulado seguimiento` were blank. They are stored as SQL `NULL`, not as zero. The two visible numeric values in each student row are stored under `definitiva_por_area` and `acumulado_asig_ano`, matching the displayed column order and the group-average row structure.

For `PALACIO MEJIA ANA SOFIA` in 11C, the first visible academic value was blank and the second was `2`; therefore `definitiva_por_area` is `NULL` and `acumulado_asig_ano` is `2.00`.

## Student assessment security model

Student registration does **not** create a Supabase anonymous Auth user. This removes the dependency that caused:

`Anonymous sign-ins are disabled`

Instead, `student_start_attempt(...)`:

1. validates assessment state;
2. validates group + name against the institutional roster;
3. reserves the student's globally unique 18-question assignment;
4. generates a cryptographically random opaque attempt token;
5. stores only the SHA-256 hash of that token in the database;
6. returns the raw token once to that browser session.

All answer submissions and audit events require both the attempt UUID and its opaque token. The browser never receives the private answer key.

## Student RPCs

Public browser access is limited to controlled `SECURITY DEFINER` RPCs:

- `student_start_attempt`
- `student_resume_attempt`
- `student_submit_answer`
- `student_log_event`
- `student_finish_attempt`

Direct anonymous table access to the roster, academic records and private question bank is not granted.

## Future source imports

Use:

```bash
python tools/import_academic_source.py \
  --file snapshot.csv \
  --source-key calificar_statistics11_2026_08_21 \
  --source-system Calificar \
  --source-date 2026-08-21 \
  --title "Statistics 11 · Calificar · 2026-08-21"
```

The import aborts on unmatched or ambiguous students rather than silently attaching values to the wrong person.

Administrative imports require `SUPABASE_SERVICE_ROLE_KEY`. Never commit that key or expose it in GitHub Pages.

## Privacy boundary

The teacher dashboard can read roster and academic-source data after authenticated teacher/admin authorization. Student-facing RPCs do not expose historical grades.

The current name-based registration is suitable for classroom identification but is not strong identity proof: another person who knows a classmate's full name could attempt to register as that student. If stronger identity assurance becomes necessary, add Microsoft/Google institutional SSO or another institution-controlled second factor without reintroducing a manually distributed student code.
