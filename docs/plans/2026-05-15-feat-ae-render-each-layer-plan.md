---
date: 2026-05-15
type: feat
status: active
origin: docs/brainstorms/2026-05-15-ae-render-each-layer-brainstorm.md
---

# feat: Render Each Layer Individually (After Effects)

## Summary

Adds `ae/render_each_layer.jsx` — a single vanilla ExtendScript that, given the active comp, renders each target layer to its own output path with effects/transforms preserved and render range trimmed to that layer's in/out. Runtime dialog collects format, scope, strict-solo toggle, and output folder; defaults persist via `app.settings`. Smart-solo dependency resolution and per-layer state capture happen in pure helpers; H.264 routes through AME via `queueInAME`.

---

## Problem Frame

Pulling individual layers out of a comp as standalone renders today is a manual loop: solo the layer, set the work area to its in/out, queue the render, wait, restore solo state, repeat. For a dense comp this is slow and error-prone — easy to forget to restore state or mis-trim. The pain compounds when layers have track mattes, parents, or sit beneath adjustment layers — naive soloing produces renders that don't match what the layer is supposed to look like.

The repo already has strong precedent for the building blocks: `ae/rose_hobart.jsx` for dialog construction and `app.settings` persistence, and `ae/undersized_footage_finder.jsx` for render-queue orchestration with template apply and name-collision handling. This plan composes those patterns into a single-purpose layer-renderer.

(see origin: `docs/brainstorms/2026-05-15-ae-render-each-layer-brainstorm.md`)

---

## Requirements

**Run configuration (single startup dialog)**
- R1. One dialog at run start collects format, scope, dependency mode, output folder (origin R1).
- R2. Format options: PNG sequence, ProRes 4444 .mov, H.264 .mp4 (origin R2).
- R3. Scope options: selected / all / visible in active comp (origin R3).
- R4. Strict-solo checkbox toggles dependency mode per run (origin R4).
- R5. Dialog defaults persist across runs via `app.settings` (origin R5).

**Render behavior**
- R6. Each layer renders with its effects/styles/transforms preserved and render range trimmed to its in/out (origin R6, R7).
- R7. Smart-solo mode includes track-matte partner, adjustment layers above target, parent chain, and lights/cameras for 3D targets (origin R8).
- R8. Strict-solo mode includes only the target layer (origin R9).
- R9. Layer enabled/solo state and any temp-comp artifacts are captured/restored such that the project on disk matches its pre-run state regardless of success, cancel, or error (origin R10, R16).

**Output**
- R10. Default layout `<chosen>/<CompName>/<LayerName>/` per layer; movie files sit inside that folder (origin R11).
- R11. Layer names are sanitized for filesystem safety (origin R12).
- R12. Name collisions de-duplicate with numeric suffix; no overwrites (origin R13).
- R13. PNG/ProRes go through AE's render queue; H.264 routes through AME via `queueInAME(true)` (origin R14).

**Feedback and cancellation**
- R14. Script reports per-layer progress (N of M) (origin R15).
- R15. User cancellation (Esc during render, or dialog Cancel) restores state per R9 (origin R16).

---

## Key Technical Decisions

