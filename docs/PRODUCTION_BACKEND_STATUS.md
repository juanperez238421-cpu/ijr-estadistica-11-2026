# Production backend status — Statistics 11 Assessment

## Production project

- Supabase project ref: `rlfxnjbqxbozjdzkbwlz`
- Public API URL: `https://rlfxnjbqxbozjdzkbwlz.supabase.co`
- Browser key type: Supabase publishable key (safe to expose in frontend)
- Canonical assessment slug: `statistics11-counting-permutations-2026`

## Public frontend contract

The GitHub Pages frontend is configured for:

- 18 questions
- 40 minutes
- 15 maximum raw points
- 1.0–5.0 grade scale
- passing grade 3.0
- 3 confirmed tab-switch strikes => server invalidation
- fullscreen monitoring
- response/event audit
- personalized watermark

## Private bank

The production bank contains 2,000 validated questions:

- 500 FCP
- 500 P_SIMPLE
- 500 P_DIST
- 500 P_CIRC

The bank contains answer keys and solutions and MUST NOT be committed to this public repository. The validated canonical SHA-256 is recorded in `evaluacion-conteo-permutaciones/PRODUCTION_BANK_MANIFEST.json`.

## Assignment policy

`20260808_dynamic_question_allocation.sql` provides server-side transactional allocation on first student registration. It uses a per-assessment advisory transaction lock and the database-level `unique (assessment_id, question_id)` constraint, so simultaneous registrations cannot intentionally reuse an assigned question.

Quota per student:

- 5 FCP
- 5 P_SIMPLE
- 4 P_DIST
- 4 P_CIRC

With 500 questions per topic, strict capacity is 100 students.

## Security boundary

Public GitHub Pages may contain only:

- Supabase project URL
- Supabase publishable/anon key
- frontend code

Never commit:

- service-role / secret key
- database password
- Supabase access token
- raw private bank
- teacher password
- IP hash salt

Official scoring, allocation and audit data are server-authoritative.

## Reproducible deployment

`.github/workflows/deploy-supabase.yml` and `.github/workflows/deploy-pages.yml` provide production deployment automation once the private repository secrets are configured. `tools/check_backend_readiness.py` validates backend state and `tools/open_assessment.py` deliberately requires the service-role key before opening the assessment.
