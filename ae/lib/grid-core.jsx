/**
 * grid-core.jsx — shared helpers for grid / cell-path layout scripts.
 * ES3 / ExtendScript. #include this from a script in ../ae (e.g. #include "lib/grid-core.jsx").
 *
 * Provides (all under the global GridCore namespace):
 *   GridCore.cellCenters(compW, compH, rows, cols)   -> {byRC, byName, cellW, cellH}
 *   GridCore.resolvePath(name|array, rows, cols, geom) -> [[x,y], ...] (may repeat cells)
 *   GridCore.fitScale(srcW, srcH, cellW, cellH, mode) -> scale percent (mode "fill"|"fit")
 *   GridCore.makeRng(seed)                            -> function() returning [0,1)
 *   GridCore.shuffle(arr, rng); GridCore.choice(arr, rng); GridCore.sample(arr, n, rng)
 *   GridCore.videoLayers(comp, skipAudio)             -> [layer, ...] (has a visible source)
 */
var GridCore = (function () {
    function cellCenters(compW, compH, rows, cols) {
        var cw = compW / cols, ch = compH / rows;
        var byRC = [], byName = {};
        // 3x3 friendly names
        var rn = rows === 3 ? ["T", "M", "B"] : null;
        var cn = cols === 3 ? ["L", "M", "R"] : null;
        for (var r = 0; r < rows; r++) {
            byRC[r] = [];
            for (var c = 0; c < cols; c++) {
                var pt = [(c + 0.5) * cw, (r + 0.5) * ch];
                byRC[r][c] = pt;
                if (rn && cn) byName[rn[r] + cn[c]] = pt;
            }
        }
        return { byRC: byRC, byName: byName, cellW: cw, cellH: ch, rows: rows, cols: cols };
    }

    function rowMajor(rows, cols) { var o = []; for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) o.push([r, c]); return o; }
    function serpentine(rows, cols) {
        var o = [];
        for (var r = 0; r < rows; r++) {
            if (r % 2 === 0) { for (var c = 0; c < cols; c++) o.push([r, c]); }
            else { for (var c2 = cols - 1; c2 >= 0; c2--) o.push([r, c2]); }
        }
        return o;
    }
    function ring(rows, cols) { // perimeter clockwise from TL
        var o = [], r, c;
        for (c = 0; c < cols; c++) o.push([0, c]);
        for (r = 1; r < rows; r++) o.push([r, cols - 1]);
        for (c = cols - 2; c >= 0; c--) o.push([rows - 1, c]);
        for (r = rows - 2; r >= 1; r--) o.push([r, 0]);
        return o;
    }
    // vertical figure-8 (3x3 only): top loop + bottom loop sharing the middle row (crossing band)
    var FIGURE8_3x3 = [[0,0],[0,1],[0,2],[1,2],[1,1],[1,0],[2,0],[2,1],[2,2],[1,2],[1,1],[1,0]];

    function resolvePath(spec, rows, cols, geom) {
        var rc;
        if (spec instanceof Array) {
            // explicit: array of [row,col] pairs OR array of 3x3 cell-name strings
            rc = [];
            for (var i = 0; i < spec.length; i++) {
                var e = spec[i];
                if (typeof e === "string") { var p = geom.byName[e]; if (!p) throw new Error("unknown cell '" + e + "'"); rc.push(p); }
                else rc.push(geom.byRC[e[0]][e[1]]);
            }
            return rc;
        }
        var name = String(spec).toUpperCase();
        if (name === "FIGURE8") {
            if (rows !== 3 || cols !== 3) throw new Error("FIGURE8 preset requires a 3x3 grid");
            rc = FIGURE8_3x3;
        } else if (name === "SERPENTINE") rc = serpentine(rows, cols);
        else if (name === "RING") rc = ring(rows, cols);
        else if (name === "ROW") rc = rowMajor(rows, cols);
        else throw new Error("unknown path preset '" + spec + "'");
        var out = [];
        for (var k = 0; k < rc.length; k++) out.push(geom.byRC[rc[k][0]][rc[k][1]]);
        return out;
    }

    function fitScale(srcW, srcH, cellW, cellH, mode) {
        var sx = cellW / srcW, sy = cellH / srcH;
        var s = (mode === "fit") ? Math.min(sx, sy) : Math.max(sx, sy); // default "fill"/cover
        return s * 100;
    }

    function makeRng(seed) {
        var s = (seed >>> 0) || 1;
        return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }
    function shuffle(arr, rng) {
        for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
        return arr;
    }
    function choice(arr, rng) { return arr[Math.floor(rng() * arr.length)]; }
    function sample(arr, n, rng) { var c = arr.slice(0); shuffle(c, rng); return c.slice(0, n); }

    // Presence: boolean array over [0, frameCount) — when does this top-level layer show content?
    //  mode "precomp-intervals": union of the source precomp's internal enabled layers' in/out
    //                            (good when a layer is a montage precomp that's mostly empty).
    //  mode "inout" (default):   the layer's own [inPoint, outPoint) (good when layers are trimmed to content).
    function layerPresence(layer, frameCount, fps, mode) {
        var arr = [], i; for (i = 0; i < frameCount; i++) arr[i] = false;
        var li0 = Math.round(layer.inPoint * fps), li1 = Math.round(layer.outPoint * fps);
        function mark(a, b) { a = Math.max(0, Math.max(a, li0)); b = Math.min(frameCount, Math.min(b, li1)); for (var f = a; f < b; f++) arr[f] = true; }
        var src = layer.source;
        // "precomp-intervals" only makes sense for a precomp whose time maps LINEARLY to the parent
        // (no time remap). Map each internal clip's source time -> parent-comp time via the layer's
        // startTime + stretch, else internal in/out would be compared against the wrong frames.
        if (mode === "precomp-intervals" && src && (src instanceof CompItem) && !layer.timeRemapEnabled) {
            var st = layer.startTime, stf = (layer.stretch || 100) / 100;
            for (var j = 1; j <= src.numLayers; j++) {
                var il = src.layer(j);
                if (!il.enabled) continue;
                var aC = st + il.inPoint * stf, bC = st + il.outPoint * stf;
                if (stf < 0) { var tmp = aC; aC = bC; bC = tmp; } // reversed (negative stretch)
                mark(Math.round(aC * fps), Math.round(bC * fps));
            }
        } else {
            // footage layer, or time-remapped precomp (nonlinear — can't derive intervals): use in/out
            mark(li0, li1);
        }
        return arr;
    }

    // Crop a layer to a target aspect ratio with a centred rectangular mask (in source space).
    // Combined with fitScale(..,"fill"), the visible region then exactly fills the cell — no spill
    // into neighbours — at ANY scale (mask is pre-transform), as long as the cell keeps that aspect.
    // Pass fit==="fit" to instead REMOVE any crop mask (contain/letterbox shows the whole source).
    function cropToAspect(layer, srcW, srcH, aspW, aspH, fit) {
        var parade = layer.property("ADBE Mask Parade");
        while (parade.numProperties > 0) parade.property(1).remove();
        if (fit === "fit") return; // no crop for contain mode
        var ar = aspW / aspH, mw, mh;
        if (srcW / srcH > ar) { mh = srcH; mw = srcH * ar; } else { mw = srcW; mh = srcW / ar; }
        var cx = srcW / 2, cy = srcH / 2, l = cx - mw / 2, r = cx + mw / 2, t = cy - mh / 2, b = cy + mh / 2;
        var m = parade.addProperty("ADBE Mask Atom");
        var sh = new Shape();
        sh.vertices = [[l, t], [r, t], [r, b], [l, b]];
        sh.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        sh.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        sh.closed = true;
        m.property("ADBE Mask Shape").setValue(sh);
    }
    // Debounce a boolean timeline: close OFF gaps shorter than `dwell`, then remove ON blips shorter than `dwell`.
    function debounce(arr, dwell) {
        var n = arr.length, a = arr.slice(0), k, f;
        function runs(x) { var o = [], i = 0; while (i < n) { var j = i; while (j < n && x[j] === x[i]) j++; o.push([x[i], i, j]); i = j; } return o; }
        var r = runs(a);
        for (k = 0; k < r.length; k++) if (r[k][0] === false && (r[k][2] - r[k][1]) < dwell && r[k][1] > 0 && r[k][2] < n) for (f = r[k][1]; f < r[k][2]; f++) a[f] = true;
        r = runs(a);
        for (k = 0; k < r.length; k++) if (r[k][0] === true && (r[k][2] - r[k][1]) < dwell) for (f = r[k][1]; f < r[k][2]; f++) a[f] = false;
        return a;
    }

    function videoLayers(comp, skipAudio) {
        var out = [];
        for (var v = 1; v <= comp.numLayers; v++) {
            var ly = comp.layer(v);
            var hasVid = (typeof ly.hasVideo !== "undefined") ? ly.hasVideo : true;
            if (skipAudio && !hasVid) continue;
            if (!ly.source) continue;
            out.push(ly);
        }
        return out;
    }

    return {
        cellCenters: cellCenters, resolvePath: resolvePath, fitScale: fitScale,
        makeRng: makeRng, shuffle: shuffle, choice: choice, sample: sample,
        layerPresence: layerPresence, debounce: debounce, cropToAspect: cropToAspect,
        videoLayers: videoLayers, FIGURE8_3x3: FIGURE8_3x3
    };
})();
