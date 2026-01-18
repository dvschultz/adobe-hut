---
name: ae-trim-resequence
description: "Trim frames from layer in/out points and resequence layers to start at 0:00 with no gaps. Wraps ae/trim_and_resequence.jsx"
---

# AE Trim and Resequence

Trim frames from the in and out points of every layer, then resequence all clips to start at 0:00 with no gaps.

## What This Skill Does

This skill wraps the `ae/trim_and_resequence.jsx` script which:

1. **Trims layers**: Removes a specified number of frames from both the in-point and out-point of each layer
2. **Resequences layers**: Arranges all layers sequentially starting at 0:00 with no gaps between them

This is particularly useful for:
- Removing slate frames or leader from clips
- Trimming flash frames at edit points
- Creating seamless sequences from individual clips
- Preparing clips for further editing

## Usage

### Run the Existing Script

The full script is located at:
```
ae/trim_and_resequence.jsx
```

To run:
1. Open your composition in After Effects
2. Go to `File > Scripts > Run Script File...`
3. Navigate to `ae/trim_and_resequence.jsx`
4. Enter the number of frames to trim from each side
5. Click "Trim & Resequence"

### Script Behavior

- **Prompts for frame count**: How many frames to remove from each side (in-point and out-point)
- **Skips short layers**: Layers too short to trim are skipped (not deleted)
- **Skips special layers**: Locked layers, null objects, and adjustment layers are skipped
- **Preserves source timing**: The correct portion of each source clip is maintained

### Example

If you have 3 clips with the following timeline:

```
Before:
Clip 1: 0:00 -------- 2:00
Clip 2:           1:30 -------- 3:30
Clip 3:                     3:00 -------- 5:00
```

After running with 5 frames trimmed from each side:

```
After (at 30fps, 5 frames = ~0.17 seconds):
Clip 1: 0:00 ------ 1:83 (trimmed from both ends)
Clip 2: 1:83 ------ 3:50
Clip 3: 3:50 ------ 5:17
```

## The Script

```javascript
#target aftereffects
/*
 * Trim and Resequence Layers
 * Trims X frames from the in and out points of every layer,
 * then resequences all clips to start at 0:00 with no gaps.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    function promptForFrameCount() {
        var dlg = new Window("dialog", "Trim and Resequence Layers");

        dlg.add("statictext", undefined, "Frames to trim from each side:");

        var inputGroup = dlg.add("group");
        var frameInput = inputGroup.add("edittext", undefined, "1");
        frameInput.characters = 10;

        dlg.add("statictext", undefined, "");

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Trim & Resequence");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        frameInput.active = true;

        if (dlg.show() !== 1) {
            return null;
        }

        var frameCount = parseInt(frameInput.text, 10);

        if (isNaN(frameCount) || frameCount < 0) {
            alert("Please enter a valid number.");
            return null;
        }

        return frameCount;
    }

    function isProcessableLayer(layer) {
        if (layer.locked) return false;
        if (layer.nullLayer) return false;
        if (layer.adjustmentLayer) return false;

        try {
            var test = layer.inPoint;
            var test2 = layer.outPoint;
            return true;
        } catch (e) {
            return false;
        }
    }

    function collectLayerData(comp) {
        var layerData = [];

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (!isProcessableLayer(layer)) continue;

            layerData.push({
                layer: layer,
                index: layer.index,
                originalInPoint: layer.inPoint,
                originalOutPoint: layer.outPoint,
                originalStartTime: layer.startTime,
                originalDuration: layer.outPoint - layer.inPoint,
                skipped: false,
                skipReason: null
            });
        }

        layerData.sort(function(a, b) {
            if (a.originalInPoint !== b.originalInPoint) {
                return a.originalInPoint - b.originalInPoint;
            }
            return a.index - b.index;
        });

        return layerData;
    }

    function trimLayers(layerData, trimSeconds) {
        var trimmedCount = 0;
        var skippedCount = 0;

        for (var i = 0; i < layerData.length; i++) {
            var data = layerData[i];
            var layer = data.layer;

            var totalTrim = trimSeconds * 2;
            if (data.originalDuration <= totalTrim) {
                data.skipped = true;
                data.skipReason = "too short";
                skippedCount++;
                continue;
            }

            layer.inPoint = data.originalInPoint + trimSeconds;
            layer.outPoint = data.originalOutPoint - trimSeconds;

            data.trimmedInPoint = layer.inPoint;
            data.trimmedOutPoint = layer.outPoint;
            data.trimmedDuration = layer.outPoint - layer.inPoint;
            data.sourceInPoint = data.trimmedInPoint - layer.startTime;

            trimmedCount++;
        }

        return { trimmed: trimmedCount, skipped: skippedCount };
    }

    function resequenceLayers(layerData) {
        var currentTime = 0;
        var resequencedCount = 0;

        for (var i = 0; i < layerData.length; i++) {
            var data = layerData[i];

            if (data.skipped) continue;

            var layer = data.layer;

            layer.startTime = currentTime - data.sourceInPoint;
            layer.inPoint = currentTime;
            layer.outPoint = currentTime + data.trimmedDuration;

            currentTime = layer.outPoint;
            resequencedCount++;
        }

        return resequencedCount;
    }

    function main() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (comp.numLayers === 0) {
            alert("Composition has no layers.");
            return;
        }

        var frameCount = promptForFrameCount();
        if (frameCount === null) return;

        var trimSeconds = frameCount / comp.frameRate;

        var layerData = collectLayerData(comp);
        var skippedDuringCollection = comp.numLayers - layerData.length;

        if (layerData.length === 0) {
            alert("No processable layers found.");
            return;
        }

        var trimResult = { trimmed: 0, skipped: 0 };
        if (frameCount > 0) {
            trimResult = trimLayers(layerData, trimSeconds);
        } else {
            for (var i = 0; i < layerData.length; i++) {
                var data = layerData[i];
                data.trimmedInPoint = data.originalInPoint;
                data.trimmedOutPoint = data.originalOutPoint;
                data.trimmedDuration = data.originalDuration;
                data.sourceInPoint = data.originalInPoint - data.originalStartTime;
            }
            trimResult.trimmed = layerData.length;
        }

        var resequencedCount = resequenceLayers(layerData);

        alert("Complete!\n" +
              "Processed: " + resequencedCount + " layers\n" +
              (trimResult.skipped > 0 ? "Skipped (too short): " + trimResult.skipped + "\n" : "") +
              (skippedDuringCollection > 0 ? "Skipped (locked/null/adj): " + skippedDuringCollection : ""));
    }

    app.beginUndoGroup("Trim and Resequence Layers");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Options

### Trim Only (No Resequence)

If you only want to trim without resequencing:

```javascript
// Modify the script to skip resequenceLayers() call
// Or use this simplified version:

var comp = app.project.activeItem;
var framesToTrim = 5;
var trimSeconds = framesToTrim / comp.frameRate;

app.beginUndoGroup("Trim Only");
for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layer(i);
    layer.inPoint = layer.inPoint + trimSeconds;
    layer.outPoint = layer.outPoint - trimSeconds;
}
app.endUndoGroup();
```

### Resequence Only (No Trim)

Enter 0 for the frame count when prompted to only resequence without trimming.

## Example Requests

- "Trim 2 frames from each clip and close the gaps"
- "Remove head and tail frames from all layers and sequence them"
- "Resequence my layers starting at 0:00"
- "Trim slate frames and sequence the clips"

## Notes

- The script works on the active composition
- Layers are sorted by their in-point before resequencing
- Original source timing is preserved (correct frames are shown)
- Use Undo (Cmd/Ctrl+Z) to revert if needed
