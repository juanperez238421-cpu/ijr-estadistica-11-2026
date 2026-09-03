# Statistics 11 · Comparisons and Boolean Logic · V3 SENIOR QA

## Scope

New lesson package extending, not replacing, `manim/stat11_comparisons_protocol_v2/src/stat11_comparisons_protocol_v2.py`.

## Repository baseline inspected

- `python/course-data-v4.js`: Arrays/lists are sequence 3; Comparisons & logic are sequence 4; Conditions are sequence 5.
- Existing V2 comparison lesson: white JP classroom style, Colab shell, Run/execution/output model, `= vs ==`, six operators, Boolean result, score-list comparison, prediction workshop.
- Existing JP style source: reconstructed from `manim/stat11_arrays_motivation/fragments/style_*`.
- Existing render convention: pinned ManimCE 0.20.1, PQL gate, PQH final, ffprobe, full decode, audit frames, artifacts.

## Pedagogical acceptance

The final sequence must preserve the list-to-comparison bridge and extend it through:

`LIST → OBSERVATION → QUESTION → COMPARISON → True/False → AND/OR/NOT → DATA RULE → NEXT: if`

The lesson intentionally does **not** teach loops, functions, Pandas, CSV, `elif`, or `else`.

## Required conceptual checks

- [x] `=` means assignment/store.
- [x] `==` means equality comparison.
- [x] Six comparison operators appear with prediction-before-reveal.
- [x] `True` and `False` are explained as Boolean values (`bool`).
- [x] Comparisons return to the existing `scores` list and zero-based indexes.
- [x] `and` is introduced from a need for two simultaneous data requirements.
- [x] `or` is introduced from a score-flagging rule.
- [x] `not` is introduced as Boolean inversion.
- [x] Natural-language rules are translated step by step into Boolean expressions.
- [x] Parentheses are used for readability without teaching a precedence table.
- [x] Two prediction workshops are included.
- [x] False is explicitly identified as a valid result, not a Python failure.
- [x] The final challenge uses `score = 4.7` and evaluates `True and False → False`.
- [x] `if` appears only as a brief next-lesson bridge.

## Visual QA contract

- 1920×1080 · 16:9 · 30 fps.
- White background, black text, neutral gray hierarchy.
- Persistent numbered headers.
- Projection-safe monospaced code.
- No semantic dependence on color.
- No dense paragraph frames.
- No overlap or clipping accepted.
- Long expressions are split or fitted rather than made tiny.
- Colab representation remains simplified and instructional.

## Temporal QA contract

Prediction pauses are intentionally long for:

- `= vs ==`
- first Boolean result
- first AND
- first OR
- first NOT
- workshops
- final challenge

Final render is accepted only after PQL smoke, PQH render, ffprobe validation, full decode validation, and representative frame audit.
