---
name: ae-expression-reference
description: "Quick reference card for After Effects expression syntax: global objects, methods, functions, and common patterns at a glance."
---

# AE Expression Quick Reference

A compact reference for After Effects expression syntax.

## Global Objects

| Object | Description |
|--------|-------------|
| `thisComp` | Current composition |
| `thisLayer` | Current layer |
| `thisProperty` | Current property |
| `time` | Current time (seconds) |
| `value` | Property value without expression |
| `colorDepth` | 8, 16, or 32 |

## Composition Properties

```javascript
thisComp.name
thisComp.width
thisComp.height
thisComp.duration
thisComp.frameDuration
thisComp.numLayers
thisComp.pixelAspect
thisComp.bgColor
thisComp.activeCamera      // 3D
thisComp.marker
```

## Layer Access

```javascript
thisComp.layer(1)              // By index (1-based)
thisComp.layer("Name")         // By name
thisComp.layer(thisLayer, 1)   // Relative (1 = below)
thisComp.layerByComment("x")   // By comment (AE 2019+)
```

## Layer Properties

```javascript
// Info
thisLayer.name
thisLayer.index
thisLayer.width
thisLayer.height
thisLayer.parent
thisLayer.hasParent
thisLayer.source
thisLayer.active
thisLayer.enabled
thisLayer.hasVideo
thisLayer.hasAudio

// Timing
thisLayer.inPoint
thisLayer.outPoint
thisLayer.startTime

// Transform
thisLayer.anchorPoint
thisLayer.position
thisLayer.scale
thisLayer.rotation
thisLayer.opacity

// 3D only
thisLayer.orientation
thisLayer.rotationX
thisLayer.rotationY
thisLayer.rotationZ
thisLayer.audioLevels
```

## Property Methods

| Method | Description |
|--------|-------------|
| `valueAtTime(t)` | Value at time t |
| `velocityAtTime(t)` | Velocity at time t |
| `speedAtTime(t)` | Speed at time t |
| `wiggle(f, a)` | Random wiggle |
| `temporalWiggle(f, a)` | Time-based wiggle |
| `smooth(w, s)` | Smooth over time |
| `loopIn(type)` | Loop before first key |
| `loopOut(type)` | Loop after last key |
| `loopInDuration(type, d)` | Loop by duration |
| `loopOutDuration(type, d)` | Loop by duration |
| `key(n)` | Keyframe by index |
| `nearestKey(t)` | Nearest keyframe |
| `propertyGroup(n)` | Parent group |

## Loop Types

| Type | Effect |
|------|--------|
| `"cycle"` | Repeat sequence |
| `"pingpong"` | Forward/backward |
| `"offset"` | Cumulative |
| `"continue"` | Continue velocity |

## Interpolation

```javascript
linear(t, tMin, tMax, v1, v2)
linear(t, v1, v2)              // t: 0-1

ease(t, tMin, tMax, v1, v2)
ease(t, v1, v2)

easeIn(t, tMin, tMax, v1, v2)
easeOut(t, tMin, tMax, v1, v2)
```

## Vector Math

```javascript
add(a, b)         // Vector addition
sub(a, b)         // Vector subtraction
mul(v, n)         // Scalar multiply
div(v, n)         // Scalar divide
length(v)         // Vector magnitude
length(p1, p2)    // Distance
normalize(v)      // Unit vector
dot(a, b)         // Dot product
cross(a, b)       // Cross product (3D)
clamp(v, min, max)
lookAt(from, to)  // 3D orientation
```

## Space Transforms

```javascript
toComp(point)          // Layer → Comp
fromComp(point)        // Comp → Layer
toWorld(point)         // Layer → World (3D)
fromWorld(point)       // World → Layer (3D)
toCompVec(vec)         // Vector transforms
fromCompVec(vec)
toWorldVec(vec)
fromWorldVec(vec)
fromCompToSurface(pt)  // 3D only
```

## Random Functions

