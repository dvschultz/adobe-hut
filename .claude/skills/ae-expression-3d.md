---
name: ae-expression-3d
description: "3D expressions for After Effects: 3D layer properties, camera expressions, light expressions, space transforms, and 3D calculations."
---

# AE 3D Expressions

Expressions for 3D layers, cameras, lights, and 3D space calculations.

## 3D Layer Properties

### Transform Properties

```javascript
// Position (3D)
thisLayer.position          // [x, y, z]

// Anchor Point (3D)
thisLayer.anchorPoint       // [x, y, z]

// Scale (3D)
thisLayer.scale             // [x%, y%, z%]

// Orientation (replaces rotation for 3D)
thisLayer.orientation       // [x, y, z] degrees

// Individual Rotation Axes
thisLayer.rotationX         // X rotation degrees
thisLayer.rotationY         // Y rotation degrees
thisLayer.rotationZ         // Z rotation degrees (same as rotation)
```

### Check if 3D

```javascript
// Check if layer is 3D
thisLayer.threeDLayer       // true/false (scripting)

// In expressions, check for Z dimension
position.length === 3       // true if 3D
```

## Camera Properties

### Access Active Camera

```javascript
// Get current camera
thisComp.activeCamera

// Camera position
thisComp.activeCamera.position

// Camera orientation
thisComp.activeCamera.orientation
```

### Camera-Specific Properties

```javascript
// Point of Interest (look-at target)
cameraLayer.pointOfInterest     // [x, y, z]

// Zoom (focal length)
cameraLayer.zoom                // pixels

// Depth of Field
cameraLayer.depthOfField        // 0 or 1 (off/on)
cameraLayer.focusDistance       // distance in pixels
cameraLayer.aperture            // f-stop
cameraLayer.blurLevel           // blur amount %
```

### Camera Calculations

```javascript
// Distance from camera to layer
var cam = thisComp.activeCamera;
var layerPos = toWorld(anchorPoint);
var camPos = cam.toWorld([0, 0, 0]);
length(layerPos, camPos)
```

```javascript
// Scale based on camera distance (perspective compensation)
var cam = thisComp.activeCamera;
var dist = length(toWorld(anchorPoint), cam.toWorld([0, 0, 0]));
var baseDist = 1000;
[100, 100] * (dist / baseDist)
```

## Light Properties

### Light-Specific Properties

```javascript
// Point of Interest (spotlight target)
lightLayer.pointOfInterest      // [x, y, z]

// Intensity
lightLayer.intensity            // percentage

// Color
lightLayer.color                // [R, G, B]

// Cone (spotlights only)
lightLayer.coneAngle            // degrees
lightLayer.coneFeather          // percentage

// Shadow
lightLayer.shadowDarkness       // 0-100
lightLayer.shadowDiffusion      // pixels
```

### Light Types

```javascript
// Light types (access via scripting, not expressions)
// Point, Spot, Parallel, Ambient
```

## Space Transforms

### Point Transforms

```javascript
// Layer space to World space
toWorld(point, t)
thisLayer.toWorld([0, 0, 0])           // Layer origin in world
thisLayer.toWorld(anchorPoint)          // Anchor in world
thisLayer.toWorld([100, 0, 0])          // Point in world

// World space to Layer space
fromWorld(point, t)
thisLayer.fromWorld([0, 0, 0])          // World origin in layer

// Layer space to Comp space
toComp(point, t)
thisLayer.toComp([0, 0, 0])

// Comp space to Layer space
fromComp(point, t)
thisLayer.fromComp([960, 540])

// Comp point to Layer surface (3D only)
fromCompToSurface(point, t)
// Projects comp-space point onto layer's surface
```

### Vector Transforms

```javascript
// Transform direction vectors (not positions)
toCompVec(vec, t)
fromCompVec(vec, t)
toWorldVec(vec, t)
fromWorldVec(vec, t)

// Example: Get layer's local X-axis in world space
toWorldVec([1, 0, 0])
```

## 3D Distance Calculations

### Distance Between Layers

```javascript
// World-space distance between two layers
var pos1 = thisLayer.toWorld(anchorPoint);
var pos2 = thisComp.layer("Target").toWorld([0, 0, 0]);
length(pos1, pos2)
```

### Distance from Camera

```javascript
var cam = thisComp.activeCamera;
var myPos = toWorld(anchorPoint);
var camPos = cam.toWorld([0, 0, 0]);
length(myPos, camPos)
```

### Depth (Z-Distance Only)

```javascript
// Z-depth relative to camera
var cam = thisComp.activeCamera;
var myWorld = toWorld(anchorPoint);
var camWorld = cam.toWorld([0, 0, 0]);
myWorld[2] - camWorld[2]
```

## Look At Expressions

### lookAt Function

