/**
 * grid-auto-layout.jsx
 * ------------------------------------------------------------------------------------------
 * Auto-arrange a comp's layers into a grid that CHANGES over time with how many layers are
 * actually "present" (showing content). Detects presence per layer, debounces the flicker,
 * splits the timeline into segments, and for each segment picks a layout (per time-region,
 * per visible-count) — then bakes hard-cut hold keyframes. Fills can duplicate clips (muted
 * copies) to keep a grid full.
 *
 * Non-destructive: works on a duplicate comp (SUFFIX). Ports two hard-won lessons:
 *   - clears existing Position/Scale/Opacity keys before baking (else old anim interleaves);
 *   - fill duplicates are muted (audioEnabled=false) so audio isn't doubled.
 *
 * Run: File > Scripts > Run Script File… with the target comp active. Edit CONFIG first.
 * Depends on: lib/grid-core.jsx
 *
 * The default CONFIG reproduces the "Bohemian Rhapsody" behaviour (3 time-regions, V/A shapes,
 * fills after 2:25). Rewrite REGIONS[i].pick and the LAYOUTS you reference to retarget it.
 * ------------------------------------------------------------------------------------------
 */
#target "aftereffects"
#include "lib/grid-core.jsx"

(function () {
    // ===================== CONFIG =====================
    var CONFIG = {
        PRESENCE: "precomp-intervals", // "precomp-intervals" | "inout"
        DWELL_FRAMES: 7,               // debounce: ignore on/off shorter than this many frames
        SEED: 42,
        SKIP_AUDIO: true,
        FILL_FIT: "fill",              // how clips fit their cell: "fill" (cover) | "fit" (contain)
        SUFFIX: "-GRID",               // duplicate comp name suffix ("" = modify active in place)
        // Time-regions (comp seconds). Each pick(count) returns a LAYOUTS mode name for that
        // visible-count. Regions are matched by the segment's start time (last fromSec <= t).
        REGIONS: [
            { fromSec: 0, pick: function (n) {
                if (n === 1) return "center";
                if (n === 2) return "pair2x2";
                if (n === 3) return "line3x3";
                if (n === 4) return "full2x2";
                return "scatter3x3";
            }},
            { fromSec: 35, pick: function (n) {
                if (n === 1) return "centerRowLR";
                if (n === 2) return "pair2x2";
                if (n === 3) return "VA3x3";
                if (n === 4) return "full2x2";
                return "scatter3x3";
            }},
            { fromSec: 145, pick: function (n) {
                if (n === 1) return "fullscreen";
                if (n >= 2 && n <= 4) return "fill2x2";
                return "fill3x3ce"; // 5..N: fill 3x3, centre empty
            }}
        ]
    };
    // ==================================================

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) { alert("grid-auto-layout: open a composition first."); return; }

    var W = comp.width, H = comp.height, fps = comp.frameRate;
    var frameCount = Math.round(comp.duration * fps);

    // grid geometries
    var g3 = GridCore.cellCenters(W, H, 3, 3);
    var g2 = GridCore.cellCenters(W, H, 2, 2);
    var Q = [g2.byRC[0][0], g2.byRC[0][1], g2.byRC[1][0], g2.byRC[1][1]]; // TL,TR,BL,BR quadrant centres
    var ROWS3 = [["TL","TM","TR"],["ML","MM","MR"],["BL","BM","BR"]];
    var COLS3 = [["TL","ML","BL"],["TM","MM","BM"],["TR","MR","BR"]];
    var V_SHAPE = ["TL","TR","BM"], A_SHAPE = ["TM","BL","BR"];
    var G3_NO_CENTER = ["TL","TM","TR","ML","MR","BL","BM","BR"];

    // assignment = {li:layerIndex, inst:instanceNumber, x, y, cw, ch}
    function A(li, inst, pt, cw, ch) { return { li: li, inst: inst, x: pt[0], y: pt[1], cw: cw, ch: ch }; }
    function names3(list) { var o = []; for (var i = 0; i < list.length; i++) o.push(g3.byName[list[i]]); return o; }
    function fillInstances(idxs, ncells) { // round-robin -> [[li,inst],...] length ncells
        var out = [], cnt = {}, i = 0, n = idxs.length;
        for (var k = 0; k < n; k++) cnt[idxs[k]] = 0;
        while (out.length < ncells) { var li = idxs[i % n]; out.push([li, cnt[li]]); cnt[li]++; i++; }
        return out;
    }

    var LAYOUTS = {
        black: function () { return []; },
        fullscreen: function (S) { return [A(S[0], 0, [W / 2, H / 2], W, H)]; },
        center: function (S) { return [A(S[0], 0, g3.byName.MM, g3.cellW, g3.cellH)]; },
        centerRowLR: function (S, rng) { return [A(S[0], 0, GridCore.choice([g3.byName.ML, g3.byName.MR], rng), g3.cellW, g3.cellH)]; },
        pair2x2: function (S, rng) { var c = GridCore.sample(Q, 2, rng), v = S.slice(0); GridCore.shuffle(v, rng); var o = []; for (var k = 0; k < 2 && k < v.length; k++) o.push(A(v[k], 0, c[k], g2.cellW, g2.cellH)); return o; },
        full2x2: function (S, rng) { var c = Q.slice(0); GridCore.shuffle(c, rng); var v = S.slice(0); GridCore.shuffle(v, rng); var o = []; for (var k = 0; k < 4 && k < v.length; k++) o.push(A(v[k], 0, c[k], g2.cellW, g2.cellH)); return o; },
        line3x3: function (S, rng) { var line = GridCore.choice(ROWS3.concat(COLS3), rng), pts = names3(line), v = S.slice(0); GridCore.shuffle(v, rng); var o = []; for (var k = 0; k < 3 && k < v.length; k++) o.push(A(v[k], 0, pts[k], g3.cellW, g3.cellH)); return o; },
        VA3x3: function (S, rng) { var sh = GridCore.choice([V_SHAPE, A_SHAPE], rng), pts = names3(sh), v = S.slice(0); GridCore.shuffle(v, rng); var o = []; for (var k = 0; k < 3 && k < v.length; k++) o.push(A(v[k], 0, pts[k], g3.cellW, g3.cellH)); return o; },
        scatter3x3: function (S, rng) { var all = objValues(g3.byName); var n = Math.min(S.length, all.length); var cells = GridCore.sample(all, n, rng); var v = S.slice(0); GridCore.shuffle(v, rng); var o = []; for (var k = 0; k < n; k++) o.push(A(v[k], 0, cells[k], g3.cellW, g3.cellH)); return o; }, // cap at available cells (>9 layers: extras hidden)
        fill2x2: function (S, rng) { var inst = fillInstances(S, 4), c = Q.slice(0); GridCore.shuffle(c, rng); var o = []; for (var k = 0; k < 4; k++) o.push(A(inst[k][0], inst[k][1], c[k], g2.cellW, g2.cellH)); return o; },
        fill3x3ce: function (S, rng) { var inst = fillInstances(S, 8), c = names3(G3_NO_CENTER); GridCore.shuffle(c, rng); var o = []; for (var k = 0; k < 8; k++) o.push(A(inst[k][0], inst[k][1], c[k], g3.cellW, g3.cellH)); return o; }
    };
    function objValues(o) { var a = []; for (var k in o) if (o.hasOwnProperty(k)) a.push(o[k]); return a; }

    function regionFor(frame) {
        var t = frame / fps, chosen = CONFIG.REGIONS[0];
        for (var i = 0; i < CONFIG.REGIONS.length; i++) if (CONFIG.REGIONS[i].fromSec <= t) chosen = CONFIG.REGIONS[i];
        return chosen;
    }

    // ---- 1. presence per layer (debounced) ----
    var layers = GridCore.videoLayers(comp, CONFIG.SKIP_AUDIO);
    var idxList = [], pres = {};
    for (var li = 0; li < layers.length; li++) {
        var idx = layers[li].index; idxList.push(idx);
        pres[idx] = GridCore.debounce(GridCore.layerPresence(layers[li], frameCount, fps, CONFIG.PRESENCE), CONFIG.DWELL_FRAMES);
    }

    // ---- 2. set-segments (constant visible set), split at region boundaries ----
    var bounds = {}; for (var b = 0; b < CONFIG.REGIONS.length; b++) bounds[Math.round(CONFIG.REGIONS[b].fromSec * fps)] = true;
    function setAt(f) { var s = []; for (var q = 0; q < idxList.length; q++) if (pres[idxList[q]][f]) s.push(idxList[q]); return s; }
    function sameSet(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; }
    var segs = [], i = 0;
    while (i < frameCount) {
        var s = setAt(i), j = i + 1;
        while (j < frameCount && sameSet(setAt(j), s) && !bounds[j]) j++;
        segs.push({ i: i, j: j, set: s }); i = j;
    }

    // ---- 3. arrangement per segment + per (layer,instance) keyframes ----
    var rng = GridCore.makeRng(CONFIG.SEED);
    var maxInst = {}; for (var m = 0; m < idxList.length; m++) maxInst[idxList[m]] = 0;

    // PASS 1: compute arrangements (consumes rng once) and the final max instance count per layer
    for (var sgi = 0; sgi < segs.length; sgi++) {
        var seg = segs[sgi];
        var mode = regionFor(seg.i).pick(seg.set.length);
        seg.asg = (seg.set.length === 0) ? [] : LAYOUTS[mode](seg.set, rng);
        for (var ai = 0; ai < seg.asg.length; ai++) if (seg.asg[ai].inst > maxInst[seg.asg[ai].li]) maxInst[seg.asg[ai].li] = seg.asg[ai].inst;
    }

    // PASS 2: emit hold keyframes for EVERY (idx, inst 0..maxInst) from frame 0 — so each instance
    // (incl. dupes that only appear later) gets an initial hidden key and never shows before its cue.
    var keys = {}; // keys[idx][inst] = [[frame, op, x, y, cw, ch], ...]
    function keyList(idx, inst) { if (!keys[idx]) keys[idx] = {}; if (!keys[idx][inst]) keys[idx][inst] = []; return keys[idx][inst]; }
    var last = {};
    var HIDDEN = [0, W / 2, H / 2, W, H];
    for (var sg2 = 0; sg2 < segs.length; sg2++) {
        var sseg = segs[sg2];
        var stateMap = {};
        for (var a2 = 0; a2 < sseg.asg.length; a2++) { var aa = sseg.asg[a2]; stateMap[aa.li + "_" + aa.inst] = [100, aa.x, aa.y, aa.cw, aa.ch]; }
        for (var q2 = 0; q2 < idxList.length; q2++) {
            var idx2 = idxList[q2];
            for (var inst = 0; inst <= maxInst[idx2]; inst++) {
                var st = stateMap[idx2 + "_" + inst] || HIDDEN;
                var sig = st.join(",");
                if (last[idx2 + "_" + inst] !== sig) { keyList(idx2, inst).push([sseg.i].concat(st)); last[idx2 + "_" + inst] = sig; }
            }
        }
    }

    // ---- 4. bake into duplicate ----
    app.beginUndoGroup("Grid auto layout");
    try {
        var target = comp;
        if (CONFIG.SUFFIX) {
            var dupName = comp.name + CONFIG.SUFFIX;
            for (var d = app.project.numItems; d >= 1; d--) { var it = app.project.item(d); if ((it instanceof CompItem) && it.name === dupName) it.remove(); }
            target = comp.duplicate(); target.name = dupName;
        }
        // map orig index -> real layer in target; create muted dupes for instances 1..maxInst
        var realOf = {}, dupOf = {};
        for (var r = 0; r < idxList.length; r++) realOf[idxList[r]] = target.layer(idxList[r]);
        for (var r2 = 0; r2 < idxList.length; r2++) {
            var oi = idxList[r2]; dupOf[oi] = [];
            for (var n2 = 1; n2 <= maxInst[oi]; n2++) { var dd = realOf[oi].duplicate(); dd.name = "DUP_" + oi + "_" + n2; dd.audioEnabled = false; dupOf[oi].push(dd); }
        }
        var HOLD = KeyframeInterpolationType.HOLD;
        function bakeInstance(ly, klist, srcW, srcH) {
            var tg = ly.property("ADBE Transform Group");
            var P = tg.property("ADBE Position"), S = tg.property("ADBE Scale"), O = tg.property("ADBE Opacity");
            var threeD = ly.threeDLayer;
            while (P.numKeys > 0) P.removeKey(1); while (S.numKeys > 0) S.removeKey(1); while (O.numKeys > 0) O.removeKey(1);
            tg.property("ADBE Anchor Point").setValue(threeD ? [srcW / 2, srcH / 2, 0] : [srcW / 2, srcH / 2]);
            for (var k = 0; k < klist.length; k++) {
                var fr = klist[k][0], op = klist[k][1], x = klist[k][2], y = klist[k][3], cw = klist[k][4], ch = klist[k][5];
                var sc = GridCore.fitScale(srcW, srcH, cw, ch, CONFIG.FILL_FIT);
                var t = fr / fps;
                O.setValueAtTime(t, op);
                P.setValueAtTime(t, threeD ? [x, y, 0] : [x, y]);
                S.setValueAtTime(t, threeD ? [sc, sc, 100] : [sc, sc]);
            }
            for (var h = 1; h <= P.numKeys; h++) { P.setInterpolationTypeAtKey(h, HOLD, HOLD); S.setInterpolationTypeAtKey(h, HOLD, HOLD); O.setInterpolationTypeAtKey(h, HOLD, HOLD); }
            GridCore.cropToAspect(ly, srcW, srcH, W, H, CONFIG.FILL_FIT); // all grid cells share comp aspect -> crop once
        }
        for (var b2 = 0; b2 < idxList.length; b2++) {
            var oi2 = idxList[b2], src = realOf[oi2].source, sw = src.width, sh = src.height;
            if (keys[oi2] && keys[oi2][0]) bakeInstance(realOf[oi2], keys[oi2][0], sw, sh);
            for (var n3 = 1; n3 <= maxInst[oi2]; n3++) if (keys[oi2] && keys[oi2][n3]) bakeInstance(dupOf[oi2][n3 - 1], keys[oi2][n3], sw, sh);
        }
    } finally { app.endUndoGroup(); }

    // log
    var log = { comp: (CONFIG.SUFFIX ? comp.name + CONFIG.SUFFIX : comp.name), frameCount: frameCount, segments: segs.length, layers: idxList.length, maxInstances: maxInst };
    var lf = new File("/tmp/ae_grid_layout.json"); lf.encoding = "UTF-8"; lf.open("w"); lf.write(log.toSource()); lf.close();
})();
