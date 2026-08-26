# ManimCE PQH Project Package Standard

**Version:** 1.1  
**Effective date:** 2026-08-24  
**Reference environment:** Manim Community Edition 0.20.1  
**Default final format:** 1920x1080, 30 fps, H.264, yuv420p, MP4

## Purpose

A final ManimCE delivery is complete only when a reproducible `.zip` package is produced. The package must preserve the rendered video, exact scene source, storyboard, style/helpers or their verified source, render QA evidence, protocol, and reproduction instructions.

## Mandatory workflow

1. Review the request and base project/style.
2. Prepare/update a storyboard for substantial explanatory or narrative changes.
3. Implement the ManimCE scene.
4. Validate Python syntax and lesson data.
5. Run literal `-pql`.
6. Correct runtime, LaTeX, framing, overlap, continuity, and timing issues.
7. Run literal `-pqh` from the accepted source.
8. Verify with `ffprobe`.
9. Fully decode with FFmpeg; the error log must be empty.
10. Export dense audit frames and visually inspect critical transitions.
11. Calculate SHA-256 of the final MP4.
12. Build the complete project ZIP.
13. Deliver the ZIP as the canonical final artifact; the MP4 may also be linked separately.

## Mandatory package structure

```text
<Project_Name>_PQH_PACKAGE/
├── README.md
├── src/
├── storyboard/
├── render/
├── qa/
│   └── audit_frames/
├── protocol/
└── workflow/
```

Assets required by the scene belong under `assets/` with project-relative paths.

## Storyboard requirement

For explanatory/educational animations, the storyboard must define the pedagogical objective, persistent objects, scene order, camera/zoom behavior, equation progression, timing intent, transition rules, conceptual takeaway, and visual QA risks. It must correspond to the rendered source.

## Source traceability

The package must preserve the exact `.py` rendered source. GitHub renders must validate source/style hashes before PQL and preserve the exact reconstructed sources whenever practical. Never substitute a differently hashed local style and claim it is the rendered file.

## Render gates

PQL:

```bash
manim -pql <scene.py> <SceneClass> --format=mp4 --disable_caching
```

PQH:

```bash
manim -pqh <scene.py> <SceneClass> --format=mp4 --disable_caching
```

## Technical acceptance

Unless explicitly changed by the project: 1920x1080, 30 fps, H.264, yuv420p, ffprobe-readable, full FFmpeg decode PASS, empty decode-error log, and SHA-256 recorded.

## Visual QA acceptance

Technical green status is not enough. Audit frames must show no harmful clipping/overlap, no stale labels, no character/object merging at key moments, no discontinuous diagram replacement when continuity is pedagogically important, and no destructive camera zoom. If a defect is found, patch and rerender; never rename an older render as the new version.

## Definition of done

Storyboard/source match; PQL PASS; PQH PASS; technical QA PASS; full decode PASS; visual QA PASS; hashes preserved; and complete downloadable ZIP exists.
