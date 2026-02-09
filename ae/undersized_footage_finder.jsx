#target aftereffects
/*
 * Undersized Footage Finder
 * Audits a composition for footage items whose source resolution is below
 * a target threshold. Offers two modes: save a text report or render each
 * undersized clip at its native resolution via the Render Queue as ProRes 422.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "Undersized Footage Finder");

        var sizePanel = dlg.add("panel", undefined, "Target Resolution");
        sizePanel.orientation = "row";
        sizePanel.alignment = "fill";

        sizePanel.add("statictext", undefined, "Width:");
        var widthInput = sizePanel.add("edittext", undefined, "1920");
        widthInput.characters = 8;

        sizePanel.add("statictext", undefined, "Height:");
        var heightInput = sizePanel.add("edittext", undefined, "1080");
        heightInput.characters = 8;

        var modePanel = dlg.add("panel", undefined, "Output Mode");
        modePanel.alignment = "fill";
        modePanel.alignChildren = "left";
        var modeReport = modePanel.add("radiobutton", undefined, "Save Text Report");
        var modeRender = modePanel.add("radiobutton", undefined, "Render Clips at Native Resolution");
        modeReport.value = true;

        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "OK");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        widthInput.active = true;

        if (dlg.show() !== 1) {
            return null;
        }

        var targetWidth = parseInt(widthInput.text, 10);
        var targetHeight = parseInt(heightInput.text, 10);

        if (isNaN(targetWidth) || targetWidth <= 0 || isNaN(targetHeight) || targetHeight <= 0) {
            alert("Please enter positive integers for width and height.");
            return null;
        }

        return {
            targetWidth: targetWidth,
            targetHeight: targetHeight,
            renderMode: modeRender.value
        };
    }

    // ========== LAYER INSPECTION ==========

    function collectUndersizedLayers(comp, targetWidth, targetHeight) {
        var results = [];

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (!layer.source || !(layer.source instanceof FootageItem)) continue;
            if (!layer.source.file) continue;

            var srcW = layer.source.width;
            var srcH = layer.source.height;

            if (srcW < targetWidth || srcH < targetHeight) {
                results.push({
                    layerIndex: i,
                    fileName: layer.source.file.name,
                    filePath: layer.source.file.fsName,
                    sourceWidth: srcW,
                    sourceHeight: srcH,
                    source: layer.source,
                    inPoint: layer.inPoint,
                    outPoint: layer.outPoint,
                    startTime: layer.startTime
                });
            }
        }

        return results;
    }

    // ========== TEXT REPORT ==========

    function deduplicateByPath(items) {
        var seen = {};
        var unique = [];
        for (var i = 0; i < items.length; i++) {
            if (!seen[items[i].filePath]) {
                seen[items[i].filePath] = true;
                unique.push(items[i]);
            }
        }
        return unique;
    }

    function saveTextReport(comp, items, targetWidth, targetHeight) {
        var unique = deduplicateByPath(items);

        unique.sort(function(a, b) {
            var nameA = a.fileName.toLowerCase();
            var nameB = b.fileName.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        var content = "Undersized Footage Report\n";
        content += "Composition: " + comp.name + "\n";
        content += "Target Resolution: " + targetWidth + " x " + targetHeight + "\n";
        content += "----------------------------------------\n";

        for (var i = 0; i < unique.length; i++) {
            var item = unique[i];
            content += item.fileName + " (" + item.sourceWidth + "x" + item.sourceHeight + ")\n";
            content += item.filePath + "\n\n";
        }

        content += "----------------------------------------\n";
        content += "Total undersized files: " + unique.length + "\n";

        var saveFile = File.saveDialog("Save undersized footage report:", "*.txt");
        if (!saveFile) return;

        try {
            saveFile.open("w");
            saveFile.write(content);
            saveFile.close();
            alert("Report saved!\n\nFile: " + saveFile.fsName + "\nUndersized files: " + unique.length);
        } catch (e) {
            alert("Error saving file: " + e.toString());
        }
    }

    // ========== RENDER MODE ==========

    function renderClips(comp, items) {
        var outputFolder = Folder.selectDialog("Select output folder for rendered clips");
        if (!outputFolder) return;

        var usedNames = {};
        var addedCount = 0;

        app.beginUndoGroup("Undersized Footage Render");

        try {
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var clipDuration = item.outPoint - item.inPoint;
                if (clipDuration <= 0) continue;

                // Create comp at footage native resolution
                var newComp = app.project.items.addComp(
                    item.fileName + "_native",
                    item.sourceWidth,
                    item.sourceHeight,
                    1.0,
                    clipDuration,
                    comp.frameRate
                );

                // Add footage to new comp and set timing
                var newLayer = newComp.layers.add(item.source);
                var sourceInTime = item.inPoint - item.startTime;
                newLayer.startTime = -sourceInTime;
                newLayer.inPoint = 0;
                newLayer.outPoint = clipDuration;

                // Add to render queue
                var rqItem = app.project.renderQueue.items.add(newComp);

                // Build output filename, handle collisions
                var baseName = item.fileName.replace(/\.[^.]+$/, "");
                var outputName;
                if (usedNames[baseName]) {
                    outputName = baseName + "_layer" + item.layerIndex + ".mov";
                } else {
                    outputName = baseName + ".mov";
                }
                usedNames[baseName] = true;

                rqItem.outputModule(1).file = new File(outputFolder.fsName + "/" + outputName);

                // Apply ProRes 422 template
                try {
                    rqItem.outputModule(1).applyTemplate("ProRes 422");
                } catch (e) {
                    // Template may not exist; leave default output module settings
                }

                addedCount++;
            }
        } catch (e) {
            alert("Error during render setup: " + e.toString());
        }

        app.endUndoGroup();

        alert("Added " + addedCount + " item(s) to the Render Queue.\nOutput folder: " + outputFolder.fsName);
    }

    // ========== MAIN ==========

    function main() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        if (comp.numLayers === 0) {
            alert("Composition has no layers.");
            return;
        }

        var settings = showDialog();
        if (!settings) return;

        var items = collectUndersizedLayers(comp, settings.targetWidth, settings.targetHeight);

        if (items.length === 0) {
            alert("No undersized footage found.\nAll footage meets or exceeds " + settings.targetWidth + "x" + settings.targetHeight + ".");
            return;
        }

        if (settings.renderMode) {
            renderClips(comp, items);
        } else {
            saveTextReport(comp, items, settings.targetWidth, settings.targetHeight);
        }
    }

    // ========== EXECUTE ==========

    main();

})();
