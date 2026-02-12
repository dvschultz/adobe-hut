---
title: "feat: Add overlap tiling masks script for After Effects"
type: feat
date: 2026-02-11
brainstorm: docs/brainstorms/2026-02-11-overlap-tiling-masks-brainstorm.md
---

# feat: Add overlap tiling masks script for After Effects

## Overview

An After Effects ExtendScript that scans the active composition for temporally overlapping video layers and automatically applies keyframed rectangular masks to tile them on screen. When clips share the same time range, each is masked to reveal only its tile portion (e.g., left half / right half). When a clip is alone on the timeline, its mask expands to full-frame. The user chooses the layout mode (vertical columns, horizontal rows, or grid) via a dialog.

## Problem Statement

When building collages or montages in After Effects, artists manually place overlapping clips on the timeline and then tediously create and keyframe masks by hand so each clip occupies a portion of the frame during overlap periods. This is repetitive and error-prone — especially when the overlap pattern changes throughout the timeline (e.g., 2 clips overlap, then 3, then 1 alone, then 2 again). Automating this saves significant manual work.

## Proposed Solution

A single vanilla ExtendScript (`.jsx`) that:

1. Validates the active composition and collects qualifying video layers
2. Presents a dialog for layout mode selection
3. Builds a timeline segmentation from all layer in/out points
4. Computes tile rectangles per segment based on overlap count and layout mode
5. Creates one named mask per layer with keyframed mask paths at each transition point
6. Reports results to the user

## Technical Approach

### Architecture

**File:** `ae/overlap_tiling_masks.jsx`

Follows existing repo conventions:
- `#target aftereffects` directive
- IIFE wrapper `(function() { ... })()`
- Section headers: `UTILITY FUNCTIONS`, `LAYER FILTERING`, `TIMELINE SEGMENTATION`, `TILING MATH`, `MASK APPLICATION`, `DIALOG`, `USER FEEDBACK`, `MAIN FUNCTION`, `EXECUTE`
- `app.beginUndoGroup("Overlap Tiling Masks")` / `app.endUndoGroup()`
- `try/catch` in execute block with `alert()` on error

### Implementation Phases

#### Phase 1: Layer Collection and Filtering

**Functions:**
- `isVideoLayer(layer)` — returns `true` for layers that are visual video content

**Filter criteria (include if ALL true):**
- `layer.enabled === true` (eye icon on)
- `layer.locked === false`
- `layer.nullLayer === false`
- `layer.adjustmentLayer === false`
- Not `instanceof CameraLayer`
- Not `instanceof LightLayer`
- Not `instanceof ShapeLayer`
- Not `instanceof TextLayer`
- `layer.hasVideo === true`
- `layer.source` exists and is `instanceof FootageItem` OR `instanceof CompItem` (includes precomps, excludes solids via `!(layer.source.mainSource instanceof SolidSource)`)

**Locked layer handling:** Skip locked layers, collect their names for the results summary.

**Reference patterns:**
- `ae/resize_layers.jsx:15-32` — `isResizableLayer()` filter function
- `ae/undersized_footage_finder.jsx:70-74` — `FootageItem` source check
- `ae/trim_and_resequence.jsx:78-109` — `collectLayerData()` with sorting

**Collect as array of objects:**

```javascript
{
    layer: layer,        // AVLayer reference
    index: layer.index,  // 1-based layer index (for ordering)
    inPoint: roundedInPoint,
    outPoint: roundedOutPoint
}
```

Sort by `layer.index` ascending (top-down in the stack = index 1, 2, 3...).

#### Phase 2: Timeline Segmentation

**Core algorithm:** Sweep-line approach to find all unique time boundaries.

**Function:** `buildSegments(layerData, comp)`

1. **Round times to frame boundaries** to eliminate floating-point issues:
   ```javascript
   function roundToFrame(time, frameRate) {
       return Math.round(time * frameRate) / frameRate;
   }
   ```
   Apply to all `inPoint` and `outPoint` values during collection.

2. **Collect all unique transition times** from `inPoint` and `outPoint` of every layer. Add to a set (object keys), sort ascending.

3. **Build segments:** Each consecutive pair of transition times `[t_start, t_end)` defines a segment. For each segment, determine which layers are visible:
   - A layer is visible in segment `[t_start, t_end)` if `layer.inPoint <= t_start` AND `layer.outPoint > t_start`
   - **outPoint is exclusive** — a layer ending at time T is NOT visible at time T

4. **Output:** Array of segment objects:
   ```javascript
   {
       startTime: t_start,
       endTime: t_end,
       visibleLayers: [layerData1, layerData2, ...]  // sorted by layer index
   }
   ```

5. **Filter out segments with 0 visible layers** (gaps between clips).

