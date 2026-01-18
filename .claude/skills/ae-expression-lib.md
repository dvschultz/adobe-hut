---
name: ae-expression-lib
description: "Expression snippet library for After Effects: wiggle variations, loop expressions, time-based animations, property linking, noise, smoothing, and color manipulation."
---

# AE Expression Library

A collection of ready-to-use After Effects expressions for common animation tasks.

## Wiggle Expressions

### Full Wiggle Signature

```javascript
wiggle(freq, amp, octaves, amp_mult, t)

// Parameters:
// freq     - Wiggles per second
// amp      - Amplitude in property units
// octaves  - Levels of detail (default: 1)
// amp_mult - Amplitude multiplier per octave (default: 0.5)
// t        - Base time (default: time)
```

### Basic Wiggle
```javascript
wiggle(frequency, amplitude)

// Example: 2 wiggles per second, 50 pixels amplitude
wiggle(2, 50)
```

### Wiggle with Octaves
```javascript
// More complex, organic wiggle
wiggle(2, 50, 3, 0.5)  // 3 octaves

// High detail wiggle
wiggle(2, 50, 5, 0.5)  // 5 octaves
```

### Wiggle with Consistent Seed
Same wiggle on every playback:
```javascript
seedRandom(1, true);
wiggle(2, 50)
```

### Wiggle One Dimension Only
Wiggle X only (horizontal):
```javascript
var w = wiggle(2, 50);
[w[0], value[1]]
```

Wiggle Y only (vertical):
```javascript
var w = wiggle(2, 50);
[value[0], w[1]]
```

### Uniform Scale Wiggle
Both dimensions wiggle together:
```javascript
var w = wiggle(2, 10)[0];
[w, w]
```

### Stepped/Held Wiggle
Wiggle that holds values (no smooth transitions):
```javascript
posterizeTime(4);
wiggle(2, 50)
```

### Smooth/Organic Wiggle
Slower, more organic motion:
```javascript
seedRandom(1, true);
wiggle(0.5, 50)
```

### Wiggle Only After Start
Wiggle that begins after a certain time:
```javascript
var startTime = 1;  // seconds
if (time > startTime) {
    wiggle(2, 50)
} else {
    value
}
```

### Fading Wiggle
Wiggle that fades out over time:
```javascript
var freq = 5;
var amp = 50;
var fadeDur = 2;  // fade duration in seconds

var fade = Math.max(0, 1 - time/fadeDur);
wiggle(freq, amp * fade)
```

### Wiggle Fade In
Wiggle that fades in:
```javascript
var freq = 2;
var amp = 50;
var fadeIn = 1;  // seconds

var fade = Math.min(1, time/fadeIn);
wiggle(freq, amp * fade)
```

### Wiggle Between Two Values
Wiggle constrained between min and max:
```javascript
var min = 50;
var max = 100;
var w = wiggle(2, 50);
clamp(w, min, max)
```

### Temporal Wiggle
Samples property at wiggled times (for time-remapped effects):
```javascript
temporalWiggle(freq, amp, octaves, amp_mult, t)

// Sample at random times +/- 0.5 seconds
temporalWiggle(2, 0.5)

// More parameters
temporalWiggle(2, 0.3, 2, 0.5)
```

## Smooth Expression

Box filter smoothing for jittery properties:

```javascript
smooth(width, samples, t)

// Parameters:
// width   - Time range to average (seconds)
// samples - Number of samples (default varies)
// t       - Center time (default: time)

// Smooth over 0.2 seconds
smooth(0.2, 5)

// Heavier smoothing
smooth(0.5, 10)

// Smooth wiggle
wiggle(5, 50).smooth(0.1, 5)
```

## Noise Expressions

Perlin noise for organic, continuous random motion.

### Basic Noise
```javascript
// Returns value from -1 to 1
noise(time)

// Scaled to useful range (e.g., 50 +/- 25)
50 + noise(time) * 25
```

### Controlling Noise Speed
```javascript
// Faster variation
noise(time * 3)

// Slower variation
noise(time * 0.5)
```

### 2D Noise
```javascript
// Different noise per layer
noise([time, index])

// Noise across space
noise([position[0] / 100, position[1] / 100])
```

### 3D Noise
```javascript
noise([time, index, 0])
noise([time * 2, index * 10, position[0]])
```

### Noise vs Wiggle

| Noise | Wiggle |
|-------|--------|
| Continuous, flowing | Discrete wiggles |
| Returns -1 to 1 | Returns in property units |
| Need to scale manually | Amplitude built-in |
| Better for organic motion | Better for shake effects |

```javascript
// Equivalent noise to wiggle(2, 50)
value + noise(time * 2) * 50
```

## Loop Expressions

### Loop Types

| Type | Description |
|------|-------------|
| `"cycle"` | Repeat keyframe sequence |
| `"pingpong"` | Alternate forward/backward |
| `"offset"` | Repeat with cumulative offset |
| `"continue"` | Continue velocity after last key |

