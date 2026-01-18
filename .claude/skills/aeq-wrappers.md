---
name: aeq-wrappers
description: AEQuery wrapper classes for Comp, Layer, Property, and Key objects
---

# AEQuery Wrapper Classes

AEQuery provides wrapper classes that extend native After Effects objects with additional methods.

## aeq.Comp

Wraps `CompItem` with iteration and access methods.

### Constructor

```javascript
var comp = new aeq.Comp(compItem);

// Or from active comp
var activeComp = aeq.getActiveComp();
var wrapped = new aeq.Comp(activeComp);
```

### Properties

```javascript
var comp = new aeq.Comp(compItem);

// Access the underlying CompItem
comp.comp;  // The raw CompItem
```

### Methods

#### forEachLayer(callback)

Iterates all layers in the composition:

```javascript
var comp = new aeq.Comp(app.project.activeItem);

comp.forEachLayer(function(layer, index) {
    $.writeln(index + ': ' + layer.name);
});

// With break (return false to stop)
comp.forEachLayer(function(layer) {
    if (layer.name === 'Target') {
        $.writeln('Found target layer');
        return false;  // Stop iteration
    }
});
```

#### get(identifier)

Gets a layer by index or name:

```javascript
var comp = new aeq.Comp(compItem);

// By index (1-based)
var firstLayer = comp.get(1);
var lastLayer = comp.get(comp.comp.numLayers);

// By name
var bgLayer = comp.get('Background');
var controller = comp.get('Controller');

// Returns null if not found
var layer = comp.get('NonExistent');
if (layer === null) {
    $.writeln('Layer not found');
}
```

### Example

```javascript
var comp = new aeq.Comp(aeq.getActiveComp());

// Log all text layers
comp.forEachLayer(function(layer) {
    if (layer instanceof TextLayer) {
        $.writeln('Text: ' + layer.name);
    }
});

// Get specific layers
var title = comp.get('Title');
var subtitle = comp.get('Subtitle');
```

---

## aeq.Layer

Wraps `Layer` objects with hierarchy and effect methods.

### Constructor

```javascript
var layer = new aeq.Layer(layerObject);

// From comp layer
var wrapped = new aeq.Layer(comp.layer(1));
```

### Properties

```javascript
var layer = new aeq.Layer(layerObject);

// Access the underlying Layer
layer.layer;  // The raw Layer object
```

### Methods

#### children()

Gets layers parented to this layer:

```javascript
var layer = new aeq.Layer(comp.layer('Controller'));

var children = layer.children();  // Returns aeq.arrayEx

children.forEach(function(child) {
    $.writeln('Child: ' + child.name);
});

// Count children
$.writeln('Number of children: ' + children.length);
```

#### parents()

Gets the parent chain:

```javascript
var layer = new aeq.Layer(comp.layer('Deeply Nested'));

var parents = layer.parents();  // Returns aeq.arrayEx

parents.forEach(function(parent) {
    $.writeln('Parent: ' + parent.name);
});
```

#### allChildren()

Gets all descendants (children, grandchildren, etc.):

```javascript
var layer = new aeq.Layer(comp.layer('Root'));

var allDescendants = layer.allChildren();  // Returns aeq.arrayEx

$.writeln('Total descendants: ' + allDescendants.length);
```

#### relatedLayers()

Gets parent chain plus all descendants:

```javascript
var layer = new aeq.Layer(comp.layer('Middle'));

var related = layer.relatedLayers();  // Returns aeq.arrayEx

// Useful for selecting entire hierarchy
related.forEach(function(l) {
    l.selected = true;
});
```

#### addEffect(effectName)

Adds an effect to the layer:

```javascript
var layer = new aeq.Layer(comp.layer(1));

// Add by display name
var blur = layer.addEffect('Gaussian Blur');

// Set effect properties
blur.property('Blurriness').setValue(10);

// Add by match name
var fill = layer.addEffect('ADBE Fill');
```

#### forEachEffect(callback)

Iterates effects on the layer:

