#target aftereffects
/*
 * Recursive Scale Tunnel
 * Takes a single selected layer, duplicates it at progressively smaller scales
 * to create a tunnel/zoom effect. Optionally creates a controller null for
 * animated offset of the entire tunnel.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    var NAME_PREFIX = "RST__";
    var CTRL_NAME = "Tunnel Offset Controller";

    // ========== UTILITY FUNCTIONS ==========

    function startsWith(str, prefix) {
        return str && str.indexOf(prefix) === 0;
    }

    function parsePositiveFloat(value) {
        var n = parseFloat(value);
        if (isNaN(n) || n <= 0) return null;
        return n;
    }

    function parseInteger(value) {
        var n = parseInt(value, 10);
        if (isNaN(n)) return null;
        return n;
    }

    function zeroPad(num, digits) {
        var s = String(num);
        while (s.length < digits) {
            s = "0" + s;
        }
        return s;
    }

    function isResizableLayer(layer) {
        if (layer.locked) return false;
        if (layer.nullLayer) return false;
        if (layer.adjustmentLayer) return false;

        if (layer instanceof CameraLayer) return false;
        if (layer instanceof LightLayer) return false;
        if (layer instanceof ShapeLayer) return false;
        if (layer instanceof TextLayer) return false;

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
        var dlg = new Window("dialog", "Recursive Scale Tunnel");

        dlg.add("statictext", undefined, "Step size (pixels):");
        var stepInput = dlg.add("edittext", undefined, "100");
        stepInput.characters = 10;

        dlg.add("statictext", undefined, "Minimum size (pixels):");
        var minInput = dlg.add("edittext", undefined, "240");
        minInput.characters = 10;

        var dimPanel = dlg.add("panel", undefined, "Reference Dimension");
        dimPanel.orientation = "row";
        dimPanel.alignment = "left";
        var matchWidth = dimPanel.add("radiobutton", undefined, "Width");
        var matchHeight = dimPanel.add("radiobutton", undefined, "Height");
        matchWidth.value = true;

        var ctrlCheck = dlg.add("checkbox", undefined, "Create offset controller null");

        dlg.add("statictext", undefined, "Time offset per step (frames):");
        var timeOffsetGroup = dlg.add("group");
        var timeOffsetInput = timeOffsetGroup.add("edittext", undefined, "0");
        timeOffsetInput.characters = 6;
        timeOffsetGroup.add("statictext", undefined, "(0 = none, cumulative per duplicate)");

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Apply");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        stepInput.active = true;

        if (dlg.show() !== 1) {
            return null;
        }

        var step = parsePositiveFloat(stepInput.text);
        if (step === null) {
            alert("Please enter a positive number for step size.");
            return null;
        }

        var minSize = parsePositiveFloat(minInput.text);
        if (minSize === null) {
            alert("Please enter a positive number for minimum size.");
            return null;
        }

        var timeOffset = parseInteger(timeOffsetInput.text);
        if (timeOffset === null) {
            alert("Please enter a whole number for time offset (0 for none).");
            return null;
        }

        return {
            step: step,
            minSize: minSize,
            useWidth: matchWidth.value,
            createController: ctrlCheck.value,
            timeOffsetFrames: timeOffset
        };
    }

    // ========== CORE FUNCTIONS ==========

    function getExistingTunnelLayers(comp) {
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (startsWith(layer.name, NAME_PREFIX)) {
                layers.push(layer);
            }
        }
        return layers;
    }

    function removeExistingTunnelLayers(comp, excludeLayer) {
        for (var i = comp.numLayers; i >= 1; i--) {
            var layer = comp.layer(i);
            if (layer === excludeLayer) continue;
            if (startsWith(layer.name, NAME_PREFIX)) {
                layer.remove();
            }
        }
        // Also remove controller null if it exists
        for (var j = comp.numLayers; j >= 1; j--) {
            var lyr = comp.layer(j);
            if (lyr === excludeLayer) continue;
            if (lyr.name === CTRL_NAME) {
                lyr.remove();
                break;
            }
        }
    }

    function getRenderedDimension(layer, useWidth) {
        var scaleVal = layer.property("Transform").property("Scale").value;
        var sourceDim = useWidth ? layer.source.width : layer.source.height;
        var scaleAxis = useWidth ? scaleVal[0] : scaleVal[1];
        return {
            rendered: sourceDim * scaleAxis / 100,
            sourceDim: sourceDim
        };
    }

    function createTunnel(comp, sourceLayer, settings, frameRate) {
        var dimInfo = getRenderedDimension(sourceLayer, settings.useWidth);
        var renderedDim = dimInfo.rendered;
        var sourceDim = dimInfo.sourceDim;

        var count = Math.floor((renderedDim - settings.minSize) / settings.step);

        if (count <= 0) {
            alert(
                "No duplicates needed.\n\n" +
                "Current rendered " + (settings.useWidth ? "width" : "height") + ": " + Math.round(renderedDim) + " px\n" +
                "Minimum size: " + settings.minSize + " px\n" +
                "Step: " + settings.step + " px\n\n" +
                "The step size is larger than the available range (" + Math.round(renderedDim - settings.minSize) + " px).\n" +
                "Try a smaller step or lower minimum size."
            );
            return null;
        }

        if (count > 50) {
            var proceed = confirm(
                "This will create " + count + " duplicate layers and may run slowly.\nContinue?"
            );
            if (!proceed) return null;
        }

        var is3D = sourceLayer.threeDLayer;
        var padDigits = String(count).length;
        if (padDigits < 2) padDigits = 2;

        // Strip existing prefix and suffix from re-runs to avoid double-prefixing
        var baseName = sourceLayer.name;
        if (startsWith(baseName, NAME_PREFIX)) {
            baseName = baseName.substring(NAME_PREFIX.length);
        }
        var origSuffix = " (original)";
        if (baseName.length > origSuffix.length &&
            baseName.substring(baseName.length - origSuffix.length) === origSuffix) {
            baseName = baseName.substring(0, baseName.length - origSuffix.length);
        }

        // Rename original layer with prefix for re-run detection
        sourceLayer.name = NAME_PREFIX + baseName + " (original)";

        var duplicates = [];

        // Create duplicates from smallest to largest so smallest ends up on top
        for (var i = count; i >= 1; i--) {
            var dup = sourceLayer.duplicate();
            var newRendered = renderedDim - (i * settings.step);
            var scalePct = (newRendered / sourceDim) * 100;

            if (is3D) {
                dup.property("Transform").property("Scale").setValue([scalePct, scalePct, scalePct]);
            } else {
                dup.property("Transform").property("Scale").setValue([scalePct, scalePct]);
            }

            dup.name = NAME_PREFIX + baseName + " " + zeroPad(i, padDigits);

            // Apply cumulative time offset (i = duplicate number from original)
            if (settings.timeOffsetFrames !== 0) {
                dup.startTime += (i * settings.timeOffsetFrames) / frameRate;
            }

            duplicates.push(dup);
        }

        return {
            duplicates: duplicates,
            count: count,
            smallestScale: ((renderedDim - count * settings.step) / sourceDim) * 100,
            largestScale: ((renderedDim - settings.step) / sourceDim) * 100,
            timeOffsetFrames: settings.timeOffsetFrames
        };
    }

    function createControllerNull(comp, sourceLayer, duplicates) {
        var ctrl = comp.layers.addNull();
        ctrl.name = CTRL_NAME;

        // Position at comp center
        ctrl.property("Transform").property("Position").setValue([comp.width / 2, comp.height / 2]);

        // Move to top of layer stack
        ctrl.moveTo(1);

        // Link position directly to controller — all tunnel layers share the same
        // center point (they differ in scale, not position)
        var exp = 'thisComp.layer("' + CTRL_NAME + '").transform.position';

        // Apply to all duplicates
        for (var i = 0; i < duplicates.length; i++) {
            duplicates[i].property("Transform").property("Position").expression = exp;
        }

        // Apply to original layer too
        sourceLayer.property("Transform").property("Position").expression = exp;
    }

    // ========== USER FEEDBACK ==========

    function showResults(result, controllerCreated) {
        var msg = "Recursive Scale Tunnel Complete!\n\n";
        msg += "Duplicates created: " + result.count + "\n";
        msg += "Scale range: " + Math.round(result.smallestScale * 100) / 100 + "% to " + Math.round(result.largestScale * 100) / 100 + "%\n";

        if (result.timeOffsetFrames !== 0) {
            var dir = result.timeOffsetFrames > 0 ? "forward" : "backward";
            var totalFrames = Math.abs(result.timeOffsetFrames * result.count);
            msg += "Time offset: " + Math.abs(result.timeOffsetFrames) + "f per step " + dir + " (" + totalFrames + "f total)\n";
        }

        if (controllerCreated) {
            msg += 'Offset controller: "' + CTRL_NAME + '" (top of stack)\n';
        }

        alert(msg);
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        // Require exactly one selected layer
        if (comp.selectedLayers.length === 0) {
            alert("Please select a layer.");
            return;
        }

        if (comp.selectedLayers.length > 1) {
            alert("Please select a single layer.\nThis script operates on one layer at a time.");
            return;
        }

        var sourceLayer = comp.selectedLayers[0];

        if (!isResizableLayer(sourceLayer)) {
            alert(
                "Selected layer cannot be used.\n\n" +
                "The layer must be an unlocked video layer with a source\n" +
                "(footage, composition, or solid).\n\n" +
                "Shape layers, text layers, nulls, cameras, lights,\n" +
                "adjustment layers, and locked layers are not supported."
            );
            return;
        }

        // Warn about scale keyframes
        if (hasScaleKeyframes(sourceLayer)) {
            var continueKf = confirm(
                "The selected layer has scale keyframes.\n\n" +
                "The tunnel will be based on the current scale value\n" +
                "and duplicates will have static scale. Continue?"
            );
            if (!continueKf) return;
        }

        var settings = showDialog();
        if (settings === null) return;

        // Check for existing tunnel layers
        var existing = getExistingTunnelLayers(comp);
        if (existing.length > 0) {
            var replaceOk = confirm(
                "Found " + existing.length + " existing tunnel layer(s).\n\nReplace them?"
            );
            if (!replaceOk) return;
            removeExistingTunnelLayers(comp, sourceLayer);
        }

        var result = createTunnel(comp, sourceLayer, settings, comp.frameRate);
        if (result === null) return;

        var controllerCreated = false;
        if (settings.createController) {
            createControllerNull(comp, sourceLayer, result.duplicates);
            controllerCreated = true;
        }

        showResults(result, controllerCreated);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Recursive Scale Tunnel");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
