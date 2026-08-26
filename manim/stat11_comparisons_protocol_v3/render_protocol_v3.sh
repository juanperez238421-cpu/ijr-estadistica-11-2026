#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="manim/stat11_comparisons_protocol_v3"
IMAGE="manimcommunity/manim:v0.20.1"
SCENE_FILE="src/stat11_comparisons_protocol_v3.py"
SCENE_CLASS="Stat11ComparisonsProtocolV3"
FINAL_NAME="Stat11_Comparisons_Protocol_V3_FINAL_PQH.mp4"
PACKAGE_NAME="Stat11_Comparisons_Protocol_V3_PQH_PACKAGE"

cd "$PROJECT_DIR"
mkdir -p src library delivery qa/audit_frames
cat fragments/scene_* > src/stat11_comparisons_protocol_v3.py
cat ../stat11_arrays_motivation/fragments/style_* > library/jp_classroom_style.py

echo "7f331c6a06c33d5045931b77e24fbadab6e8ee053ce747d8dd45971e1aaa8c8d  src/stat11_comparisons_protocol_v3.py" | sha256sum -c -
echo "3f3f06e94d5cad870ad335502cc1a93e56ce675abb1231ded5f9c71fd3e60e3d  library/jp_classroom_style.py" | sha256sum -c -
python -m py_compile src/stat11_comparisons_protocol_v3.py library/jp_classroom_style.py
sha256sum src/stat11_comparisons_protocol_v3.py > qa/source.sha256
sha256sum library/jp_classroom_style.py > qa/style.sha256
cd - >/dev/null

docker pull "$IMAGE"

rm -rf "$PROJECT_DIR/media_pql"
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/manim-home \
  -e PYTHONPATH="/manim/$PROJECT_DIR" \
  -e SCENE_FILE="$SCENE_FILE" \
  -e SCENE_CLASS="$SCENE_CLASS" \
  -v "$PWD:/manim" \
  -w "/manim/$PROJECT_DIR" \
  --entrypoint bash \
  "$IMAGE" \
  -c '
    set -euo pipefail
    mkdir -p /tmp/colab-bin
    printf "#!/usr/bin/env bash\nexit 0\n" > /tmp/colab-bin/xdg-open
    chmod +x /tmp/colab-bin/xdg-open
    export PATH="/tmp/colab-bin:$PATH"
    manim -pql "$SCENE_FILE" "$SCENE_CLASS" --format=mp4 --media_dir media_pql --disable_caching
  '
PREVIEW="$(find "$PROJECT_DIR/media_pql" -type f -name '*.mp4' ! -path '*/partial_movie_files/*' | head -n 1)"
test -n "$PREVIEW" && test -s "$PREVIEW"

rm -rf "$PROJECT_DIR/media_pqh"
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -e HOME=/tmp/manim-home \
  -e PYTHONPATH="/manim/$PROJECT_DIR" \
  -e SCENE_FILE="$SCENE_FILE" \
  -e SCENE_CLASS="$SCENE_CLASS" \
  -v "$PWD:/manim" \
  -w "/manim/$PROJECT_DIR" \
  --entrypoint bash \
  "$IMAGE" \
  -c '
    set -euo pipefail
    mkdir -p /tmp/colab-bin
    printf "#!/usr/bin/env bash\nexit 0\n" > /tmp/colab-bin/xdg-open
    chmod +x /tmp/colab-bin/xdg-open
    export PATH="/tmp/colab-bin:$PATH"
    manim -pqh "$SCENE_FILE" "$SCENE_CLASS" --format=mp4 --media_dir media_pqh --disable_caching
  '
FINAL="$(find "$PROJECT_DIR/media_pqh" -type f -name '*.mp4' ! -path '*/partial_movie_files/*' | head -n 1)"
test -n "$FINAL" && test -s "$FINAL"
cp "$FINAL" "$PROJECT_DIR/delivery/$FINAL_NAME"

sudo apt-get update
sudo apt-get install -y ffmpeg zip
V="$PROJECT_DIR/delivery/$FINAL_NAME"
ffprobe -v error \
  -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt \
  -show_entries format=duration,size \
  -of default=nw=1 "$V" | tee "$PROJECT_DIR/qa/ffprobe.txt"
