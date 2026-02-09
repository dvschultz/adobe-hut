#target aftereffects
#include '../lib/aequery.js'
/*
 * Upresed Footage Replacer (AEQuery version)
 * Scans the active composition for footage items, matches them to upresed
 * files in a user-selected folder by name, and replaces the source footage
 * project-wide. Preserves all timeline positions, effects, and keyframes.
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "Replace Upresed Footage");

        // Folder selection
        var folderPanel = dlg.add("panel", undefined, "Upresed Files Folder");
        folderPanel.alignment = "fill";
        folderPanel.alignChildren = "fill";

        var folderGroup = folderPanel.add("group");
        folderGroup.alignment = "fill";
        var browseBtn = folderGroup.add("button", undefined, "Browse...");
        var folderLabel = folderGroup.add("statictext", undefined, "No folder selected");
        folderLabel.characters = 40;

        var selectedFolder = null;

        browseBtn.onClick = function() {
            var f = Folder.selectDialog("Select folder containing upresed files");
            if (f) {
                selectedFolder = f;
                folderLabel.text = f.fsName;
            }
        };

        // Suffix
        var suffixPanel = dlg.add("panel", undefined, "Filename Suffix");
        suffixPanel.alignment = "fill";
        suffixPanel.orientation = "row";
        suffixPanel.add("statictext", undefined, "Suffix:");
        var suffixInput = suffixPanel.add("edittext", undefined, "_2x");
        suffixInput.characters = 15;

        // Match mode
        var matchPanel = dlg.add("panel", undefined, "Match Mode");
        matchPanel.alignment = "fill";
        matchPanel.alignChildren = "left";
        var modeStrip = matchPanel.add("radiobutton", undefined, "Strip suffix (exact match after removing suffix)");
        var modeFuzzy = matchPanel.add("radiobutton", undefined, "Fuzzy match (original name is substring of upresed name)");
        modeStrip.value = true;

        // Dry run
        var dryRunCheck = dlg.add("checkbox", undefined, "Dry run (preview matches only, no changes)");
        dryRunCheck.value = true;

        // Buttons
        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "OK");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) {
            return null;
        }

        if (!selectedFolder) {
            alert("Please select a folder containing upresed files.");
            return null;
        }

        var suffix = suffixInput.text;
        if (modeStrip.value && suffix.length === 0) {
            alert("Please enter a suffix for strip-suffix mode.");
            return null;
        }

        return {
            folder: selectedFolder,
            suffix: suffix,
            fuzzyMode: modeFuzzy.value,
            dryRun: dryRunCheck.value
        };
    }

    // ========== COLLECT COMP FOOTAGE ==========

    function collectCompFootage(comp) {
        var lookup = {};
        var seen = {};

        aeq('layer', comp)
            .filter(function(layer) {
                return layer.source &&
                       layer.source instanceof FootageItem &&
                       layer.source.file;
            })
            .forEach(function(layer) {
                var sourceId = layer.source.id;
                if (seen[sourceId]) return;
                seen[sourceId] = true;

                var fileName = layer.source.file.name;
                var baseName = fileName.replace(/\.[^.]+$/, "");
                var key = baseName.toLowerCase();

                lookup[key] = {
                    footageItem: layer.source,
                    baseName: baseName,
                    fileName: fileName,
                    width: layer.source.width,
                    height: layer.source.height
                };
            });

        return lookup;
    }

    // ========== SCAN UPRESED FOLDER ==========

    function stripExtension(name) {
        return name.replace(/\.[^.]+$/, "");
    }

    function scanAndMatch(folder, compLookup, suffix, fuzzyMode) {
        var allFiles = folder.getFiles();
        var matched = [];
        var unmatched = [];
        var matchTargets = {};

        for (var i = 0; i < allFiles.length; i++) {
            if (!(allFiles[i] instanceof File)) continue;

            var upFile = allFiles[i];
            var upBaseName = stripExtension(upFile.name);
            var matchName = null;
            var matchedKey = null;
            var matchedItem = null;

            if (fuzzyMode) {
                // Fuzzy: find a comp footage item whose base name is contained in the upresed filename
                for (var key in compLookup) {
                    if (!compLookup.hasOwnProperty(key)) continue;
                    if (upBaseName.toLowerCase().indexOf(key) !== -1) {
                        if (matchTargets[key]) {
                            matchTargets[key].ambiguous = true;
                            matchTargets[key].files.push(upFile.name);
                            matchedKey = null;
                            break;
                        }
                        matchedKey = key;
                        matchedItem = compLookup[key];
                    }
                }
            } else {
                // Strip suffix mode: remove suffix from upresed base name to get match name
                var suffixLower = suffix.toLowerCase();
                var upBaseNameLower = upBaseName.toLowerCase();

                if (upBaseNameLower.length > suffixLower.length &&
                    upBaseNameLower.indexOf(suffixLower, upBaseNameLower.length - suffixLower.length) !== -1) {
                    matchName = upBaseName.substring(0, upBaseName.length - suffix.length);
                    matchedKey = matchName.toLowerCase();
                    matchedItem = compLookup[matchedKey] || null;
                }
            }

            if (matchedKey && matchedItem) {
                if (!matchTargets[matchedKey]) {
                    matchTargets[matchedKey] = { ambiguous: false, files: [upFile.name] };
                    matched.push({
                        original: matchedItem,
                        upresedFile: upFile,
                        upresedName: upFile.name,
                        key: matchedKey
                    });
                } else if (!fuzzyMode) {
                    matchTargets[matchedKey].ambiguous = true;
                    matchTargets[matchedKey].files.push(upFile.name);
                }
            } else {
                unmatched.push(upFile.name);
            }
        }

        // Remove ambiguous matches
        var cleanMatched = [];
        var ambiguous = [];
        for (var m = 0; m < matched.length; m++) {
            var target = matchTargets[matched[m].key];
            if (target && target.ambiguous) {
                ambiguous.push(matched[m].original.baseName + " matched by: " + target.files.join(", "));
            } else {
                cleanMatched.push(matched[m]);
            }
        }

        // Find unmatched comp footage
        var matchedKeys = {};
        for (var c = 0; c < cleanMatched.length; c++) {
            matchedKeys[cleanMatched[c].key] = true;
        }
        var unmatchedComp = [];
        for (var compKey in compLookup) {
            if (!compLookup.hasOwnProperty(compKey)) continue;
            if (!matchedKeys[compKey]) {
                unmatchedComp.push(compLookup[compKey].fileName);
            }
        }

        return {
            matched: cleanMatched,
            unmatchedUpresed: unmatched,
            unmatchedComp: unmatchedComp,
            ambiguous: ambiguous
        };
    }

    // ========== DRY RUN ==========

    function showDryRunReport(results) {
        var msg = "=== DRY RUN REPORT ===\n\n";

        if (results.matched.length > 0) {
            msg += "MATCHED (" + results.matched.length + "):\n";
            for (var i = 0; i < results.matched.length; i++) {
                var m = results.matched[i];
                msg += "  " + m.original.fileName + " -> " + m.upresedName;
                msg += " (" + m.original.width + "x" + m.original.height + ")\n";
            }
            msg += "\n";
        } else {
            msg += "No matches found.\n\n";
        }

        if (results.ambiguous.length > 0) {
            msg += "AMBIGUOUS (skipped, " + results.ambiguous.length + "):\n";
            for (var a = 0; a < results.ambiguous.length; a++) {
                msg += "  " + results.ambiguous[a] + "\n";
            }
            msg += "\n";
        }

        if (results.unmatchedUpresed.length > 0) {
            msg += "UNMATCHED UPRESED FILES (" + results.unmatchedUpresed.length + "):\n";
            for (var u = 0; u < results.unmatchedUpresed.length; u++) {
                msg += "  " + results.unmatchedUpresed[u] + "\n";
            }
            msg += "\n";
        }

        if (results.unmatchedComp.length > 0) {
            msg += "UNMATCHED COMP FOOTAGE (" + results.unmatchedComp.length + "):\n";
            for (var c = 0; c < results.unmatchedComp.length; c++) {
                msg += "  " + results.unmatchedComp[c] + "\n";
            }
        }

        alert(msg);
    }

    // ========== REPLACE ==========

    function replaceFootage(results) {
        var replaced = 0;
        var failures = [];

        app.beginUndoGroup("Replace Upresed Footage");

        try {
            for (var i = 0; i < results.matched.length; i++) {
                var m = results.matched[i];
                try {
                    m.original.footageItem.replace(new File(m.upresedFile.fsName));
                    replaced++;
                } catch (e) {
                    failures.push(m.original.fileName + ": " + e.toString());
                }
            }
        } catch (e) {
            alert("Error during replacement: " + e.toString());
        }

        app.endUndoGroup();

        // Summary
        var msg = "=== REPLACEMENT SUMMARY ===\n\n";
        msg += "Replaced: " + replaced + " / " + results.matched.length + "\n";

        if (failures.length > 0) {
            msg += "\nFAILURES (" + failures.length + "):\n";
            for (var f = 0; f < failures.length; f++) {
                msg += "  " + failures[f] + "\n";
            }
        }

        if (results.ambiguous.length > 0) {
            msg += "\nAMBIGUOUS (skipped): " + results.ambiguous.length + "\n";
        }

        if (results.unmatchedComp.length > 0) {
            msg += "\nUNMATCHED COMP FOOTAGE: " + results.unmatchedComp.length + "\n";
        }

        alert(msg);
    }

    // ========== MAIN ==========

    function main() {
        var comp = aeq.getActiveComp();

        if (!comp) {
            alert("Please select a composition.");
            return;
        }

        if (comp.numLayers === 0) {
            alert("Composition has no layers.");
            return;
        }

        var settings = showDialog();
        if (!settings) return;

        var compLookup = collectCompFootage(comp);

        var results = scanAndMatch(settings.folder, compLookup, settings.suffix, settings.fuzzyMode);

        if (results.matched.length === 0) {
            alert("No matches found between comp footage and upresed files.\n\n" +
                  "Upresed files scanned: " + (results.unmatchedUpresed.length) + "\n" +
                  "Comp footage items: " + results.unmatchedComp.length);
            return;
        }

        if (settings.dryRun) {
            showDryRunReport(results);
        } else {
            replaceFootage(results);
        }
    }

    // ========== EXECUTE ==========

    main();

})();
