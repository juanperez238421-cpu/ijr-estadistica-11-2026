# Statistics 11 — From Variables to Arrays

ManimCE classroom scene designed to introduce arrays/lists by **creating the need from students' existing knowledge of variable assignment**.

## Scene

- File: `src/stat11_arrays_motivation.py`
- Class: `Stat11ArraysMotivation`
- Target: Manim Community Edition 0.20.1
- Format: 1920×1080, 30 fps, white background
- Style: exact preserved copy of the supplied `jp_classroom_style(3).py`

## Curriculum boundary

The scene uses only:

- variable assignment;
- numeric values;
- a Python `list` as the class's basic array model;
- indexes `0`, `1`, `2`, ...

It deliberately does **not** use loops, functions, conditions, NumPy, Pandas, slicing, or list mutation.

## Render gates

From this project directory:

```bash
manim -pql src/stat11_arrays_motivation.py Stat11ArraysMotivation --format=mp4 --disable_caching
manim -pqh src/stat11_arrays_motivation.py Stat11ArraysMotivation --format=mp4 --disable_caching
```

The GitHub workflow performs syntax validation, source-hash validation, literal PQL and PQH renders, `ffprobe`, full FFmpeg decode, audit-frame export, SHA-256 recording, package assembly, artifact upload, and copies the accepted MP4/poster into the workshop assets folder.

## Workshop integration

The corresponding workshop setup screen embeds the final video before the grading policy. The intent is for students to watch the “why” before the array/list stages.

## Canonical package

The workflow builds:

```text
Stat11_Arrays_Motivation_PQH_PACKAGE/
├── README.md
├── src/
├── storyboard/
├── render/
├── qa/
│   └── audit_frames/
├── protocol/
└── workflow/
```

The resulting ZIP is the canonical deliverable under the supplied project-package protocol.