### Loop Out (After Last Keyframe)

```javascript
loopOut("cycle")      // Repeat infinitely
loopOut("pingpong")   // Back and forth
loopOut("offset")     // Progressive
loopOut("continue")   // Continue motion
```

### Loop In (Before First Keyframe)
```javascript
loopIn("cycle")
loopIn("pingpong")
loopIn("offset")
```

### Loop Specific Keyframes
```javascript
loopOut("cycle", 2)      // Loop last 2 keyframes
loopOut("pingpong", 3)   // Pingpong last 3 keyframes
loopIn("cycle", 2)       // Loop first 2 keyframes
```

### Loop By Duration
```javascript
loopOutDuration("cycle", 2)    // Loop last 2 seconds
loopInDuration("pingpong", 1)  // Pingpong first 1 second
```

### Loop Both Directions
```javascript
loopIn("cycle") + loopOut("cycle") - value
```

## Time-Based Expressions

### Continuous Rotation
```javascript
// Degrees per second
time * 90
```

### Oscillation (Sine Wave)
```javascript
var amp = 50;      // Amplitude
var freq = 1;      // Cycles per second

value + Math.sin(time * freq * Math.PI * 2) * amp
```

### Circular Motion
```javascript
var radius = 100;
var speed = 1;  // rotations per second
var angle = time * speed * Math.PI * 2;

value + [Math.cos(angle) * radius, Math.sin(angle) * radius]
```

### Bounce
```javascript
var amp = 100;
var freq = 2;
var decay = 3;

value + amp * Math.abs(Math.sin(freq * time * Math.PI)) / Math.exp(decay * time)
```

### Overshoot/Elastic
```javascript
var freq = 3;
var decay = 5;

var n = 0;
if (numKeys > 0) {
    n = nearestKey(time).index;
    if (key(n).time > time) n--;
}
if (n > 0) {
    var t = time - key(n).time;
    var amp = velocityAtTime(key(n).time - 0.001);
    var w = freq * Math.PI * 2;
    value + amp * (Math.sin(t * w) / Math.exp(decay * t) / w);
} else {
    value;
}
```

### Linear Animation
Animate from value A to B over time:
```javascript
linear(time, 0, 5, 0, 100)
// From 0 to 5 seconds, animate from 0 to 100
```

### Ease Animation
Same as linear but with easing:
```javascript
ease(time, 0, 5, 0, 100)

// Ease in only
easeIn(time, 0, 5, 0, 100)

// Ease out only
easeOut(time, 0, 5, 0, 100)
```

### Time Remap
```javascript
// Speed up 2x
time * 2

// Slow down to half speed
time * 0.5

// Reverse
thisComp.duration - time

// Pause at 2 seconds
Math.min(time, 2)
```

## Property Linking

### Link to Another Layer's Property
```javascript
thisComp.layer("Controller").transform.position
```

### Link to Effect Control
```javascript
// Slider
thisComp.layer("Controls").effect("My Slider")("Slider")

// Color
thisComp.layer("Controls").effect("My Color")("Color")

// Checkbox
thisComp.layer("Controls").effect("Toggle")("Checkbox")

// Dropdown (returns index 1, 2, 3...)
thisComp.layer("Controls").effect("Style")("Menu")

// Point
thisComp.layer("Controls").effect("Position")("Point")
```

### Value at Different Time
```javascript
// Delayed follow (0.5 second delay)
thisComp.layer("Leader").transform.position.valueAtTime(time - 0.5)
```

### Index-Based Offset
Each layer in a sequence gets different values:
```javascript
// Staggered position
value + [0, index * 50]

// Staggered opacity fade
var delay = index * 0.1;
linear(time, inPoint + delay, inPoint + delay + 0.5, 0, 100)
```

### Parent Layer Reference
```javascript
// Get parent's position
parent.transform.position

// Get parent's scale
parent.transform.scale

// Check if has parent
hasParent ? parent.rotation : 0
```

## Space Transforms

### Layer to Comp Coordinates
```javascript
// Convert layer point to comp space
thisLayer.toComp([0, 0])

// Layer's current position in comp
toComp(anchorPoint)
```

### Comp to Layer Coordinates
```javascript
// Convert comp point to layer space
thisLayer.fromComp([960, 540])
```

### World Transforms (3D)
```javascript
// Layer point to world space
toWorld([0, 0, 0])

// World to layer
fromWorld([0, 0, 0])
```

### Distance Between Layers
```javascript
var p1 = thisComp.layer("A").toComp([0, 0]);
var p2 = thisComp.layer("B").toComp([0, 0]);
length(p1, p2)
```

### 3D Distance
```javascript
var w1 = thisLayer.toWorld([0, 0, 0]);
var w2 = thisComp.layer("Target").toWorld([0, 0, 0]);
length(w1, w2)
```

## Random Expressions

### Random Number
```javascript
random(100)        // 0 to 100
random(50, 100)    // 50 to 100
random([100, 200]) // Random 2D value
```