- **Sequential per-layer orchestration for PNG/ProRes (AE render queue).** For each target: snapshot comp state → enable target + dependency set → add one item to RQ with `timeSpanStart`/`timeSpanDuration` matching the layer's in/out → call `renderQueue.render()` → restore snapshot. Comp layer-enabled state is shared across the comp, so we cannot batch-queue items that each need different per-layer enabled sets. Sequential keeps state simple and project untouched. *(Per Phase 5.1.5 confirmation.)*
- **Temp-comp orchestration for H.264 (AME path).** `queueInAME(true)` hands the full RQ to AME in one shot and AME runs asynchronously to AE, so we cannot sequence per-layer state flips around it. For H.264: duplicate the active comp per target layer, configure each duplicate (enable target + deps, set comp work area to the layer's in/out), add each duplicate to the RQ, then call `queueInAME(true)` once. Temp comp names carry a `[render_each_layer]` suffix so they're identifiable for cleanup. *(See Risk Notes for the cleanup-timing trade-off.)*
- **Manual state snapshot + try/finally, not `app.beginUndoGroup`.** Snapshot is `[{layer, enabled, solo}, ...]` captured into a JS array before the per-layer mutation, restored in `finally`. Reasoning: `endUndoGroup()` after a render doesn't reliably roll back layer state when the user cancels mid-render, but a `finally` block does. Undo grouping is still used to bracket the mutations so the project's undo history isn't polluted by N individual flips. *(Per Phase 5.1.5 confirmation.)*
- **`rqItem.timeSpanStart` / `timeSpanDuration`, not comp work area, for PNG/ProRes range trimming.** Setting per-RQ-item time span avoids mutating (and needing to restore) `comp.workAreaStart`/`workAreaDuration`. H.264/AME path uses comp work area because the duplicate comp is throwaway.
- **`app.settings.saveSetting("render_each_layer", ...)` for persisted defaults.** Mirrors the `rose_hobart.jsx` precedent; wrapped in try/catch because `app.settings` access is gated by the "Allow Scripts to Write Files and Access Network" preference on some installs.
- **Format → template name mapping with try/catch fallback.** Format buttons map to AE output module template names (`"Best Settings"` + PNG sequence settings, `"ProRes 4444"`, `"H.264 - Match Render Settings - 15 Mbps"`). Each `applyTemplate` call is wrapped per the `undersized_footage_finder.jsx` precedent — if the user's AE doesn't have the named template, fall back to default output module settings and warn rather than crash.
- **Vanilla only for v1; AEQ variant deferred.** This script isn't selector-heavy; `rose_hobart.jsx` and `slitscan_masks.jsx` both ship vanilla-only. *(Per Phase 5.1.5 confirmation.)*

---

## High-Level Technical Design

*Directional guidance — orchestration shape only. Implementer should treat as context, not code to reproduce.*

Orchestration branches on format:

```
                  +------------------+
                  | Show dialog      |
                  | (format, scope,  |
                  |  strict-solo,    |
                  |  out folder)     |
                  +--------+---------+
                           |
                  +--------v---------+
                  | Resolve targets  |
                  | (scope + deps)   |
                  +--------+---------+
                           |
              +------------+------------+
              |                         |
       PNG / ProRes                  H.264
       (AE RQ path)                  (AME path)
              |                         |
   for each target layer:        for each target layer:
     snapshot comp                 duplicate comp
     enable target+deps            enable target+deps on dupe
     RQ add (timeSpan = in/out)    RQ add (workArea = in/out)
     renderQueue.render()          (collect dupes)
     restore snapshot              (no per-iteration state flips)
              |                         |
              |              queueInAME(true)  → hands off to AME
              |                         |
              |              (temp dupes persist until user cleans;
              |               see Risk Notes)
              +------------+------------+
                           |
                  +--------v---------+
                  | Summary alert    |
                  | (N rendered,     |
                  |  any skipped,    |
                  |  output path)    |
                  +------------------+
```

---

## Implementation Units

### U1. Dialog UI shell with persisted defaults

**Goal:** Build the ScriptUI dialog that gathers format / scope / strict-solo / output folder, loading defaults from `app.settings` on open and saving them on Apply.

**Requirements:** R1, R2, R3, R4, R5

**Dependencies:** none

**Files:** `ae/render_each_layer.jsx` (new)

**Approach:**
- Dialog structure mirrors `rose_hobart.jsx`: top-level `Window("dialog", ...)`, multiple `panel` children, Apply/Cancel button row at bottom.
- Panels: **Format** (radio group: PNG seq / ProRes 4444 / H.264), **Scope** (radio group: Selected / All / Visible), **Dependencies** (checkbox: "Strict solo (ignore mattes, adjustment layers, parents, lights/cameras)"), **Output** (statictext path label + "Browse..." button calling `Folder.selectDialog`).
- Settings section: `"render_each_layer"`. Keys: `format`, `scope`, `strict_solo`, `output_folder`. Each load wrapped in try/catch; missing keys fall back to documented defaults (PNG seq, Selected, smart-solo, no folder).
- Apply validates that an output folder is set (block with inline warning row, same pattern as rose_hobart's warning row); on success, returns settings object and writes settings back. Cancel returns null.
- Target-count statictext: shows how many layers will be processed given current scope choice. Recompute on scope-radio change.

**Patterns to follow:** `ae/rose_hobart.jsx:235-372` (dialog construction, settings helpers, warning row, Apply/Cancel flow).

**Test scenarios (manual verification — no test framework in repo):**
- Open dialog with no prior settings: defaults are PNG seq / Selected / smart-solo / no folder.
- Set values, Apply, re-run: previous values reload as defaults (incl. output folder if it still exists).
- Apply without an output folder: warning appears; Apply does not return.
- Browse opens a native folder picker; selection updates the path label.
- Change scope radio: target-count statictext updates to match.
- Cancel returns null; the calling code exits without touching the project.
- `app.settings` blocked by preference: dialog still works, defaults are documented values, no error.

**Verification:** Dialog opens, captures all four inputs, persists across runs, validates required fields, and returns a structured settings object (or null on cancel).

---

### U2. Layer scope + smart-solo dependency resolver

**Goal:** Pure helpers that, given the comp and dialog settings, produce (a) the ordered list of target layers and (b) for each target, the set of layers that must remain enabled during its render.

**Requirements:** R3 (scope), R7 (smart solo), R8 (strict solo)

**Dependencies:** U1 (consumes settings object)

**Files:** `ae/render_each_layer.jsx` (helpers within)

**Approach:**
- `getTargetLayers(comp, scopeMode)`:
  - `"selected"` → `comp.selectedLayers` in comp index order
  - `"all"` → every layer in `comp`
  - `"visible"` → every layer where `.enabled === true`
- `getDependencySet(comp, target, mode)` returns a layer-index Set:
  - Always: `target.index`
  - When `mode === "smart"`, add:
    - **Track matte partner:** if `target.hasTrackMatte === true`, add `target.index - 1` (AE positions matte sources immediately above the matted layer).
    - **Adjustment layers above:** scan layers at index `< target.index`, include each with `.adjustmentLayer === true`.
    - **Parent chain:** walk `target.parent` until null, adding each ancestor's index.
    - **3D lights/cameras:** if `target.threeDLayer === true`, include every layer that `instanceof CameraLayer` or `instanceof LightLayer`.
  - When `mode === "strict"`, return only the target's index.
- Both helpers are pure (no side effects) so they can be reasoned about and re-run during testing.

**Patterns to follow:** `ae/rose_hobart.jsx:154-167` (`getTargetLayers` shape, instanceof checks for layer types) and `ae/overlap_tiling_masks.jsx:31` (`layer.enabled` visibility test).

**Test scenarios (manual verification):**
- **Covers AE2.** Comp with target under an adjustment layer and with a track matte directly above: smart-mode dep set includes target + matte source + adjustment layer indices; strict-mode dep set is target only.
- **Covers AE3.** Same comp as above, strict mode: dep set is target only; matte and adjustment indices are excluded.
- Comp with target parented to a Null: smart-mode dep set includes both the target's index and the null's index.
- Comp with a 3D target plus a Camera and a Light: smart-mode dep set includes target + camera + light indices.
- Multi-level parent chain (target → parent → grandparent): smart-mode dep set includes all three indices.
- Scope `"selected"` with two selected layers in a 5-layer comp: target list has exactly those two, in comp order.
- Scope `"visible"` with three eye-icons off out of five: target list has exactly two.

**Verification:** Helpers return correct sets across the scenarios above without mutating comp state.

---

### U3. State snapshot/restore + filesystem helpers

**Goal:** Capture and restore comp layer state (enabled, solo); sanitize layer names for filesystem use; build collision-free output folder paths.

**Requirements:** R9 (state restoration), R10 (output layout), R11 (sanitization), R12 (collision de-dup)

**Dependencies:** none (pure helpers)

**Files:** `ae/render_each_layer.jsx` (helpers within)

**Approach:**
- `snapshotComp(comp)` → returns `{layers: [{layer, enabled, solo}, ...]}`. Captures references plus current state.
- `restoreComp(snapshot)` → writes back `enabled` and `solo` for each entry. Wrapped in its own try/catch so a single layer's restoration failure doesn't prevent the rest.
- `applyEnabledSet(comp, depIndexSet)` → sets every layer's `.enabled` such that those in the set are true and all others are false. Solo is left untouched (toggling enabled is sufficient and clearer in undo history).
- `sanitizeName(str)` → replace `[<>:"/\\|?*\x00-\x1f]` with `_`, collapse runs of `_`, trim trailing dots and spaces. Empty input returns `"layer"`.
- `buildOutputFolder(rootFolder, compName, layerName)` → `<root>/<sanitize(compName)>/<sanitize(layerName)>/`; if that folder already exists, try `<…>_2/`, `<…>_3/`, … until a non-existent path is found. Returns the resolved `Folder` (created on first write, not here).

**Patterns to follow:** `ae/undersized_footage_finder.jsx:187-195` (collision-handling shape with `usedNames` dedup; here we extend to disk-existence checks).

**Test scenarios (manual verification):**
- **Covers AE4.** Snapshot a comp where layers 1 and 3 are soloed, layers 2 and 5 are hidden; apply a new enabled set; restore; verify every layer's enabled/solo matches pre-snapshot.
- `sanitizeName("My/Layer:Name")` returns `"My_Layer_Name"`.
- `sanitizeName("")` returns `"layer"`.
- `sanitizeName("name....   ")` returns `"name"` (no trailing dots/spaces).
- **Covers AE5.** Given existing `<root>/MainComp/Logo/`, `buildOutputFolder(root, "MainComp", "Logo")` returns a Folder pointing at `<root>/MainComp/Logo_2/`; pre-existing folder untouched.
- Two different sanitized names that would normalize to the same path: each gets its own folder via the collision suffix.

**Verification:** Snapshot/restore is exact; sanitization handles known edge cases; collision de-dup never returns an existing path.

---

### U4. Render orchestration loop — PNG/ProRes path (AE render queue)

**Goal:** For PNG and ProRes formats, walk the target list and for each target: snapshot → apply enabled set → add to RQ → set time span and output → render that single item → restore. Aggregate progress and handle cancellation.

**Requirements:** R6, R9, R13 (RQ path), R14, R15

**Dependencies:** U1, U2, U3

**Files:** `ae/render_each_layer.jsx` (orchestration in main flow)

**Approach:**
- Per target layer (loop body wrapped in try/finally; `finally` calls `restoreComp`):
  1. `snapshot = snapshotComp(comp)`
  2. `applyEnabledSet(comp, getDependencySet(comp, layer, mode))`
  3. `rqItem = app.project.renderQueue.items.add(comp)`
  4. `rqItem.timeSpanStart = layer.inPoint`
  5. `rqItem.timeSpanDuration = layer.outPoint - layer.inPoint`
  6. `rqItem.outputModule(1).applyTemplate(templateNameForFormat(format))` (try/catch — see Key Technical Decisions)
  7. `rqItem.outputModule(1).file = buildOutputFolder(...).fsName + "/" + filename(format, layerName)`
  8. `app.project.renderQueue.render()` — blocks until this single item completes or the user cancels
  9. `finally`: `restoreComp(snapshot)`; if `rqItem.status === RQItemStatus.USER_STOPPED` (cancel), break the outer loop after restoration
- Progress: before each iteration, update an alert-substitute (write to `$.writeln` for the ExtendScript debugger console; final summary alert at end reports N rendered / M skipped / output root).
- After the loop, surface a final summary `alert()` listing per-layer outcome (rendered / cancelled / errored) and the output root folder.
- Cancellation: AE's native Esc-cancel on render returns control to the script with `rqItem.status` set; the try/finally guarantees restore.

**Patterns to follow:** `ae/undersized_footage_finder.jsx:152-215` (RQ item creation, output module file assignment, template apply with try/catch, post-run alert).

**Test scenarios (manual verification):**
- **Covers AE1.** Comp with a 2-second text layer + glow effect spanning 00:01:00–00:03:00; PNG seq format, scope = selected (with that layer selected): output folder exists at `<root>/<comp>/<layer>/`, contains exactly the right number of frames for 2 seconds at the comp frame rate, glow visible in frames, transparency outside the text.
- ProRes 4444 format on the same setup: single `.mov` file in the output folder, plays with alpha intact in a player that supports it.
- Three layers selected; render all: three output folders created; alert summary reports 3/3.
- **Covers AE4.** Mid-run cancel (Esc): the layer being rendered shows "cancelled" in summary; pre-run comp state is fully restored (layer enabled flags, solo flags); subsequent layers in the loop are not processed.
- Layer with effects + parent transform: render shows the effect applied and the parent-driven transform; matches the equivalent manual solo+render.
- Template-not-found case: simulate by changing the format → template mapping to a fake template name; render still produces output using AE's default output module; summary reports the fallback.

**Verification:** PNG seq and ProRes outputs land at the expected paths with correct durations and transparency; layer state is preserved across success, cancel, and error paths.

---

### U5. AME handoff (H.264 path), main entry point, and error handling

**Goal:** Wire all units together behind a `main()` with project/comp guards. For H.264 format, route to the temp-comp + AME orchestration path instead of the per-layer RQ loop.

**Requirements:** R13 (AME path), R14, R15, plus end-to-end integration of U1–U4

**Dependencies:** U1, U2, U3, U4

**Files:** `ae/render_each_layer.jsx` (main + AME path)

**Approach:**
- `main()`:
  1. Guard: `app.project.activeItem` must be a `CompItem`; else alert and return.
  2. Show dialog (U1). If cancelled, return.
  3. Resolve targets via U2's `getTargetLayers`. If empty, alert and return.
  4. Branch by format: PNG/ProRes → U4 path; H.264 → AME path below.
- AME path (H.264 only):
  1. For each target layer: duplicate the comp via `comp.duplicate()`, name dupe `<orig> [render_each_layer] [<layerName>]`.
  2. On each dupe, apply enabled set for that target's dependency set (no need to snapshot — dupe is throwaway).
  3. Set the dupe's `workAreaStart` / `workAreaDuration` to the layer's in/out (RQ items reference the comp's work area for time span when timeSpan isn't explicitly set; explicit `timeSpanStart`/`timeSpanDuration` on the RQ item still works as a belt-and-suspenders).
  4. Add the dupe to the RQ; set output file path; `applyTemplate("H.264 - Match Render Settings - 15 Mbps")` with try/catch fallback.
  5. After all dupes are queued: `app.project.renderQueue.queueInAME(true)` (`true` = start rendering immediately in AME).
  6. Surface a clear alert: "Sent N items to Adobe Media Encoder. Temp comps marked `[render_each_layer]` will remain in the project until AME finishes — delete them manually after AME completes." (See Risk Notes.)
- Top-level error handling wraps `main()` in try/catch + `app.beginUndoGroup`/`endUndoGroup` for the layer-mutation work (NOT for renders themselves), mirroring `rose_hobart.jsx:414-421`. Restoration is in finally blocks inside U4's loop, not relying on undo.
- Detect AME availability before queueing: if `app.project.renderQueue.queueInAME` is undefined (older AE versions), alert with a graceful message and abort the H.264 run. (See Outstanding Questions — exact API check needs verification.)

**Patterns to follow:** `ae/rose_hobart.jsx:376-421` (main guards, alert UX, undo-group wrapping); `ae/undersized_footage_finder.jsx:217-end` (main flow).

**Test scenarios (manual verification):**
- H.264 with 3 target layers: 3 temp comps appear in the project named with `[render_each_layer]` and the layer name; AME launches and processes 3 items; outputs land at the expected paths.
- After AME completes, temp comps remain in the project (documented limitation); deleting them manually does not affect the rendered files on disk.
- AME unavailable (simulate by guarding the call): script alerts with a clear message; no temp comps created.
- Run script with no comp active: clear "Please open a composition" alert; no project mutations.
- Run script on a comp with zero matching layers (e.g., scope = visible but everything is hidden): clear "No matching layers" alert; no project mutations.
- Throw an unexpected error mid-PNG run: caught by top-level handler; restoration still runs via U4's `finally`; user sees a friendly error message.

**Verification:** End-to-end run on a non-trivial comp produces correct outputs for every format mode; project state matches pre-run state for PNG/ProRes path; H.264 path leaves only the documented temp-comp artifacts and successfully hands off to AME.

---

## Scope Boundaries

Carried from origin's `## Scope Boundaries`:

- **One comp per run.** Active comp only; no multi-comp batching, no Render Queue inspection.
- **No per-layer overrides.** Format and dependency mode apply uniformly across the run.
- **No re-render detection beyond name collision.** Only path-collision dedup.
- **No custom render templates beyond format choice.** Format buttons map to fixed internal template names.
- **No nested-comp recursion.** Precomp layers render as single composited units.
- **No special handling for shy, locked, or guide layers.** Treated like any other layer.

### Deferred to Follow-Up Work

- **AEQuery parity variant (`ae/render_each_layer-aeq.jsx`).** Repo pattern for selector-heavy scripts; this script is light enough that vanilla suffices for v1. *(Per Phase 5.1.5 confirmation.)*
- **Automatic temp-comp cleanup after AME completes.** Requires polling AME status or a `Bridg`​`eTalk` callback; not in v1 scope. Documented manual cleanup instead.
- **Progress bar UI during PNG/ProRes runs.** AE doesn't block the script with a progress dialog during `renderQueue.render()`; for v1 we rely on AE's native render window. A ScriptUI progress palette could be added later if it earns its weight.

---

## Risk Notes

- **AME cleanup race.** The H.264 path leaves temp comps in the project until AME finishes (asynchronous, separate process). If the user closes the AE project before AME completes, AME may fail mid-render. v1 surfaces this via the post-handoff alert; v2 could detect and warn on project-close. Acceptable for a single-user creative tool.
- **`renderQueue.render()` blocks AE's UI.** While the per-layer render runs, the user can't interact with AE except via Esc-cancel. This is the standard AE behavior, not introduced by the script, but worth flagging — for very large comps the user shouldn't expect to multitask in AE during the run.
- **Output module template names are locale-dependent in some AE installs.** `"ProRes 4444"` and `"H.264 - Match Render Settings - 15 Mbps"` are typical names but may differ on non-English installs. The try/catch fallback prevents hard failure, but the fallback default output module may not produce the expected codec. Documented under Outstanding Questions for implementation-time validation.
- **`hasTrackMatte` heuristic.** AE's API reports `hasTrackMatte` on the matted layer; the matte source is by convention the layer immediately above (lower index). This convention is reliable in practice but is not enforced by the API — exotic comp arrangements could theoretically violate it. Smart-solo will pick the wrong layer in those cases; strict-solo is the user's escape hatch.

---

## Outstanding Questions (Deferred to Implementation)

- [Affects U4][Technical] Exact output module template names that ship by default in the user's AE version. Plan assumes `"H.264 - Match Render Settings - 15 Mbps"`, `"ProRes 4444"`, and PNG sequence via render-settings + output-module combination. Validate against the user's actual AE installation during U4 implementation; adjust mapping if needed.
- [Affects U5][Needs research] Whether `app.project.renderQueue.queueInAME` is reliably present in the AE version the user runs. AE 2014+ should have it; verify in implementation against the actual installed version.
- [Affects U2][Technical] Edge-case behavior when `target.parent` chain contains a layer that's also in the matted-track-matte pair. Likely degenerate; resolve when the test scenarios in U2 expose it (if ever).
- [Affects U4][Technical] Whether to use comp frame rate or duration as the basis for PNG-sequence frame-count expectations in the verification step. Decide while running the AE1 test scenario.
