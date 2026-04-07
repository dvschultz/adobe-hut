#target aftereffects
/*
 * Slit-Scan Masks
 * Divides the active composition into equal vertical or horizontal strips
 * and applies one rectangular mask per layer, creating a slit-scan effect.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== UTILITY FUNCTIONS ==========

    function makeRectShape(x, y, w, h) {
        var shape = new Shape();
        shape.vertices = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        shape.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.closed = true;
        return shape;
    }

    // ========== LAYER FILTERING ==========

    function isMaskableLayer(layer) {
        if (layer.locked) return false;
        if (layer.nullLayer) return false;
        if (layer.adjustmentLayer) return false;
        if (layer instanceof CameraLayer) return false;
        if (layer instanceof LightLayer) return false;
        return true;
    }

    function collectLayers(comp) {
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (isMaskableLayer(layer)) {
                layers.push(layer);
            }
        }
        return layers;
    }

    // ========== MASK APPLICATION ==========

    function removeExistingSlitMasks(layer) {
        var masks = layer.property("ADBE Mask Parade");
        if (!masks) return;
        for (var m = masks.numProperties; m >= 1; m--) {
            if (masks.property(m).name === "Slit Mask") {
                masks.property(m).remove();
            }
        }
    }

    function hasNonSlitMasks(layer) {
        var masks = layer.property("ADBE Mask Parade");
        if (!masks) return false;
        for (var m = 1; m <= masks.numProperties; m++) {
            if (masks.property(m).name !== "Slit Mask") {
                return true;
            }
        }
        return false;
    }

    function applySlitMasks(layers, direction, compWidth, compHeight) {
        var count = layers.length;

        for (var i = 0; i < count; i++) {
            var layer = layers[i];

            removeExistingSlitMasks(layer);

            var x, y, w, h;
            if (direction === "vertical") {
                var slitW = Math.floor(compWidth / count);
                x = i * slitW;
                w = (i === count - 1) ? (compWidth - x) : slitW;
                y = 0;
                h = compHeight;
            } else {
                var slitH = Math.floor(compHeight / count);
                y = i * slitH;
                h = (i === count - 1) ? (compHeight - y) : slitH;
                x = 0;
                w = compWidth;
            }

            var useIntersect = hasNonSlitMasks(layer);
            var masks = layer.property("ADBE Mask Parade");
            var newMask = masks.addProperty("ADBE Mask Atom");
            newMask.name = "Slit Mask";
            newMask.maskMode = useIntersect ? MaskMode.INTERSECT : MaskMode.ADD;

            var maskShapeProp = newMask.property("ADBE Mask Shape");
            maskShapeProp.setValue(makeRectShape(x, y, w, h));
        }
    }

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "Slit-Scan Masks");

        var dirPanel = dlg.add("panel", undefined, "Slit Direction");
        dirPanel.orientation = "column";
        dirPanel.alignment = ["fill", "top"];
        dirPanel.alignChildren = "left";

        var verticalBtn = dirPanel.add("radiobutton", undefined, "Vertical columns");
        var horizontalBtn = dirPanel.add("radiobutton", undefined, "Horizontal rows");
        verticalBtn.value = true;

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Apply");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) {
            return null;
        }

        return { direction: horizontalBtn.value ? "horizontal" : "vertical" };
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var layers = collectLayers(comp);

        if (layers.length === 0) {
            alert("No maskable layers found in composition.");
            return;
        }

        if (layers.length === 1) {
            alert("Only 1 layer found \u2014 need at least 2 layers for a slit-scan effect.");
            return;
        }

        var settings = showDialog();
        if (!settings) return;

        applySlitMasks(layers, settings.direction, comp.width, comp.height);

        alert("Slit-Scan Masks applied!\n\n" +
              "Layers masked: " + layers.length + "\n" +
              "Direction: " + settings.direction + "\n" +
              "Strip size: " + (settings.direction === "vertical"
                  ? Math.floor(comp.width / layers.length) + " x " + comp.height
                  : comp.width + " x " + Math.floor(comp.height / layers.length)) + " px");
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Slit-Scan Masks");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
