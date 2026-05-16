---
date: 2026-05-15
topic: ae-render-each-layer
---

# After Effects: Render Each Layer Individually

## Summary

An After Effects script that solos each layer in the active comp and renders it as its own output, preserving the layer's effects, transforms, and styles, with the render range trimmed to that layer's in/out point. The user chooses output format, layer scope, and dependency-handling behavior in a single runtime dialog.

---

## Problem Frame

Pulling individual layers out of a comp as standalone renders today is manual: solo the layer, set the work area to its in/out, queue the render, wait, restore solo state, repeat for every layer. For a dense comp this is a lot of repetitive UI work, and it's easy to forget to restore state or to mis-trim the work area. The pain compounds when the layers in question have track mattes, parents, or sit beneath adjustment layers — naive soloing produces renders that don't match what the layer is supposed to look like.

---

## Requirements

**Run configuration (single startup dialog)**
- R1. Script presents a single dialog at run start that collects: output format, layer scope, dependency-handling mode, and output folder.
- R2. Output format options include at least PNG sequence, ProRes 4444 .mov (alpha), and H.264 .mp4 (no alpha). Format choice determines whether transparency is preserved.
- R3. Layer scope options are: selected layers in active comp, all layers in active comp, all visible layers in active comp.
- R4. Dependency handling defaults to "smart solo" with a "strict solo" checkbox in the dialog to override per run.
- R5. The dialog remembers the previous run's choices as defaults.

**Render behavior**
- R6. For each target layer, the script renders the active comp with only the target layer (plus any dependencies kept by the current mode) enabled, with render range trimmed to that layer's in-point and out-point.
- R7. The target layer keeps its position, scale, rotation, opacity, blending mode, effects, layer styles, and time remapping during render.
- R8. When dependency mode is "smart solo", the script keeps enabled: the target layer, its track matte partner (the layer immediately above when the target uses a track matte), any adjustment layer positioned above the target in the stack, the target's parent chain (all ancestors), and any 3D lights and cameras in the comp if the target is a 3D layer.
- R9. When dependency mode is "strict solo", only the target layer itself is enabled; everything else in the comp is hidden.
- R10. The script never leaves the project in a modified state. Layer enabled/visibility flags, solo flags, and comp work area are captured before each render and restored after, including if rendering is cancelled or errors out.

**Output**
- R11. Default output layout is `<chosen-folder>/<CompName>/<LayerName>/` per layer, with the layer's render(s) inside that subfolder. PNG sequence frames sit inside the folder; movie files sit inside the folder as a single file.
- R12. Layer names are sanitized for filesystem safety (illegal characters replaced) before being used as folder or file names.
- R13. Name collisions (two layers with the same sanitized name, or a re-run over an existing output) are de-duplicated with a numeric suffix on the folder name. The script does not overwrite existing output.
- R14. H.264 output routes through Adobe Media Encoder (since the AE render queue cannot write H.264 directly in modern AE); PNG and ProRes route through the AE render queue.

**Feedback and cancellation**
- R15. The script reports progress as it queues/renders each layer (which layer is rendering, count of N of M).
- R16. The user can cancel mid-run. Cancellation triggers the same project-state restoration as a successful completion (R10).

---

## Acceptance Examples

- AE1. **Covers R6, R7.** Given a comp containing a 2-second text layer with a glow effect starting at 00:01:00 and ending at 00:03:00, when the script renders that layer, the output is a 2-second render of just that text layer with its glow effect intact, transparent everywhere the text isn't, and the render duration matches the layer's 2-second span — not the comp's full duration.
- AE2. **Covers R4, R8.** Given a target layer that has a track matte above it and sits under an adjustment layer, when the script runs in smart-solo mode, the output includes both the track-matte effect and the adjustment-layer effect applied to the target.
- AE3. **Covers R4, R9.** Given the same setup as AE2, when the script runs with the strict-solo checkbox enabled, the output contains only the target layer with no track matte and no adjustment-layer effect.
- AE4. **Covers R10, R16.** Given a comp where several layers are soloed and others are hidden before running the script, when the script completes (or the user cancels mid-run), every layer's enabled/solo flag and the comp's work area match the values they held before the script started.
- AE5. **Covers R13.** Given a previous run already produced `<chosen>/MainComp/Logo/`, when the script is re-run for the same layer to the same chosen folder, the new output lands in `<chosen>/MainComp/Logo_2/` and the original folder is untouched.