**Edge cases handled:**
- Zero-duration layers (`inPoint === outPoint`) — excluded during collection
- Single-frame segments — valid, will get keyframes at both boundaries
- Layers flush with comp start/end — handled naturally by the sweep

#### Phase 3: Tiling Math

**Functions:**
- `computeTileRects(visibleCount, layoutMode, compWidth, compHeight)` — returns array of `{x, y, width, height}` rectangles
- `computeGridDimensions(n)` — returns `{cols, rows}` for grid mode

**Layout modes:**

| Mode | Algorithm |
|------|-----------|
| **Vertical columns** | Each tile is `compWidth / n` wide, full height. Tile `i` starts at `x = i * tileWidth` |
| **Horizontal rows** | Each tile is full width, `compHeight / n` tall. Tile `i` starts at `y = i * tileHeight` |
| **Grid** | `cols = Math.ceil(Math.sqrt(n))`, `rows = Math.ceil(n / cols)`. Each cell is `compWidth / cols` by `compHeight / rows`. Fill left-to-right, top-to-bottom. |

**Grid dimension table (for reference):**

| n | cols | rows | empty cells |
|---|------|------|-------------|
| 2 | 2 | 1 | 0 |
| 3 | 2 | 2 | 1 |
| 4 | 2 | 2 | 0 |
| 5 | 3 | 2 | 1 |
| 6 | 3 | 2 | 0 |
| 7 | 3 | 3 | 2 |
| 8 | 3 | 3 | 1 |
| 9 | 3 | 3 | 0 |

**Tile assignment:** Layer with the lowest index (topmost in stack) gets tile 0 (leftmost / topmost), next layer gets tile 1, etc.

**Pixel rounding:** Round tile boundaries to whole pixels. Distribute remainder to the last tile:
```javascript
var tileWidth = Math.floor(compWidth / cols);
// Last column gets the remainder
// tile[cols-1].width = compWidth - (tileWidth * (cols - 1));
```

**Full-frame rect:** When a segment has only 1 visible layer, the tile rect is `{x: 0, y: 0, width: compWidth, height: compHeight}`.

#### Phase 4: Mask Application

**Function:** `applyMasks(layerData, segments, layoutMode, compWidth, compHeight)`

**Algorithm:**

1. **Clean up existing script masks:** For each qualifying layer, iterate its masks. Remove any mask named `"Tile Mask"`. This enables safe re-runs.
   ```javascript
   var masks = layer.property("ADBE Mask Parade");
   for (var m = masks.numProperties; m >= 1; m--) {
       if (masks.property(m).name === "Tile Mask") {
           masks.property(m).remove();
       }
   }
   ```
   (Iterate in reverse to avoid index shifting.)

2. **Build per-layer keyframe schedule:** For each layer, walk through segments where that layer is visible. At each segment boundary, record `{time, tileRect}`. Also record the tile rect for the segment BEFORE the first overlap (full-frame) and AFTER the last overlap (full-frame) if the layer extends beyond.

3. **Create one mask per layer:**
   ```javascript
   var masks = layer.property("ADBE Mask Parade");
   var newMask = masks.addProperty("ADBE Mask Atom");
   newMask.name = "Tile Mask";
   newMask.maskMode = MaskMode.ADD;
   ```

4. **Set keyframed mask paths:** For each entry in the keyframe schedule, create a `Shape` rectangle and set it at the transition time:
   ```javascript
   function makeRectShape(x, y, w, h) {
       var shape = new Shape();
       shape.vertices = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
       shape.inTangents = [[0,0], [0,0], [0,0], [0,0]];
       shape.outTangents = [[0,0], [0,0], [0,0], [0,0]];
       shape.closed = true;
       return shape;
   }

   var maskShapeProp = newMask.property("ADBE Mask Shape");
   maskShapeProp.setValueAtTime(time, rectShape);
   ```

5. **Set hold keyframes** on all mask shape keyframes:
   ```javascript
   for (var k = 1; k <= maskShapeProp.numKeys; k++) {
       maskShapeProp.setInterpolationTypeAtKey(k,
           KeyframeInterpolationType.HOLD,
           KeyframeInterpolationType.HOLD);
   }
   ```

**Keyframe placement details:**

For a layer visible in segments S1, S2, S3:
- If the layer's `inPoint` is before S1's `startTime`, place a full-frame keyframe at `inPoint` (layer is alone before first overlap)
- At S1 `startTime`: place the tile rect keyframe
- At S2 `startTime`: place the new tile rect keyframe (overlap count may have changed)
- At S3 `endTime`: if the layer continues past S3, place a full-frame keyframe (layer is alone after last overlap)

**Existing masks on layers:** If a layer already has non-script masks (masks not named "Tile Mask"), set the new mask's mode to `MaskMode.INTERSECT` so it combines with the artist's existing masks rather than overriding them. If no existing masks, use `MaskMode.ADD`.

