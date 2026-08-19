# Colab Lab 01 · V4 QA — progressive help, non-blocking progress and 40-minute pacing

Date: 2026-08-19

## QA decision

V3 is classroom-ready as a collaborative Python workspace, but its validation model still behaves as a mastery gate: a wrong checkpoint keeps the team on the same stage and retrying has no scoring consequence. V4 changes that into a transparent formative scoring model.

## Required behavior

### Progress is never blocked by a wrong answer
- A wrong validated output remains visible as incorrect.
- The team may edit and retry normally.
- After the first validated wrong output, `Continuar sin resolver` becomes available.
- Skipping completes the stage with 0% stage credit and advances to the next stage.
- Python syntax/runtime errors do not count as wrong validations and do not reduce the grade.

### Three help tokens for the complete lab
- Each team starts with exactly 3 help tokens for all eight stages combined.
- Help usage is recorded server-side and survives reload/recovery.
- Help is progressive inside each stage: level 1 conceptual, level 2 structural, level 3 near-complete code structure.
- One help token reduces the stage's available internal credit by 0.20 points, equivalent to 0.10 on the final 1.00–5.00 grade scale when all eight stages are considered.
- No more than three help tokens can be consumed by one attempt.

### Wrong validated outputs
- Each wrong validation reduces the current stage's available internal credit by 0.10 points.
- Only the first three wrong validations per stage affect credit; further retries remain possible without additional deduction.
- In the final grade scale, each penalized wrong validation is equivalent to 0.05 grade units.
- A correctly solved stage has a 25% internal-credit floor even after multiple recorded penalties.

### Reveal the correct answer
- `Ver solución correcta` is always available while a stage is pending.
- The UI requires an explicit confirmation before revealing.
- The backend marks the stage as `revealed` and awards exactly 25% of its point value.
- The page displays the complete correct Python code and the correct expected output.
- The team must explicitly press `Entendimos · continuar` before the next stage replaces the solution.

### Projected grade
- The visible live grade is a **projected maximum grade**, not merely points already earned.
- It begins at 5.00.
- It decreases immediately after a recorded help, wrong validation, reveal or skip.
- Pending stages are valued at their current remaining potential.
- At completion, projected grade and final grade converge.
- The teacher dashboard displays projected grade for active teams and final grade for submitted teams.

## Grade model

Each of the 8 stages is worth 1.00 internal point. The course grade remains 1.00–5.00:

`grade = 1 + 4 * (internal_points / 8)`

For a stage solved by the team:

`stage_credit = max(0.25, 1 - 0.20*help_count - 0.10*min(wrong_attempts,3))`

Special completion modes:
- solved: formula above
- revealed: 0.25
- skipped: 0.00

This preserves a maximum final grade of 5.00 and a minimum of 1.00.

## 40-minute pacing review

Eight stages are sufficient for approximately one 40-minute lesson **when the activity remains guided and collaborative rather than open-ended**. No interface can guarantee an exact classroom duration because reading speed, discussion, internet/runtime loading and prior Python experience vary.

V4 therefore uses an explicit target budget:

| Stage | Topic | Target |
|---|---|---:|
| A1 | Variables + addition | 4 min |
| A2 | Multiplication / operators | 3 min |
| A3 | Lists + `len()` | 4 min |
| A4 | Aggregation + `sum()` | 4 min |
| A5 | Arithmetic mean | 5 min |
| A6 | CSV + Pandas + DataFrame | 7 min |
| A7 | Column mean | 5 min |
| A8 | Filtering + count | 5 min |
|  | **Stage work** | **37 min** |
|  | Registration + fullscreen + Python startup | **≈ 3 min** |
|  | **Planned lesson** | **≈ 40 min** |

Expected classroom envelope: approximately **38–45 minutes** for a 2–3 student team.

### Pacing UI
- Workspace timer shows elapsed time against `40:00`.
- At 35 minutes the timer changes to warning state.
- At 40 minutes it changes to over-target state but does not terminate the learning activity.
- Each stage shows its recommended target time.

## Master dashboard telemetry

For each team/student row the dashboard now exposes:
- completed stages, not only correct stages;
- active projected grade or submitted final grade;
- help tokens used (`A`);
- validated wrong outputs (`E`);
- revealed solutions (`R`);
- skipped stages (`O`);
- existing fullscreen/visibility events.

## Production acceptance gates

1. Student and master JavaScript pass syntax validation in Pages deployment.
2. Supabase applies `20260819185000_colab_v4_progressive_help_scoring.sql` successfully.
3. Public activity loads with 3 help tokens and projected grade 5.00.
4. One wrong validation lowers projected grade and enables `Continuar sin resolver`.
5. A Python syntax error does not change projected grade.
6. Help use persists after reload and decrements the global remaining-help counter.
7. After three help uses, backend rejects a fourth.
8. Reveal shows complete solution and expected output, awards 25%, then permits controlled continuation.
9. Skip awards 0% and advances.
10. Completion is based on eight completed stages (`solved`, `revealed` or `skipped`), not eight correct answers.
11. Teacher dashboard shows projected grade for active teams and final grade after submission.
12. The timer and per-stage targets render without interfering with fullscreen enforcement.

## Release recommendation

Approve after Pages and Supabase deployment workflows pass and one classroom smoke test confirms wrong → retry/help/reveal/skip transitions.
