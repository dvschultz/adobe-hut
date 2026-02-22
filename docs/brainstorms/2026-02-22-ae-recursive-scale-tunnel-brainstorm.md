# Brainstorm: Recursive Scale Tunnel Effect for After Effects

**Date:** 2026-02-22
**Status:** Draft
**App:** After Effects

## What We're Building

An After Effects script that takes a single selected layer, duplicates it repeatedly at progressively smaller scales, creating a tunnel/zoom effect. Each duplicate is a fixed number of pixels smaller on the chosen dimension (width or height) than the previous one. The loop stops when the next duplicate would be smaller than a user-defined minimum size.

### Core Behavior

1. User selects a single layer in the active composition
2. Dialog collects parameters: pixel step, minimum size, dimension (width/height)
3. Script duplicates the layer, scales it down by the step amount, and repeats
4. Duplicates are centered (default tunnel look) with smallest layers on top of the stack
5. Optionally creates a controller null that all duplicates link their position to, enabling animated offset

### Dialog Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| Step size | Number (pixels) | 100 | How many pixels smaller each duplicate is on the reference dimension |
| Minimum size | Number (pixels) | 240 | Stop when next duplicate would be smaller than this |
| Dimension | Radio (Width / Height) | Width | Which dimension to measure for stepping and minimum |
| Create offset controller | Checkbox | Unchecked | Creates a null layer that all duplicates link position to |

### Scaling Math

Given a layer with source width `W` and current scale `S%`:
- Current rendered width = `W * S / 100`
- Each duplicate reduces the rendered dimension by `step` pixels
- New scale for duplicate N = `((renderedDim - N * step) / sourceDim) * 100`
- Stop when `renderedDim - N * step < minSize`

Example: 1920px wide layer, step=100px, min=240px
- Original: 1920px (100%)
- Dup 1: 1820px (94.79%)
- Dup 2: 1720px (89.58%)
- ...
- Dup 16: 320px (16.67%)
- Dup 17: 220px -- below 240px minimum, stop at 16 duplicates

### Layer Stacking

- Smallest duplicate at the top of the layer stack (index 1 direction)
- Creates a "looking into the tunnel" effect where smaller layers appear in front
- All duplicates positioned at comp center (anchor point centered)

### Controller Null (Optional)

- When enabled, creates a null layer named "Tunnel Offset Controller"
- Each duplicate gets a position expression: `thisComp.layer("Tunnel Offset Controller").transform.position`
- Uniform offset: all duplicates shift by the same amount regardless of scale
- User can then keyframe the null or apply expressions (wiggle, circular motion, etc.) to animate the entire tunnel

## Why This Approach

**Fixed pixel step over percentage step**: A fixed pixel decrement produces evenly-spaced visual layers in the tunnel, which looks more uniform. Percentage-based stepping would create layers that bunch up near the center (diminishing returns). The user explicitly chose pixel-based stepping.

**Individual layers over pre-comp**: Keeps duplicates editable in the main comp. User can adjust individual layer properties, add effects per layer, or delete specific duplicates.

**Controller null over per-layer expressions**: Clean separation of concerns. One control point for offset animation. Easy to delete or replace. Doesn't pollute each layer with complex expressions.

**Uniform offset over parallax**: Simpler to reason about. User can add parallax later by modifying the expression to factor in scale if desired.

## Key Decisions

1. **Fixed pixel step** - each duplicate is N pixels smaller, not a percentage
2. **Width or height reference** - user picks which dimension drives the stepping logic
3. **Smallest on top** - layer stack order has smallest (frontmost) at the top
4. **Single layer input** - operates on exactly one selected layer
5. **Individual layers in comp** - no pre-composition of results
6. **Controller null for offset** - optional, links all duplicate positions uniformly
7. **Center-aligned by default** - duplicates inherit the original layer's position (comp center)

## Open Questions

None - all questions resolved during brainstorming.

## Scope Boundaries

**In scope:**
- Dialog UI with the four inputs described above
- Duplicate-and-scale loop with pixel stepping
- Layer ordering (smallest on top)
- Optional controller null with position expression

**Out of scope (for now):**
- Parallax/depth-scaled offset
- Percentage-based step mode
- Multiple selected layers
- Pre-composition of results
- Opacity fade on smaller duplicates
- Per-duplicate color/effect variation
