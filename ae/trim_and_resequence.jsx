#target aftereffects
/*
 * Trim and Resequence Layers
 * Trims X frames from the in and out points of every layer,
 * then resequences all clips to start at 0:00 with no gaps.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== UTILITY FUNCTIONS ==========

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

        // Focus the input field
        frameInput.active = true;

        if (dlg.show() !== 1) {
            return null; // User cancelled
        }

        var frameCount = parseInt(frameInput.text, 10);

        if (isNaN(frameCount)) {
            alert("Please enter a valid number.");
            return null;
        }

        if (frameCount < 0) {
            alert("Frame count cannot be negative.");
            return null;
        }

        return frameCount;
    }

    function isProcessableLayer(layer) {
        // Skip locked layers
        if (layer.locked) return false;

        // Skip null objects
        if (layer.nullLayer) return false;

        // Skip adjustment layers
        if (layer.adjustmentLayer) return false;

        // Check if it's an AVLayer (has video/audio)
        // Cameras and Lights don't have inPoint/outPoint we can modify in the same way
        try {
            // If we can access these properties, it's a valid layer
            var test = layer.inPoint;
            var test2 = layer.outPoint;
            return true;
        } catch (e) {
            return false;
        }
    }

    // ========== CORE FUNCTIONS ==========

    function collectLayerData(comp) {
        var layerData = [];

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (!isProcessableLayer(layer)) {
                continue;
            }

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

        // Sort by original inPoint, then by layer index as tiebreaker
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

            // Check if layer has enough duration to trim
            var totalTrim = trimSeconds * 2;
            if (data.originalDuration <= totalTrim) {
                data.skipped = true;
                data.skipReason = "too short";
                skippedCount++;
                continue;
            }

            // Trim the layer
            layer.inPoint = data.originalInPoint + trimSeconds;
            layer.outPoint = data.originalOutPoint - trimSeconds;

            // Store trimmed values for resequencing
            data.trimmedInPoint = layer.inPoint;
            data.trimmedOutPoint = layer.outPoint;
            data.trimmedDuration = layer.outPoint - layer.inPoint;
            // Source-relative in point (which frame of source is shown at inPoint)
            data.sourceInPoint = data.trimmedInPoint - layer.startTime;

            trimmedCount++;
        }

        return {
            trimmed: trimmedCount,
            skipped: skippedCount
        };
    }

    function resequenceLayers(layerData) {
        var currentTime = 0;
        var resequencedCount = 0;

        for (var i = 0; i < layerData.length; i++) {
            var data = layerData[i];

            // Skip layers that were skipped during trimming
            if (data.skipped) {
                continue;
            }

            var layer = data.layer;

            // Reposition layer to currentTime while preserving source alignment
            // The source-relative position tells us which frame of source is at inPoint
            layer.startTime = currentTime - data.sourceInPoint;
            layer.inPoint = currentTime;
            layer.outPoint = currentTime + data.trimmedDuration;

            currentTime = layer.outPoint;
            resequencedCount++;
        }

        return resequencedCount;
    }

    // ========== USER FEEDBACK ==========

    function showResults(trimResult, resequencedCount, skippedLayers) {
        var message = "Trim and Resequence Complete!\n\n";
        message += "Processed: " + resequencedCount + " layers\n";

        if (trimResult.skipped > 0) {
            message += "Skipped (too short to trim): " + trimResult.skipped + " layers\n";
        }

        if (skippedLayers > 0) {
            message += "Skipped (locked/null/adjustment): " + skippedLayers + " layers\n";
        }

        alert(message);
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        // Check for active composition
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (comp.numLayers === 0) {
            alert("Composition has no layers.");
            return;
        }

        // Prompt for frame count
        var frameCount = promptForFrameCount();
        if (frameCount === null) {
            return; // User cancelled or invalid input
        }

        var trimSeconds = frameCount / comp.frameRate;

        // Collect layer data (before any modifications)
        var layerData = collectLayerData(comp);
        var skippedDuringCollection = comp.numLayers - layerData.length;

        if (layerData.length === 0) {
            alert("No processable layers found.\n(Locked, null, and adjustment layers are skipped)");
            return;
        }

        // Phase 1: Trim all layers
        var trimResult = { trimmed: 0, skipped: 0 };
        if (frameCount > 0) {
            trimResult = trimLayers(layerData, trimSeconds);
        } else {
            // If frame count is 0, just mark all layers as not skipped for resequencing
            for (var i = 0; i < layerData.length; i++) {
                var data = layerData[i];
                data.trimmedInPoint = data.originalInPoint;
                data.trimmedOutPoint = data.originalOutPoint;
                data.trimmedDuration = data.originalDuration;
                data.sourceInPoint = data.originalInPoint - data.originalStartTime;
            }
            trimResult.trimmed = layerData.length;
        }

        // Phase 2: Resequence layers
        var resequencedCount = resequenceLayers(layerData);

        // Show results
        showResults(trimResult, resequencedCount, skippedDuringCollection);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Trim and Resequence Layers");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
