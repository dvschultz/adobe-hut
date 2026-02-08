#target aftereffects
#include '../lib/aequery.js'
/*
 * Resize Layers to Target Dimension (AEQuery version)
 * Resizes layers in the active composition to match a target width or height,
 * maintaining aspect ratio. Skips locked, null, adjustment, camera, light,
 * and scale-keyframed layers.
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
    var dialog = aeq.ui.createDialog('Resize Layers');

    dialog.addStaticText('Target size (pixels):');
    var sizeInput = dialog.addEditText('1920');

    var dimPanel = dialog.addPanel('Match Dimension');
    dimPanel.set({ orientation: 'row', alignment: 'left' });
    var matchWidthBtn = dimPanel.addRadioButton('Match Width');
    var matchHeightBtn = dimPanel.addRadioButton('Match Height');
    matchWidthBtn.set({ value: true });

    var scopePanel = dialog.addPanel('Layer Scope');
    scopePanel.set({ orientation: 'row', alignment: 'left' });
    var allLayersBtn = scopePanel.addRadioButton('All Layers');
    var selectedLayersBtn = scopePanel.addRadioButton('Selected Layers');
    allLayersBtn.set({ value: true });

    var buttons = dialog.addGroup();
    buttons.addButton('Resize', function() {
        dialog.close(1);
    });
    buttons.addButton('Cancel', function() {
        dialog.close(0);
    });

    if (dialog.show() !== 1) {
        return;
    }

    var targetSize = parseInt(sizeInput.text, 10);

    if (isNaN(targetSize) || targetSize <= 0) {
        alert('Please enter a positive integer for the target size.');
        return;
    }

    var matchWidth = matchWidthBtn.value;
    var useSelected = selectedLayersBtn.value;

    // Check selected layers early
    if (useSelected && comp.selectedLayers.length === 0) {
        alert('No layers selected.\nPlease select one or more layers.');
        return;
    }

    aeq.createUndoGroup('Resize Layers', function() {

        // Get layers using aeq selectors
        var layers;
        if (useSelected) {
            layers = new aeq.arrayEx(comp.selectedLayers);
        } else {
            layers = aeq('layer:not(locked):not(nullLayer):not(adjustmentLayer)', comp);
        }

        // Filter to resizable layers
        var resizableLayers = layers.filter(function(layer) {
            if (useSelected) {
                if (layer.locked) return false;
                if (layer.nullLayer) return false;
                if (layer.adjustmentLayer) return false;
            }

            if (layer instanceof CameraLayer) return false;
            if (layer instanceof LightLayer) return false;

            try {
                var w = layer.source.width;
                var h = layer.source.height;
                if (!w || !h) return false;
            } catch (e) {
                return false;
            }

            return true;
        });

        var resizedCount = 0;
        var keyframedCount = 0;
        var skippedCount = layers.length - resizableLayers.length;

        resizableLayers.forEach(function(layer) {
            // Skip layers with scale keyframes
            try {
                if (layer.property('Transform').property('Scale').numKeys > 0) {
                    keyframedCount++;
                    return;
                }
            } catch (e) {
                skippedCount++;
                return;
            }

            try {
                var sourceDim = matchWidth ? layer.source.width : layer.source.height;
                var scaleFactor = (targetSize / sourceDim) * 100;
                layer.property('Transform').property('Scale').setValue([scaleFactor, scaleFactor]);
                resizedCount++;
            } catch (e) {
                skippedCount++;
            }
        });

        // Show results
        var message = 'Resize Complete!\n\n';
        message += 'Resized: ' + resizedCount + ' layers\n';

        if (keyframedCount > 0) {
            message += 'Skipped (scale keyframes): ' + keyframedCount + ' layers\n';
        }

        if (skippedCount > 0) {
            message += 'Skipped (locked/null/adjustment/camera/light): ' + skippedCount + ' layers\n';
        }

        alert(message);
    });

})();
