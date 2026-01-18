#target aftereffects
#include '../lib/aequery.js'
/*
 * Trim and Resequence Layers (AEQuery version)
 * Trims X frames from the in and out points of every layer,
 * then resequences all clips to start at 0:00 with no gaps.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // Check for active composition
    var comp = aeq.getActiveComp();
    if (!comp) {
        alert('Please select a composition.');
        return;
    }

    if (comp.numLayers === 0) {
        alert('Composition has no layers.');
        return;
    }

    // Create UI dialog using aeq.ui
    var dialog = aeq.ui.createDialog('Trim and Resequence Layers');

    dialog.addStaticText('Frames to trim from each side:');
    var frameInput = dialog.addEditText('1');

    var buttons = dialog.addGroup();
    buttons.addButton('Trim & Resequence', function() {
        dialog.close(1);
    });
    buttons.addButton('Cancel', function() {
        dialog.close(0);
    });

    if (dialog.show() !== 1) {
        return; // User cancelled
    }

    var frameCount = parseInt(frameInput.text, 10);

    if (isNaN(frameCount)) {
        alert('Please enter a valid number.');
        return;
    }

    if (frameCount < 0) {
        alert('Frame count cannot be negative.');
        return;
    }

    var trimSeconds = frameCount / comp.frameRate;

    aeq.createUndoGroup('Trim and Resequence Layers', function() {

        // Get processable layers using selectors
        // Filter out locked, null, and adjustment layers
        var layers = aeq('layer:not(locked):not(nullLayer):not(adjustmentLayer)', comp);

        // Additional filter for layers we can actually process
        var processableLayers = layers.filter(function(layer) {
            try {
                // Test if we can access timing properties
                var test = layer.inPoint;
                var test2 = layer.outPoint;
                return true;
            } catch (e) {
                return false;
            }
        });

        var skippedDuringCollection = comp.numLayers - processableLayers.length;

        if (processableLayers.length === 0) {
            alert('No processable layers found.\n(Locked, null, and adjustment layers are skipped)');
            return;
        }

        // Collect layer data and sort by inPoint
        var layerData = processableLayers.map(function(layer) {
            return {
                layer: layer,
                index: layer.index,
                originalInPoint: layer.inPoint,
                originalOutPoint: layer.outPoint,
                originalStartTime: layer.startTime,
                originalDuration: layer.outPoint - layer.inPoint,
                skipped: false,
                skipReason: null
            };
        });

        // Sort by original inPoint, then by layer index as tiebreaker
        layerData.sort(function(a, b) {
            if (a.originalInPoint !== b.originalInPoint) {
                return a.originalInPoint - b.originalInPoint;
            }
            return a.index - b.index;
        });

        // Convert back to arrayEx for chaining
        layerData = new aeq.arrayEx(layerData);

        // Phase 1: Trim layers
        var trimResult = { trimmed: 0, skipped: 0 };

        if (frameCount > 0) {
            layerData.forEach(function(data) {
                var totalTrim = trimSeconds * 2;

                // Check if layer has enough duration to trim
                if (data.originalDuration <= totalTrim) {
                    data.skipped = true;
                    data.skipReason = 'too short';
                    trimResult.skipped++;
                    return;
                }

                // Trim the layer
                data.layer.inPoint = data.originalInPoint + trimSeconds;
                data.layer.outPoint = data.originalOutPoint - trimSeconds;

                // Store trimmed values for resequencing
                data.trimmedInPoint = data.layer.inPoint;
                data.trimmedOutPoint = data.layer.outPoint;
                data.trimmedDuration = data.layer.outPoint - data.layer.inPoint;
                data.sourceInPoint = data.trimmedInPoint - data.layer.startTime;

                trimResult.trimmed++;
            });
        } else {
            // If frame count is 0, just prepare for resequencing
            layerData.forEach(function(data) {
                data.trimmedInPoint = data.originalInPoint;
                data.trimmedOutPoint = data.originalOutPoint;
                data.trimmedDuration = data.originalDuration;
                data.sourceInPoint = data.originalInPoint - data.originalStartTime;
            });
            trimResult.trimmed = layerData.length;
        }

        // Phase 2: Resequence layers
        var currentTime = 0;
        var resequencedCount = 0;

        layerData
            .filter(function(data) { return !data.skipped; })
            .forEach(function(data) {
                var layer = data.layer;

                // Reposition layer to currentTime while preserving source alignment
                layer.startTime = currentTime - data.sourceInPoint;
                layer.inPoint = currentTime;
                layer.outPoint = currentTime + data.trimmedDuration;

                currentTime = layer.outPoint;
                resequencedCount++;
            });

        // Show results
        var message = 'Trim and Resequence Complete!\n\n';
        message += 'Processed: ' + resequencedCount + ' layers\n';

        if (trimResult.skipped > 0) {
            message += 'Skipped (too short to trim): ' + trimResult.skipped + ' layers\n';
        }

        if (skippedDuringCollection > 0) {
            message += 'Skipped (locked/null/adjustment): ' + skippedDuringCollection + ' layers\n';
        }

        alert(message);
    });

})();
