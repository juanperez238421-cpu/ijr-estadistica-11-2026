# Senior QA Review — V2 → V3

## V2 review score
**8.1 / 10**

### Strengths retained
- Correct comparison-operator content and lesson sequence.
- Clean monochrome JP classroom aesthetic.
- Functional live code construction and Boolean output.
- 1920×1080 projection-safe final render.

### Main V2 issues found from dense frame review
1. Several screens used only a small central region and left too much unused white space.
2. The full Colab notebook chrome was visually denser than the lesson concept required while the actual code remained relatively small.
3. The six-operator section was technically complete but visually compressed; cards and explanatory text were smaller than the established classroom template standard.
4. Some conceptual moments appeared as isolated cards rather than integrated template-style split layouts (`figure/data + explanation/formula`).
5. The workshop accumulated question, cell, output and interpretation in a compact lower region instead of using the full projection area one problem at a time.
6. The final workflow used `python -m manim -ql/-qh`; the project protocol explicitly requests literal `manim -pql/-pqh` for canonical acceptance.

## V3 corrective design
- Replace the dense Colab shell with a minimal code-cell abstraction.
- Increase code, operator, question and result sizes.
- Use `split_layout`, `formula_panel`, `note_panel`, `process_map`, `focus_on`, and `clear_stage` more directly from `jp_classroom_style`.
- Present the six operators in paired reveals with larger cards.
- Give `=` versus `==` a dedicated split-layout scene.
- Present each workshop problem as a full-screen micro-sequence.
- Enforce literal PQL/PQH gates and complete project-package output.
