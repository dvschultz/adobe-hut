---
name: ae-randomize
description: "Randomize layer order in After Effects. Wraps ae/randomize-layers.jsx"
---

# AE Randomize Layers

Randomly shuffle the order of layers in the layer stack.

## What This Skill Does

This skill wraps the `ae/randomize-layers.jsx` script which randomizes the stacking order of all layers in the active composition.

Useful for:
- Creating variation in collage compositions
- Randomizing z-order of elements
- Shuffling cards or tile arrangements
- Quick experimentation with layer order

## Usage

### Run the Existing Script

The script is located at:
```
ae/randomize-layers.jsx
```

To run:
1. Open your composition in After Effects
2. Go to `File > Scripts > Run Script File...`
3. Navigate to `ae/randomize-layers.jsx`
4. The layers will be immediately shuffled

### The Original Script

```javascript
{
var myComp = app.project.activeItem;
var n = myComp.numLayers;
var myLayers = [];
var myIdx = [];

for (var i = 1; i <= n; i++) {
    myIdx[i-1] = i;
    myLayers[i-1] = myComp.layer(i);
}

var idx;
var temp;
for (var i = 0; i < myIdx.length; i++) {
    idx = i + Math.floor(Math.random() * (myIdx.length - i));
    temp = myIdx[i];
    myIdx[i] = myIdx[idx];
    myIdx[idx] = temp;
}

for (var i = 0; i < myIdx.length; i++) {
    myLayers[myIdx[i]-1].moveToBeginning();
}
}
```

## Enhanced Version

Here's an enhanced version with more options:

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    if (comp.numLayers < 2) {
        alert("Need at least 2 layers to randomize.");
        return;
    }

    // Options dialog
    var dlg = new Window("dialog", "Randomize Layers");

    var scopePanel = dlg.add("panel", undefined, "Scope");
    scopePanel.alignChildren = ["left", "top"];
    var allLayers = scopePanel.add("radiobutton", undefined, "All layers");
    var selectedOnly = scopePanel.add("radiobutton", undefined, "Selected layers only");
    allLayers.value = true;

    var optionsPanel = dlg.add("panel", undefined, "Options");
    optionsPanel.alignChildren = ["left", "top"];
    var preserveLocked = optionsPanel.add("checkbox", undefined, "Preserve locked layers position");
    preserveLocked.value = true;

    var btnGroup = dlg.add("group");
    btnGroup.add("button", undefined, "Randomize", { name: "ok" });
    btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

    if (dlg.show() !== 1) return;

    app.beginUndoGroup("Randomize Layers");
    try {
        var layers = [];
        var lockedIndices = [];

        if (selectedOnly.value) {
            // Selected layers only
            var selected = comp.selectedLayers;
            if (selected.length < 2) {
                alert("Select at least 2 layers to randomize.");
                return;
            }
            for (var i = 0; i < selected.length; i++) {
                layers.push(selected[i]);
            }
        } else {
            // All layers
            for (var j = 1; j <= comp.numLayers; j++) {
                var layer = comp.layer(j);
                if (preserveLocked.value && layer.locked) {
                    lockedIndices.push(j);
                } else {
                    layers.push(layer);
                }
            }
        }

        if (layers.length < 2) {
            alert("Not enough layers to randomize.");
            return;
        }

        // Fisher-Yates shuffle
        for (var k = layers.length - 1; k > 0; k--) {
            var rand = Math.floor(Math.random() * (k + 1));
            var temp = layers[k];
            layers[k] = layers[rand];
            layers[rand] = temp;
        }

        // Reorder by moving to beginning in reverse shuffled order
        for (var m = layers.length - 1; m >= 0; m--) {
            layers[m].moveToBeginning();
        }

        alert("Randomized " + layers.length + " layers.");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Variations

### Randomize Selected Layers Only

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
        alert("Select at least 2 layers to randomize.");
        return;
    }

    app.beginUndoGroup("Randomize Selected");
    try {
        // Fisher-Yates shuffle
        var layers = selected.slice();
        for (var i = layers.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = layers[i];
            layers[i] = layers[j];
            layers[j] = temp;
        }

        // Reorder
        for (var k = layers.length - 1; k >= 0; k--) {
            layers[k].moveToBeginning();
        }

        alert("Randomized " + layers.length + " selected layers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### Randomize with Seed (Reproducible)

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var seed = parseInt(prompt("Enter seed number (same seed = same result):", "12345"), 10);
    if (isNaN(seed)) return;

    // Simple seeded random function
    function seededRandom(seed) {
        var x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    app.beginUndoGroup("Randomize with Seed");
    try {
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            layers.push(comp.layer(i));
        }

        // Seeded shuffle
        var currentSeed = seed;
        for (var j = layers.length - 1; j > 0; j--) {
            var rand = Math.floor(seededRandom(currentSeed++) * (j + 1));
            var temp = layers[j];
            layers[j] = layers[rand];
            layers[rand] = temp;
        }

        for (var k = layers.length - 1; k >= 0; k--) {
            layers[k].moveToBeginning();
        }

        alert("Randomized with seed: " + seed);
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### Randomize Timing (Keep Stack Order)

Randomize when layers appear without changing stack order:

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var maxOffset = parseFloat(prompt("Max random offset (seconds):", "2"));
    if (isNaN(maxOffset)) return;

    app.beginUndoGroup("Randomize Timing");
    try {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var offset = (Math.random() * 2 - 1) * maxOffset;
            layer.startTime += offset;
        }

        alert("Randomized timing of " + comp.numLayers + " layers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Example Requests

- "Randomize the order of all layers"
- "Shuffle selected layers only"
- "Randomize with a seed so I can reproduce it"
- "Randomize when layers appear on the timeline"

## Notes

- Uses Fisher-Yates shuffle algorithm for true randomness
- The original script affects all layers in the composition
- Use Undo (Cmd/Ctrl+Z) if you don't like the result
- Run multiple times for different random arrangements