**Reference patterns:**
- `ae/midi_generative_visuals.jsx:233` — `setValueAtTime()` for keyframes
- `ae/midi_generative_visuals.jsx:237-240` — `setInterpolationTypeAtKey()`

#### Phase 5: Dialog UI

**Function:** `showDialog()`

**Dialog layout:**

```
+------------------------------------------+
|  Overlap Tiling Masks                    |
|                                          |
|  Layout Mode:                            |
|  [panel]                                 |
|    ( ) Vertical columns                  |
|    ( ) Horizontal rows                   |
|    ( ) Grid                              |
|                                          |
|  [Apply]  [Cancel]                       |
+------------------------------------------+
```

Returns `{ layoutMode: "vertical"|"horizontal"|"grid" }` or `null` on cancel.

**Reference patterns:**
- `ae/resize_layers.jsx:51-56` — radio button panel
- `ae/midi_generative_visuals.jsx:94-156` — full dialog with OK/Cancel

#### Phase 6: Results Summary

**Function:** `showResults(stats)`

Display:
- Number of layers processed
- Number of segments detected
- Max simultaneous overlap count
- Total mask keyframes placed
- Locked layers skipped (if any)
- Layout mode used

### Entry Conditions and Validation

| Condition | Action |
|-----------|--------|
| No active comp | Alert "Please select a composition." Exit. |
| 0 qualifying video layers | Alert "No video layers found in composition." Exit. |
| 1 qualifying video layer | Alert "Only 1 video layer found — no overlaps to tile." Exit. |
| Multiple layers, 0 overlap segments | Alert "No overlapping layers found." Exit. |
| Max overlap > 8 | Warn "Up to N layers overlap simultaneously. Tiles may be very small. Continue?" |

### Re-run Safety

Script-generated masks are named `"Tile Mask"`. On each run, existing masks with this name are removed before new ones are created. This makes the script idempotent — running it twice produces the same result as running it once.

## Acceptance Criteria

### Functional Requirements

- [x] Script detects all temporal overlaps between qualifying video layers
- [x] User can choose layout mode (vertical, horizontal, grid) via dialog
- [x] Each qualifying layer gets exactly one mask named "Tile Mask"
- [x] Mask path is keyframed at each transition point (hold keyframes)
- [x] Layer alone in a segment: mask covers full comp dimensions
- [x] 2 layers overlap: each masked to its half (per layout mode)
- [x] 3+ layers overlap: dynamic tiling (thirds, quarters, etc.)
- [x] Grid layout uses `ceil(sqrt(n))` columns, fills left-to-right top-to-bottom
- [x] Top layer (lowest index) gets leftmost/topmost tile
- [x] outPoint is exclusive — layers sharing a cut point do NOT overlap
- [x] Times rounded to nearest frame boundary before comparison
- [x] Tile boundaries rounded to whole pixels
- [x] Locked layers skipped and reported
- [x] Layers with existing non-script masks: new mask set to Intersect mode
- [x] Re-running script removes previous "Tile Mask" masks before re-applying
- [x] Results summary shown after completion
- [x] Entire operation wrapped in a single undo group

### Edge Cases

- [x] Zero-duration layers excluded from processing
- [x] Single-frame overlap segments handled correctly
- [x] Layers flush with comp start/end handled correctly
- [x] Precomp layers included in processing
- [x] Solid layers excluded from processing

## File Structure

```
ae/overlap_tiling_masks.jsx       # Vanilla ExtendScript (this plan)
ae/overlap_tiling_masks-aeq.jsx   # AEQuery version (future, out of scope)
```

## References

### Internal

- Layer filtering: `ae/resize_layers.jsx:15-32`
- Layer timing collection: `ae/trim_and_resequence.jsx:78-109`
- Keyframe setting: `ae/midi_generative_visuals.jsx:212-243`
- Dialog with radio buttons: `ae/resize_layers.jsx:51-56`
- Dialog with controls: `ae/midi_generative_visuals.jsx:94-156`
- Mask type definitions: `types/AfterEffects/17.0/index.d.ts:1577-1613`
- Brainstorm: `docs/brainstorms/2026-02-11-overlap-tiling-masks-brainstorm.md`

### AE Scripting API (Masks)

- `layer.property("ADBE Mask Parade")` — masks property group
- `.addProperty("ADBE Mask Atom")` — add a new mask
- `mask.maskMode` — `MaskMode.ADD` or `MaskMode.INTERSECT`
- `mask.property("ADBE Mask Shape")` — the mask shape property
- `new Shape()` — create path with `.vertices`, `.inTangents`, `.outTangents`, `.closed`
- `.setValueAtTime(time, shape)` — keyframe the mask path
- `.setInterpolationTypeAtKey(idx, KeyframeInterpolationType.HOLD, ...)` — hold keyframes
