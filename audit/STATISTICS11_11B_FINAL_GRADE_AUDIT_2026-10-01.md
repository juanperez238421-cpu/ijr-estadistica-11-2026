# Statistics 11 · 11B Final Grade Audit

**Evaluation:** `modules-1-3-2026-10-01`  
**Status:** FINAL technical audit snapshot  
**Policy:** preserve every raw attempt, assignment, response and integrity event. Store teacher-approved audited grades in a separate audit overlay.

## Final consolidated 11B gradebook

| Student | Stored points | Audited points | Grade / 5 |
| --- | ---: | ---: | ---: |
| Pedro Pablo Arbeláez Escobar | 17 | 17 | **4.78** |
| Emma Aubad Acebedo | — | — | No exam |
| Jerónimo Bautista Giraldo | 15 | 15 | **4.33** |
| María Camila Betancur Ossa | 15 | 15 | **4.33** |
| Daren Cardona González | 11 | 11 | **3.44** |
| **Antonia Cardona Villegas** | 14 | **15** | **4.33** |
| Samuel Chavarriaga Avendaño | 14 | 14 | **4.11** |
| María del Mar Gallego Ortega | 13 | 13 | **3.89** |
| Mariajosé Giraldo Hinestroza | 15 | 15 | **4.33** |
| María Antonia Gómez Tamayo | 11 | 11 | **3.44** |
| Jacobo Guzmán Gómez | 15 | 15 | **4.33** |
| Pablo Jaramillo Álvarez | 15 | 15 | **4.33** |
| Pablo Jaramillo Palacio | 14 | 14 | **4.11** |
| Sofía López Vinasco | 13 | 13 | **3.89** |
| Sara Lotero Muñoz | 16 | 16 | **4.56** |
| Isabella Palacio Orrego | 16 | 16 | **4.56** |
| María del Mar Posada González | 13 | 13 | **3.89** |
| Sofía Posada Higuita | 14 | 14 | **4.11** |
| Emmanuel Remache López | — | — | No exam |
| Isabel Restrepo Ospina | — | — | No exam |
| Alejandro Rico Páramo | — | — | No exam |

Grade conversion:

`grade_5 = round(1 + 4 × audited_points / 18, 2)`

## Confirmed technical adjustment

Only one roster-grade adjustment is supported by the forensic review:

**Antonia Cardona Villegas: 14 → 15 points.**

Question `M123-52` asked the student to create `[5, 10, 15]` and print the second item using its index. The submitted code used a semantically valid index variable:

```python
list=[5, 10, 15]
index=1
print(list[index])
```

The observed output was `10`, which is correct. The production grader rejected the answer only because its token rule required the literal substring `[1]`. This is a confirmed false negative in the grader contract. The original response remains unchanged; the +1 exists only in the final audit overlay.

## Pedro Pablo Arbeláez

His stored response to `print(2 ** 5)` contained extra text plus the correct value `32`. The prompt explicitly required **only the output**. The app stored exactly what was entered, and no technical reader/grader bug was demonstrated. Therefore the final technical audit remains **17/18 = 4.78**.

## Unlinked email

The raw evaluation contains `antonia.gomez@ijr.edu.co` inside a team, but that member currently has no `student_registry_id`. It is intentionally excluded from this roster-grade snapshot until the identity is verified. The raw member record is preserved unchanged.

## Data integrity

The audit is additive. It does **not** overwrite:

- `python_hub_eval_attempts`
- `python_hub_eval_attempt_members`
- `python_hub_eval_assignments`
- `python_hub_eval_responses`
- `python_hub_eval_events`

The authoritative raw evidence remains available for future forensic review.
