#target aftereffects
/*
 * Wallpaper Pattern Loop Generator
 * Creates a procedural wallpaper-style motif grid and applies a 4-phase loop:
 * 1) Columns move vertically
 * 2) Global spin
 * 3) Rows move horizontally
 * 4) Global spin
 *
 * Usage: File > Scripts > Run Script File...
 */

(function() {

    var NAME_PREFIX = "WPL__";

    // ========== UTIL ==========

    function startsWith(str, prefix) {
        return str && str.indexOf(prefix) === 0;
    }

    function clamp(value, min, max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function parsePositiveFloat(value) {
        var n = parseFloat(value);
        if (isNaN(n) || n <= 0) return null;
        return n;
    }

    function parsePositiveInt(value) {
        var n = parseInt(value, 10);
        if (isNaN(n) || n <= 0) return null;
        return n;
    }

    function parseNonNegativeFloat(value) {
        var n = parseFloat(value);
        if (isNaN(n) || n < 0) return null;
        return n;
    }

    function toFixedNumber(value) {
        return String(Math.round(value * 1000) / 1000);
    }

    function hexToRgb01(hex) {
        var cleaned = String(hex).replace(/\s+/g, "");
        if (cleaned.charAt(0) === "#") cleaned = cleaned.substring(1);
        if (cleaned.length === 3) {
            cleaned = cleaned.charAt(0) + cleaned.charAt(0) +
                cleaned.charAt(1) + cleaned.charAt(1) +
                cleaned.charAt(2) + cleaned.charAt(2);
        }
        if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;

        var r = parseInt(cleaned.substring(0, 2), 16) / 255;
        var g = parseInt(cleaned.substring(2, 4), 16) / 255;
        var b = parseInt(cleaned.substring(4, 6), 16) / 255;
        return [r, g, b];
    }

    function seededRandom(seed) {
        var state = parseInt(seed, 10);
        if (isNaN(state)) state = 1;
        state = state >>> 0;
        if (state === 0) state = 1;

        return function() {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function clearKeys(prop) {
        while (prop.numKeys > 0) {
            prop.removeKey(prop.numKeys);
        }
    }

    function getEasePresetIndex(name) {
        if (name === "Linear") return 0;
        if (name === "Easy Ease") return 1;
        return 2; // Smooth
    }

    function applyInterpolation(prop, presetName) {
        var i;
        if (presetName === "Linear") {
            for (i = 1; i <= prop.numKeys; i++) {
                prop.setInterpolationTypeAtKey(
                    i,
                    KeyframeInterpolationType.LINEAR,
                    KeyframeInterpolationType.LINEAR
                );
            }
            return;
        }

        var influence = (presetName === "Smooth") ? 80 : 50;
        for (i = 1; i <= prop.numKeys; i++) {
            prop.setInterpolationTypeAtKey(
                i,
                KeyframeInterpolationType.BEZIER,
                KeyframeInterpolationType.BEZIER
            );

            var easeIn = [];
            var easeOut = [];
            var dim = 1;
            var valueType = prop.propertyValueType;
            if (valueType === PropertyValueType.TwoD) dim = 2;
            if (valueType === PropertyValueType.ThreeD) dim = 3;
            var d;
            for (d = 0; d < dim; d++) {
                easeIn.push(new KeyframeEase(0, influence));
                easeOut.push(new KeyframeEase(0, influence));
            }

            prop.setTemporalEaseAtKey(i, easeIn, easeOut);
        }
    }

    // ========== UI ==========

    function showDialog() {
        var dlg = new Window("dialog", "Wallpaper Pattern Loop Generator");

        var loopPanel = dlg.add("panel", undefined, "Loop");
        loopPanel.alignment = ["fill", "top"];
        loopPanel.orientation = "column";
        loopPanel.alignChildren = ["left", "top"];

        var durationGroup = loopPanel.add("group");
        durationGroup.add("statictext", undefined, "Loop Duration (sec):");
        var durationInput = durationGroup.add("edittext", undefined, "6");
        durationInput.characters = 8;

        var seamGroup = loopPanel.add("group");
        seamGroup.add("statictext", undefined, "Seam Mode:");
        var seamDropdown = seamGroup.add("dropdownlist", undefined, [
            "Keyframes + cycle expression",
            "Pure expression-driven"
        ]);
        seamDropdown.selection = 0;

        var easingGroup = loopPanel.add("group");
        easingGroup.add("statictext", undefined, "Easing Preset:");
        var easingDropdown = easingGroup.add("dropdownlist", undefined, [
            "Linear",
            "Easy Ease",
            "Smooth"
        ]);
        easingDropdown.selection = 1;

        var gridPanel = dlg.add("panel", undefined, "Grid + Motion");
        gridPanel.alignment = ["fill", "top"];
        gridPanel.orientation = "column";
        gridPanel.alignChildren = ["left", "top"];

        var rcGroup = gridPanel.add("group");
        rcGroup.add("statictext", undefined, "Rows:");
        var rowsInput = rcGroup.add("edittext", undefined, "8");
        rowsInput.characters = 5;
        rcGroup.add("statictext", undefined, "Columns:");
        var colsInput = rcGroup.add("edittext", undefined, "14");
        colsInput.characters = 5;

        var infoGroup = gridPanel.add("group");
        infoGroup.add("statictext", undefined, "Motion distance auto = 2x cell size");

        var rowModeGroup = gridPanel.add("group");
        rowModeGroup.add("statictext", undefined, "Row Motion:");
        var rowModeDropdown = rowModeGroup.add("dropdownlist", undefined, [
            "Alternating",
            "Single direction",
            "Seeded-random"
        ]);
        rowModeDropdown.selection = 0;

        var colModeGroup = gridPanel.add("group");
        colModeGroup.add("statictext", undefined, "Column Motion:");
        var colModeDropdown = colModeGroup.add("dropdownlist", undefined, [
            "Alternating",
            "Single direction",
            "Seeded-random"
        ]);
        colModeDropdown.selection = 0;

        var rotModeGroup = loopPanel.add("group");
        rotModeGroup.add("statictext", undefined, "Rotation Motion:");
        var rotModeDropdown = rotModeGroup.add("dropdownlist", undefined, [
            "Forward only",
            "Pulse (forward/back)"
        ]);
        rotModeDropdown.selection = 0;

        var seedGroup = gridPanel.add("group");
        seedGroup.add("statictext", undefined, "Random Seed:");
        var seedInput = seedGroup.add("edittext", undefined, "42");
        seedInput.characters = 8;

        var stylePanel = dlg.add("panel", undefined, "Style");
        stylePanel.alignment = ["fill", "top"];
        stylePanel.orientation = "column";
        stylePanel.alignChildren = ["left", "top"];

        var colorGroup = stylePanel.add("group");
        colorGroup.add("statictext", undefined, "Background Hex:");
        var bgInput = colorGroup.add("edittext", undefined, "#F4B0C8");
        bgInput.characters = 10;
        colorGroup.add("statictext", undefined, "Motif Hex:");
        var motifInput = colorGroup.add("edittext", undefined, "#F8D6E5");
        motifInput.characters = 10;

        var shapeGroup = stylePanel.add("group");
        shapeGroup.add("statictext", undefined, "Dot Size (px):");
        var dotSizeInput = shapeGroup.add("edittext", undefined, "16");
        dotSizeInput.characters = 8;
        shapeGroup.add("statictext", undefined, "Stroke Weight:");
        var strokeInput = shapeGroup.add("edittext", undefined, "2");
        strokeInput.characters = 8;
        shapeGroup.add("statictext", undefined, "Rotation Amount:");
        var rotationInput = shapeGroup.add("edittext", undefined, "90");
        rotationInput.characters = 8;

        var rerunGroup = dlg.add("group");
        var promptReplaceCheckbox = rerunGroup.add("checkbox", undefined, "Prompt before replacing previous generated output");
        promptReplaceCheckbox.value = true;

        var btnGroup = dlg.add("group");
        var generateBtn = btnGroup.add("button", undefined, "Generate");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        generateBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) return null;

        var loopDuration = parsePositiveFloat(durationInput.text);
        var rows = parsePositiveInt(rowsInput.text);
        var cols = parsePositiveInt(colsInput.text);
        var dotSize = parsePositiveFloat(dotSizeInput.text);
        var strokeWeight = parsePositiveFloat(strokeInput.text);
        var rotationAmount = parseNonNegativeFloat(rotationInput.text);

        if (loopDuration === null) {
            alert("Loop Duration must be a positive number.");
            return null;
        }
        if (rows === null || cols === null) {
            alert("Rows and Columns must be positive integers.");
            return null;
        }
        if (dotSize === null || strokeWeight === null || rotationAmount === null) {
            alert("Dot Size, Stroke Weight, and Rotation Amount must be valid numbers.");
            return null;
        }

        var bgColor = hexToRgb01(bgInput.text);
        var motifColor = hexToRgb01(motifInput.text);
        if (!bgColor || !motifColor) {
            alert("Please enter valid 3 or 6 digit hex colors.");
            return null;
        }

        var totalCells = rows * cols;
        if (totalCells > 500) {
            var continueHeavy = confirm("This creates " + totalCells + " motif layers and may run slowly. Continue?");
            if (!continueHeavy) return null;
        }

        return {
            loopDuration: loopDuration,
            seamMode: seamDropdown.selection.text,
            easingPreset: easingDropdown.selection.text,
            rows: rows,
            cols: cols,
            rowMotionMode: rowModeDropdown.selection.text,
            colMotionMode: colModeDropdown.selection.text,
            rotationMotionMode: rotModeDropdown.selection.text,
            randomSeed: parseInt(seedInput.text, 10),
            bgColor: bgColor,
            motifColor: motifColor,
            dotSize: dotSize,
            strokeWeight: strokeWeight,
            rotationAmount: rotationAmount,
            promptReplace: promptReplaceCheckbox.value
        };
    }

    // ========== GENERATED LAYER MANAGEMENT ==========

    function getGeneratedLayers(comp) {
        var layers = [];
        var i;
        for (i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (startsWith(layer.name, NAME_PREFIX)) {
                layers.push(layer);
            }
        }
        return layers;
    }

    function removeGeneratedLayers(comp) {
        var i;
        for (i = comp.numLayers; i >= 1; i--) {
            var layer = comp.layer(i);
            if (startsWith(layer.name, NAME_PREFIX)) {
                layer.remove();
            }
        }
    }

    // ========== SHAPE HELPERS ==========

    function makeLineShape(x1, y1, x2, y2) {
        var shape = new Shape();
        shape.vertices = [[x1, y1], [x2, y2]];
        shape.inTangents = [[0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0]];
        shape.closed = false;
        return shape;
    }

    function addStroke(contents, color, width, opacity) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(color);
        stroke.property("Stroke Width").setValue(width);
        if (typeof opacity === "number") {
            stroke.property("Opacity").setValue(clamp(opacity, 0, 100));
        }
        try {
            // 1=Butt, 2=Round, 3=Projecting (AE enum for shape stroke line cap)
            stroke.property("ADBE Vector Stroke Line Cap").setValue(2);
        } catch (e) {}
        return stroke;
    }

    function addDottedCircle(contents, dotSize, strokeWeight, color) {
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "Dotted Circle";
        var groupContents = group.property("Contents");

        var ellipse = groupContents.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("Size").setValue([dotSize * 2, dotSize * 2]);

        var circleWeight = strokeWeight * 1.25;
        var stroke = addStroke(groupContents, color, circleWeight, 100);
        var dashes = stroke.property("ADBE Vector Stroke Dashes");
        if (dashes) {
            var dash = dashes.addProperty("ADBE Vector Stroke Dash 1");
            var gap = dashes.addProperty("ADBE Vector Stroke Gap 1");
            dash.setValue(Math.max(0.2, circleWeight * 1.0));
            gap.setValue(Math.max(3.6, circleWeight * 3.0));
        }
    }

    function addXMark(contents, dotSize, strokeWeight, color) {
        var group = contents.addProperty("ADBE Vector Group");
        group.name = "X Mark";
        var groupContents = group.property("Contents");

        var half = dotSize * 0.72;
        var xWeight = strokeWeight * 1.35;

        function addDashedDiagonal(x1, y1, x2, y2) {
            var lineGroup = groupContents.addProperty("ADBE Vector Group");
            var lineContents = lineGroup.property("Contents");

            var path = lineContents.addProperty("ADBE Vector Shape - Group");
            path.property("Path").setValue(makeLineShape(x1, y1, x2, y2));

            var stroke = addStroke(lineContents, color, xWeight, 100);
            var dashes = stroke.property("ADBE Vector Stroke Dashes");
            if (dashes) {
                var dash = dashes.addProperty("ADBE Vector Stroke Dash 1");
                var gap = dashes.addProperty("ADBE Vector Stroke Gap 1");
                dash.setValue(Math.max(1.3, xWeight * 1.35));
                gap.setValue(Math.max(6.2, xWeight * 4.2));
            }
        }

        addDashedDiagonal(-half, -half, half, half);
        addDashedDiagonal(-half, half, half, -half);
    }

    function createMotifLayer(comp, name, settings, position, symbolType) {
        var layer = comp.layers.addShape();
        layer.name = name;

        var contents = layer.property("Contents");
        var symbolSize = settings.dotSize * 1.5;
        if (symbolType === "circle") {
            addDottedCircle(contents, symbolSize, settings.strokeWeight, settings.motifColor);
        } else {
            addXMark(contents, symbolSize, settings.strokeWeight, settings.motifColor);
        }

        layer.property("Transform").property("Anchor Point").setValue([0, 0]);
        layer.property("Transform").property("Position").setValue(position);
        layer.property("Transform").property("Rotation").setValue(0);

        return layer;
    }

    // ========== GRID + DIRECTIONS ==========

    function computeCellCenters(comp, rows, cols, overscanCells) {
        var cellW = comp.width / cols;
        var cellH = comp.height / rows;
        if (cellW <= 0 || cellH <= 0) return null;

        var centers = [];
        var startRow = -overscanCells;
        var endRow = rows + overscanCells - 1;
        var startCol = -overscanCells;
        var endCol = cols + overscanCells - 1;

        var r, c;
        for (r = startRow; r <= endRow; r++) {
            for (c = startCol; c <= endCol; c++) {
                var x = (c + 0.5) * cellW;
                var y = (r + 0.5) * cellH;
                centers.push({
                    row: r,
                    col: c,
                    rowIndex: r - startRow,
                    colIndex: c - startCol,
                    position: [x, y]
                });
            }
        }

        return {
            centers: centers,
            cellW: cellW,
            cellH: cellH,
            totalRows: rows + overscanCells * 2,
            totalCols: cols + overscanCells * 2
        };
    }

    function buildDirectionArray(count, mode, rng) {
        var arr = [];
        var i;
        for (i = 0; i < count; i++) {
            if (mode === "Alternating") {
                arr.push((i % 2 === 0) ? -1 : 1);
            } else if (mode === "Single direction") {
                arr.push(1);
            } else {
                arr.push((rng() < 0.5) ? -1 : 1);
            }
        }
        return arr;
    }

    // ========== ANIMATION ==========

    function setPositionKeys(prop, basePos, verticalOffset, horizontalOffset, startTime, q, pauseRatio) {
        var moveDur = q * (1 - pauseRatio);
        var t0 = startTime;
        var t1 = startTime + moveDur;
        var t2 = startTime + q;
        var t3 = startTime + q * 2;
        var t4 = startTime + q * 2 + moveDur;
        var t5 = startTime + q * 3;
        var t6 = startTime + q * 4;

        prop.setValueAtTime(t0, [basePos[0], basePos[1]]);
        prop.setValueAtTime(t1, [basePos[0], basePos[1] + verticalOffset]); // end col move
        prop.setValueAtTime(t2, [basePos[0], basePos[1] + verticalOffset]); // pause before spin 1
        prop.setValueAtTime(t3, [basePos[0], basePos[1] + verticalOffset]);
        prop.setValueAtTime(t4, [basePos[0] + horizontalOffset, basePos[1] + verticalOffset]); // end row move
        prop.setValueAtTime(t5, [basePos[0] + horizontalOffset, basePos[1] + verticalOffset]); // pause before spin 2
        prop.setValueAtTime(t6, [basePos[0] + horizontalOffset, basePos[1] + verticalOffset]);
    }

    function setRotationKeys(prop, rotationAmount, startTime, q, pauseRatio, forwardOnly) {
        var spinStartOffset = q * pauseRatio;
        var spinDur = q - spinStartOffset;
        var t0 = startTime;
        var s1 = startTime + q + spinStartOffset;
        var m1 = s1 + spinDur * 0.5;
        var e1 = startTime + q * 2;
        var s2 = startTime + q * 3 + spinStartOffset;
        var m2 = s2 + spinDur * 0.5;
        var e2 = startTime + q * 4;

        prop.setValueAtTime(t0, 0);
        prop.setValueAtTime(s1, 0);

        if (forwardOnly) {
            prop.setValueAtTime(e1, rotationAmount);
            prop.setValueAtTime(s2, rotationAmount);
            prop.setValueAtTime(e2, rotationAmount * 2);
        } else {
            prop.setValueAtTime(m1, rotationAmount);
            prop.setValueAtTime(e1, 0);
            prop.setValueAtTime(s2, 0);
            prop.setValueAtTime(m2, rotationAmount);
            prop.setValueAtTime(e2, 0);
        }
    }

    function buildExpressionHelpers(easePresetIndex) {
        var lines = [];
        lines.push("var E=" + easePresetIndex + ";");
        lines.push("function easeProgress(u){");
        lines.push("  if (u < 0) u = 0;");
        lines.push("  if (u > 1) u = 1;");
        lines.push("  if (E === 0) return u;");
        lines.push("  var s = Math.sin((Math.PI * 0.5) * u);");
        lines.push("  if (E === 1) return Math.pow(s, 0.9);");
        lines.push("  return Math.pow(s, 1.35);");
        lines.push("}");
        lines.push("function spinPulse(u){");
        lines.push("  if (u < 0) u = 0;");
        lines.push("  if (u > 1) u = 1;");
        lines.push("  var p = Math.sin(Math.PI * u);");
        lines.push("  if (E === 0) return p;");
        lines.push("  if (E === 1) return Math.pow(p, 0.85);");
        lines.push("  return Math.pow(p, 1.4);");
        lines.push("}");
        return lines.join("\n");
    }

    function buildPositionExpression(basePos, verticalOffset, horizontalOffset, loopDuration, easePresetIndex, pauseRatio) {
        var exp = [];
        exp.push("var D=" + toFixedNumber(loopDuration) + ";");
        exp.push("var BX=" + toFixedNumber(basePos[0]) + ";");
        exp.push("var BY=" + toFixedNumber(basePos[1]) + ";");
        exp.push("var V=" + toFixedNumber(verticalOffset) + ";");
        exp.push("var H=" + toFixedNumber(horizontalOffset) + ";");
        exp.push("var P=" + toFixedNumber(pauseRatio) + ";");
        exp.push(buildExpressionHelpers(easePresetIndex));
        exp.push("var t=((time % D) + D) % D;");
        exp.push("var q=D/4;");
        exp.push("var mv=q*(1-P);");
        exp.push("var x=0;");
        exp.push("var y=0;");
        exp.push("var u=0;");
        exp.push("if (t < q) {");
        exp.push("  if (t < mv) {");
        exp.push("    u=t/mv;");
        exp.push("    y=V*easeProgress(u);");
        exp.push("  } else {");
        exp.push("    y=V;");
        exp.push("  }");
        exp.push("} else if (t < 2*q) {");
        exp.push("  y=V;");
        exp.push("} else if (t >= 2*q && t < 3*q) {");
        exp.push("  var t2=t-2*q;");
        exp.push("  if (t2 < mv) {");
        exp.push("    u=t2/mv;");
        exp.push("    x=H*easeProgress(u);");
        exp.push("  } else {");
        exp.push("    x=H;");
        exp.push("  }");
        exp.push("  y=V;");
        exp.push("} else {");
        exp.push("  x=H;");
        exp.push("  y=V;");
        exp.push("}");
        exp.push("[BX + x, BY + y];");
        return exp.join("\n");
    }

    function buildRotationExpression(rotationAmount, loopDuration, easePresetIndex, pauseRatio, forwardOnly) {
        var exp = [];
        exp.push("var D=" + toFixedNumber(loopDuration) + ";");
        exp.push("var R=" + toFixedNumber(rotationAmount) + ";");
        exp.push("var P=" + toFixedNumber(pauseRatio) + ";");
        exp.push("var F=" + (forwardOnly ? "1" : "0") + ";");
        exp.push(buildExpressionHelpers(easePresetIndex));
        exp.push("var t=((time % D) + D) % D;");
        exp.push("var q=D/4;");
        exp.push("var s=q*P;");
        exp.push("var sd=q-s;");
        exp.push("var r=0;");
        exp.push("var u=0;");
        exp.push("if (t >= q && t < 2*q) {");
        exp.push("  var t1=t-q;");
        exp.push("  if (t1 < s) {");
        exp.push("    r=0;");
        exp.push("  } else {");
        exp.push("    u=(t1-s)/sd;");
        exp.push("    if (F === 1) r=R*easeProgress(u);");
        exp.push("    else r=R*spinPulse(u);");
        exp.push("  }");
        exp.push("} else if (t >= 2*q && t < 3*q) {");
        exp.push("  if (F === 1) r=R;");
        exp.push("  else r=0;");
        exp.push("} else if (t >= 3*q && t < 4*q) {");
        exp.push("  var t3=t-3*q;");
        exp.push("  if (t3 < s) {");
        exp.push("    if (F === 1) r=R;");
        exp.push("    else r=0;");
        exp.push("  } else {");
        exp.push("    u=(t3-s)/sd;");
        exp.push("    if (F === 1) r=R + R*easeProgress(u);");
        exp.push("    else r=R*spinPulse(u);");
        exp.push("  }");
        exp.push("}");
        exp.push("r;");
        return exp.join("\n");
    }

    function applyAnimation(items, settings, startTime) {
        var q = settings.loopDuration / 4;
        var easePresetIndex = getEasePresetIndex(settings.easingPreset);
        var pauseRatio = 0.22;
        var forwardOnlyRotation = (settings.rotationMotionMode === "Forward only");
        var i;

        for (i = 0; i < items.length; i++) {
            var item = items[i];
            var layer = item.layer;
            var posProp = layer.property("Transform").property("Position");
            var rotProp = layer.property("Transform").property("Rotation");

            var verticalOffset = settings.stepY * item.colDir;
            var horizontalOffset = settings.stepX * item.rowDir;

            clearKeys(posProp);
            clearKeys(rotProp);
            posProp.expression = "";
            rotProp.expression = "";

            if (settings.seamMode === "Keyframes + cycle expression") {
                setPositionKeys(posProp, item.basePos, verticalOffset, horizontalOffset, startTime, q, pauseRatio);
                setRotationKeys(rotProp, settings.rotationAmount, startTime, q, pauseRatio, forwardOnlyRotation);

                applyInterpolation(posProp, settings.easingPreset);
                applyInterpolation(rotProp, settings.easingPreset);

                posProp.expression = 'loopOut("cycle")';
                rotProp.expression = 'loopOut("cycle")';
            } else {
                posProp.setValue(item.basePos);
                rotProp.setValue(0);
                posProp.expression = buildPositionExpression(
                    item.basePos,
                    verticalOffset,
                    horizontalOffset,
                    settings.loopDuration,
                    easePresetIndex,
                    pauseRatio
                );
                rotProp.expression = buildRotationExpression(
                    settings.rotationAmount,
                    settings.loopDuration,
                    easePresetIndex,
                    pauseRatio,
                    forwardOnlyRotation
                );
            }
        }
    }

    // ========== MAIN ==========

    function main() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var settings = showDialog();
        if (!settings) return;

        if (comp.duration < settings.loopDuration) {
            comp.duration = settings.loopDuration;
        }

        var existing = getGeneratedLayers(comp);
        if (existing.length > 0) {
            if (settings.promptReplace) {
                var ok = confirm(
                    "Found " + existing.length + " existing generated layer(s).\n\nReplace them?"
                );
                if (!ok) return;
            }
            removeGeneratedLayers(comp);
        }

        var overscanCells = 2;
        var gridData = computeCellCenters(comp, settings.rows, settings.cols, overscanCells);
        if (!gridData) {
            alert("Invalid grid dimensions for this comp.");
            return;
        }

        settings.stepX = gridData.cellW * 2;
        settings.stepY = gridData.cellH * 2;

        if (gridData.centers.length > 1400) {
            var proceedHeavy = confirm(
                "This setup creates " + gridData.centers.length + " motif layers (including offscreen overscan) and may run slowly. Continue?"
            );
            if (!proceedHeavy) return;
        }

        var rng = seededRandom(settings.randomSeed);
        var colDirs = buildDirectionArray(gridData.totalCols, settings.colMotionMode, rng);
        var rowDirs = buildDirectionArray(gridData.totalRows, settings.rowMotionMode, rng);

        var bg = comp.layers.addSolid(
            settings.bgColor,
            NAME_PREFIX + "BG",
            comp.width,
            comp.height,
            comp.pixelAspect,
            comp.duration
        );
        bg.moveToEnd();

        var created = [];
        var i;
        for (i = 0; i < gridData.centers.length; i++) {
            var c = gridData.centers[i];
            var name = NAME_PREFIX + "M_r" + c.row + "_c" + c.col;
            var symbolType = (((c.row + c.col) % 2) === 0) ? "x" : "circle";
            var layer = createMotifLayer(comp, name, settings, c.position, symbolType);

            created.push({
                layer: layer,
                row: c.row,
                col: c.col,
                rowDir: rowDirs[c.rowIndex],
                colDir: colDirs[c.colIndex],
                basePos: c.position
            });
        }

        applyAnimation(created, settings, 0);

        alert(
            "Wallpaper Pattern Loop generated.\n\n" +
            "Layers created: " + created.length + "\n" +
            "Loop duration: " + settings.loopDuration + "s\n" +
            "Row motion: " + settings.rowMotionMode + "\n" +
            "Column motion: " + settings.colMotionMode + "\n" +
            "Rotation motion: " + settings.rotationMotionMode + "\n" +
            "Seam mode: " + settings.seamMode
        );
    }

    app.beginUndoGroup("Wallpaper Pattern Loop Generator");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
