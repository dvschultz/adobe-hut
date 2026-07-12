# ae-bridge

Drive the **already-running** After Effects on macOS from the terminal (or an AI agent) —
no ExtendScript Debugger, no manual *File → Run Script*. Also: render frames and build
preview movies without the render queue UI.

## Requirements
- macOS, After Effects open with a project.
- First run may trigger a one-time macOS "allow Terminal to control After Effects" prompt — approve it.
- AE preference **Scripting & Expressions → Allow Scripts to Write Files and Access Network** must be ON (it is by default) for scripts to write result files.
- `render-preview.sh` needs `ffmpeg` (and uses `ImageMagick`/`magick` if present).

## `aerun.sh` — run a .jsx in AE

```sh
./aerun.sh /abs/path/to/script.jsx
AE_APP="Adobe After Effects 2024" ./aerun.sh script.jsx   # target another version
AE_TIMEOUT=900 ./aerun.sh long_job.jsx                     # raise AppleEvent timeout (default 600s)
```

`DoScript` returns only a status code, **not** your script's return value. So the pattern is:
your `.jsx` **writes its results to a file**, and you read that file afterward.

```jsx
// mydump.jsx
(function () {
  var out = { name: app.project.activeItem.name };
  var f = new File("/tmp/out.json"); f.encoding = "UTF-8"; f.open("w");
  f.write(out.toSource());   // ES3-friendly; parse with a JSON lib or a small regex on the caller side
  f.close();
})();
```
```sh
./aerun.sh mydump.jsx && cat /tmp/out.json
```

## `render-preview.sh` — comp → preview MP4

```sh
./render-preview.sh --comp "my-comp" [--start 0 --end 300] [--out ~/Desktop/preview.mp4] \
                    [--scale 2] [--audio] [--fps 29.97]
```
Renders each frame with `saveFrameToPng`, composites over black, scales, and (with `--audio`)
renders the comp's audio to AIFF and muxes it. Good for quickly eyeballing motion/cutting.

## Gotchas baked into these scripts (so you don't rediscover them)
- **DoScript returns status only** → write results to a file; read it back.
- **Uncaught/parse errors pop a modal dialog** that freezes AE's AppleEvent queue (you'll see
  `-1712 AppleEvent timed out`, then `-609 Connection is invalid`). `aerun.sh` wraps your script
  in a try/catch that writes the error to `<script>.err` instead. If AE ever goes unresponsive,
  check for a dialog and dismiss it.
- **`saveFrameToPng` is asynchronous** — a DoScript loop of N frames returns almost immediately;
  AE writes the PNGs in the background over the next seconds. **Poll the filesystem** until the
  count is stable before assembling.
- **zsh empty-glob** — `ls out/frame_*.png | wc -l` errors and can read 0 even when files exist.
  Use `find out -name 'frame_*.png' | wc -l`.
- **Don't double-launch** a background render pipeline that `rm -rf`s its output dir — a second
  copy will wipe the first's in-flight frames. Guard with a lockfile / run exactly one.

## Related in-AE scripts
- `../../ae/clip-path-sequencer.jsx` — lay time-sequential clips along a cell path (figure-8, etc.)
- `../../ae/grid-auto-layout.jsx` — presence-driven dynamic grid layout