```javascript
random()               // 0-1
random(max)            // 0-max
random(min, max)       // min-max
gaussRandom()          // Bell curve
gaussRandom(min, max)
seedRandom(n, true)    // Consistent seed
noise(v)               // Perlin: -1 to 1
```

## Color Conversion

```javascript
rgbToHsl(rgba)     // [R,G,B,A] → [H,S,L,A]
hslToRgb(hsla)     // [H,S,L,A] → [R,G,B,A]
hexToRgb(hex)      // "FF0000" → [1,0,0,1]
```

## Time Conversion

```javascript
timeToFrames(t, fps)
framesToTime(f, fps)
timeToTimecode(t, base)
timeToCurrentFormat(t)
```

## Math

```javascript
degreesToRadians(d)
radiansToDegrees(r)
Math.sin/cos/tan(rad)
Math.atan2(y, x)
Math.abs/floor/ceil/round(n)
Math.min/max(a, b)
Math.pow(base, exp)
Math.sqrt(n)
Math.PI
```

## Effect Access

```javascript
effect("Name")("Property")
effect(1)("Slider")
effect("Slider Control")("Slider")
effect("Color Control")("Color")
effect("Checkbox Control")("Checkbox")
effect("Point Control")("Point")
effect("Dropdown Control")("Menu")
```

## Mask Access

```javascript
mask("Mask 1")
mask(1)
mask("Name").maskPath
mask("Name").maskFeather
mask("Name").maskOpacity
mask("Name").maskExpansion
```

## Markers

```javascript
marker.numKeys
marker.key(1)
marker.key("name")
marker.nearestKey(time)
marker.key(1).time
marker.key(1).comment
marker.key(1).duration
```

## Source Rect

```javascript
sourceRectAtTime(time, false)
// Returns: {top, left, width, height}
```

## Common Patterns

### Wiggle
```javascript
wiggle(2, 50)                  // Standard
wiggle(2, 50, 3, 0.5)          // With octaves
posterizeTime(8); wiggle(2,50) // Stepped
```

### One-Axis Wiggle
```javascript
var w = wiggle(2, 50);
[w[0], value[1]]  // X only
[value[0], w[1]]  // Y only
```

### Looping
```javascript
loopOut("cycle")
loopOut("pingpong", 2)
```

### Delay Follow
```javascript
thisComp.layer("L").position.valueAtTime(time - 0.5)
```

### Continuous Rotation
```javascript
time * 90  // 90°/sec
```

### Oscillation
```javascript
value + Math.sin(time * Math.PI * 2) * 50
```

### Link to Slider
```javascript
thisComp.layer("Ctrl").effect("Slider")("Slider")
```

### Conditional
```javascript
time > 2 ? 100 : 0
```

### Safe Layer Reference
```javascript
try {
    thisComp.layer("Name").position
} catch(e) {
    [960, 540]
}
```

### Angle to Target
```javascript
var d = target - position;
radiansToDegrees(Math.atan2(d[1], d[0]))
```

### Distance
```javascript
length(position, target)
```

### Index-Based Delay
```javascript
var delay = index * 0.1;
linear(time - delay, 0, 1, 0, 100)
```

### Responsive Position
```javascript
[thisComp.width/2, thisComp.height/2]
```

## Quick Formulas

| Goal | Expression |
|------|------------|
| Center | `[thisComp.width/2, thisComp.height/2]` |
| Rotate/sec | `time * 360` |
| Bounce | `Math.abs(Math.sin(time * 2))` |
| Pulse | `50 + Math.sin(time * 4) * 20` |
| Flicker | `random() > 0.9 ? 0 : 100` |
| Frame # | `Math.floor(time * thisComp.frameRate)` |

## Version Features

| Feature | Version |
|---------|---------|
| `layerByComment()` | AE 2019 |
| `hexToRgb()` | AE 16.0 |
| Text styling | AE 17.0 |
| `sourceRectAtTime` | AE CC |

## Debugging

```javascript
// Check for errors
thisProperty.expressionError

// Safe references
if (hasParent) { parent.rotation } else { 0 }

// Try-catch
try { expr } catch(e) { fallback }
```
