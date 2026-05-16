#target aftereffects
/*
 * Render Each Layer
 * Renders each target layer in the active composition to its own output,
 * with effects/transforms preserved and the render range trimmed to the
 * layer's in/out point. Smart-solo dependency resolution keeps track
 * mattes, adjustment layers above the target, the parent chain, and 3D
 * lights/cameras enabled during each render so the output matches what
 * the layer actually looks like in context. Strict-solo disables all of
 * that and renders the bare target.
 *
 * Output formats:
 *   - PNG sequence  (alpha)            — via AE render queue
 *   - ProRes 4444   (alpha)            — via AE render queue
 *   - H.264 mp4     (no alpha)         — via Adobe Media Encoder
 *
 * Defaults (format, scope, strict-solo flag, output folder) persist
 * between runs via app.settings; access is wrapped in try/catch because
 * settings writes are gated by the "Allow Scripts to Write Files and
 * Access Network" preference on some installs.
 *
 * Notes:
 *  - The script never overwrites existing outputs. If `<CompName>/<LayerName>/`
 *    already exists, a numeric suffix is added (`_2`, `_3`, ...).
 *  - Layer enabled/solo state is captured before each render and restored
 *    after — including on Esc cancel or error.
 *  - For H.264 / AME mode, the script duplicates the active comp once per
 *    target layer, queues every duplicate, and hands off to AME via
 *    queueInAME(true). The duplicates carry a [render_each_layer] suffix
 *    and remain in the project until you delete them — AME runs as a
 *    separate process so we can't reliably auto-clean.
 *  - Pre-existing render queue items are temporarily disabled (render = false)
 *    during this script's renders, then restored, so they don't render
 *    along with ours.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== CONSTANTS ==========

    var SETTINGS_SECTION = "render_each_layer";
    var KEY_FORMAT        = "format";
    var KEY_SCOPE         = "scope";
    var KEY_STRICT_SOLO   = "strict_solo";
    var KEY_OUTPUT_FOLDER = "output_folder";

    var FORMAT_PNG    = "png_seq";
    var FORMAT_PRORES = "prores_4444";
    var FORMAT_H264   = "h264";

    var SCOPE_SELECTED = "selected";
    var SCOPE_ALL      = "all";
    var SCOPE_VISIBLE  = "visible";

    var DEP_MODE_SMART  = "smart";
    var DEP_MODE_STRICT = "strict";

    var TEMP_COMP_SUFFIX = " [render_each_layer]";

    // ========== PERSISTENT SETTINGS ==========

    function loadSetting(key, fallback) {
        try {
            if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
                var v = app.settings.getSetting(SETTINGS_SECTION, key);
                if (v !== null && v !== "") return v;
            }
        } catch (e) {}
        return fallback;
    }

    function saveSetting(key, value) {
        try {
            app.settings.saveSetting(SETTINGS_SECTION, key, String(value));
        } catch (e) {}
    }

    // ========== PURE HELPERS ==========

    function sanitizeName(str) {
        if (str == null) return "layer";
        var s = String(str);
        // Replace filesystem-invalid characters with underscore.
        s = s.replace(/[<>:"\/\\|?*\x00-\x1f]/g, "_");
        // Collapse runs of underscores.
        s = s.replace(/_+/g, "_");
        // Trim trailing dots and whitespace (illegal on Windows, ugly on macOS).
        s = s.replace(/[\s.]+$/g, "");
        // Trim leading whitespace.
        s = s.replace(/^\s+/g, "");
        if (s.length === 0) return "layer";
        return s;
    }

    function padInt(n, width) {
        var s = String(n);
        while (s.length < width) s = "0" + s;
        return s;
    }

    // Unique-per-layer label combining the layer's comp index with its name.
    // Multiple layer instances often share a name (e.g., several copies of
    // the same source footage), so a name-only disambiguator collides.
    // Format: "001_LayerName".
    function layerLabel(layer) {
        return padInt(layer.index, 3) + "_" + sanitizeName(layer.name);
    }

    // ========== LAYER SCOPE + DEPENDENCIES ==========

    function getTargetLayers(comp, scopeMode) {
        var targets = [];
        if (scopeMode === SCOPE_SELECTED) {
            var sel = comp.selectedLayers;
            // selectedLayers is unordered; re-sort by comp index for deterministic output.
            var byIndex = [];
            for (var i = 0; i < sel.length; i++) byIndex.push(sel[i]);
            byIndex.sort(function(a, b) { return a.index - b.index; });
            return byIndex;
        }
        for (var k = 1; k <= comp.numLayers; k++) {
            var layer = comp.layer(k);
            if (scopeMode === SCOPE_VISIBLE && !layer.enabled) continue;
            targets.push(layer);
        }
        return targets;
    }

    // One-pass scan over the comp that the per-target dependency resolver
    // can read from instead of re-walking the layer list for every target.
    function analyzeComp(comp) {
        var adjustmentIndices = [];
        var lightCamIndices = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var l = comp.layer(i);
            try { if (l.adjustmentLayer === true) adjustmentIndices.push(i); } catch (e1) {}
            if (l instanceof CameraLayer || l instanceof LightLayer) {
                lightCamIndices.push(i);
            }
        }
        return { adjustmentIndices: adjustmentIndices, lightCamIndices: lightCamIndices };
    }

    // Returns an index-keyed map (used as a Set) of layer indices that
    // must remain enabled while rendering `target`. `analysis` is the
    // analyzeComp() output for the comp the target lives in.
    function getDependencySet(target, depMode, analysis) {
        var set = {};
        set[String(target.index)] = true;
        if (depMode !== DEP_MODE_SMART) return set;

        // Track matte partner: AE positions matte sources immediately above
        // (lower index) the matted layer.
        try {
            if (target.hasTrackMatte && target.index > 1) {
                set[String(target.index - 1)] = true;
            }
        } catch (e) {}

        for (var i = 0; i < analysis.adjustmentIndices.length; i++) {
            var adjIdx = analysis.adjustmentIndices[i];
            if (adjIdx < target.index) set[String(adjIdx)] = true;
        }

        // Parent chain.
        try {
            var p = target.parent;
            var guard = 0;
            while (p != null && guard < 64) {
                set[String(p.index)] = true;
                p = p.parent;
                guard++;
            }
        } catch (e3) {}

        try {
            if (target.threeDLayer === true) {
                for (var j = 0; j < analysis.lightCamIndices.length; j++) {
                    set[String(analysis.lightCamIndices[j])] = true;
                }
            }
        } catch (e4) {}

        return set;
    }

    // ========== STATE SNAPSHOT / RESTORE ==========

    function snapshotComp(comp) {
        var entries = [];
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var entry = { layer: layer, enabled: layer.enabled };
            try { entry.solo = layer.solo; } catch (e) { entry.solo = false; }
            entries.push(entry);
        }
        return { layers: entries };
    }

    function restoreComp(snapshot) {
        if (!snapshot || !snapshot.layers) return;
        for (var i = 0; i < snapshot.layers.length; i++) {
            var e = snapshot.layers[i];
            try { e.layer.enabled = e.enabled; } catch (err1) {}
            try { e.layer.solo = e.solo; } catch (err2) {}
        }
    }

    // Set every layer's .enabled such that only those in depSet are visible.
    // Also clears solo across the comp so .enabled is the sole driver of
    // visibility (AE renders solo'd layers exclusively when any solo is on).
    function applyEnabledSet(comp, depSet) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            try { layer.solo = false; } catch (e1) {}
            var inSet = depSet[String(i)] === true;
            try { layer.enabled = inSet; } catch (e2) {}
        }
    }

    // ========== FILESYSTEM HELPERS ==========

    function buildOutputFolder(rootFolder, compName, layerName) {
        var compFolderName = sanitizeName(compName);
        var layerFolderName = sanitizeName(layerName);
        var basePath = rootFolder.fsName + "/" + compFolderName + "/" + layerFolderName;
        var folder = new Folder(basePath);
        var n = 2;
        while (folder.exists) {
            folder = new Folder(basePath + "_" + n);
            n++;
            if (n > 9999) {
                // Pathological — bail out with a unique-but-ugly path.
                folder = new Folder(basePath + "_" + (new Date()).getTime());
                break;
            }
        }
        return folder;
    }

    function ensureFolder(folder) {
        if (!folder.exists) folder.create();
    }

    // ========== FORMAT / TEMPLATE MAPPING ==========

    // Returns { omTemplate, ext, isSequence, viaAME }.
    // Template names are validated against the user's AE at runtime via
    // applyTemplate's try/catch in queueOne(); a fallback uses AE's default
    // output module and surfaces a per-layer warning in the run summary.
    function formatInfo(format) {
        if (format === FORMAT_PNG) {
            return { omTemplate: "PNG Sequence", ext: "_[#####].png", viaAME: false };
        }
        if (format === FORMAT_PRORES) {
            return { omTemplate: "Apple ProRes 4444", ext: ".mov", viaAME: false };
        }
        // FORMAT_H264
        return { omTemplate: "H.264 - Match Render Settings - 15 Mbps", ext: ".mp4", viaAME: true };
    }

    // Common per-layer render-queue item setup. Adds `targetComp` to the
    // render queue, sets per-item time span to the layer's in/out, applies
    // the format's output module template (with fallback), and points the
    // output file at `outFilePath`. Returns the rqItem plus a flag for
    // whether the named template was found.
    function configureRQItem(targetComp, layer, info, outFilePath) {
        var rqItem = app.project.renderQueue.items.add(targetComp);
        rqItem.timeSpanStart = layer.inPoint;
        rqItem.timeSpanDuration = layer.outPoint - layer.inPoint;
        var om = rqItem.outputModule(1);
        var templateApplied = true;
        try {
            om.applyTemplate(info.omTemplate);
        } catch (eTpl) {
            templateApplied = false;
        }
        om.file = new File(outFilePath);
        return { rqItem: rqItem, templateApplied: templateApplied };
    }

    // ========== RENDER QUEUE ISOLATION ==========

    // Disable pre-existing QUEUED render items so they don't render along
    // with ours; return a snapshot for restoration.
    function isolateRenderQueue() {
        var rq = app.project.renderQueue;
        var snap = [];
        for (var i = 1; i <= rq.numItems; i++) {
            var item = rq.item(i);
            var status;
            try { status = item.status; } catch (e1) { status = null; }
            if (status === RQItemStatus.QUEUED) {
                var prevRender;
                try { prevRender = item.render; } catch (e2) { prevRender = true; }
                try { item.render = false; } catch (e3) {}
                snap.push({ item: item, render: prevRender });
            }
        }
        return snap;
    }

    function restoreRenderQueue(snap) {
        for (var i = 0; i < snap.length; i++) {
            try {
                if (snap[i].item.status === RQItemStatus.QUEUED) {
                    snap[i].item.render = snap[i].render;
                }
            } catch (e) {}
        }
    }

    // ========== PNG / ProRes PATH (AE RENDER QUEUE) ==========

    // Render one layer via AE's render queue. Returns { status, message }
    // where status is "done", "cancelled", or "error".
    function renderOneViaRQ(comp, layer, depMode, info, outputFolder, analysis) {
        var snapshot = snapshotComp(comp);
        var rqItem = null;
        try {
            applyEnabledSet(comp, getDependencySet(layer, depMode, analysis));
            ensureFolder(outputFolder);

            var outFilePath = outputFolder.fsName + "/" + layerLabel(layer) + info.ext;
            var cfg = configureRQItem(comp, layer, info, outFilePath);
            rqItem = cfg.rqItem;

            // Per-item time span — avoids mutating comp work area.
            // AE renders any items with render = true; we isolated the queue
            // earlier, so this is the only one that will run.
            rqItem.render = true;
            app.project.renderQueue.render();

            var finalStatus;
            try { finalStatus = rqItem.status; } catch (eStat) { finalStatus = null; }

            try { rqItem.remove(); } catch (eRm) {}
            rqItem = null;

            if (finalStatus === RQItemStatus.USER_STOPPED) {
                return { status: "cancelled", message: "User cancelled during render" };
            }
            if (finalStatus === RQItemStatus.ERR_STOPPED) {
                return { status: "error", message: "Render error" };
            }
            return {
                status: "done",
                message: cfg.templateApplied ? null : "Template '" + info.omTemplate + "' not found — used default output module"
            };
        } catch (e) {
            try { if (rqItem !== null) rqItem.remove(); } catch (eRm2) {}
            return { status: "error", message: e.toString() };
        } finally {
            restoreComp(snapshot);
        }
    }

    // ========== H.264 / AME PATH (TEMP COMP PER TARGET) ==========

    // For H.264, AE's queueInAME(true) hands the entire RQ to AME in one
    // call and AME runs async — so we can't sequence per-layer state flips
    // around it. Instead, duplicate the active comp per target layer,
    // configure each dupe, queue all of them, and hand off once.
    //
    // Returns { queued, skipped, tempComps, addedRqItems, templateFallbacks }.
    // tempComps and addedRqItems are kept as live refs so the caller can
    // clean them up on AME handoff failure (or leave them in place on
    // success, since AME needs the comps to remain in the project until
    // it finishes rendering).
    function buildAMEQueue(comp, targets, depMode, info, rootFolder, analysis) {
        var queued = 0;
        var skipped = [];
        var tempComps = [];
        var addedRqItems = [];
        var templateFallbacks = 0;

        for (var i = 0; i < targets.length; i++) {
            var layer = targets[i];
            var dupeComp = null;
            try {
                var label = layerLabel(layer);
                var layerOutFolder = buildOutputFolder(rootFolder, comp.name, label);
                ensureFolder(layerOutFolder);

                dupeComp = comp.duplicate();
                dupeComp.name = comp.name + TEMP_COMP_SUFFIX + " [" + label + "]";

                // Indices match 1-to-1 on the duplicate since duplicate() is
                // exact, so the original-comp analysis applies to the dupe.
                applyEnabledSet(dupeComp, getDependencySet(layer, depMode, analysis));

                dupeComp.workAreaStart = layer.inPoint;
                dupeComp.workAreaDuration = layer.outPoint - layer.inPoint;

                var outFilePath = layerOutFolder.fsName + "/" + label + info.ext;
                var cfg = configureRQItem(dupeComp, layer, info, outFilePath);
                cfg.rqItem.render = true;
                if (!cfg.templateApplied) templateFallbacks++;

                tempComps.push(dupeComp);
                addedRqItems.push(cfg.rqItem);
                queued++;
            } catch (e) {
                skipped.push({ name: layer.name, message: e.toString() });
                try { if (dupeComp !== null) dupeComp.remove(); } catch (eDup) {}
            }
        }

        return {
            queued: queued,
            skipped: skipped,
            tempComps: tempComps,
            addedRqItems: addedRqItems,
            templateFallbacks: templateFallbacks
        };
    }

    // Remove our temp comps and RQ items from the project. Used on AME
    // handoff failure to clean up the artifacts we created.
    function cleanupAMEArtifacts(ameResult) {
        for (var i = ameResult.addedRqItems.length - 1; i >= 0; i--) {
            try { ameResult.addedRqItems[i].remove(); } catch (eRq) {}
        }
        for (var j = ameResult.tempComps.length - 1; j >= 0; j--) {
            try { ameResult.tempComps[j].remove(); } catch (eComp) {}
        }
    }

    // ========== DIALOG ==========

    function showDialog(comp) {
        var dlg = new Window("dialog", "Render Each Layer");
        dlg.preferredSize = [420, 460];
        dlg.alignChildren = "fill";
        dlg.margins = 12;
        dlg.spacing = 8;

        // ---------- Format panel ----------
        var formatPanel = dlg.add("panel", undefined, "Format");
        formatPanel.alignChildren = "left";
        formatPanel.margins = 10;
        formatPanel.spacing = 4;
        var fmtPng    = formatPanel.add("radiobutton", undefined, "PNG sequence (alpha)");
        var fmtProRes = formatPanel.add("radiobutton", undefined, "ProRes 4444 .mov (alpha)");
        var fmtH264   = formatPanel.add("radiobutton", undefined, "H.264 .mp4 (no alpha — via Adobe Media Encoder)");
        var initialFormat = loadSetting(KEY_FORMAT, FORMAT_PNG);
        fmtPng.value    = (initialFormat === FORMAT_PNG);
        fmtProRes.value = (initialFormat === FORMAT_PRORES);
        fmtH264.value   = (initialFormat === FORMAT_H264);

        // ---------- Scope panel ----------
        var scopePanel = dlg.add("panel", undefined, "Layer Scope");
        scopePanel.alignChildren = "left";
        scopePanel.margins = 10;
        scopePanel.spacing = 4;
        var scSelected = scopePanel.add("radiobutton", undefined, "Selected layers");
        var scAll      = scopePanel.add("radiobutton", undefined, "All layers");
        var scVisible  = scopePanel.add("radiobutton", undefined, "All visible layers (eye-icon on)");
        var initialScope = loadSetting(KEY_SCOPE, SCOPE_SELECTED);
        scSelected.value = (initialScope === SCOPE_SELECTED);
        scAll.value      = (initialScope === SCOPE_ALL);
        scVisible.value  = (initialScope === SCOPE_VISIBLE);

        var countText = scopePanel.add("statictext", undefined, "");
        countText.alignment = ["fill", "top"];

        // ---------- Dependencies panel ----------
        var depsPanel = dlg.add("panel", undefined, "Dependencies");
        depsPanel.alignChildren = "left";
        depsPanel.margins = 10;
        depsPanel.spacing = 4;
        var strictBox = depsPanel.add(
            "checkbox",
            undefined,
            "Strict solo (ignore track mattes, adjustment layers, parents, lights/cameras)"
        );
        var initialStrict = loadSetting(KEY_STRICT_SOLO, "0");
        strictBox.value = (initialStrict === "1");
        var depsHint = depsPanel.add(
            "statictext",
            undefined,
            "Smart solo (default) keeps the target's matte partner, adjustment layers above it, parent chain, and lights/cameras enabled.",
            { multiline: true }
        );
        depsHint.preferredSize = [380, 32];

        // ---------- Output folder ----------
        var outPanel = dlg.add("panel", undefined, "Output Folder");
        outPanel.alignChildren = "fill";
        outPanel.margins = 10;
        outPanel.spacing = 4;
        var outRow = outPanel.add("group");
        outRow.alignChildren = ["left", "center"];
        outRow.spacing = 6;
        var outLabel = outRow.add("statictext", undefined, "", { truncate: "middle" });
        outLabel.preferredSize = [300, 22];
        var browseBtn = outRow.add("button", undefined, "Browse...");
        browseBtn.preferredSize = [80, 22];

        var initialOutPath = loadSetting(KEY_OUTPUT_FOLDER, "");
        var outFolder = null;
        if (initialOutPath && initialOutPath.length > 0) {
            var f = new Folder(initialOutPath);
            if (f.exists) {
                outFolder = f;
                outLabel.text = f.fsName;
            } else {
                outLabel.text = "(previous folder no longer exists)";
            }
        } else {
            outLabel.text = "(no folder selected)";
        }

        browseBtn.onClick = function() {
            var picked = Folder.selectDialog("Select output folder");
            if (picked) {
                outFolder = picked;
                outLabel.text = picked.fsName;
            }
        };

        // ---------- Warning row + buttons ----------
        var warningRow = dlg.add("statictext", undefined, "", { multiline: true });
        warningRow.preferredSize = [380, 28];
        warningRow.visible = false;

        var btnGroup = dlg.add("group");
        btnGroup.alignment = "right";
        var applyBtn = btnGroup.add("button", undefined, "Render");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        // ---------- Count updater ----------
        function currentScope() {
            if (scAll.value)      return SCOPE_ALL;
            if (scVisible.value)  return SCOPE_VISIBLE;
            return SCOPE_SELECTED;
        }
        function updateCount() {
            try {
                var n = getTargetLayers(comp, currentScope()).length;
                countText.text = n + " layer(s) will be rendered";
            } catch (e) {
                countText.text = "";
            }
        }
        scSelected.onClick = updateCount;
        scAll.onClick      = updateCount;
        scVisible.onClick  = updateCount;
        updateCount();

        var settings = null;

        applyBtn.onClick = function() {
            warningRow.text = "";
            warningRow.visible = false;

            if (outFolder === null || !outFolder.exists) {
                warningRow.text = "Pick an output folder before rendering.";
                warningRow.visible = true;
                dlg.layout.layout(true);
                return;
            }

            var fmt;
            if (fmtPng.value)         fmt = FORMAT_PNG;
            else if (fmtProRes.value) fmt = FORMAT_PRORES;
            else                      fmt = FORMAT_H264;

            settings = {
                format: fmt,
                scope: currentScope(),
                depMode: strictBox.value ? DEP_MODE_STRICT : DEP_MODE_SMART,
                outputFolder: outFolder
            };

            saveSetting(KEY_FORMAT, settings.format);
            saveSetting(KEY_SCOPE, settings.scope);
            saveSetting(KEY_STRICT_SOLO, strictBox.value ? "1" : "0");
            saveSetting(KEY_OUTPUT_FOLDER, outFolder.fsName);

            dlg.close(1);
        };

        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) return null;
        return settings;
    }

    // ========== MAIN ==========

    function main() {
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Please open a composition before running Render Each Layer.");
            return;
        }

        var settings = showDialog(comp);
        if (settings === null) return;

        var targets = getTargetLayers(comp, settings.scope);
        if (targets.length === 0) {
            alert("No matching layers in the active composition for the chosen scope.");
            return;
        }

        var info = formatInfo(settings.format);
        var analysis = analyzeComp(comp);

        // Branch: AME path (H.264) vs RQ path (PNG/ProRes).
        if (info.viaAME) {
            // Verify AME bridge is available.
            if (typeof app.project.renderQueue.queueInAME !== "function") {
                alert(
                    "H.264 / Adobe Media Encoder is not available in this version of After Effects. " +
                    "Re-run with PNG sequence or ProRes 4444."
                );
                return;
            }

            // Pre-existing QUEUED items stay disabled (render = false)
            // through queueInAME(true) so AME only picks up our temp-comp
            // items. Restored in the outer finally regardless of outcome.
            var rqIsolation = isolateRenderQueue();
            try {
                var ameResult = buildAMEQueue(
                    comp, targets, settings.depMode, info, settings.outputFolder, analysis
                );

                if (ameResult.queued === 0) {
                    cleanupAMEArtifacts(ameResult);
                    alert("Nothing was queued for AME — see ExtendScript console for per-layer errors.");
                    return;
                }

                try {
                    app.project.renderQueue.queueInAME(true);
                } catch (eAME) {
                    cleanupAMEArtifacts(ameResult);
                    alert(
                        "AME handoff failed: " + eAME.toString() + "\n\n" +
                        "Adobe Media Encoder may not be running. Launch AME, wait for it to finish loading, then run this script again."
                    );
                    return;
                }

                var ameMsg = "Sent " + ameResult.queued + " item(s) to Adobe Media Encoder.\n\n";
                ameMsg += "Output root: " + settings.outputFolder.fsName + "\n\n";
                ameMsg += "Temp comps left in project (delete after AME finishes):\n";
                for (var i = 0; i < ameResult.tempComps.length && i < 12; i++) {
                    ameMsg += "  " + ameResult.tempComps[i].name + "\n";
                }
                if (ameResult.tempComps.length > 12) {
                    ameMsg += "  ... +" + (ameResult.tempComps.length - 12) + " more\n";
                }
                if (ameResult.templateFallbacks > 0) {
                    ameMsg += "\nTemplate '" + info.omTemplate + "' was not available on " +
                              ameResult.templateFallbacks + " of " + ameResult.queued +
                              " item(s); AME default output module used.\n";
                }
                if (ameResult.skipped.length > 0) {
                    ameMsg += "\nSkipped " + ameResult.skipped.length + " layer(s) due to errors. See ExtendScript console.\n";
                    for (var s = 0; s < ameResult.skipped.length; s++) {
                        $.writeln("Skipped " + ameResult.skipped[s].name + ": " + ameResult.skipped[s].message);
                    }
                }
                alert(ameMsg);
            } finally {
                restoreRenderQueue(rqIsolation);
            }
            return;
        }

        // ---------- PNG / ProRes path ----------
        var rqIsolation2 = isolateRenderQueue();
        var doneCount = 0;
        var cancelledAt = -1;
        var errors = [];
        var templateFallbacks = 0;

        try {
            for (var i = 0; i < targets.length; i++) {
                var layer = targets[i];
                var layerOutFolder = buildOutputFolder(
                    settings.outputFolder, comp.name, layerLabel(layer)
                );
                $.writeln("[render_each_layer] " + (i + 1) + "/" + targets.length +
                          " — " + layer.name + " → " + layerOutFolder.fsName);

                var result = renderOneViaRQ(
                    comp, layer, settings.depMode, info, layerOutFolder, analysis
                );

                if (result.status === "done") {
                    doneCount++;
                    if (result.message != null) templateFallbacks++;
                } else if (result.status === "cancelled") {
                    cancelledAt = i;
                    break;
                } else {
                    errors.push({ name: layer.name, message: result.message });
                }
            }
        } finally {
            restoreRenderQueue(rqIsolation2);
        }

        var msg = "Render Each Layer\n\n";
        msg += "Rendered: " + doneCount + " of " + targets.length + "\n";
        msg += "Output root: " + settings.outputFolder.fsName + "\n";
        if (cancelledAt >= 0) {
            msg += "\nCancelled by user at layer " + (cancelledAt + 1) +
                   " (" + targets[cancelledAt].name + ").\n";
        }
        if (templateFallbacks > 0) {
            msg += "\nTemplate '" + info.omTemplate + "' was not available on " +
                   templateFallbacks + " layer(s); default output module was used.\n";
        }
        if (errors.length > 0) {
            msg += "\nErrors:\n";
            for (var e = 0; e < errors.length && e < 8; e++) {
                msg += "  " + errors[e].name + ": " + errors[e].message + "\n";
            }
            if (errors.length > 8) msg += "  ... +" + (errors.length - 8) + " more\n";
        }
        alert(msg);
    }

    // ========== EXECUTE ==========

    // No app.beginUndoGroup wrapper — renderQueue.render() and queueInAME()
    // open their own internal undo groups during execution, and wrapping
    // the whole run produces "Undo group mismatch" warnings. State safety
    // is handled by snapshotComp/restoreComp inside try/finally instead.
    try {
        main();
    } catch (e) {
        alert("Render Each Layer error: " + e.toString());
    }

})();
