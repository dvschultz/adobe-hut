/**
 * clip-path-sequencer.jsx
 * ------------------------------------------------------------------------------------------
 * For a comp whose layers are a TIME-SEQUENCED montage (clips playing one at a time), place
 * each successive clip into the next cell of a grid, so the sequence "hops" along a path
 * (e.g. a figure-8). Each clip is sized to its cell. Non-destructive by default (works on a
 * duplicate comp). Static placement — the motion is the clip-to-clip hopping, not per-clip moves.
 *
 * Run: File > Scripts > Run Script File…  (with the target comp active)
 * Depends on: lib/grid-core.jsx (kept alongside, in ae/lib/)
 *
 * Edit CONFIG below, then run.
 * ------------------------------------------------------------------------------------------
 */
#target "aftereffects"
#include "lib/grid-core.jsx"

(function () {
    // ===================== CONFIG =====================
    var CONFIG = {
        ROWS: 3,
        COLS: 3,
        // PATH: a preset name — "FIGURE8" (3x3 only), "SERPENTINE", "RING", "ROW" —
        // OR an explicit array of 3x3 cell names, e.g. ["TL","TM","TR","MR","MM","ML","BL","BM","BR","MR","MM","ML"]
        // OR an array of [row,col] pairs. The list may repeat cells; it is cycled.
        PATH: "FIGURE8",
        CELL_FIT: "fill",        // "fill" (cover, crop overflow) or "fit" (contain, letterbox)
        ORDER_BY: "playback",    // "playback" (by inPoint) or "stacking" (top-to-bottom layer order)
        CYCLE: true,             // wrap through the path repeatedly; false = stop on last cell
        REVERSE: false,          // reverse the path direction (e.g. SERPENTINE + REVERSE starts bottom-right)
        PINGPONG: false,         // seamless loop: at the end, snake back instead of jumping across to the start
        SKIP_AUDIO: true,        // don't move audio-only layers
        SUFFIX: "-SEQ"           // work on a duplicate named comp+SUFFIX; "" = modify active comp in place
    };
    // ==================================================

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) { alert("clip-path-sequencer: open a composition first."); return; }

    app.beginUndoGroup("Clip path sequencer");
    try {
        var target = comp;
        if (CONFIG.SUFFIX) {
            var dupName = comp.name + CONFIG.SUFFIX;
            for (var i = app.project.numItems; i >= 1; i--) {
                var it = app.project.item(i);
                if ((it instanceof CompItem) && it.name === dupName) it.remove();
            }
            target = comp.duplicate();
            target.name = dupName;
        }

        var geom = GridCore.cellCenters(target.width, target.height, CONFIG.ROWS, CONFIG.COLS);
        var path = GridCore.resolvePath(CONFIG.PATH, CONFIG.ROWS, CONFIG.COLS, geom);
        if (CONFIG.REVERSE) path.reverse();
        // seamless loop: append the path reversed (minus both endpoints) so cycling snakes back
        // instead of teleporting from the last cell to the first.
        if (CONFIG.PINGPONG && path.length > 2) { var back = path.slice(1, path.length - 1); back.reverse(); path = path.concat(back); }
        var cellW = geom.cellW, cellH = geom.cellH;

        var layers = GridCore.videoLayers(target, CONFIG.SKIP_AUDIO);
        // order
        if (CONFIG.ORDER_BY === "playback") {
            layers.sort(function (a, b) { return (a.inPoint - b.inPoint) || (a.index - b.index); });
        } else {
            layers.sort(function (a, b) { return a.index - b.index; });
        }

        for (var k = 0; k < layers.length; k++) {
            var ly = layers[k], src = ly.source;
            var sw = src.width, sh = src.height;
            var cell = CONFIG.CYCLE ? path[k % path.length] : path[Math.min(k, path.length - 1)];
            var scale = GridCore.fitScale(sw, sh, cellW, cellH, CONFIG.CELL_FIT);
            var tg = ly.property("ADBE Transform Group");
            var threeD = ly.threeDLayer;
            tg.property("ADBE Anchor Point").setValue(threeD ? [sw / 2, sh / 2, 0] : [sw / 2, sh / 2]);
            tg.property("ADBE Scale").setValue(threeD ? [scale, scale, 100] : [scale, scale]);
            tg.property("ADBE Position").setValue(threeD ? [cell[0], cell[1], 0] : [cell[0], cell[1]]);
        }
    } finally {
        app.endUndoGroup();
    }
})();
