# Colab Lab 01 · Team Guided V3 QA

Date: 2026-08-19
Scope: student workspace, beginner guidance, team registration, live gradebook compatibility, fullscreen telemetry.

## QA assessment of V2 before changes

Overall: **acceptable foundation, not yet classroom-optimal**.

### Strengths retained
- Real Python runtime in-browser through Pyodide/WebAssembly.
- Editable cell, stdout/stderr terminal and shared interactive Python console.
- One active stage at a time instead of eight stacked quiz cards.
- Existing Supabase checkpoint validation, live grade and fullscreen telemetry.
- KaTeX rendering for statistical notation.
- Neutral notebook-style visual language.

### Findings that required improvement
1. **Guide readability — medium severity**
   - Main explanatory copy was approximately 0.93rem in the guide pane.
   - For a shared workstation viewed by 2–3 students, that size is too small for comfortable group reading.

2. **Scaffolding — high pedagogical priority**
   - V2 frequently told students to “run the starter cell”.
   - The starter cell already contained the complete operation and therefore reduced the activity to execution + observation.
   - Students could obtain the checkpoint result without constructing the key line themselves.

3. **Registration model — high severity for real classroom use**
   - V2 treated one browser session as one student identity.
   - The real classroom constraint is one PC shared by 2 or 3 students.
   - The backend and master dashboard therefore needed an explicit attempt-participant model.

4. **Instruction sequence — medium severity**
   - Concept / goal / task / explore existed, but novice students still had to infer the exact order of actions.
   - A numbered “do this now” sequence was missing.

## V3 acceptance criteria

### Student registration
- [x] One workstation registers exactly 2 or 3 students.
- [x] Group is selected once for the whole team.
- [x] All member names are required for the selected team size.
- [x] Duplicate names inside one team are rejected client-side and server-side.
- [x] Any non-empty name remains valid; roster matching is opportunistic, not mandatory.
- [x] Roster-matched participants retain their individual institutional association.
- [x] The same roster student cannot be registered in two different teams for the same activity.

### Backend / gradebook
- [x] New `learning_activity_attempt_members` table stores each participant separately.
- [x] Legacy one-person attempts are backfilled into the participant model.
- [x] `learning_activity_snapshot` returns `participants` and `team_size`.
- [x] Team attempt reuses the existing checkpoint/grade model; one PC has one progress state and one grade.
- [x] Teacher dashboard returns participant arrays for each attempt.
- [x] A roster-matched member receives the team activity result in their individual dashboard row.
- [x] Unmatched names remain visible as `Nombre libre` rows.
- [x] Dashboard metrics distinguish teams from registered participants.

### Beginner guidance
- [x] Guide body typography increased for shared-screen reading.
- [x] Guide pane widened relative to the code pane.
- [x] Every stage includes a numbered 4-step procedure.
- [x] The active task and optional exploration remain visually distinct.
- [x] Hints are collapsed by default so students do not immediately see the most explicit guidance.
- [x] Statistical notation remains rendered with KaTeX.

### No pre-revealed checkpoint result
- [x] Starter cells no longer contain the completed target expression.
- [x] Every target line contains `WRITE_HERE` until the team edits it.
- [x] No expected numeric checkpoint answer is displayed in the guide or starter code.
- [x] The UI blocks execution while an unresolved `WRITE_HERE` remains and directs students back to the numbered guide.
- [x] Validation still reads the last numeric value printed by the executed Python code; there is no quiz answer field.

### Runtime / integrity retained
- [x] Pyodide runtime remains unchanged.
- [x] Pandas is loaded only when required.
- [x] `data.csv` remains mounted inside the browser Python filesystem.
- [x] Cell and console share the same Python interpreter state.
- [x] Fullscreen gating remains active.
- [x] Observable fullscreen/visibility exits continue to be recorded.

## Production gates

1. GitHub Pages build must pass `node --check` for the activity and master JS files.
2. Supabase migration workflow must successfully apply `20260819173500_colab_team_registration_v3.sql`.
3. Smoke test with a 3-person free-name team:
   - enter 11A,
   - register three arbitrary distinct names,
   - confirm snapshot shows three participants,
   - complete A1 and verify one shared grade is stored.
4. Smoke test with a 2-person team:
   - select 2 students,
   - third input disappears and is not required,
   - start succeeds,
   - team size displays as 2.
5. Master dashboard:
   - matched roster participants show the same team progress/grade,
   - unmatched participants appear individually as `Nombre libre`,
   - team column lists all members sharing that PC.
6. A1 starter code must contain `WRITE_HERE` and must not contain the completed expression or expected numeric output.
7. Escape/fullscreen test must pause the workspace and increase exit telemetry.

## Release recommendation

**Approve after both deployment workflows and the two team smoke tests pass.**

The V3 design is intentionally a guided collaborative lab, not an individual quiz. The database stores team membership explicitly while preserving the existing checkpoint engine and live-grade calculation.