```javascript
// Returns [X, Y, Z] rotation to face target
lookAt(fromPoint, atPoint)

// Apply to Orientation property
lookAt(position, thisComp.layer("Target").position)

// Look at with offset
var target = thisComp.layer("Target").position;
lookAt(position, target) + [0, 180, 0]  // Face away
```

### Manual Look At (2D on 3D layer)

```javascript
// Just Y rotation (turntable)
var target = thisComp.layer("Target").position;
var delta = target - position;
radiansToDegrees(Math.atan2(delta[0], -delta[2]))
```

### Track Another Layer

```javascript
// Orientation tracks target layer
var target = thisComp.layer("Target");
lookAt(toWorld(anchorPoint), target.toWorld([0, 0, 0]))
```

## 3D Positioning

### Position Relative to Camera

```javascript
// Position in front of camera
var cam = thisComp.activeCamera;
var offset = [0, 0, -500];  // 500 pixels in front
cam.toWorld(offset)
```

### Orbit Around Point

```javascript
// Circular orbit in 3D
var center = thisComp.layer("Center").position;
var radius = 300;
var speed = 0.5;  // rotations per second
var angle = time * speed * Math.PI * 2;

center + [
    Math.cos(angle) * radius,
    0,
    Math.sin(angle) * radius
]
```

### Spiral Motion

```javascript
var center = [thisComp.width/2, thisComp.height/2, 0];
var radius = 200;
var speed = 1;
var rise = 50;  // Z change per rotation
var angle = time * speed * Math.PI * 2;

center + [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    time * rise * speed
]
```

## 3D Rotation Expressions

### Continuous 3D Rotation

```javascript
// Rotate on all axes
[time * 45, time * 90, time * 30]
```

### Look at Motion Direction

```javascript
// Orient based on velocity (for moving objects)
var vel = position.velocityAtTime(time);
if (length(vel) > 0.1) {
    lookAt([0,0,0], vel)
} else {
    value
}
```

### Rotation from Parent

```javascript
// Inherit parent orientation
if (hasParent) {
    parent.orientation
} else {
    [0, 0, 0]
}
```

## Camera-Based Effects

### Scale by Camera Distance

```javascript
// Maintain consistent screen size
var cam = thisComp.activeCamera;
var dist = length(toWorld(anchorPoint), cam.toWorld([0,0,0]));
var refDist = 1000;
var s = dist / refDist * 100;
[s, s, s]
```

### Fade by Distance

```javascript
// Opacity based on camera distance
var cam = thisComp.activeCamera;
var dist = length(toWorld(anchorPoint), cam.toWorld([0,0,0]));
var near = 100;
var far = 2000;
linear(dist, near, far, 100, 0)
```

### Billboard (Face Camera)

```javascript
// Make layer always face camera
var cam = thisComp.activeCamera;
lookAt(toWorld(anchorPoint), cam.toWorld([0,0,0]))
```

## Z-Depth Sorting

### Sort by Index

```javascript
// Stagger Z position by layer index
[value[0], value[1], index * -100]
```

### Random Z Distribution

```javascript
seedRandom(index, true);
var z = random(-500, 500);
[value[0], value[1], z]
```

## Parallax Effects

### Multi-Plane Parallax

```javascript
// Move based on camera with depth multiplier
var cam = thisComp.activeCamera;
var camPos = cam.position;
var depth = 0.5;  // 0 = no move, 1 = full camera move

value + [(camPos[0] - thisComp.width/2) * depth,
         (camPos[1] - thisComp.height/2) * depth,
         0]
```

## Usage

When working with 3D expressions, consider:

1. **Coordinate Systems**: Layer, Comp, and World spaces
2. **Transform Order**: AE applies transforms in specific order
3. **Camera Influence**: Active camera affects rendering
4. **Performance**: 3D calculations are more intensive

## Common Use Cases

| Task | Property | Approach |
|------|----------|----------|
| Face target | Orientation | `lookAt()` |
| Follow in 3D | Position | `toWorld/fromWorld` |
| Scale by depth | Scale | Distance calculation |
| Fade by depth | Opacity | `linear()` with distance |
| Orbit | Position | Trigonometry |
| Stay in front | Position | Camera-relative |

## Examples

### Auto-Orient to Camera
```javascript
// Orientation property
var cam = thisComp.activeCamera;
lookAt(toWorld([0,0,0]), cam.toWorld([0,0,0]))
```

### Distance-Based Blur
```javascript
// Link to Gaussian Blur Blurriness
var cam = thisComp.activeCamera;
var dist = length(toWorld([0,0,0]), cam.toWorld([0,0,0]));
var focusDist = 800;
Math.abs(dist - focusDist) / 50
```

### 3D Wiggle
```javascript
// Position property
var w = wiggle(2, 50);
[w[0], w[1], wiggle(2, 30)[0]]
```