grep -q '^codec_name=h264$' "$PROJECT_DIR/qa/ffprobe.txt"
grep -q '^width=1920$' "$PROJECT_DIR/qa/ffprobe.txt"
grep -q '^height=1080$' "$PROJECT_DIR/qa/ffprobe.txt"
grep -q '^pix_fmt=yuv420p$' "$PROJECT_DIR/qa/ffprobe.txt"
grep -q '^r_frame_rate=30/1$' "$PROJECT_DIR/qa/ffprobe.txt"
ffmpeg -nostdin -v error -i "$V" -f null - 2> "$PROJECT_DIR/qa/decode_errors.log"
test ! -s "$PROJECT_DIR/qa/decode_errors.log"
sha256sum "$V" | tee "$PROJECT_DIR/qa/final_mp4.sha256"
rm -rf "$PROJECT_DIR/qa/audit_frames" && mkdir -p "$PROJECT_DIR/qa/audit_frames"
ffmpeg -nostdin -v error -i "$V" -vf "fps=1/15,scale=960:-2" -frames:v 24 "$PROJECT_DIR/qa/audit_frames/frame_%02d.jpg"
FRAME_COUNT="$(find "$PROJECT_DIR/qa/audit_frames" -type f -name '*.jpg' | wc -l)"
test "$FRAME_COUNT" -ge 12
printf 'AUDIT_FRAME_COUNT=%s\nVISUAL_REVIEW_REQUIRED_AFTER_ARTIFACT_DOWNLOAD=YES\n' "$FRAME_COUNT" > "$PROJECT_DIR/qa/audit_summary.txt"

ROOT="$PROJECT_DIR/delivery/$PACKAGE_NAME"
rm -rf "$ROOT"
mkdir -p "$ROOT/src" "$ROOT/library" "$ROOT/storyboard" "$ROOT/render" "$ROOT/qa/audit_frames" "$ROOT/protocol" "$ROOT/workflow"
cp "$PROJECT_DIR/src/stat11_comparisons_protocol_v3.py" "$ROOT/src/"
cp "$PROJECT_DIR/library/jp_classroom_style.py" "$ROOT/library/"
cp "$PROJECT_DIR/storyboard/STORYBOARD.md" "$ROOT/storyboard/"
cp "$PROJECT_DIR/qa/SENIOR_QA_REVIEW.md" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/ffprobe.txt" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/decode_errors.log" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/final_mp4.sha256" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/source.sha256" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/style.sha256" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/audit_summary.txt" "$ROOT/qa/"
cp "$PROJECT_DIR/qa/audit_frames/"*.jpg "$ROOT/qa/audit_frames/"
cp "$PROJECT_DIR/protocol/PROTOCOL_MANIMCE_PQH_PROJECT_PACKAGE_STANDARD.md" "$ROOT/protocol/"
cp "$V" "$ROOT/render/"
cp "$PROJECT_DIR/render_protocol_v3.sh" "$ROOT/workflow/"
cat > "$ROOT/workflow/RENDER_COMMANDS.txt" <<'EOF'
Reference image: manimcommunity/manim:v0.20.1
PQL: manim -pql src/stat11_comparisons_protocol_v3.py Stat11ComparisonsProtocolV3 --format=mp4 --disable_caching
PQH: manim -pqh src/stat11_comparisons_protocol_v3.py Stat11ComparisonsProtocolV3 --format=mp4 --disable_caching
Expected: 1920x1080 · 30 fps · H.264 · yuv420p
EOF
cat > "$ROOT/README.md" <<EOF
# Statistics 11 — Comparison Operators Protocol V3

Canonical ManimCE PQH package generated from the exact hashed source used in GitHub Actions.

- Scene: Stat11ComparisonsProtocolV3
- ManimCE: 0.20.1
- Final video: render/$FINAL_NAME
- PQL/PQH: literal protocol gates
- QA: ffprobe + full FFmpeg decode + dense audit frames
EOF
cd "$PROJECT_DIR/delivery"
zip -qr "$PACKAGE_NAME.zip" "$PACKAGE_NAME"
unzip -t "$PACKAGE_NAME.zip" > package_zip_test.txt
