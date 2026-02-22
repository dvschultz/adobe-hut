---
title: "feat: Recursive Scale Tunnel Effect"
type: feat
status: completed
date: 2026-02-22
origin: docs/brainstorms/2026-02-22-ae-recursive-scale-tunnel-brainstorm.md
---

# feat: Recursive Scale Tunnel Effect

## Overview

An After Effects script that takes a single selected layer and creates a tunnel/zoom effect by duplicating it at progressively smaller scales. Each duplicate is a fixed number of pixels smaller on the chosen dimension (width or height). An optional controller null enables animated offset of the entire tunnel.

## Problem Statement / Motivation

Creating a tunnel or recursive zoom effect in After Effects is tedious manual work: duplicate a layer, calculate the scale, position it, repeat dozens of times. This script automates the entire process with a single dialog, producing consistent results in seconds. The optional controller null gives the user keyframeable or expression-driven animation of the tunnel's position without manually linking layers.

## Proposed Solution

A single vanilla ExtendScript file (`ae/recursive_scale_tunnel.jsx`) following the established repo patterns: IIFE wrapper, `#target aftereffects`, ScriptUI dialog, undo group, try/catch error handling, results alert.

### Script Flow

1. Validate: active composition, single selected layer, layer is resizable (AVLayer with source)
2. Show dialog: step size (px), minimum size (px), dimension (width/height), controller null (checkbox)
3. Calculate rendered dimension from source dimension and current scale
4. Calculate duplicate count: `floor((renderedDim - minSize) / step)`
5. If count is 0, alert and exit
6. If count > 50, confirm dialog before proceeding (performance warning)
7. Check for existing tunnel layers (by name prefix) and prompt for replacement
8. Create duplicates in smallest-to-largest order (so smallest ends up on top of stack)
9. Set scale on each duplicate: `((renderedDim - i * step) / sourceDim) * 100`
10. Name duplicates with prefix: `RST__[OriginalName] 01`, `RST__[OriginalName] 02`, etc.
11. If controller checkbox is on: create null, apply offset expression to all duplicates AND the original
12. Show results alert

### File

- `ae/recursive_scale_tunnel.jsx` — single new file

## Technical Considerations

### Scaling Math

The script must account for layers that are not at 100% scale. Use the **rendered dimension**, not source dimension, as the starting point:

```
renderedDim = sourceDim * currentScale / 100
```

For non-uniform scale (e.g., `[120, 80]`), use the scale axis that matches the user's dimension choice: `scaleX` for width, `scaleY` for height. Duplicates are set to uniform scale based on the calculated percentage.

For 3D layers, check `layer.threeDLayer` and use `[pct, pct, pct]` instead of `[pct, pct]` for the Scale value.

Read `Scale.value` (current time indicator), matching what the user sees in the viewport.

### Controller Null Expression (Critical)

The expression must be an **offset**, not a direct position replacement. A direct replacement (`thisComp.layer("Tunnel Offset Controller").transform.position`) would collapse all duplicates to the same point, destroying the tunnel layout.

Correct expression:

```javascript
var ctrl = thisComp.layer("Tunnel Offset Controller");
var offset = ctrl.transform.position - [thisComp.width/2, thisComp.height/2];
value + offset;
```

When the null is at comp center (its default position), the offset is `[0, 0]` and duplicates stay in place. When the null moves, all layers shift uniformly. The null's default position is set to `[comp.width/2, comp.height/2]` on creation.

Apply this expression to **both duplicates and the original layer** so the entire tunnel moves together.

The controller null is placed at the top of the layer stack (index 1 direction) for easy access.

### Layer Ordering

`layer.duplicate()` places the copy directly above the source layer. If we always duplicate from the original layer, each new duplicate appears just above the original while previous duplicates remain higher in the stack:

- Trace: original at index N → dup1 at N, original at N+1 → dup2 at N+1, original at N+2 → ...
- Result: dup1 (created first) at top, dup_last (created last) just above original

To get smallest on top, create the **smallest duplicate first** (loop from `i = maxCount` down to `i = 1`). This way the first-created (smallest) layer ends up highest in the stack.

### Layer Type Validation

