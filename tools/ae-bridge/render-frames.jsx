/**
 * render-frames.jsx — render a comp's frames (and optionally its audio) to disk.
 * Driven by /tmp/ae_render_params.jsx which must define a global RP:
 *   var RP = { comp:"name", f0:0, f1:299, outdir:"/abs/dir/", audioOut:"/abs/out.aif"|null };
 * f0/f1 null => whole comp. Writes /tmp/ae_render_done.json with the resolved range/size.
 * Called by render-preview.sh; not meant to be run by hand.
 *
 * NOTE: saveFrameToPng is ASYNCHRONOUS — this returns after queuing; AE writes PNGs in the
 * background. The caller polls the output dir for completion. Audio (render queue) is synchronous.
 */
(function () {
    function readAll(p) { var f = new File(p); f.open("r"); var c = f.read(); f.close(); return c; }
    eval(readAll("/tmp/ae_render_params.jsx")); // -> RP

    var proj = app.project, comp = null;
    for (var i = 1; i <= proj.numItems; i++) {
        var it = proj.item(i);
        if ((it instanceof CompItem) && it.name === RP.comp) { comp = it; break; }
    }
    var done = { comp: RP.comp, found: !!comp };
    if (comp) {
        var fps = comp.frameRate;
        var f0 = (RP.f0 == null) ? 0 : RP.f0;
        var f1 = (RP.f1 == null) ? Math.round(comp.duration * fps) - 1 : RP.f1;
        done.f0 = f0; done.f1 = f1; done.expected = f1 - f0 + 1;
        done.fps = fps; done.w = comp.width; done.h = comp.height;

        if (RP.audioOut) {
            var rq = app.project.renderQueue;
            // snapshot existing items' render flags, disable them for our one-off render, restore after
            var saved = [];
            for (var k = 1; k <= rq.numItems; k++) { try { saved[k] = rq.item(k).render; rq.item(k).render = false; } catch (e) { saved[k] = null; } }
            var item = rq.items.add(comp);
            item.applyTemplate("Best Settings");
            item.timeSpanStart = 0; item.timeSpanDuration = comp.duration;
            var om = item.outputModule(1); om.applyTemplate("AIFF 48kHz");
            var af = new File(RP.audioOut); if (af.exists) af.remove();
            om.file = new File(RP.audioOut); item.render = true;
            rq.render();
            item.remove(); // drop our temp item so the queue is left exactly as we found it
            for (var k2 = 1; k2 <= rq.numItems; k2++) { try { if (saved[k2] !== null && saved[k2] !== undefined) rq.item(k2).render = saved[k2]; } catch (e) {} }
            done.audio = RP.audioOut;
        }

        var fld = new Folder(RP.outdir); if (!fld.exists) fld.create();
        function pad(n) { n = "" + n; while (n.length < 5) n = "0" + n; return n; }
        for (var fr = f0; fr <= f1; fr++) {
            comp.saveFrameToPng(fr / fps, new File(RP.outdir + "frame_" + pad(fr) + ".png"));
        }
    }
    var df = new File("/tmp/ae_render_done.json"); df.encoding = "UTF-8"; df.open("w"); df.write(done.toSource()); df.close();
})();
