# Colab Lab 01 · Workspace V2 QA

Date: 2026-08-19

## Goal

Replace the stacked questionnaire layout with a guided, executable Python learning environment where one stage owns the workspace at a time.

## Functional acceptance criteria

- [x] One active stage is shown at a time; future stages are not rendered as a long questionnaire.
- [x] Python executes inside the page using a real CPython-compatible Pyodide runtime in WebAssembly.
- [x] Code cells are editable and support Run, Shift+Enter / Ctrl+Enter, reset, execution count, stdout and stderr.
- [x] The Python console shares the same global interpreter state as the notebook cell.
- [x] `input()` is bridged to a browser prompt.
- [x] The course `data.csv` is fetched from the same origin and mounted in the Python virtual filesystem.
- [x] Pandas is loaded for data-analysis stages.
- [x] Validation uses the last value printed by the code cell; there is no separate manual quiz-answer textbox.
- [x] Students may retry without penalty and receive guide-oriented feedback.
- [x] The eight existing Supabase checkpoints and live grade calculation remain compatible.
- [x] Literal `\\n` sequences from legacy checkpoint content are normalized if fallback rendering is used.
- [x] Mathematical notation can be rendered with KaTeX; Stage A5 includes the arithmetic-mean formula.
- [x] Fullscreen gating remains mandatory while the activity is active.
- [x] Observable fullscreen exits / visibility changes continue to be logged through the existing activity-event RPC.

## Visual QA

- Google/Colab-inspired neutral palette: white, light gray, blue accent, dark console.
- System/Arial/Roboto UI typography; monospace only for executable code and terminal content.
- No green classroom-theme dependency in the activity workspace.
- Guide pane and notebook pane are visually distinct.
- The terminal is a dedicated dark console surface rather than a decorative code block.
- The active stage consumes the available workspace instead of stacking eight cards vertically.

## Important boundary

This is not an iframe of Google Colab and does not claim to be a Google-hosted VM. It is a real Python runtime embedded in the course page. Browser security prevents a website from providing unrestricted operating-system shell access or physically disabling Escape / Alt+Tab. The activity therefore pauses when fullscreen is lost and records observable exits.

## Production smoke test after merge

1. Enter with any non-empty name in 11A, 11B, or 11C.
2. Accept fullscreen.
3. Wait for `Python ready`.
4. Stage 1: run the starter cell; terminal must print `17`; validate; Stage 2 must replace Stage 1.
5. In the console run `type(a)` or `a ** 2`; output must execute in the same interpreter state.
6. Complete through Stage 5 and verify KaTeX renders the mean formula without raw LaTeX delimiters.
7. Stage 6: Pandas must load; `data.csv` must be readable; the final printed row count must be `12`.
8. Leave fullscreen with Escape: workspace must be blocked until fullscreen is restored, and the master dashboard should increment exit telemetry.
9. Verify the master dashboard still updates progress and grade through the existing Supabase RPCs.

## Backend impact

No new database schema is required for Workspace V2. It reuses:

- `student_learning_activity_start`
- `student_learning_activity_resume`
- `student_learning_activity_submit`
- `student_learning_activity_event`
- `teacher_learning_dashboard`

The existing production data model therefore remains backward compatible.
