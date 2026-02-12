# Overlap Tiling Masks

**Date:** 2026-02-11
**Status:** Brainstorm complete

## What We're Building

An After Effects script that scans a composition for temporally overlapping video layers and automatically applies keyframed rectangular masks to tile them on screen. When two clips share the same time range, each gets masked to reveal only its portion (e.g., left half / right half). When a clip is alone on the timeline, it plays full-frame.

### Core Behavior

- Detect all time-overlap regions in the active comp
- For each overlap region, count the number of visible video layers
- Divide the frame into tiles based on count and user-chosen layout mode
- Apply keyframed mask paths that activate only during overlap periods
- When a layer has no overlap, its mask expands to full comp dimensions (full-frame)

## Why This Approach

**Mask path keyframes** (Approach A) were chosen over pre-comp splitting or track mattes because:

- Non-destructive: masks are easily adjusted or removed by hand
- No timeline clutter: no extra solid layers or sub-comps
- Standard AE workflow: artists already understand and work with masks
- Simplest implementation of the three options

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Overlap type | Temporal (time-based) | Clips share the same time range on the timeline |
| Use case | Collage/montage | Tiling multiple clips simultaneously |
| Mask duration | Only during overlap | Clip plays full-frame when alone, masked only when overlapping |
| Overlap count | Dynamic tiling | 2 = halves, 3 = thirds, 4 = quarters, etc. |
| Layout mode | User chooses at runtime | Dialog asks: vertical columns, horizontal rows, or grid |
| Position/scale | Mask only (crop in place) | No repositioning or scaling — just crop via mask |
| Tile assignment | Layer order (top-down) | Top layer gets leftmost/topmost tile |
| Mask animation | Keyframed on/off | Mask path keyframes at each overlap transition point |
| Layer filtering | Video footage only | Skip audio-only, nulls, adjustments, cameras, lights, shapes, text |

## How It Works (Conceptual)

1. **Collect layers:** Get all video footage layers in the active comp, skip non-video
2. **Build timeline events:** For each layer, record its inPoint and outPoint
3. **Find transition points:** Collect all unique in/out times, sort them — these define "segments" where the overlap count is constant
4. **For each segment:** Count how many layers are visible, compute each layer's tile mask rect based on layout mode and layer order
5. **Apply masks:** For each layer, create one mask and set keyframed mask paths at each transition point where its tile size/position changes
6. **Full-frame default:** When a layer is alone in a segment, its mask covers the full comp

## Open Questions

- **Existing masks:** If a layer already has masks, should the script add another mask (set to Intersect mode)? Or warn and skip?
- **Grid math:** For grid layout with non-square numbers (e.g., 3 clips), how to tile? 2x2 with one empty cell? Or 1 on top + 2 on bottom?
- **Transition frames:** Should mask keyframes be hard cuts (hold keyframes) or interpolated over 1-2 frames for a soft transition?
- **Layer naming/labeling:** Should the script label or color-code layers it has processed?

## Scope Boundaries

**In scope:**
- Overlap detection, tiling math, mask creation, mask keyframing
- Dialog for layout mode selection (vertical/horizontal/grid)
- Vanilla ExtendScript version (AEQuery version can follow later)

**Out of scope:**
- Repositioning or scaling layers
- Audio handling
- Nested/pre-composed layer detection
- Undo for re-running (user can undo via Edit > Undo)
