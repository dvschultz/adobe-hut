---
name: ae-properties
description: "Property manipulation in After Effects: copy properties between layers, reset transforms, bake expressions to keyframes."
---

# AE Properties

Manipulate layer properties in After Effects including copying, resetting, and baking expressions.

## Available Operations

### 1. Copy Properties Between Layers

Copy transform or other properties from one layer to another.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length !== 2) {
        alert("Please select exactly 2 layers.\nFirst selected = source, Second = target.");
        return;
    }

    var source = selected[0];
    var target = selected[1];

    // Properties to copy (modify as needed)
    var properties = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];

    app.beginUndoGroup("Copy Properties");
    try {
        var transform = source.property("Transform");
        var targetTransform = target.property("Transform");

        for (var i = 0; i < properties.length; i++) {
            var propName = properties[i];
            var sourceProp = transform.property(propName);
            var targetProp = targetTransform.property(propName);

            if (sourceProp !== null && targetProp !== null) {
                if (sourceProp.numKeys > 0) {
                    // Copy keyframes
                    for (var k = 1; k <= sourceProp.numKeys; k++) {
                        var time = sourceProp.keyTime(k);
                        var value = sourceProp.keyValue(k);
                        targetProp.setValueAtTime(time, value);
                    }
                } else {
                    // Copy static value
                    targetProp.setValue(sourceProp.value);
                }
            }
        }

        alert("Copied properties from '" + source.name + "' to '" + target.name + "'.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Reset Transforms

Reset all transform properties to their default values.

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

    app.beginUndoGroup("Reset Transforms");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var transform = layer.property("Transform");

            // Reset Anchor Point to layer center
            var anchorProp = transform.property("Anchor Point");
            if (layer.source && layer.source.width) {
                anchorProp.setValue([layer.source.width/2, layer.source.height/2]);
            }

            // Reset Position to comp center
            var posProp = transform.property("Position");
            if (posProp.dimensionsSeparated) {
                transform.property("X Position").setValue(comp.width/2);
                transform.property("Y Position").setValue(comp.height/2);
            } else {
                posProp.setValue([comp.width/2, comp.height/2]);
            }

            // Reset Scale to 100%
            transform.property("Scale").setValue([100, 100]);

            // Reset Rotation to 0
            transform.property("Rotation").setValue(0);

            // Reset Opacity to 100%
            transform.property("Opacity").setValue(100);
        }

        alert("Reset transforms for " + selected.length + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Bake Expressions to Keyframes

Convert expression-driven properties to keyframes at a specified interval.

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

    // Get bake interval
    var frameInterval = parseInt(prompt("Keyframe every N frames:", "1"), 10);
    if (isNaN(frameInterval) || frameInterval < 1) {
        alert("Invalid frame interval.");
        return;
    }

    var secondsPerKey = frameInterval / comp.frameRate;

    app.beginUndoGroup("Bake Expressions");
    try {
        var bakedCount = 0;

        for (var i = 0; i < selected.length; i++) {
            bakedCount += bakeLayerExpressions(selected[i], comp, secondsPerKey);
        }

        alert("Baked " + bakedCount + " expression(s) to keyframes.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function bakeLayerExpressions(layer, comp, interval) {
        var count = 0;
        processPropertyGroup(layer, comp, interval, function() { count++; });
        return count;
    }

    function processPropertyGroup(group, comp, interval, callback) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "" && prop.canSetExpression) {
                    bakeProperty(prop, comp, interval);
                    callback();
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                processPropertyGroup(prop, comp, interval, callback);
            }
        }
    }

    function bakeProperty(prop, comp, interval) {
        var start = comp.workAreaStart;
        var end = start + comp.workAreaDuration;
        var values = [];
        var times = [];

        // Sample expression values
        for (var t = start; t <= end; t += interval) {
            times.push(t);
            values.push(prop.valueAtTime(t, false));
        }

        // Remove expression
        prop.expression = "";

        // Set keyframes
        for (var j = 0; j < times.length; j++) {
            prop.setValueAtTime(times[j], values[j]);
        }
    }

})();
```

### 4. Copy Property with Keyframes

Copy a specific property including all keyframes from source to target layers.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length < 2) {
        alert("Select source layer first, then target layer(s).");
        return;
    }

    var propPath = prompt("Property path (e.g., 'Transform/Position'):", "Transform/Position");
    if (!propPath) return;

    var pathParts = propPath.split("/");
    var source = selected[0];

    app.beginUndoGroup("Copy Property");
    try {
        var sourceProp = source;
        for (var p = 0; p < pathParts.length; p++) {
            sourceProp = sourceProp.property(pathParts[p]);
            if (!sourceProp) {
                throw new Error("Property not found: " + pathParts[p]);
            }
        }

        for (var i = 1; i < selected.length; i++) {
            var targetProp = selected[i];
            for (var p2 = 0; p2 < pathParts.length; p2++) {
                targetProp = targetProp.property(pathParts[p2]);
            }

            // Remove existing keyframes
            while (targetProp.numKeys > 0) {
                targetProp.removeKey(1);
            }

            if (sourceProp.numKeys > 0) {
                for (var k = 1; k <= sourceProp.numKeys; k++) {
                    targetProp.setValueAtTime(
                        sourceProp.keyTime(k),
                        sourceProp.keyValue(k)
                    );
                }
            } else {
                targetProp.setValue(sourceProp.value);
            }
        }

        alert("Copied '" + propPath + "' to " + (selected.length - 1) + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Offset Keyframes in Time

Shift all keyframes on selected layers by a specified amount.

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

    var offsetFrames = parseInt(prompt("Offset keyframes by frames (negative = earlier):", "10"), 10);
    if (isNaN(offsetFrames)) {
        alert("Invalid input.");
        return;
    }

    var offsetSeconds = offsetFrames / comp.frameRate;

    app.beginUndoGroup("Offset Keyframes");
    try {
        var totalMoved = 0;

        for (var i = 0; i < selected.length; i++) {
            totalMoved += offsetLayerKeyframes(selected[i], offsetSeconds);
        }

        alert("Moved " + totalMoved + " keyframe(s) by " + offsetFrames + " frames.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function offsetLayerKeyframes(layer, offset) {
        var count = 0;
        processGroup(layer, offset, function() { count++; });
        return count;
    }

    function processGroup(group, offset, callback) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.numKeys > 0 && prop.canSetExpression) {
                    offsetPropertyKeyframes(prop, offset);
                    callback();
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                processGroup(prop, offset, callback);
            }
        }
    }

    function offsetPropertyKeyframes(prop, offset) {
        // Store keyframe data
        var keyData = [];
        for (var k = 1; k <= prop.numKeys; k++) {
            keyData.push({
                time: prop.keyTime(k) + offset,
                value: prop.keyValue(k)
            });
        }

        // Remove all keyframes
        while (prop.numKeys > 0) {
            prop.removeKey(1);
        }

        // Add keyframes at new times
        for (var j = 0; j < keyData.length; j++) {
            if (keyData[j].time >= 0) {
                prop.setValueAtTime(keyData[j].time, keyData[j].value);
            }
        }
    }

})();
```

## Usage

When the user invokes `/ae-properties`, ask which operation they want:

1. Copy properties between layers
2. Reset transforms
3. Bake expressions to keyframes
4. Copy specific property with keyframes
5. Offset keyframes in time

## Example Requests

- "Copy the position and scale from layer 1 to layer 2"
- "Reset all transforms on selected layers"
- "Bake my wiggle expression to keyframes every frame"
- "Move all keyframes 30 frames later"
- "Copy the opacity animation to other layers"
