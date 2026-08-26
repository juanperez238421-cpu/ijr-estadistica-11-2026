# Statistics 11 — Comparison Operators · Protocol V3 Storyboard

## Pedagogical objective
Students translate a data question into a Python comparison, execute the expression in a minimal Colab-style code cell, read the Boolean result, and interpret that result in context.

## Persistent visual system
- JP classroom standard: white background, black text/lines, neutral gray panels.
- Standard numbered section header and subtitle.
- Safe content zone enforced with `assert_content_safe` on critical grouped layouts.
- Large sans-serif instructional text plus DejaVu Sans Mono for Python code.
- Minimal Colab abstraction: code cell + execution gutter + output; no dense browser/notebook chrome.

## Scene order
1. **Begin with the data** — observed score and pass mark appear first; question appears second; mathematical relation and Boolean answer appear last.
2. **Translate the question into Python** — live write `score = 4.2`, then `score >= 3.0`; execute; reveal `True`; connect to 3-step route.
3. **Assignment is not comparison** — split-screen contrast of `=` as storage and `==` as equality question. End with a concise `= stores / == compares` reminder.
4. **Six comparison operators** — reveal the operator family in three logical pairs: `>/<`, `>=/<=`, `==/!=`; each card includes meaning, example and Boolean result.
5. **True and False are data too** — create a Boolean variable, print the value and its Python type, then explain why Boolean data matters later.
6. **Compare values inside a list** — build the indexed list, select indexes 1 and 3, translate to `scores[3] > scores[1]`, then to `4.5 > 2.8`, then `True`.
7. **Guided workshop** — three problems, one full screen at a time. Each follows THINK → TYPE → RUN → OUTPUT → INTERPRET.
8. **Takeaway** — 4-step process map and compact operator family; final conceptual bridge to future conditions/filtering.

## Camera behavior
- Default full 16:9 frame for reading and note-taking.
- Brief `focus_on` only after a code/result block or list-comparison chain is complete.
- Persistent header temporarily hides during focus according to the shared style helper.
- No zoom occurs while content is incomplete or during a destructive transition.

## Timing intent
- `PAUSE_EXPLAIN` after a new concept.
- `PAUSE_WORK` before revealing workshop answers.
- `PAUSE_SUMMARY` for operator family and conceptual contrasts.
- `PAUSE_FINAL` for final takeaway.
- Python lines are written progressively rather than appearing fully formed.

## Transition rules
- `clear_stage()` removes all non-header objects between conceptual sections.
- Workshop problems also clear between each problem, preventing stale prompt/result overlap.
- New section headers use the shared replacement transition.

## Conceptual takeaway
A comparison operator is a precise question about data. Python evaluates that question and returns a Boolean (`True` or `False`) that can later be stored, counted, filtered or used in conditions.

## Senior QA risks and mitigations
- **Tiny text / excessive whitespace:** reduced dense UI chrome; larger code/operator typography and split layouts.
- **Visual overload:** one central idea or one workshop problem per screen.
- **Ambiguous `=` vs `==`:** dedicated scene with direct contrast.
- **List indexing confusion:** explicit indexed boxes plus selection outlines before the code expression.
- **Unsafe zoom / clipping:** full-group safety assertions and camera focus only on completed objects.
- **Protocol drift:** literal `-pql` and `-pqh` render commands, fixed ManimCE 0.20.1 Docker image, ffprobe, full FFmpeg decode, dense audit frames, source/style hashes and canonical package ZIP.
