# Statistics 11 Comparison Operators — V5 Senior QA

## Scope reviewed

- Actual V4 FINAL PQH render: 1920×1080, 30 fps, 227.1 s.
- V4 ManimCE source from PR #90.
- Existing PR #90 review threads.
- Google Colab notebook structure: notebook title/menu bar, `+ Code`, `+ Text`, `Run all`, executable code cells, run button/execution counter, and output directly below the cell.

## V4 findings

### P1 — notebook state was not executable as shown

The workshop used `scores[1]`, `scores[2]`, and `scores[0]`, but the V4 lesson never executed a cell assigning `scores`. The visible score strip was only Manim graphics. A student reproducing the sequence in Colab would therefore receive `NameError: name 'scores' is not defined`.

**V5 correction:** section 7 now explicitly runs:

```python
scores = [4.2, 2.8, 3.0, 4.5, 3.7]
```

before any `scores[index]` expression. The V5 runtime validation gate executes the same notebook sequence and asserts every workshop result.

### P2 — printed output did not match Colab

V4 displayed `True    bool` on one line even though two `print()` calls produce two output lines.

**V5 correction:** literal notebook output is rendered as:

```text
True
bool
```

The teacher interpretation is visually separated from literal notebook output.

### P2 — Colab interface was too abstract

V4 had a clean cell-like card, but it did not clearly establish the notebook environment. For beginners this weakens transfer from the animation to the real tool.

**V5 correction:** a compact, projection-safe Colab chrome is introduced with notebook title, File/Edit/View/Insert/Runtime/Tools/Help, `+ Code`, `+ Text`, `Run all`, connected status, run button, execution counter, code area, and output region. The interface is intentionally simplified rather than pixel-for-pixel so the classroom typography remains readable.

### P3 — operator terminology

V4 used “greater or equal” and “less or equal”.

**V5 correction:** uses “greater than or equal to” and “less than or equal to”.

## Visual QA decisions retained from V4

- 16:9 projection-safe composition.
- Large typography and no camera zooms.
- One principal instructional action at a time.
- Predict → Run → Interpret workshop rhythm.
- Monochrome JP classroom style.
- Safe-zone assertions on major compositions.

## V5 execution sequence

1. `score = 4.2` and `score >= 3.0` → `True`.
2. `passed = score >= 3.0`; print value and type → `True` then `bool` on separate lines.
3. Define `scores = [4.2, 2.8, 3.0, 4.5, 3.7]`.
4. `scores[3] > scores[1]` → `True`.
5. `scores[1] < 3.0` → `True`.
6. `scores[2] == 3.0` → `True`.
7. `scores[0] != 4.2` → `False`.
8. Final recap: `scores[2] == 3.0` → `True`.

## Automated gates

The V5 GitHub Actions workflow performs:

- Python syntax compilation for V5, V4 dependency, and classroom style.
- Source checks for explicit `scores` definition, multiline Boolean output, and corrected operator terminology.
- PQL smoke render, which also runs lesson-data assertions.
- Final `-qh` 1920×1080 / 30 fps render using ManimCE 0.20.1 Docker image.
- H.264, yuv420p, 1920×1080, 30 fps ffprobe checks.
- Full decode pass with zero ffmpeg decode errors required.
- SHA-256 capture.
- Dense visual audit frame extraction every 10 seconds.

## Acceptance target

V5 is accepted only after the PQH workflow passes and the extracted frames confirm no clipping, no text-to-text overlap, readable code/output, and clear separation between literal Colab output and teacher interpretation.
