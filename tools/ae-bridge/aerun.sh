#!/bin/zsh
# aerun.sh — run an ExtendScript .jsx inside the *already-running* After Effects on macOS,
# and surface any script error. This is the bridge that lets a terminal (or an AI agent)
# drive AE without the ExtendScript Debugger or manual "File > Run Script".
#
# Usage:
#   ./aerun.sh /abs/path/to/script.jsx
#   AE_APP="Adobe After Effects 2024" ./aerun.sh script.jsx      # target a different version
#
# How it works / why it's shaped this way (hard-won):
#   * AE is scriptable over AppleScript via `DoScript`. `DoScript` returns only a STATUS
#     code (0), NOT the script's return value — so your .jsx must WRITE its results to a
#     file, and the caller reads that file. (Remember file.encoding="UTF-8" before open("w").)
#   * We don't inline the script into the AppleScript string (escaping hell). Instead we send
#     a tiny fixed wrapper that reads the .jsx from disk and eval()s it, inside a try/catch
#     that writes any error to <script>.err. Without that catch, an uncaught or parse error
#     pops a MODAL error dialog in AE that blocks the AppleEvent queue (you'll then see
#     -1712 "AppleEvent timed out" and -609 "Connection is invalid" until it's dismissed).
#   * Always send `with timeout of N seconds` so a genuine long op doesn't fail at the 60s default.
#   * `saveFrameToPng` (and render-queue renders) run ASYNCHRONOUSLY — DoScript returns before
#     the PNGs are on disk. Poll the filesystem for completion; don't assume files exist on return.
#   * When counting output files in zsh, `ls out/foo_*.png` errors ("no matches found") on an
#     empty glob and can undercount. Prefer `find DIR -name 'foo_*.png' | wc -l`.
set -u
AE_APP="${AE_APP:-Adobe After Effects 2025}"
TIMEOUT="${AE_TIMEOUT:-600}"

if [ $# -lt 1 ]; then
  echo "usage: aerun.sh <script.jsx>" >&2
  exit 2
fi
SCR="$1"
if [ ! -f "$SCR" ]; then
  echo "aerun: no such script: $SCR" >&2
  exit 2
fi
ERR="${SCR%.jsx}.err"
rm -f "$ERR"

# Escape paths for a JS single-quoted literal, and the whole wrapper for an AppleScript
# double-quoted literal — so paths with apostrophes/backslashes/quotes (e.g. "Director's Tools")
# don't break the wrapper. Order matters: backslashes first, then the quote char.
js_sq() { local s=$1; s=${s//\\/\\\\}; s=${s//\'/\\\'}; printf '%s' "$s"; }
as_dq() { local s=$1; s=${s//\\/\\\\}; s=${s//\"/\\\"}; printf '%s' "$s"; }
SCR_JS=$(js_sq "$SCR"); ERR_JS=$(js_sq "$ERR")

WRAP="var __ERR='$ERR_JS'; try { var __f=new File('$SCR_JS'); __f.open('r'); var __c=__f.read(); __f.close(); eval(__c); } catch(e){ var __ef=new File(__ERR); __ef.encoding='UTF-8'; __ef.open('w'); __ef.write('ERR: '+e.toString()+' @line '+(e.line||'?')); __ef.close(); }"
WRAP_AS=$(as_dq "$WRAP")

osascript \
  -e "with timeout of ${TIMEOUT} seconds" \
  -e "tell application \"${AE_APP}\" to DoScript \"${WRAP_AS}\"" \
  -e "end timeout" >/dev/null 2>&1
rc=$?

if [ -f "$ERR" ]; then
  echo "JSX-ERROR: $(cat "$ERR")" >&2
  exit 1
fi
if [ $rc -ne 0 ]; then
  echo "aerun: osascript failed (rc=$rc) — is '$AE_APP' running? is a modal dialog open in AE?" >&2
  exit $rc
fi
exit 0