```javascript
var layer = new aeq.Layer(comp.layer(1));

layer.forEachEffect(function(effect, index) {
    $.writeln(index + ': ' + effect.name + ' (' + effect.matchName + ')');
});

// Disable all effects
layer.forEachEffect(function(effect) {
    effect.enabled = false;
});
```

#### effects()

Gets all effects as aeq.arrayEx:

```javascript
var layer = new aeq.Layer(comp.layer(1));

var effects = layer.effects();

// Filter effects by type
var blurs = effects.filter(function(e) {
    return e.matchName.indexOf('Blur') !== -1;
});
```

#### copyToComp(targetComp)

Copies layer to another composition:

```javascript
var layer = new aeq.Layer(sourceComp.layer('Logo'));
var targetComp = aeq('comp[name="Output"]').first();

var copiedLayer = layer.copyToComp(targetComp);
```

### Example: Process Layer Hierarchy

```javascript
var root = new aeq.Layer(comp.layer('Root Controller'));

// Get all children
var children = root.allChildren();

// Disable all descendants
children.forEach(function(child) {
    child.enabled = false;
});

// Log hierarchy
$.writeln('Root: ' + root.layer.name);
root.children().forEach(function(child, index) {
    $.writeln('  Child ' + index + ': ' + child.name);
});
```

---

## aeq.layer Namespace

Static utility functions for layer operations:

### aeq.layer.parents(layer)

```javascript
var parents = aeq.layer.parents(myLayer);  // Returns aeq.arrayEx
```

### aeq.layer.children(layer)

```javascript
var children = aeq.layer.children(myLayer);  // Returns aeq.arrayEx
```

### aeq.layer.allChildren(layer)

```javascript
var all = aeq.layer.allChildren(myLayer);  // Returns aeq.arrayEx
```

### aeq.layer.copyLayerToggles(sourceLayer, targetLayer)

Copies layer switches (enabled, solo, locked, shy, etc.):

```javascript
var source = comp.layer('Template');
var target = comp.layer('New Layer');

aeq.layer.copyLayerToggles(source, target);

// Copies:
// - enabled
// - solo
// - locked
// - shy
// - audioEnabled
// - motionBlur
// - adjustmentLayer
// - guideLayer
// - threeDLayer
// - collapseTransformation
```

---

## aeq.Property

Wraps `Property` objects with keyframe methods.

### Constructor

```javascript
var prop = new aeq.Property(propertyObject);

// From layer property
var position = new aeq.Property(layer.property('Position'));
```

### Properties

```javascript
var prop = new aeq.Property(positionProp);

// Access the underlying Property
prop.property;  // The raw Property object

// Get current value
prop.value;  // Same as property.value
```

### Methods

#### getKeys()

Gets all keyframes as aeq.arrayEx of aeq.Key objects:

```javascript
var prop = new aeq.Property(layer.property('Position'));

var keys = prop.getKeys();  // Returns aeq.arrayEx of aeq.Key

keys.forEach(function(key, index) {
    $.writeln('Key ' + index + ': time=' + key.getTime() + ', value=' + key.getValue());
});
```

#### forEachKey(callback)

Iterates keyframes:

```javascript
var prop = new aeq.Property(layer.property('Opacity'));

prop.forEachKey(function(key, index) {
    $.writeln('Keyframe ' + index + ' at ' + key.getTime() + 's');
});
```

#### addKey(time)

Adds a keyframe at the specified time:

```javascript
var prop = new aeq.Property(layer.property('Position'));

prop.addKey(0);      // Keyframe at 0 seconds
prop.addKey(2.5);    // Keyframe at 2.5 seconds
```

#### valueAtTime(time)

Gets property value at a specific time:

```javascript
var prop = new aeq.Property(layer.property('Position'));

var valueAt1Sec = prop.valueAtTime(1);
$.writeln('Position at 1s: ' + valueAt1Sec);
```

### Example: Copy Keyframes