### Seeded Random (Consistent)
```javascript
seedRandom(index, true);  // Seed by layer index
random(100)
```

### Gaussian Random
Bell curve distribution:
```javascript
gaussRandom(50, 100)  // Mean 50, max 100
```

## Color Expressions

### RGB to HSL
```javascript
var rgb = [1, 0.5, 0, 1];  // RGBA
var hsl = rgbToHsl(rgb);   // [H, S, L, A]
```

### HSL to RGB
```javascript
var hsl = [0.5, 1, 0.5, 1];  // HSLA
var rgb = hslToRgb(hsl);     // RGBA
```

### Hex to RGB (AE 16.0+)
```javascript
hexToRgb("FF0000")   // Red
hexToRgb("#00FF00")  // Green
```

### Hue Shift
```javascript
var hsl = rgbToHsl(value);
hsl[0] = (hsl[0] + 0.5) % 1;  // Shift 180 degrees
hslToRgb(hsl)
```

### Desaturate
```javascript
var hsl = rgbToHsl(value);
hsl[1] = 0;
hslToRgb(hsl)
```

### Animated Color
```javascript
var hsl = [time % 1, 1, 0.5, 1];  // Cycle through hues
hslToRgb(hsl)
```

## Math Helpers

### Clamp Value
```javascript
clamp(value, min, max)

// Example: Keep opacity between 20 and 80
clamp(wiggle(1, 50), 20, 80)
```

### Normalize/Remap
```javascript
// Remap 0-100 input to 0-1 output
linear(input, 0, 100, 0, 1)

// Remap with easing
ease(input, 0, 100, 0, 1)
```

### Distance Between Points
```javascript
var p1 = thisComp.layer("A").transform.position;
var p2 = thisComp.layer("B").transform.position;
length(p1, p2)
```

### Angle Between Points
```javascript
var p1 = thisComp.layer("A").transform.position;
var p2 = thisComp.layer("B").transform.position;
var delta = p2 - p1;
radiansToDegrees(Math.atan2(delta[1], delta[0]))
```

### Look At (2D Rotation)
```javascript
var target = thisComp.layer("Target").position;
var delta = target - position;
radiansToDegrees(Math.atan2(delta[1], delta[0]))
```

### Look At (3D Orientation)
```javascript
lookAt(position, thisComp.layer("Target").position)
```

## Conditional Expressions

### Simple If/Else
```javascript
if (time > 2) {
    100
} else {
    0
}
```

### Ternary Operator
```javascript
time > 2 ? 100 : 0
```

### Based on Checkbox
```javascript
var show = thisComp.layer("Controls").effect("Show")("Checkbox");
show == 1 ? 100 : 0
```

### Based on Layer
```javascript
thisComp.layer("Other").active ? value : [0, 0]
```

### Based on Dropdown
```javascript
var menu = thisComp.layer("Controls").effect("Style")("Menu");
if (menu == 1) {
    [255, 0, 0, 1]
} else if (menu == 2) {
    [0, 255, 0, 1]
} else {
    [0, 0, 255, 1]
}
```

## Text Expressions

### Source Text Counter
```javascript
Math.floor(time)
```

### Leading Zeros
```javascript
var num = Math.floor(time);
("000" + num).slice(-3)  // Always 3 digits
```

### Typewriter Effect
```javascript
var txt = "Hello World";
var charsPerSec = 10;
txt.substring(0, Math.floor(time * charsPerSec))
```

### Time Display
```javascript
var mins = Math.floor(time / 60);
var secs = Math.floor(time % 60);
(mins < 10 ? "0" : "") + mins + ":" + (secs < 10 ? "0" : "") + secs
```

## Expression Application Script

Apply an expression to selected layers:

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one layer.");
        return;
    }

    var expression = prompt("Enter expression:", "wiggle(2, 50)");
    if (!expression) return;

    var propertyPath = prompt(
        "Property path:\n" +
        "Examples: Position, Scale, Opacity, Rotation",
        "Position"
    );
    if (!propertyPath) return;

    app.beginUndoGroup("Apply Expression");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var prop = layer.property("Transform").property(propertyPath);

            if (prop && prop.canSetExpression) {
                prop.expression = expression;
                count++;
            }
        }
        alert("Applied expression to " + count + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Usage

When the user invokes `/ae-expression-lib`, ask what type of expression they need:

1. Wiggle (and variations)
2. Loop
3. Time-based animation
4. Property linking
5. Random values
6. Noise (Perlin)
7. Smoothing
8. Color manipulation
9. Space transforms
10. Math operations
11. Conditional logic
12. Text manipulation

Provide the appropriate expression snippet that they can paste directly into After Effects.

## Example Requests

- "Give me a wiggle expression that only moves horizontally"
- "How do I loop keyframes?"
- "Expression for continuous rotation"
- "Link this property to a slider control"
- "Make text appear one character at a time"
- "Smooth out jittery motion"
- "Create organic noise-based animation"
- "Shift the hue of a color over time"
