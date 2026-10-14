# Seminar 11 — Guided notebook update (2026-10-14)

The project workshop now uses the existing Python workshop titlebar, notebook file identity, stage sidebar, code cell and output styles. The Python hub itself is unchanged.

## Construction
- 19 implementation cells now have 147 incremental steps.
- Rico's original Config cell now starts with two import lines and has 13 steps.
- Each new fragment is appended to the student's current source.
- A successful intermediate step does not record the entire cell as complete.
- Student construction exercises and final verification cells remain in place.

## Continuity and provenance
- Existing project keys, class numbers and cell IDs are unchanged.
- Saved custom source is preserved as a legacy full-cell draft.
- Unedited previous starters are introduced through the smaller steps; their previous source is retained in legacyCode.
- The step index is stored in the existing cloud draft.
- Resetting a guide retains up to three previous cell source snapshots in codeHistory.
- No production draft or progress row was migrated, cleared or overwritten by this update.
- Existing QA authentication, project selector, save/recover controls and version conflict checks remain.

## Validation
- Executed 83 Python prefixes with their step checks.
- Ran the existing animation and defensive-policy regression tests.
- Verified source reconstruction, append-only progression, resume indices and legacy/reset preservation across all five routes.
- Checked JavaScript syntax and parsed web implementation statements.
- Verified cloud round-trip of microIndex, legacyCode and codeHistory inside a rolled-back transaction.
- Inspected the published Rico workshop: established notebook layout and the two-line first step were present.
- This validation did not include a new authenticated browser session for every project.