```javascript
var sourceProp = new aeq.Property(sourceLayer.property('Position'));
var targetProp = new aeq.Property(targetLayer.property('Position'));

sourceProp.forEachKey(function(key) {
    var time = key.getTime();
    var value = key.getValue();
    targetProp.property.setValueAtTime(time, value);
});
```

---

## aeq.Key

Wraps keyframe data with manipulation methods.

### Properties

```javascript
var keys = prop.getKeys();
var key = keys.first();

// The aeq.Key contains keyframe information
```

### Methods

#### getTime()

Gets keyframe time:

```javascript
var time = key.getTime();
$.writeln('Keyframe at: ' + time + ' seconds');
```

#### getValue()

Gets keyframe value:

```javascript
var value = key.getValue();
$.writeln('Value: ' + value);
```

#### moveTo(newTime)

Moves keyframe to a new time:

```javascript
var key = prop.getKeys().first();

// Move to 1 second
key.moveTo(1.0);

// Offset by 0.5 seconds
key.moveTo(key.getTime() + 0.5);
```

#### remove()

Removes the keyframe:

```javascript
var keys = prop.getKeys();

// Remove last keyframe
keys[keys.length - 1].remove();

// Remove all keyframes
keys.forEach(function(key) {
    key.remove();
});
```

#### copyTo(targetProperty, time)

Copies keyframe to another property:

```javascript
var sourceKey = sourceProp.getKeys().first();
var targetProp = targetLayer.property('Position');

// Copy to same time
sourceKey.copyTo(targetProp);

// Copy to specific time
sourceKey.copyTo(targetProp, 2.0);
```

#### interpolationType()

Gets keyframe interpolation type:

```javascript
var key = prop.getKeys().first();

var interp = key.interpolationType();
$.writeln('In type: ' + interp.inType);
$.writeln('Out type: ' + interp.outType);

// Types: KeyframeInterpolationType.LINEAR, BEZIER, HOLD
```

#### temporalEase()

Gets temporal ease values:

```javascript
var key = prop.getKeys().first();

var ease = key.temporalEase();
$.writeln('In ease: ' + ease.inEase);
$.writeln('Out ease: ' + ease.outEase);
```

### Example: Analyze Keyframes

```javascript
var prop = new aeq.Property(layer.property('Position'));

prop.forEachKey(function(key, index) {
    $.writeln('--- Keyframe ' + (index + 1) + ' ---');
    $.writeln('  Time: ' + key.getTime() + 's');
    $.writeln('  Value: ' + key.getValue());

    var interp = key.interpolationType();
    $.writeln('  Interpolation: ' + interp.outType);
});
```

### Example: Offset All Keyframes

```javascript
var prop = new aeq.Property(layer.property('Position'));
var offset = 1.0;  // 1 second offset

// Get keys in reverse order (to avoid index shifting)
var keys = prop.getKeys();
for (var i = keys.length - 1; i >= 0; i--) {
    var key = keys[i];
    key.moveTo(key.getTime() + offset);
}
```

---

## Combined Example

```javascript
#include 'aequery.js'

aeq.createUndoGroup('Process Hierarchy', function() {
    var comp = new aeq.Comp(aeq.getActiveComp());

    // Find the root controller
    var rootLayer = comp.get('Root Controller');
    if (!rootLayer) {
        alert('Root Controller not found');
        return;
    }

    var root = new aeq.Layer(rootLayer);

    // Get all children
    var children = root.allChildren();
    $.writeln('Found ' + children.length + ' child layers');

    // Process each child
    children.forEach(function(childLayer) {
        var child = new aeq.Layer(childLayer);

        // Log effects
        child.forEachEffect(function(effect) {
            $.writeln(childLayer.name + ' has effect: ' + effect.name);
        });

        // Process position keyframes
        var position = new aeq.Property(childLayer.property('Position'));
        var keys = position.getKeys();

        if (keys.length > 0) {
            $.writeln(childLayer.name + ' has ' + keys.length + ' position keyframes');
        }
    });
});
```