---

## Success Criteria

- A render that previously took ~30+ minutes of manual solo/trim/queue/restore for a comp full of layers can be triggered in under a minute of dialog input, with output that matches what the manual process would have produced.
- Re-runs are safe: the project state on disk and in the open file is identical before and after, and existing outputs are never silently overwritten.
- Downstream planning (`ce-plan`) does not need to revisit product behavior — only implementation choices (render queue templating, AME bridge mechanics, dialog construction, state-capture data structure).

---

## Scope Boundaries

- **One comp per run.** The active comp only. No multi-comp batching, no walking the Render Queue, no project-wide loops.
- **No per-layer overrides.** Format and dependency mode apply uniformly to every layer in the run. If the user needs different settings for different layers, they run the script multiple times.
- **No re-render detection beyond name collision.** The script doesn't compare timestamps, hashes, or layer contents to decide whether to skip — it only de-duplicates output paths.
- **No custom render templates beyond the format choice.** No exposing the full AE output module / render settings template picker. The format buttons map to fixed internal templates.
- **No nested-comp recursion.** A precomp layer is treated as a single layer (renders the precomp's composited output). The script does not descend into the precomp and render its layers individually.
- **No special handling for shy, locked, or guide layers.** They're treated like any other layer; if they're in the chosen scope, they render.

---

## Key Decisions

- **Runtime dialog for format, scope, and strict-solo toggle.** Avoids hardcoding choices the user wants to vary per run, while keeping it to one dialog rather than a wizard. Defaults remembered between runs make the common case fast.
- **Smart-solo as the default dependency mode.** The painful failure mode of naive soloing is silent visual incorrectness (missing matte, missing color grade from an adjustment layer). Smart solo defends against that; strict solo is available for users who want the cleanest possible isolation and know what they're doing.
- **Folder-per-layer even for single-file movie formats.** Keeps output layout consistent across formats, makes collision de-dup uniform, and makes it trivial for the user to add sidecar files (preview, notes) per layer later.
- **No overwrite by default.** Renders are slow; accidentally clobbering an old one is expensive. De-duplicate with a numeric suffix and let the user clean up.
- **H.264 via AME, PNG and ProRes via the AE render queue.** Reflects what each pipeline can actually do in modern AE; mixing both gives format flexibility without forcing everything through AME.

---

## Dependencies / Assumptions

- Adobe Media Encoder is installed and reachable via BridgeTalk on machines where H.264 output is selected. If AME is unavailable, the script should detect this and either offer ProRes/PNG fallback or report cleanly rather than failing mid-render. *(Unverified — script will need to check at runtime.)*
- The user is on a recent enough After Effects version (≥ CC 2023) for the assumed render queue + AME behavior. Older AE versions may still support direct H.264 from the render queue but aren't a target.
- ExtendScript (ES3) is the script runtime, consistent with the rest of `ae/` in this repo (per `CLAUDE.md`).

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1, R5][Technical] Where to persist remembered dialog defaults — app settings (`app.settings.saveSetting`), a JSON file alongside the project, or a hidden item in the project. Repo precedent in `rose_hobart.jsx` may inform the choice.
- [Affects R8][Technical] Exact rules for detecting "the parent chain" and "any 3D lights/cameras" — straightforward in concept but needs verification of the AE API surface (`Layer.parent`, `Layer.threeDLayer`, `CameraLayer`/`LightLayer` classes) and tested behavior on parented camera/light hierarchies.
- [Affects R14][Needs research] BridgeTalk handshake details for sending the right AME job format (queue from AE → AME, or write AEP → AME → render). Both are possible; planning needs to pick one and verify on the target AE version.
- [Affects R10][Technical] Whether to capture/restore via an undo group, manual state snapshot, or both. Manual snapshot is more robust to cancellation; undo group is simpler but cancellation behavior is less predictable.
- [Affects R6][Technical] Whether to use the comp's work area, layer in/out as render range, or per-render trim via render settings — AE offers a few equivalent paths and one will be cleaner.
