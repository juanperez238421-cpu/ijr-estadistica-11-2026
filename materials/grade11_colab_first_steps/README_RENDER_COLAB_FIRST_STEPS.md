# Render - Grade 11 Colab First Steps Complete

## Scene

`Grade11ColabFirstStepsComplete`

## Preview scene

`Grade11ColabFirstStepsCompletePreview`

## Required files

- `grade11_colab_first_steps_complete.py`
- `statistics11_colab_data_analysis_foundations.py`

## Docker preview

```bash
docker run --rm -it \
  -e COLAB_FIRST_STEPS_SHORT_PAUSES=1 \
  -v "$PWD:/manim" -w /manim \
  manimcommunity/manim:v0.20.1 \
  manim -pql grade11_colab_first_steps_complete.py \
  Grade11ColabFirstStepsCompletePreview \
  --format=mp4 --disable_caching
```

## Complete low-quality validation

```bash
docker run --rm -it \
  -e COLAB_FIRST_STEPS_SHORT_PAUSES=1 \
  -v "$PWD:/manim" -w /manim \
  manimcommunity/manim:v0.20.1 \
  manim -pql grade11_colab_first_steps_complete.py \
  Grade11ColabFirstStepsComplete \
  --format=mp4 --disable_caching
```

## Final high-quality render

```bash
docker run --rm -it \
  -e COLAB_FIRST_STEPS_SHORT_PAUSES=0 \
  -v "$PWD:/manim" -w /manim \
  manimcommunity/manim:v0.20.1 \
  manim -pqh grade11_colab_first_steps_complete.py \
  Grade11ColabFirstStepsComplete \
  --format=mp4 --disable_caching
```
