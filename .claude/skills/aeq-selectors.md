---
name: aeq-selectors
description: AEQuery CSS-like selector syntax for querying After Effects objects
---

# AEQuery Selectors

AEQuery provides CSS-like selector syntax for querying After Effects objects. The `aeq()` function returns an `aeq.arrayEx` of matching objects.

## Basic Syntax

```javascript
aeq(selector)
aeq(selector, context)
```

- **selector**: String with CSS-like query syntax
- **context**: Optional CompItem or array to scope the search

## Type Selectors

| Selector | Description | Returns |
|----------|-------------|---------|
| `comp` | All compositions in project | CompItem[] |
| `layer` | All layers | Layer[] |
| `effect` | All effects | PropertyGroup[] |
| `property` or `prop` | All properties | Property[] |
| `key` | All keyframes | aeq.Key[] |
| `activecomp` | Active composition | CompItem |
| `item` | All project items | Item[] |

### Examples

```javascript
// Get all compositions
var comps = aeq('comp');

// Get all layers in active comp
var layers = aeq('activecomp layer');

// Get all effects in active comp
var effects = aeq('activecomp effect');
```

## Attribute Selectors

Filter by object properties using bracket notation:

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Exact match | `[name="Main"]` |
| `!=` | Not equal | `[index!=1]` |
| `^=` | Starts with | `[name^="BG_"]` |
| `$=` | Ends with | `[name$="_v2"]` |
| `*=` | Contains | `[name*="temp"]` |

### Examples

```javascript
// Comp by name
aeq('comp[name="Main Comp"]')

// Comp by dimensions
aeq('comp[width=1920][height=1080]')

// Layer by index
aeq('layer[index=1]')

// Layers with name starting with "BG"
aeq('layer[name^="BG"]')

// Layers with name ending with "_precomp"
aeq('layer[name$="_precomp"]')

// Layers with name containing "temp"
aeq('layer[name*="temp"]')

// Effects by match name
aeq('effect[matchName="ADBE Gaussian Blur 2"]')

// Effects not matching specific name
aeq('effect[matchName!="ADBE Fill"]')
```

## Pseudo-Selectors

### :is() - Positive Condition

Matches objects where the condition is true:

```javascript
// Selected layers
aeq('layer:is(selected)')

// Layer types
aeq('layer:is(TextLayer)')
aeq('layer:is(ShapeLayer)')
aeq('layer:is(CameraLayer)')
aeq('layer:is(LightLayer)')
aeq('layer:is(AVLayer)')

// Layer states
aeq('layer:is(solo)')
aeq('layer:is(locked)')
aeq('layer:is(shy)')
aeq('layer:is(enabled)')
aeq('layer:is(audioEnabled)')
aeq('layer:is(motionBlur)')
aeq('layer:is(adjustmentLayer)')
aeq('layer:is(guideLayer)')
aeq('layer:is(threeDLayer)')
aeq('layer:is(collapseTransformation)')
```

### :not() - Negative Condition

Matches objects where the condition is false:

```javascript
// Layers without audio
aeq('layer:not(hasAudio)')

// Unlocked layers
aeq('layer:not(locked)')

// Layers without motion blur
aeq('layer:not(motionBlur)')

// Layers that aren't adjustment layers
aeq('layer:not(adjustmentLayer)')

// Enabled effects only
aeq('effect:not(enabled)')  // Disabled effects
```

### :has() - Property Check

Matches objects that have a specific property or child:

```javascript
// Layers with effects
aeq('layer:has(effect)')

// Layers with expressions
aeq('layer:has(expression)')

// Layers with masks
aeq('layer:has(mask)')
```

## Combining Selectors

### Descendant Selectors

Space-separated selectors query descendants:

```javascript
// Layers in active comp
aeq('activecomp layer')

// Effects on layers in active comp
aeq('activecomp layer effect')

// Properties on layers
aeq('activecomp layer property')
```

### Multiple Conditions

Chain pseudo-selectors and attributes:

```javascript
// Selected text layers
aeq('layer:is(selected):is(TextLayer)')

// Selected layers that aren't locked
aeq('layer:is(selected):not(locked)')

// Text layers with names starting with "Title"
aeq('layer:is(TextLayer)[name^="Title"]')

// Selected layers in a specific comp
aeq('comp[name="Main"] layer:is(selected)')
```

## Context Parameter

Scope queries to a specific composition or array:

```javascript
// Get reference to a comp
var mainComp = aeq('comp[name="Main Comp"]').first();

// Query within that comp
var textLayers = aeq('layer:is(TextLayer)', mainComp);

// Query within selected layers
var selected = comp.selectedLayers;
var textInSelection = aeq('layer:is(TextLayer)', selected);
```

## Real-World Examples

### Disable All Gaussian Blurs

```javascript
aeq('activecomp effect[matchName="ADBE Gaussian Blur 2"]')
    .attr('enabled', false);
```

### Get All Selected Text Layers

```javascript
var textLayers = aeq('activecomp layer:is(selected):is(TextLayer)');
textLayers.forEach(function(layer) {
    $.writeln(layer.name);
});
```

### Find Layers by Name Pattern

```javascript
// All layers starting with "BG_"
var bgLayers = aeq('activecomp layer[name^="BG_"]');

// All layers ending with "_reference"
var refLayers = aeq('activecomp layer[name$="_reference"]');

// All layers containing "temp"
var tempLayers = aeq('activecomp layer[name*="temp"]');
```

### Get HD Compositions

```javascript
var hdComps = aeq('comp[width=1920][height=1080]');
```

### Get Solo'd Layers

```javascript
var soloLayers = aeq('activecomp layer:is(solo)');
```

### Get 3D Layers

```javascript
var threeDLayers = aeq('activecomp layer:is(threeDLayer)');
```

### Filter Shape Layers with Effects

```javascript
var shapesWithEffects = aeq('activecomp layer:is(ShapeLayer):has(effect)');
```

### Get Unlocked, Visible Layers

```javascript
var editableLayers = aeq('activecomp layer:not(locked):is(enabled)');
```

## Method Chaining After Selection

Query results are `aeq.arrayEx` objects with extended methods:

```javascript
// Chain operations
aeq('activecomp layer:is(selected)')
    .filter(function(l) { return l instanceof TextLayer; })
    .forEach(function(l) {
        l.solo = true;
    });

// Get attribute from all matches
var names = aeq('activecomp layer').attr('name');

// Set attribute on all matches
aeq('activecomp layer:is(selected)').attr('locked', true);
```

## Common Match Names for Effects

Use with `effect[matchName="..."]`:

| Effect | Match Name |
|--------|------------|
| Gaussian Blur | `ADBE Gaussian Blur 2` |
| Glow | `ADBE Glow` |
| Fill | `ADBE Fill` |
| Drop Shadow | `ADBE Drop Shadow` |
| Slider Control | `ADBE Slider Control` |
| Color Control | `ADBE Color Control` |
| Checkbox Control | `ADBE Checkbox Control` |
| Point Control | `ADBE Point Control` |
| Dropdown Control | `ADBE Dropdown Control` |
| Camera Lens Blur | `ADBE Camera Lens Blur` |
| Fast Blur | `ADBE Fast Blur` |
| Levels | `ADBE Levels2` |
| Curves | `ADBE CurvesCustom` |
