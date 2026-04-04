#target aftereffects
/*
 * Text Hue Cycle
 * Finds every text layer in the active composition and adds a
 * Text Animator with keyframed Fill Hue. Every 12 seconds the
 * hue shifts by -60 degrees (cumulative).
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    var HUE_STEP = -60;       // degrees per interval
    var INTERVAL = 12;        // seconds between keyframes

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "Text Hue Cycle");

        var interpPanel = dlg.add("panel", undefined, "Keyframe Interpolation");
        interpPanel.orientation = "row";
        interpPanel.alignment = "left";
        var linearBtn = interpPanel.add("radiobutton", undefined, "Linear (smooth)");
        var holdBtn = interpPanel.add("radiobutton", undefined, "Hold (hard cuts)");
        linearBtn.value = true;

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Apply");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) {
            return null;
        }

        return {
            useHold: holdBtn.value
        };
    }

    // ========== CORE FUNCTIONS ==========

    function getTextLayers(comp) {
        var layers = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i) instanceof TextLayer) {
                layers.push(comp.layer(i));
            }
        }
        return layers;
    }

    function applyHueCycle(layer, compDuration, useHold) {
        // Add a Text Animator with Fill Hue property
        var animators = layer.property("ADBE Text Properties").property("ADBE Text Animators");
        var animator = animators.addProperty("ADBE Text Animator");
        animator.name = "Hue Cycle";

        // Add Fill Hue to the animator's properties
        var animProps = animator.property("ADBE Text Animator Properties");
        var fillHue = animProps.addProperty("ADBE Text Fill Hue");

        // Set keyframes at 12-second intervals
        var keyframeCount = Math.floor(compDuration / INTERVAL) + 1;

        for (var i = 0; i < keyframeCount; i++) {
            var time = i * INTERVAL;
            fillHue.setValueAtTime(time, i * HUE_STEP);
        }

        // Set keyframe interpolation
        var interpType = useHold
            ? KeyframeInterpolationType.HOLD
            : KeyframeInterpolationType.LINEAR;

        for (var k = 1; k <= fillHue.numKeys; k++) {
            fillHue.setInterpolationTypeAtKey(k, interpType, interpType);
        }

        return keyframeCount;
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var textLayers = getTextLayers(comp);

        if (textLayers.length === 0) {
            alert("No text layers found in the active composition.");
            return;
        }

        var settings = showDialog();
        if (settings === null) return;

        var keyframeCount = 0;

        for (var i = 0; i < textLayers.length; i++) {
            keyframeCount = applyHueCycle(textLayers[i], comp.duration, settings.useHold);
        }

        var interpName = settings.useHold ? "Hold (hard cuts)" : "Linear (smooth)";
        var msg = "Text Hue Cycle Complete!\n\n";
        msg += "Text layers processed: " + textLayers.length + "\n";
        msg += "Keyframes per layer: " + keyframeCount + "\n";
        msg += "Interpolation: " + interpName + "\n";
        msg += "Hue shift: " + HUE_STEP + " degrees every " + INTERVAL + " seconds";

        alert(msg);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Text Hue Cycle");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
