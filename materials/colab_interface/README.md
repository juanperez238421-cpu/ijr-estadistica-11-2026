# Grade 11 Google Colab Interface Explainer Package

This package is a companion to the Grade 11 data-analysis foundations class. It focuses only on notebook navigation and first-day operating skills.

## Files

- `Grade11ColabInterfaceExplainer_pqh.mp4` — rendered interface walkthrough.
- `grade11_colab_interface_explainer.py` — complete ManimCE source.
- `statistics11_colab_data_analysis_foundations.py` — shared visual library used by the scene.
- `grade11_colab_interface_walkthrough.ipynb` — student practice notebook.
- `COLAB_INTERFACE_QUICK_REFERENCE.md` — one-page reference.
- `COLAB_INTERFACE_TEACHER_GUIDE.md` — suggested 45–50 minute lesson.
- `colab_interface_map.png` — representative annotated interface frame.
- `grade11_colab_student_success.csv` — practice dataset used in the upload section.

## Render

```bash
manim -pqh grade11_colab_interface_explainer.py Grade11ColabInterfaceExplainer --format=mp4 --disable_caching
```

Validated target: ManimCE 0.20.1, 1920×1080, 30 fps, H.264, yuv420p.
