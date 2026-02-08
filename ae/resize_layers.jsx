#target aftereffects
/*
 * Resize Layers to Target Dimension
 * Resizes layers in the active composition to match a target width or height,
 * maintaining aspect ratio. Skips locked, null, adjustment, camera, light,
 * and scale-keyframed layers.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== UTILITY FUNCTIONS ==========

    function isResizableLayer(layer) {
        if (layer.locked) return false;
        if (layer.nullLayer) return false;
        if (layer.adjustmentLayer) return false;

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
    }

    function hasScaleKeyframes(layer) {
        try {
            return layer.property("Transform").property("Scale").numKeys > 0;
        } catch (e) {
            return false;
        }
    }

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "Resize Layers");

        dlg.add("statictext", undefined, "Target size (pixels):");
        var sizeInput = dlg.add("edittext", undefined, "1920");
        sizeInput.characters = 10;

        var dimPanel = dlg.add("panel", undefined, "Match Dimension");
        dimPanel.orientation = "row";
        dimPanel.alignment = "left";
        var matchWidth = dimPanel.add("radiobutton", undefined, "Match Width");
        var matchHeight = dimPanel.add("radiobutton", undefined, "Match Height");
        matchWidth.value = true;

        var scopePanel = dlg.add("panel", undefined, "Layer Scope");
        scopePanel.orientation = "row";
        scopePanel.alignment = "left";
        var allLayers = scopePanel.add("radiobutton", undefined, "All Layers");
        var selectedLayers = scopePanel.add("radiobutton", undefined, "Selected Layers");
        allLayers.value = true;

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Resize");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        sizeInput.active = true;

        if (dlg.show() !== 1) {
            return null;
        }

        var targetSize = parseInt(sizeInput.text, 10);

        if (isNaN(targetSize) || targetSize <= 0) {
            alert("Please enter a positive integer for the target size.");
            return null;
        }

        return {
            targetSize: targetSize,
            matchWidth: matchWidth.value,
            useSelected: selectedLayers.value
        };
    }

    // ========== CORE FUNCTIONS ==========

    function getLayers(comp, useSelected) {
        var layers = [];

        if (useSelected) {
            if (comp.selectedLayers.length === 0) {
                alert("No layers selected.\nPlease select one or more layers.");
                return null;
            }
            for (var i = 0; i < comp.selectedLayers.length; i++) {
                layers.push(comp.selectedLayers[i]);
            }
        } else {
            for (var i = 1; i <= comp.numLayers; i++) {
                layers.push(comp.layer(i));
            }
        }

        return layers;
    }

    function resizeLayers(layers, targetSize, matchWidth) {
        var resizedCount = 0;
        var keyframedCount = 0;
        var skippedCount = 0;

        for (var i = 0; i < layers.length; i++) {
            var layer = layers[i];

            if (!isResizableLayer(layer)) {
                skippedCount++;
                continue;
            }

            if (hasScaleKeyframes(layer)) {
                keyframedCount++;
                continue;
            }

            try {
                var sourceDim = matchWidth ? layer.source.width : layer.source.height;
                var scaleFactor = (targetSize / sourceDim) * 100;
                layer.property("Transform").property("Scale").setValue([scaleFactor, scaleFactor]);
                resizedCount++;
            } catch (e) {
                skippedCount++;
            }
        }

        return {
            resized: resizedCount,
            keyframed: keyframedCount,
            skipped: skippedCount
        };
    }

    // ========== USER FEEDBACK ==========

    function showResults(result) {
        var message = "Resize Complete!\n\n";
        message += "Resized: " + result.resized + " layers\n";

        if (result.keyframed > 0) {
            message += "Skipped (scale keyframes): " + result.keyframed + " layers\n";
        }

        if (result.skipped > 0) {
            message += "Skipped (locked/null/adjustment/camera/light): " + result.skipped + " layers\n";
        }

        alert(message);
    }

    // ========== MAIN FUNCTION ==========

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

        var settings = showDialog();
        if (settings === null) {
            return;
        }

        var layers = getLayers(comp, settings.useSelected);
        if (layers === null) {
            return;
        }

        var result = resizeLayers(layers, settings.targetSize, settings.matchWidth);
        showResults(result);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Resize Layers");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
