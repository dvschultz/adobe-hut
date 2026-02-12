#target aftereffects
/*
 * Overlap Tiling Masks
 * Scans the active composition for temporally overlapping video layers
 * and applies keyframed rectangular masks to tile them on screen.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== UTILITY FUNCTIONS ==========

    function roundToFrame(time, frameRate) {
        return Math.round(time * frameRate) / frameRate;
    }

    function makeRectShape(x, y, w, h) {
        var shape = new Shape();
        shape.vertices = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
        shape.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.closed = true;
        return shape;
    }

    // ========== LAYER FILTERING ==========

    function isVideoLayer(layer) {
        if (layer.locked) return false;
        if (layer.enabled === false) return false;
        if (layer.nullLayer) return false;
        if (layer.adjustmentLayer) return false;

        if (layer instanceof CameraLayer) return false;
        if (layer instanceof LightLayer) return false;
        if (layer instanceof ShapeLayer) return false;
        if (layer instanceof TextLayer) return false;

        try {
            if (!layer.hasVideo) return false;
        } catch (e) {
            return false;
        }

        // Must have a source that is FootageItem or CompItem (not solid)
        try {
            var src = layer.source;
            if (!src) return false;
            if (src instanceof CompItem) return true;
            if (src instanceof FootageItem) {
                if (src.mainSource instanceof SolidSource) return false;
                return true;
            }
        } catch (e) {
            return false;
        }

        return false;
    }

    function collectVideoLayers(comp, frameRate) {
        var layers = [];
        var lockedNames = [];

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            // Track locked video layers separately
            if (layer.locked && layer.enabled) {
                // Quick check if it would otherwise qualify
                if (!layer.nullLayer && !layer.adjustmentLayer &&
                    !(layer instanceof CameraLayer) && !(layer instanceof LightLayer) &&
                    !(layer instanceof ShapeLayer) && !(layer instanceof TextLayer)) {
                    lockedNames.push(layer.name);
                }
                continue;
            }

            if (!isVideoLayer(layer)) continue;

            var inPt = roundToFrame(layer.inPoint, frameRate);
            var outPt = roundToFrame(layer.outPoint, frameRate);

            // Skip zero-duration layers
            if (inPt >= outPt) continue;

            layers.push({
                layer: layer,
                index: layer.index,
                inPoint: inPt,
                outPoint: outPt
            });
        }

        // Sort by layer index ascending (top of stack = index 1)
        layers.sort(function(a, b) {
            return a.index - b.index;
        });

        return { layers: layers, lockedNames: lockedNames };
    }

    // ========== TIMELINE SEGMENTATION ==========

    function buildSegments(layerData) {
        // Collect all unique transition times
        var timeSet = {};
        for (var i = 0; i < layerData.length; i++) {
            timeSet[layerData[i].inPoint] = true;
            timeSet[layerData[i].outPoint] = true;
        }

        // Sort times ascending
        var times = [];
        for (var key in timeSet) {
            if (timeSet.hasOwnProperty(key)) {
                times.push(parseFloat(key));
            }
        }
        times.sort(function(a, b) { return a - b; });

        if (times.length < 2) return [];

        // Build segments from consecutive time pairs
        var segments = [];
        for (var t = 0; t < times.length - 1; t++) {
            var startTime = times[t];
            var endTime = times[t + 1];

            // Find visible layers in this segment
            // A layer is visible if inPoint <= startTime AND outPoint > startTime
            var visible = [];
            for (var j = 0; j < layerData.length; j++) {
                if (layerData[j].inPoint <= startTime && layerData[j].outPoint > startTime) {
                    visible.push(layerData[j]);
                }
            }

            // Skip empty segments (gaps between clips)
            if (visible.length === 0) continue;

            segments.push({
                startTime: startTime,
                endTime: endTime,
                visibleLayers: visible
            });
        }

        return segments;
    }

    function hasOverlaps(segments) {
        for (var i = 0; i < segments.length; i++) {
            if (segments[i].visibleLayers.length > 1) return true;
        }
        return false;
    }

    function maxOverlapCount(segments) {
        var max = 0;
        for (var i = 0; i < segments.length; i++) {
            if (segments[i].visibleLayers.length > max) {
                max = segments[i].visibleLayers.length;
            }
        }
        return max;
    }

    // ========== TILING MATH ==========

    function computeGridDimensions(n) {
        var cols = Math.ceil(Math.sqrt(n));
        var rows = Math.ceil(n / cols);
        return { cols: cols, rows: rows };
    }

    function computeTileRects(visibleCount, layoutMode, compWidth, compHeight) {
        var rects = [];

        if (visibleCount === 1) {
            rects.push({ x: 0, y: 0, width: compWidth, height: compHeight });
            return rects;
        }

        if (layoutMode === "vertical") {
            var tileW = Math.floor(compWidth / visibleCount);
            for (var i = 0; i < visibleCount; i++) {
                var x = i * tileW;
                var w = (i === visibleCount - 1) ? (compWidth - x) : tileW;
                rects.push({ x: x, y: 0, width: w, height: compHeight });
            }
        } else if (layoutMode === "horizontal") {
            var tileH = Math.floor(compHeight / visibleCount);
            for (var i = 0; i < visibleCount; i++) {
                var y = i * tileH;
                var h = (i === visibleCount - 1) ? (compHeight - y) : tileH;
                rects.push({ x: 0, y: y, width: compWidth, height: h });
            }
        } else {
            // Grid
            var grid = computeGridDimensions(visibleCount);
            var cellW = Math.floor(compWidth / grid.cols);
            var cellH = Math.floor(compHeight / grid.rows);

            for (var i = 0; i < visibleCount; i++) {
                var col = i % grid.cols;
                var row = Math.floor(i / grid.cols);
                var gx = col * cellW;
                var gy = row * cellH;
                var gw = (col === grid.cols - 1) ? (compWidth - gx) : cellW;
                var gh = (row === grid.rows - 1) ? (compHeight - gy) : cellH;
                rects.push({ x: gx, y: gy, width: gw, height: gh });
            }
        }

        return rects;
    }

    // ========== MASK APPLICATION ==========

    function removeExistingTileMasks(layer) {
        var masks = layer.property("ADBE Mask Parade");
        if (!masks) return;
        // Iterate in reverse to avoid index shifting
        for (var m = masks.numProperties; m >= 1; m--) {
            if (masks.property(m).name === "Tile Mask") {
                masks.property(m).remove();
            }
        }
    }

    function hasNonTileMasks(layer) {
        var masks = layer.property("ADBE Mask Parade");
        if (!masks) return false;
        for (var m = 1; m <= masks.numProperties; m++) {
            if (masks.property(m).name !== "Tile Mask") {
                return true;
            }
        }
        return false;
    }

    function buildLayerKeyframeSchedule(layerInfo, segments, layoutMode, compWidth, compHeight) {
        // Build a list of {time, rect} entries for this layer's mask keyframes
        var schedule = [];
        var fullRect = { x: 0, y: 0, width: compWidth, height: compHeight };

        // Find segments where this layer is visible
        var layerSegments = [];
        for (var s = 0; s < segments.length; s++) {
            var seg = segments[s];
            for (var v = 0; v < seg.visibleLayers.length; v++) {
                if (seg.visibleLayers[v].index === layerInfo.index) {
                    // Find this layer's position among visible layers
                    var tileIndex = -1;
                    for (var vi = 0; vi < seg.visibleLayers.length; vi++) {
                        if (seg.visibleLayers[vi].index === layerInfo.index) {
                            tileIndex = vi;
                            break;
                        }
                    }
                    layerSegments.push({
                        startTime: seg.startTime,
                        endTime: seg.endTime,
                        visibleCount: seg.visibleLayers.length,
                        tileIndex: tileIndex
                    });
                    break;
                }
            }
        }

        if (layerSegments.length === 0) return schedule;

        // If the layer starts before the first segment, add full-frame at inPoint
        if (layerInfo.inPoint < layerSegments[0].startTime) {
            schedule.push({ time: layerInfo.inPoint, rect: fullRect });
        }

        // Add keyframes at each segment boundary
        var prevRect = null;
        for (var ls = 0; ls < layerSegments.length; ls++) {
            var lSeg = layerSegments[ls];
            var rects = computeTileRects(lSeg.visibleCount, layoutMode, compWidth, compHeight);
            var rect = rects[lSeg.tileIndex];

            // Only add keyframe if rect changed from previous
            if (!prevRect || rect.x !== prevRect.x || rect.y !== prevRect.y ||
                rect.width !== prevRect.width || rect.height !== prevRect.height) {
                schedule.push({ time: lSeg.startTime, rect: rect });
            }
            prevRect = rect;

            // Check if next segment is discontinuous (gap between segments for this layer)
            var nextSeg = (ls < layerSegments.length - 1) ? layerSegments[ls + 1] : null;
            if (nextSeg && nextSeg.startTime > lSeg.endTime) {
                // Gap: layer is alone between this segment's end and next segment's start
                schedule.push({ time: lSeg.endTime, rect: fullRect });
                prevRect = fullRect;
            }
        }

        // If the layer extends past the last segment, add full-frame at last segment end
        var lastSeg = layerSegments[layerSegments.length - 1];
        if (layerInfo.outPoint > lastSeg.endTime) {
            schedule.push({ time: lastSeg.endTime, rect: fullRect });
        }

        return schedule;
    }

    function applyMasks(layerData, segments, layoutMode, compWidth, compHeight) {
        var totalKeyframes = 0;

        for (var i = 0; i < layerData.length; i++) {
            var info = layerData[i];
            var layer = info.layer;

            // Remove existing Tile Masks for re-run safety
            removeExistingTileMasks(layer);

            // Build keyframe schedule
            var schedule = buildLayerKeyframeSchedule(info, segments, layoutMode, compWidth, compHeight);

            if (schedule.length === 0) continue;

            // Determine mask mode based on existing masks
            var useIntersect = hasNonTileMasks(layer);

            // Create the mask
            var masks = layer.property("ADBE Mask Parade");
            var newMask = masks.addProperty("ADBE Mask Atom");
            newMask.name = "Tile Mask";
            newMask.maskMode = useIntersect ? MaskMode.INTERSECT : MaskMode.ADD;

            var maskShapeProp = newMask.property("ADBE Mask Shape");

            // Set keyframes
            for (var k = 0; k < schedule.length; k++) {
                var entry = schedule[k];
                var shape = makeRectShape(entry.rect.x, entry.rect.y, entry.rect.width, entry.rect.height);
                maskShapeProp.setValueAtTime(entry.time, shape);
            }

            // Set all keyframes to hold interpolation
            for (var kf = 1; kf <= maskShapeProp.numKeys; kf++) {
                maskShapeProp.setInterpolationTypeAtKey(kf,
                    KeyframeInterpolationType.HOLD,
                    KeyframeInterpolationType.HOLD);
            }

            totalKeyframes += maskShapeProp.numKeys;
        }

        return totalKeyframes;
    }

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "Overlap Tiling Masks");

        var layoutPanel = dlg.add("panel", undefined, "Layout Mode");
        layoutPanel.orientation = "column";
        layoutPanel.alignment = ["fill", "top"];
        layoutPanel.alignChildren = "left";

        var verticalBtn = layoutPanel.add("radiobutton", undefined, "Vertical columns");
        var horizontalBtn = layoutPanel.add("radiobutton", undefined, "Horizontal rows");
        var gridBtn = layoutPanel.add("radiobutton", undefined, "Grid");
        verticalBtn.value = true;

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Apply");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) {
            return null;
        }

        var mode = "vertical";
        if (horizontalBtn.value) mode = "horizontal";
        if (gridBtn.value) mode = "grid";

        return { layoutMode: mode };
    }

    // ========== USER FEEDBACK ==========

    function showResults(stats) {
        var msg = "Overlap Tiling Masks applied!\n\n";
        msg += "Layers processed: " + stats.layerCount + "\n";
        msg += "Segments detected: " + stats.segmentCount + "\n";
        msg += "Max simultaneous overlap: " + stats.maxOverlap + "\n";
        msg += "Mask keyframes placed: " + stats.totalKeyframes + "\n";
        msg += "Layout mode: " + stats.layoutMode + "\n";

        if (stats.lockedNames.length > 0) {
            msg += "\nLocked layers skipped (" + stats.lockedNames.length + "):\n";
            for (var i = 0; i < stats.lockedNames.length && i < 10; i++) {
                msg += "  - " + stats.lockedNames[i] + "\n";
            }
            if (stats.lockedNames.length > 10) {
                msg += "  ... and " + (stats.lockedNames.length - 10) + " more\n";
            }
        }

        alert(msg);
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        // 1. Validate active composition
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var frameRate = comp.frameRate;
        var compWidth = comp.width;
        var compHeight = comp.height;

        // 2. Collect qualifying video layers
        var collected = collectVideoLayers(comp, frameRate);
        var layerData = collected.layers;
        var lockedNames = collected.lockedNames;

        if (layerData.length === 0) {
            alert("No video layers found in composition.");
            return;
        }

        if (layerData.length === 1) {
            alert("Only 1 video layer found \u2014 no overlaps to tile.");
            return;
        }

        // 3. Build timeline segments
        var segments = buildSegments(layerData);

        if (!hasOverlaps(segments)) {
            alert("No overlapping layers found.");
            return;
        }

        // 4. Check for extreme overlap counts
        var maxOvlp = maxOverlapCount(segments);
        if (maxOvlp > 8) {
            var proceed = confirm("Up to " + maxOvlp + " layers overlap simultaneously. Tiles may be very small. Continue?");
            if (!proceed) return;
        }

        // 5. Show dialog for layout mode
        var settings = showDialog();
        if (!settings) return;

        // 6. Apply masks
        var totalKeyframes = applyMasks(layerData, segments, settings.layoutMode, compWidth, compHeight);

        // 7. Show results
        showResults({
            layerCount: layerData.length,
            segmentCount: segments.length,
            maxOverlap: maxOvlp,
            totalKeyframes: totalKeyframes,
            layoutMode: settings.layoutMode,
            lockedNames: lockedNames
        });
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("Overlap Tiling Masks");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
