#target aftereffects
/*
 * Rose Hobart
 * Applies Black & White + Tint to all footage and precomp layers in
 * the active composition, drawing colors from a user-supplied palette
 * via shuffle-with-no-repeats. Inspired by Joseph Cornell's Rose Hobart
 * (1936), which projected re-edited footage through a single piece of
 * blue glass.
 *
 * Notes:
 *  - Adjustment layers above the footage will further modify the wash.
 *    Disable them temporarily to see Rose Hobart's output isolated.
 *  - Do not copy Rose-Hobart-treated layers between projects without
 *    first stripping the [rose_hobart] suffix from their effect names;
 *    re-running on imported tagged effects will remove them.
 *  - Locked layers and layers used as track-matte sources are skipped.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== CONSTANTS ==========

    var MARKER_SUFFIX = " [rose_hobart]";
    var DEFAULT_PALETTE = [
        "#1B3F8B", // deep cobalt (Cornell-blue homage)
        "#D4AA3F", // amber
        "#9B2D4F", // magenta-burgundy
        "#2D7C7C", // teal
        "#7C5839"  // sepia
    ];
    var DEFAULT_AMOUNT = 100;
    var DEFAULT_CONTRAST = 20;

    // ========== PURE HELPERS ==========

    function endsWithSuffix(name, suffix) {
        return name.length >= suffix.length &&
               name.substring(name.length - suffix.length) === suffix;
    }

    function parseHexColors(text) {
        var colors = [];
        var skipped = [];
        if (!text) return { colors: colors, skipped: skipped };

        var tokens = text.split(/[\s,]+/);
        for (var i = 0; i < tokens.length; i++) {
            var raw = tokens[i];
            if (!raw) continue;
            var hex = raw.toLowerCase();
            if (hex.charAt(0) === "#") hex = hex.substring(1);
            // Expand 3-digit form to 6-digit.
            if (hex.length === 3 && /^[0-9a-f]{3}$/.test(hex)) {
                hex = hex.charAt(0) + hex.charAt(0) +
                      hex.charAt(1) + hex.charAt(1) +
                      hex.charAt(2) + hex.charAt(2);
            }
            if (hex.length !== 6 || !/^[0-9a-f]{6}$/.test(hex)) {
                skipped.push(raw);
                continue;
            }
            var r = parseInt(hex.substring(0, 2), 16) / 255;
            var g = parseInt(hex.substring(2, 4), 16) / 255;
            var b = parseInt(hex.substring(4, 6), 16) / 255;
            colors.push([r, g, b]);
        }
        return { colors: colors, skipped: skipped };
    }

    // 32-bit integer multiply polyfill. ExtendScript is ES3 — no Math.imul.
    function imul(a, b) {
        var aHi = (a >>> 16) & 0xffff, aLo = a & 0xffff;
        var bHi = (b >>> 16) & 0xffff, bLo = b & 0xffff;
        return ((aLo * bLo) + (((aHi * bLo + aLo * bHi) << 16) >>> 0)) | 0;
    }

    function mulberry32(seed) {
        var state = (seed | 0) >>> 0;
        return function() {
            state = (state + 0x6D2B79F5) >>> 0;
            var t = state;
            t = imul(t ^ (t >>> 15), t | 1);
            t ^= t + imul(t ^ (t >>> 7), t | 61);
            return (((t ^ (t >>> 14)) >>> 0)) / 4294967296;
        };
    }

    function shuffleWithNoRepeats(length, palette, rng) {
        var result = [];
        if (length === 0 || palette.length === 0) return result;
        if (palette.length === 1) {
            for (var i = 0; i < length; i++) result.push(0);
            return result;
        }

        var prevLast = -1;
        while (result.length < length) {
            // Fisher-Yates shuffle of [0 .. palette.length-1].
            var cycle = [];
            for (var k = 0; k < palette.length; k++) cycle.push(k);
            for (var j = cycle.length - 1; j > 0; j--) {
                var swap = Math.floor(rng() * (j + 1));
                var tmp = cycle[j];
                cycle[j] = cycle[swap];
                cycle[swap] = tmp;
            }
            // Avoid boundary repeat: if the new cycle's first index equals the
            // previous cycle's last, swap cycle[0] with a random non-zero index.
            if (prevLast >= 0 && cycle[0] === prevLast && cycle.length > 1) {
                var swapIdx = 1 + Math.floor(rng() * (cycle.length - 1));
                var tmp2 = cycle[0];
                cycle[0] = cycle[swapIdx];
                cycle[swapIdx] = tmp2;
            }
            for (var n = 0; n < cycle.length && result.length < length; n++) {
                result.push(cycle[n]);
            }
            prevLast = result[result.length - 1];
        }
        return result;
    }

    // ========== LAYER TARGETING + CLEANUP ==========

    function getTargetLayers(comp) {
        var targets = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (!(layer instanceof AVLayer)) continue;
            if (layer.source == null) continue;
            if (!(layer.source instanceof FootageItem ||
                  layer.source instanceof CompItem)) continue;
            if (layer.locked) continue;
            if (layer.isTrackMatte) continue;
            targets.push(layer);
        }
        return targets;
    }

    function removePriorRoseHobartEffects(layer) {
        var effects = layer.property("ADBE Effect Parade");
        if (!effects) return;
        // Iterate downward so removal does not skip indices.
        for (var i = effects.numProperties; i >= 1; i--) {
            var fx = effects.property(i);
            if (endsWithSuffix(fx.name, MARKER_SUFFIX)) {
                fx.remove();
                // Do not reuse fx after .remove() — the reference is invalidated.
            }
        }
    }

    // ========== EFFECT APPLICATION ==========

    function applyRoseHobart(layer, color, amount, contrast) {
        var effects = layer.property("ADBE Effect Parade");

        // Stack order (top to bottom = render order):
        //   Black & White → Brightness & Contrast → Tint
        // Black & White desaturates first; the contrast bump crunches the
        // grayscale (filmic feel); Tint paints the result with the assigned
        // color. addProperty appends at the bottom of the effect stack and
        // AE renders top-to-bottom, so this trio always renders LAST for the
        // layer — intentional, the wash is the final color treatment.
        var bw = effects.addProperty("ADBE Black&White");
        try {
            bw.name = bw.name + MARKER_SUFFIX;
        } catch (e1) {
            bw.remove();
            throw new Error("Could not tag added Black & White effect; " +
                            "aborting to prevent un-rediscoverable artifacts.");
        }

        var bc = effects.addProperty("ADBE Brightness & Contrast 2");
        try {
            bc.name = bc.name + MARKER_SUFFIX;
        } catch (e2) {
            bc.remove();
            throw new Error("Could not tag added Brightness & Contrast effect; " +
                            "aborting to prevent un-rediscoverable artifacts.");
        }
        // Brightness & Contrast 2 sub-property indices (locale-stable):
        //   1 = Brightness  (left at 0)
        //   2 = Contrast    (assigned dialog value)
        //   3 = Use Legacy  (left at default false — modern gamma handling)
        bc.property(2).setValue(contrast);

        var tint = effects.addProperty("ADBE Tint");
        try {
            tint.name = tint.name + MARKER_SUFFIX;
        } catch (e3) {
            tint.remove();
            throw new Error("Could not tag added Tint effect; " +
                            "aborting to prevent un-rediscoverable artifacts.");
        }
        // Tint sub-property indices (locale-stable):
        //   1 = Map Black To  (left at default black per origin R13)
        //   2 = Map White To  (assigned palette color)
        //   3 = Amount to Tint
        tint.property(2).setValue(color);
        tint.property(3).setValue(amount);
    }

    // ========== DIALOG ==========

    function showDialog(layerCount) {
        var dlg = new Window("dialog", "Rose Hobart");
        dlg.preferredSize = [360, 360];
        dlg.alignChildren = "fill";
        dlg.margins = 12;
        dlg.spacing = 8;

        // Palette panel
        var palettePanel = dlg.add("panel", undefined, "Palette");
        palettePanel.alignChildren = "fill";
        palettePanel.margins = 10;
        palettePanel.spacing = 4;
        palettePanel.add("statictext", undefined,
            "Paste hex colors (one per line, comma- or whitespace-separated):");
        var paletteField = palettePanel.add(
            "edittext",
            undefined,
            DEFAULT_PALETTE.join("\n"),
            { multiline: true, wantReturn: true, scrolling: true }
        );
        paletteField.preferredSize = [300, 140];

        // Options panel
        var optionsPanel = dlg.add("panel", undefined, "Options");
        optionsPanel.alignChildren = "left";
        optionsPanel.margins = 10;
        optionsPanel.spacing = 6;
        var amountRow = optionsPanel.add("group");
        amountRow.add("statictext", undefined, "Tint Amount (%):");
        var amountField = amountRow.add("edittext", undefined, String(DEFAULT_AMOUNT));
        amountField.preferredSize = [60, 22];
        var contrastRow = optionsPanel.add("group");
        contrastRow.add("statictext", undefined, "Contrast (0–100):");
        var contrastField = contrastRow.add("edittext", undefined, String(DEFAULT_CONTRAST));
        contrastField.preferredSize = [60, 22];
        var seedRow = optionsPanel.add("group");
        seedRow.add("statictext", undefined, "Random Seed (optional):");
        var seedField = seedRow.add("edittext", undefined, "");
        seedField.preferredSize = [80, 22];

        // Layer count preview
        dlg.add(
            "statictext",
            undefined,
            layerCount + " layer(s) will be processed"
        );

        // Warning row (initially hidden, toggled via .visible)
        var warningRow = dlg.add("statictext", undefined, "", { multiline: true });
        warningRow.preferredSize = [330, 36];
        warningRow.enabled = false;
        warningRow.visible = false;

        // Buttons
        var btnGroup = dlg.add("group");
        btnGroup.alignment = "right";
        var applyBtn = btnGroup.add("button", undefined, "Apply");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        var settings = null;

        applyBtn.onClick = function() {
            // Clear and hide warning at the top of every Apply attempt.
            warningRow.text = "";
            warningRow.visible = false;

            var parsed = parseHexColors(paletteField.text);
            var colors = parsed.colors;
            var skipped = parsed.skipped;

            if (colors.length === 0 && skipped.length === 0) {
                warningRow.text = "Palette is empty. Paste at least one hex color.";
                warningRow.visible = true;
                dlg.layout.layout(true);
                return;
            }
            if (colors.length === 0 && skipped.length > 0) {
                warningRow.text = "No valid hex colors found. Skipped: " + skipped.join(", ");
                warningRow.visible = true;
                dlg.layout.layout(true);
                return;
            }
            if (skipped.length > 0) {
                // Non-blocking: surface skipped, but proceed with the valid colors.
                warningRow.text = "Skipped: " + skipped.join(", ");
                warningRow.visible = true;
                dlg.layout.layout(true);
            }

            // Tint Amount: clamp to [0, 100], default to DEFAULT_AMOUNT on non-numeric.
            var amount = parseFloat(amountField.text);
            if (isNaN(amount)) amount = DEFAULT_AMOUNT;
            if (amount < 0) amount = 0;
            if (amount > 100) amount = 100;

            // Contrast: clamp to [0, 100], default to DEFAULT_CONTRAST on non-numeric.
            var contrast = parseFloat(contrastField.text);
            if (isNaN(contrast)) contrast = DEFAULT_CONTRAST;
            if (contrast < 0) contrast = 0;
            if (contrast > 100) contrast = 100;

            // Random Seed: integer or null.
            var seedRaw = seedField.text;
            var seed;
            if (seedRaw == null || seedRaw === "") {
                seed = null;
            } else {
                var n = parseInt(seedRaw, 10);
                seed = isNaN(n) ? null : n;
            }

            settings = { colors: colors, amount: amount, contrast: contrast, seed: seed };
            dlg.close(1);
        };

        cancelBtn.onClick = function() { dlg.close(0); };

        // Default focus on the palette field.
        paletteField.active = true;

        // Treat any non-1 return as Cancel (covers the OS title-bar X on Windows,
        // which can return undefined rather than 0).
        if (dlg.show() !== 1) return null;
        return settings;
    }

    // ========== MAIN ==========

    function main() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please open a composition before running Rose Hobart.");
            return;
        }

        var targets = getTargetLayers(comp);
        if (targets.length === 0) {
            alert("No footage or precomp layers found in the active composition.");
            return;
        }

        var settings = showDialog(targets.length);
        if (settings === null) return;

        var rng = (settings.seed === null) ? Math.random : mulberry32(settings.seed);
        var indices = shuffleWithNoRepeats(targets.length, settings.colors, rng);

        for (var i = 0; i < targets.length; i++) {
            var layer = targets[i];
            var color = settings.colors[indices[i]];
            removePriorRoseHobartEffects(layer);
            applyRoseHobart(layer, color, settings.amount, settings.contrast);
        }

        var seedDescriptor = (settings.seed === null) ? "random" : String(settings.seed);
        var msg = "Rose Hobart applied!\n\n";
        msg += "Layers processed: " + targets.length + "\n";
        msg += "Palette size: " + settings.colors.length + "\n";
        msg += "Seed: " + seedDescriptor + "\n";
        msg += "Tint Amount: " + settings.amount + "%\n";
        msg += "Contrast: " + settings.contrast;
        alert(msg);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Rose Hobart");
    try {
        main();
    } catch (e) {
        alert("Rose Hobart error: " + e.message);
    }
    app.endUndoGroup();

})();
