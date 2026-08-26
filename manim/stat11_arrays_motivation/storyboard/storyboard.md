# Storyboard — Statistics 11: From Variables to Arrays

**Scene class:** `Stat11ArraysMotivation`  
**Audience:** Grade 11 Statistics / Python in Colab  
**Primary bridge:** existing knowledge `variable = value` → need for a Python list/basic array  
**Excluded concepts:** loops, functions, conditions, NumPy, Pandas, slicing, mutation  
**Visual standard:** JP Classroom, white background, black/gray hierarchy, large notebook-readable text.

## Pedagogical objective

Students should not meet list syntax as an arbitrary new rule. They should first experience the limitation of using one distinct variable name for every related observation. By the end, they should be able to explain:

1. a variable is sufficient for one value;
2. separate variables become cumbersome when values belong to one dataset;
3. a Python list can store many related values under one variable name while preserving order;
4. the preserved order can be read with an index starting at `0`.

## Persistent objects and continuity rules

- Numbered section header and subtitle remain persistent during each section.
- The score dataset `[4.2, 3.8, 4.5, 3.2, 4.0]` is deliberately reused across sections 2–5 so the visual story changes the **structure**, not the data.
- The transition from five separate score variables to `scores = [...]` must preserve the same five values.
- Camera zoom is reserved for the scalability statement `30 students → 30 variable names` and for the one-list code line; it must temporarily hide the header via the style helper and then restore the full 16:9 frame.
- No new syntax should appear before the need for one name + many ordered values has been stated explicitly.

## Scene order

### Opening — “FROM VARIABLES TO ARRAYS”
**Intent:** frame the lesson as a reason-first transition.  
**On screen:** course label, title, “Why one variable is not enough for a dataset”, promise “Create the need first. Introduce the list second.”  
**Timing:** slow enough to copy the topic title.

### 01 — Start with what you already know
**Concept:** one variable names one value.  
**Visuals:** code card `score = 4.2`, name-arrow-value diagram, summary card.  
**Takeaway:** current knowledge is correct and useful; no artificial problem is created yet.

### 02 — Now the dataset grows
**Concept:** repeated assignments are valid but do not represent one dataset cleanly.  
**Visuals:** prompt to store five scores; five assignments appear one by one; the exact five values sit together visually; reflection card.  
**Scale beat:** scene clears and grows the bookkeeping pattern to a 30-student class using a grid of repeated `score_n = ...` names plus the statement `30 students → 30 variable names`.  
**Camera:** controlled zoom onto the scalability statement, then full-frame restore.  
**Takeaway:** the problem is organization, not arithmetic.

### 03 — Define the need before the new syntax
**Concept:** extract requirements from the failed scaling pattern.  
**Visuals:** four process cards: one variable name; many related values; preserved order; read a position.  
**Equation-like statement:** `one dataset ⇒ one organized object`.  
**Takeaway:** students can predict what kind of structure is needed before seeing Python syntax.

### 04 — One name, many ordered values
**Concept:** introduce a Python list as the solution.  
**Visual continuity:** the same five scores remain visible.  
**Transition:** five separate assignments are replaced by one code card: `scores = [4.2, 3.8, 4.5, 3.2, 4.0]`.  
**Definition:** “For this class, a Python list is our basic array model: one variable stores an ordered collection of values.”  
**Camera:** brief focus on the one-list code statement.  
**Takeaway:** values are unchanged; storage structure is improved.

### 05 — Order gives us an index
**Concept:** positional access follows from ordering.  
**Visuals:** score strip with indexes `0,1,2,3,4`; large examples `scores[0] → 4.2`, `scores[2] → 4.5`.  
**Takeaway:** human first/second/third maps to Python indexes 0/1/2.

### 06 — Mini workshop
The exercises deliberately begin with prior knowledge before using the new structure.

**Exercise 1 — Create the friction**  
Prompt: store `22.1, 22.8, 23.0, 22.6` using separate variables.  
Reveal: `t1`, `t2`, `t3`, `t4`.  
Reflection: all values measure the same variable; why do they need four names; what about 100 measurements?

**Exercise 2 — Reorganize the same data**  
Prompt: use one variable `temperatures`.  
Reveal: `temperatures = [22.1, 22.8, 23.0, 22.6]`.  
Visual: values and indexes remain explicit.

**Exercise 3 — Read a position**  
Prompt: read the second temperature.  
Pause for prediction.  
Reveal: `temperatures[1] → 22.8`.

**Exercise 4 — Transfer**  
New data: `161, 168, 173, 159, 176, 170`.  
Task: create `heights` and read second value.  
Reveal: `heights = [...]`, `heights[1] → 168`.

### 07 — Summary
**Process map:** one value → variable; many related values → list; order → index.  
**Pattern card:**

```python
data = [value0, value1, value2, ...]
data[0]  # first value
data[1]  # second value
```

**Closing:** “A list is not more data. It is a better structure for related data.”

## Equation / code progression

```text
score = 4.2
↓
score_1 = 4.2 ... score_5 = 4.0
↓
30 students → 30 variable names
↓
Need: one name + many values + order + positional access
↓
scores = [4.2, 3.8, 4.5, 3.2, 4.0]
↓
scores[0] → 4.2
scores[2] → 4.5
```

## Timing intent

- Opening: 10–15 s.
- Prior knowledge: 15–20 s.
- Five-variable buildup: 25–35 s.
- Thirty-student scaling + zoom: 20–30 s.
- Need extraction: 20–25 s.
- List introduction: 25–30 s.
- Index bridge: 20–25 s.
- Four mini-workshop prompts: approximately 20–30 s each, with explicit prediction/copy pauses.
- Summary: 20–25 s.

Expected full lesson duration: approximately 3.5–5 minutes at `LESSON_TIME_SCALE=1.0`, depending on render timing behavior.

## Transition rules

- Use fades and replacements, not hard cuts between logically connected objects.
- Never swap the score values while explaining the structural change.
- Clear the stage before scaling to 30 students so clutter is intentional rather than accidental overlap.
- Do not show indexes before the list has been established as ordered.
- Mini-workshop answers appear only after a work pause.

## Visual QA risks and required checks

1. **Header collision:** every major composition uses `assert_content_safe`.
2. **Code readability:** code lines must remain large enough for a projected classroom screen; no dense syntax coloring is used.
3. **Grid clutter:** the 30-student visual uses only representative variable labels plus `score_30`; its purpose is scale, not reading every line.
4. **Array strip width:** six-value `heights` strip must remain inside safe width after scaling.
5. **Index labels:** index row must not collide with the bottom safe margin.
6. **Camera restoration:** both focus operations must restore full 16:9 framing and the persistent header.
7. **Stale objects:** each section ends with `clear_stage()`.
8. **Pedagogical continuity:** values remain identical during the separate-variables → list transformation.

## Conceptual takeaway

> A list is useful because related values form one dataset. The new syntax is a response to a structural need: one name, many ordered values, and a consistent way to read positions.