Only accept AVLayer instances with a valid source. Guard using the existing `isResizableLayer` pattern from `resize_layers.jsx`:
- Reject: locked, null, adjustment, camera, light, shape, text layers
- Reject: layers without `.source.width`

### Re-Run Safety

Use a name prefix `RST__` (Recursive Scale Tunnel) on all generated layers. On re-run, detect existing `RST__` layers and prompt the user: "Previous tunnel layers found. Replace them?" Following the pattern from `wallpaper_pattern_loop.jsx` (lines 683-692).

### Parenting

Duplicates inherit the original layer's parent. This is acceptable for the default tunnel effect. The spec does not require special parenting behavior.

### Existing Scale Keyframes

If the original layer has scale keyframes, warn the user: the tunnel will be based on the scale at the current time indicator and duplicates will have static scale values. Duplicates do not inherit keyframes from `setValue()`.

### Performance

Follow the `wallpaper_pattern_loop.jsx` pattern: if duplicate count exceeds 50, show a confirmation dialog before proceeding. For very large counts, AE may become unresponsive.

## Acceptance Criteria

- [x] Script runs from File > Scripts > Run Script File in After Effects
- [x] Dialog appears with: step size input, minimum size input, width/height radio buttons, controller null checkbox
- [x] Validates single selected layer is an AVLayer with a valid source
- [x] Correctly calculates rendered dimension accounting for current layer scale
- [x] Creates the correct number of duplicates based on step and minimum size
- [x] Each duplicate has the correct uniform scale value
- [x] Layer stack order: smallest duplicate on top, original at bottom of tunnel group
- [x] Duplicates named with `RST__` prefix and zero-padded index
- [x] Controller null (when enabled) is created at comp center, placed at top of stack
- [x] Controller null expression is an offset (not direct position), applied to duplicates AND original
- [x] Moving the controller null shifts the entire tunnel uniformly
- [x] 3D layers supported with 3-value scale array
- [x] Zero duplicates case shows a clear alert message
- [x] Large duplicate count (>50) triggers a confirmation dialog
- [x] Re-run detects existing `RST__` layers and prompts for replacement
- [x] Entire operation is wrapped in a single undo group
- [x] Results alert shows: duplicate count, scale range, controller status

## Success Metrics

- Tunnel effect is visually correct: concentric layers decreasing in size toward center
- Single Cmd+Z undoes the entire operation
- Controller null animates the full tunnel as expected

## Dependencies & Risks

- **No external dependencies** — vanilla ExtendScript, no library includes
- **Risk: AE performance** — mitigated by the 50-duplicate confirmation threshold
- **Risk: Expression errors** — if the user renames the controller null, expressions break. Mitigated by using a clear, distinctive name

## Implementation Sections

The script follows the established repo structure:

```
// ========== UTILITY FUNCTIONS ==========
// isResizableLayer(), parsePositiveFloat(), parsePositiveInt()

// ========== DIALOG ==========
// showDialog() — returns settings object or null

// ========== CORE FUNCTIONS ==========
// getExistingTunnelLayers(), removeExistingTunnelLayers()
// calculateDuplicateCount(), createTunnel(), createControllerNull()

// ========== USER FEEDBACK ==========
// showResults()

// ========== MAIN FUNCTION ==========
// main() — orchestrates validation, dialog, creation, feedback

// ========== EXECUTE ==========
// app.beginUndoGroup() + try/catch + app.endUndoGroup()
```

## Sources & References

- **Origin brainstorm:** [docs/brainstorms/2026-02-22-ae-recursive-scale-tunnel-brainstorm.md](docs/brainstorms/2026-02-22-ae-recursive-scale-tunnel-brainstorm.md) — key decisions: fixed pixel step, smallest on top, controller null for offset, single layer input, uniform offset
- Similar patterns: `ae/resize_layers.jsx` (scale math, dialog, layer validation), `ae/wallpaper_pattern_loop.jsx` (re-run safety, expression application, performance warnings)
- Scale manipulation: `ae/resize_layers.jsx:160`
- Expression application: `ae/wallpaper_pattern_loop.jsx:643-662`
- Re-run detection: `ae/wallpaper_pattern_loop.jsx:298-318, 683-692`
- Input validation helpers: `ae/wallpaper_pattern_loop.jsx:29-45`
- Layer type guard: `ae/resize_layers.jsx:15-32`
