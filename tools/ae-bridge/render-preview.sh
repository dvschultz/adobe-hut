#!/bin/zsh
# render-preview.sh — render a comp to a preview MP4 via the AE bridge + ffmpeg.
#
#   ./render-preview.sh --comp "my-comp" [--start F0] [--end F1] [--out PATH]
#                       [--scale N] [--audio] [--fps X]
#
#   --comp   (required) exact comp name in the open project
#   --start/--end  frame range (default: whole comp)
#   --out    output mp4 (default: ~/Desktop/<comp>_preview.mp4)
#   --scale  integer upscale factor for the rendered frames (default 1)
#   --audio  render the comp's audio (AIFF) and mux it (needs the "AIFF 48kHz" OM template)
#   --fps    output fps (default: comp fps reported by AE)
#
# Frames render at the comp's current *resolution* (Third/Half/Full) — set the comp to Full
# for a crisp preview. Composited over black. Single-instance (lockfile) so it can't wipe itself.
set -u
HERE="${0:A:h}"
AERUN="$HERE/aerun.sh"
LOCK="/tmp/ae_render_preview.lock"

COMP=""; F0=""; F1=""; OUT=""; SCALE=1; AUDIO=0; FPS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --comp) COMP="$2"; shift 2;;
    --start) F0="$2"; shift 2;;
    --end) F1="$2"; shift 2;;
    --out) OUT="$2"; shift 2;;
    --scale) SCALE="$2"; shift 2;;
    --audio) AUDIO=1; shift;;
    --fps) FPS="$2"; shift 2;;
    *) echo "unknown arg: $1" >&2; exit 2;;
  esac
done
[ -z "$COMP" ] && { echo "render-preview: --comp is required" >&2; exit 2; }

if [ -e "$LOCK" ] && kill -0 "$(cat "$LOCK" 2>/dev/null)" 2>/dev/null; then
  echo "render-preview: another render is already running (lock $LOCK)"; exit 0
fi
echo $$ > "$LOCK"; trap 'rm -f "$LOCK"' EXIT

OUTDIR="$(mktemp -d "/tmp/ae-preview-XXXXXX")/"
AUDIO_AIF=""
[ "$AUDIO" = "1" ] && AUDIO_AIF="/tmp/ae_preview_audio.aif"

# params for render-frames.jsx
{
  echo -n "var RP={comp:\"$COMP\", "
  echo -n "f0:${F0:-null}, f1:${F1:-null}, "
  echo -n "outdir:\"$OUTDIR\", "
  echo -n "audioOut:$([ -n "$AUDIO_AIF" ] && echo "\"$AUDIO_AIF\"" || echo null)};"
} > /tmp/ae_render_params.jsx

rm -f /tmp/ae_render_done.json
echo "rendering '$COMP' frames (audio=$AUDIO)…"
"$AERUN" "$HERE/render-frames.jsx" || { echo "render-frames failed"; exit 1; }

# read resolved range/size
for i in $(seq 1 20); do [ -f /tmp/ae_render_done.json ] && break; sleep 0.5; done
read RF0 EXPECT CFPS < <(python3 -c "
import re
s=open('/tmp/ae_render_done.json').read()
def g(k,d):
    m=re.search(k+r':([0-9.]+)',s); return m.group(1) if m else d
print(g('f0','0'), g('expected','0'), g('fps','30'))
")
[ -z "$EXPECT" -o "$EXPECT" = "0" ] && { echo "render-frames reported no frames (comp not found?)"; cat /tmp/ae_render_done.json; exit 1; }
[ -z "$FPS" ] && FPS="$CFPS"

# poll until all frames are on disk (saveFrameToPng is async)
prev=-1; stable=0
for i in $(seq 1 400); do
  n=$(find "$OUTDIR" -maxdepth 1 -name 'frame_*.png' | wc -l | tr -d ' ')
  [ "$n" -ge "$EXPECT" ] && { echo "frames complete: $n/$EXPECT"; break; }
  [ $((i % 10)) -eq 0 ] && echo "  …$n/$EXPECT"
  if [ "$n" -eq "$prev" ] && [ "$n" -gt 0 ]; then stable=$((stable + 1)); else stable=0; fi
  prev=$n
  [ "$stable" -ge 20 ] && { echo "stalled at $n/$EXPECT"; break; }
  sleep 2
done

FIRST=$(find "$OUTDIR" -maxdepth 1 -name 'frame_*.png' | sort | head -1)
read PW PH < <(magick "$FIRST" -format "%w %h" info: 2>/dev/null || sips -g pixelWidth -g pixelHeight "$FIRST" | awk '/pixel/{print $2}' | paste -sd' ' -)
OW=$((PW * SCALE)); OH=$((PH * SCALE))
[ -z "$OUT" ] && OUT="$HOME/Desktop/${COMP}_preview.mp4"
OFFSET=$(awk -v a="${RF0:-0}" -v b="${CFPS:-30}" 'BEGIN{printf "%.6f", a/b}')

echo "assembling ${OW}x${OH} @ ${FPS}fps -> $OUT"
if [ "$AUDIO" = "1" ] && [ -f "$AUDIO_AIF" ]; then
  ffmpeg -y -framerate "$FPS" -start_number "${RF0:-0}" -i "$OUTDIR/frame_%05d.png" \
    -f lavfi -i "color=c=black:s=${PW}x${PH}:r=${FPS}" \
    -ss "$OFFSET" -i "$AUDIO_AIF" \
    -filter_complex "[1][0]overlay=shortest=1,scale=${OW}:${OH}:flags=neighbor,format=yuv420p[v]" \
    -map "[v]" -map 2:a:0 -c:v libx264 -crf 20 -c:a aac -b:a 192k -shortest -movflags +faststart "$OUT" 2>&1 | tail -2
else
  ffmpeg -y -framerate "$FPS" -start_number "${RF0:-0}" -i "$OUTDIR/frame_%05d.png" \
    -f lavfi -i "color=c=black:s=${PW}x${PH}:r=${FPS}" \
    -filter_complex "[1][0]overlay=shortest=1,scale=${OW}:${OH}:flags=neighbor,format=yuv420p[v]" \
    -map "[v]" -c:v libx264 -crf 20 -pix_fmt yuv420p -movflags +faststart "$OUT" 2>&1 | tail -2
fi
echo "done: $OUT"
ls -la "$OUT" 2>/dev/null
