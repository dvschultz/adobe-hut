---
name: ae-layer-ops
description: "Common After Effects layer operations: duplicate with offset, trim to work area, sequence layers, randomize order, parent/unparent."
---

# AE Layer Operations

Perform common layer manipulation tasks in After Effects.

## Available Operations

### 1. Duplicate with Offset

Duplicate selected layers with a time offset between each copy.

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

    var copies = parseInt(prompt("Number of copies:", "5"), 10);
    var offset = parseFloat(prompt("Time offset (seconds):", "0.1"));

    if (isNaN(copies) || isNaN(offset)) {
        alert("Invalid input.");
        return;
    }

    app.beginUndoGroup("Duplicate with Offset");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            for (var j = 1; j <= copies; j++) {
                var dupe = layer.duplicate();
                dupe.startTime = layer.startTime + (offset * j);
            }
        }
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Trim to Work Area

Trim all selected layers to match the composition's work area.

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

    var waStart = comp.workAreaStart;
    var waEnd = waStart + comp.workAreaDuration;

    app.beginUndoGroup("Trim to Work Area");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            layer.inPoint = waStart;
            layer.outPoint = waEnd;
        }
        alert("Trimmed " + selected.length + " layer(s) to work area.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Sequence Layers

Arrange selected layers sequentially (end to end) starting from the first layer's in point.

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
        alert("Please select at least 2 layers.");
        return;
    }

    // Sort by current in point
    var sorted = selected.slice().sort(function(a, b) {
        return a.inPoint - b.inPoint;
    });

    app.beginUndoGroup("Sequence Layers");
    try {
        var currentTime = sorted[0].inPoint;

        for (var i = 0; i < sorted.length; i++) {
            var layer = sorted[i];
            var duration = layer.outPoint - layer.inPoint;
            var sourceIn = layer.inPoint - layer.startTime;

            layer.startTime = currentTime - sourceIn;
            layer.inPoint = currentTime;
            layer.outPoint = currentTime + duration;

            currentTime = layer.outPoint;
        }

        alert("Sequenced " + sorted.length + " layers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 4. Randomize Layer Order

Randomly reorder selected layers in the layer stack.

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
        alert("Please select at least 2 layers.");
        return;
    }

    app.beginUndoGroup("Randomize Layer Order");
    try {
        // Fisher-Yates shuffle
        var indices = [];
        for (var i = 0; i < selected.length; i++) {
            indices[i] = i;
        }

        for (var j = indices.length - 1; j > 0; j--) {
            var rand = Math.floor(Math.random() * (j + 1));
            var temp = indices[j];
            indices[j] = indices[rand];
            indices[rand] = temp;
        }

        // Reorder by moving each to beginning in shuffled order
        for (var k = 0; k < indices.length; k++) {
            selected[indices[k]].moveToBeginning();
        }

        alert("Randomized " + selected.length + " layers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Parent to New Null

Create a null object and parent all selected layers to it.

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

    app.beginUndoGroup("Parent to Null");
    try {
        var nullLayer = comp.layers.addNull();
        nullLayer.name = "Controller";

        for (var i = 0; i < selected.length; i++) {
            selected[i].parent = nullLayer;
        }

        alert("Parented " + selected.length + " layer(s) to '" + nullLayer.name + "'.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 6. Unparent All

Remove parent relationship from selected layers while preserving their current transform.

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

    app.beginUndoGroup("Unparent All");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            if (selected[i].parent !== null) {
                selected[i].parent = null;
                count++;
            }
        }
        alert("Unparented " + count + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Usage

When the user invokes `/ae-layer-ops`, ask which operation they want to perform:

1. Duplicate with offset
2. Trim to work area
3. Sequence layers
4. Randomize order
5. Parent to null
6. Unparent all

Then provide the appropriate script or customize based on their parameters.

## Example Requests

- "Duplicate selected layers 10 times with 2 frame offset"
- "Trim all selected layers to the work area"
- "Sequence my selected layers end to end"
- "Randomize the order of selected layers"
- "Create a null and parent everything to it"
