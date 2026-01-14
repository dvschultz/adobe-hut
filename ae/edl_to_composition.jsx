#target aftereffects
/*
 * EDL to Composition Converter
 * Parses CMX 3600 EDL files and creates After Effects compositions
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== UTILITY FUNCTIONS ==========

    function trim(str) {
        return str.replace(/^\s+|\s+$/g, "");
    }

    function timecodeToFrames(timecode, frameRate, isDropFrame) {
        // Parse HH:MM:SS:FF format (handles both : and ; separators)
        var parts = timecode.split(/[:;]/);

        if (parts.length !== 4) {
            throw new Error("Invalid timecode format: " + timecode);
        }

        var hours = parseInt(parts[0], 10);
        var minutes = parseInt(parts[1], 10);
        var seconds = parseInt(parts[2], 10);
        var frames = parseInt(parts[3], 10);

        // Round frameRate for calculations
        var roundedFps = Math.round(frameRate);

        // Calculate total frames (non-drop frame calculation)
        var totalFrames = frames
            + (seconds * roundedFps)
            + (minutes * 60 * roundedFps)
            + (hours * 3600 * roundedFps);

        // Apply drop frame correction if needed (NTSC 29.97)
        if (isDropFrame && frameRate > 29 && frameRate < 31) {
            // Drop frame: drop 2 frames every minute except every 10th minute
            var totalMinutes = (hours * 60) + minutes;
            var dropFrames = 2 * (totalMinutes - Math.floor(totalMinutes / 10));
            totalFrames = totalFrames - dropFrames;
        }

        return totalFrames;
    }

    function framesToSeconds(frames, frameRate) {
        return frames / frameRate;
    }

    // ========== FILE HANDLING ==========

    function selectEDLFile() {
        var edlFile = File.openDialog("Select CMX 3600 EDL file", "*.edl");
        return edlFile;
    }

    function selectSourceFolder() {
        var sourceFolder = Folder.selectDialog("Select folder containing source video files");
        return sourceFolder;
    }

    // ========== EDL PARSING ==========

    function parseEventLine(line) {
        // CMX 3600 format:
        // 001  clip1.mov  V     C        00:00:05:00 00:00:15:00 00:00:00:00 00:00:10:00

        line = trim(line);
        if (line.length === 0) return null;

        // Check if line starts with event number (digits)
        var firstChar = line.charAt(0);
        if (firstChar < "0" || firstChar > "9") return null;

        // Split by whitespace (multiple spaces common in EDL)
        var parts = line.split(/\s+/);

        // Need at least 8 parts: event#, source, track, trans, srcIn, srcOut, recIn, recOut
        if (parts.length < 8) return null;

        var eventNum = parseInt(parts[0], 10);
        if (isNaN(eventNum)) return null;

        return {
            eventNumber: eventNum,
            sourceName: parts[1],
            trackType: parts[2],
            transitionType: parts[3],
            sourceIn: parts[4],
            sourceOut: parts[5],
            recordIn: parts[6],
            recordOut: parts[7],
            sourceFilePath: null,  // Will be populated from * SOURCE FILE line
            clipName: null         // Will be populated from * FROM CLIP NAME line
        };
    }

    function parseEDL(edlFile) {
        var result = {
            title: "Untitled",
            frameRate: 30,
            isDropFrame: false,
            events: []
        };

        if (!edlFile.open("r")) {
            throw new Error("Cannot open EDL file: " + edlFile.fsName);
        }

        var currentEvent = null;

        while (!edlFile.eof) {
            var line = edlFile.readln();

            // Parse TITLE line
            if (line.indexOf("TITLE:") === 0) {
                result.title = trim(line.substring(6));
                continue;
            }

            // Parse FCM (Frame Code Mode) line
            if (line.indexOf("FCM:") === 0) {
                var fcm = trim(line.substring(4));
                if (fcm === "DROP FRAME") {
                    result.isDropFrame = true;
                    result.frameRate = 29.97;
                } else if (fcm === "NON-DROP FRAME") {
                    result.isDropFrame = false;
                    result.frameRate = 30;
                }
                continue;
            }

            // Parse event lines (start with number)
            var eventMatch = parseEventLine(line);
            if (eventMatch) {
                currentEvent = eventMatch;
                result.events.push(currentEvent);
                continue;
            }

            // Parse SOURCE FILE line (follows event line)
            // Format: * SOURCE FILE: /path/to/file.mov
            if (currentEvent && line.indexOf("* SOURCE FILE:") !== -1) {
                var sourceFileIdx = line.indexOf("* SOURCE FILE:");
                var path = trim(line.substring(sourceFileIdx + 14));
                currentEvent.sourceFilePath = path;
                continue;
            }

            // Also check for alternate formats
            // Format: *SOURCE FILE: /path/to/file.mov (no space after *)
            if (currentEvent && line.indexOf("*SOURCE FILE:") !== -1) {
                var sourceFileIdx2 = line.indexOf("*SOURCE FILE:");
                var path2 = trim(line.substring(sourceFileIdx2 + 13));
                currentEvent.sourceFilePath = path2;
                continue;
            }

            // Parse FROM CLIP NAME line (useful as fallback filename)
            // Format: * FROM CLIP NAME: filename.mov
            if (currentEvent && line.indexOf("* FROM CLIP NAME:") !== -1) {
                var clipNameIdx = line.indexOf("* FROM CLIP NAME:");
                var clipName = trim(line.substring(clipNameIdx + 17));
                currentEvent.clipName = clipName;
                continue;
            }

            // Alternate format without space
            if (currentEvent && line.indexOf("*FROM CLIP NAME:") !== -1) {
                var clipNameIdx2 = line.indexOf("*FROM CLIP NAME:");
                var clipName2 = trim(line.substring(clipNameIdx2 + 16));
                currentEvent.clipName = clipName2;
                continue;
            }
        }

        edlFile.close();
        return result;
    }

    // ========== SOURCE MATCHING ==========

    var EXTENSIONS = [".mov", ".mp4", ".avi", ".mxf", ".m4v", ".mkv", ".wmv", ".webm", ".m2ts", ".mts"];

    function buildFolderLookup(folder) {
        // Build a lookup table of files in a folder (case-insensitive)
        var lookup = {};
        if (!folder) return lookup;

        var allFiles = folder.getFiles();
        for (var i = 0; i < allFiles.length; i++) {
            if (allFiles[i] instanceof File) {
                var fileName = allFiles[i].name.toLowerCase();
                lookup[fileName] = allFiles[i];
            }
        }
        return lookup;
    }

    function findFileInLookup(lookup, name) {
        // Try to find a file by name in a folder lookup
        if (!name) return null;

        var nameLower = name.toLowerCase();

        // Try exact match
        if (lookup[nameLower]) {
            return lookup[nameLower];
        }

        // Try adding extensions
        for (var k = 0; k < EXTENSIONS.length; k++) {
            var withExt = nameLower + EXTENSIONS[k];
            if (lookup[withExt]) {
                return lookup[withExt];
            }
        }

        return null;
    }

    function tryResolveEvent(event, folderLookups) {
        // Try to resolve an event using embedded path or known folder lookups
        // folderLookups is an array of { folder: Folder, lookup: {} }

        // First: try the SOURCE FILE path from EDL
        if (event.sourceFilePath) {
            var sourceFile = new File(event.sourceFilePath);
            if (sourceFile.exists) {
                return sourceFile;
            }
        }

        // Try each known folder lookup
        for (var i = 0; i < folderLookups.length; i++) {
            var lookup = folderLookups[i].lookup;

            // Try clipName
            if (event.clipName) {
                var found = findFileInLookup(lookup, event.clipName);
                if (found) return found;
            }

            // Try sourceName
            var found2 = findFileInLookup(lookup, event.sourceName);
            if (found2) return found2;
        }

        return null;
    }

    function promptForMissingFile(event, remainingCount) {
        // Prompt user to locate a specific missing file
        // Returns: { action: "locate"|"skip"|"cancel", file: File|null }
        var fileName = event.clipName || event.sourceName;
        var edlPath = event.sourceFilePath || "(no path in EDL)";

        // Create custom dialog with proper button labels
        var dlg = new Window("dialog", "Missing file (" + remainingCount + " remaining)");

        dlg.add("statictext", undefined, "File: " + fileName);
        dlg.add("statictext", undefined, "EDL Path: " + edlPath);
        dlg.add("statictext", undefined, "");

        var btnGroup = dlg.add("group");
        var locateBtn = btnGroup.add("button", undefined, "Locate File");
        var skipBtn = btnGroup.add("button", undefined, "Skip");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        locateBtn.onClick = function() { dlg.close(1); };
        skipBtn.onClick = function() { dlg.close(2); };
        cancelBtn.onClick = function() { dlg.close(3); };

        var result = dlg.show();

        if (result === 3) {
            return { action: "cancel", file: null };
        }

        if (result === 2) {
            return { action: "skip", file: null };
        }

        // User chose to locate - open file dialog
        var linkedFile = File.openDialog("Locate: " + fileName);
        if (!linkedFile) {
            // User cancelled file dialog - treat as skip
            return { action: "skip", file: null };
        }

        return { action: "locate", file: linkedFile };
    }

    function resolveSourceFiles(events, initialFolder) {
        var results = {
            resolved: {},      // eventIndex -> File object
            skipped: [],       // list of event indices that were skipped
            cancelled: false   // true if user cancelled the entire process
        };

        // Track known folders and their lookups
        var folderLookups = [];

        // Add initial folder if provided
        if (initialFolder) {
            folderLookups.push({
                folder: initialFolder,
                lookup: buildFolderLookup(initialFolder)
            });
        }

        // First pass: resolve what we can automatically
        var unresolvedIndices = [];
        for (var j = 0; j < events.length; j++) {
            var file = tryResolveEvent(events[j], folderLookups);
            if (file) {
                results.resolved[j] = file;
            } else {
                unresolvedIndices.push(j);
            }
        }

        // Second pass: prompt for each missing file
        while (unresolvedIndices.length > 0) {
            var idx = unresolvedIndices[0];
            var event = events[idx];

            // Prompt user for this file
            var promptResult = promptForMissingFile(event, unresolvedIndices.length);

            if (promptResult.action === "cancel") {
                // User cancelled entire process
                results.cancelled = true;
                return results;
            }

            if (promptResult.action === "skip") {
                // User skipped this file
                results.skipped.push(idx);
                unresolvedIndices.shift();
                continue;
            }

            // User linked a file - save it
            var linkedFile = promptResult.file;
            results.resolved[idx] = linkedFile;
            unresolvedIndices.shift();

            // Check the folder this file came from for other missing files
            var linkedFolder = linkedFile.parent;
            var alreadyKnown = false;
            for (var f = 0; f < folderLookups.length; f++) {
                if (folderLookups[f].folder.fsName === linkedFolder.fsName) {
                    alreadyKnown = true;
                    break;
                }
            }

            if (!alreadyKnown) {
                // Add this new folder to our lookups
                var newLookup = {
                    folder: linkedFolder,
                    lookup: buildFolderLookup(linkedFolder)
                };
                folderLookups.push(newLookup);

                // Try to resolve remaining unresolved events with this new folder
                var stillUnresolved = [];
                var autoLinked = 0;
                for (var u = 0; u < unresolvedIndices.length; u++) {
                    var uIdx = unresolvedIndices[u];
                    var uEvent = events[uIdx];
                    var found = tryResolveEvent(uEvent, [newLookup]);
                    if (found) {
                        results.resolved[uIdx] = found;
                        autoLinked++;
                    } else {
                        stillUnresolved.push(uIdx);
                    }
                }
                unresolvedIndices = stillUnresolved;

                // Notify user if we auto-linked files
                if (autoLinked > 0) {
                    alert("Auto-linked " + autoLinked + " additional file(s) from:\n" + linkedFolder.fsName);
                }
            }
        }

        return results;
    }

    function checkEmbeddedPaths(events) {
        // Check how many events have embedded SOURCE FILE paths
        var withPaths = 0;
        var withExistingFiles = 0;

        for (var i = 0; i < events.length; i++) {
            if (events[i].sourceFilePath) {
                withPaths++;
                var f = new File(events[i].sourceFilePath);
                if (f.exists) {
                    withExistingFiles++;
                }
            }
        }

        return {
            total: events.length,
            withPaths: withPaths,
            withExistingFiles: withExistingFiles
        };
    }

    // ========== COMPOSITION CREATION ==========

    function calculateDuration(events, frameRate, isDropFrame) {
        var maxFrame = 0;
        for (var i = 0; i < events.length; i++) {
            var recOut = timecodeToFrames(events[i].recordOut, frameRate, isDropFrame);
            if (recOut > maxFrame) {
                maxFrame = recOut;
            }
        }
        return framesToSeconds(maxFrame, frameRate);
    }

    function createComposition(edlData, durationInSeconds) {
        var compWidth = 1920;
        var compHeight = 1080;
        var pixelAspect = 1.0;

        var comp = app.project.items.addComp(
            edlData.title,
            compWidth,
            compHeight,
            pixelAspect,
            durationInSeconds,
            edlData.frameRate
        );

        return comp;
    }

    function importFootage(file) {
        try {
            var importOpts = new ImportOptions(file);
            var footageItem = app.project.importFile(importOpts);
            return footageItem;
        } catch (e) {
            return null;
        }
    }

    function addLayerWithTiming(comp, footageItem, event, frameRate, isDropFrame) {
        // Convert timecodes to frames then seconds
        var sourceInFrames = timecodeToFrames(event.sourceIn, frameRate, isDropFrame);
        var sourceOutFrames = timecodeToFrames(event.sourceOut, frameRate, isDropFrame);
        var recordInFrames = timecodeToFrames(event.recordIn, frameRate, isDropFrame);
        var recordOutFrames = timecodeToFrames(event.recordOut, frameRate, isDropFrame);

        var sourceInSec = framesToSeconds(sourceInFrames, frameRate);
        var sourceOutSec = framesToSeconds(sourceOutFrames, frameRate);
        var recordInSec = framesToSeconds(recordInFrames, frameRate);
        var recordOutSec = framesToSeconds(recordOutFrames, frameRate);

        // Add the layer to composition
        var layer = comp.layers.add(footageItem);

        // Position layer on timeline
        // startTime offsets the layer's internal 0:00 from comp time
        // If source starts at 00:00:05:00, we shift the layer so that point aligns with recordIn
        layer.startTime = recordInSec - sourceInSec;
        layer.inPoint = recordInSec;
        layer.outPoint = recordOutSec;

        return layer;
    }

    // ========== USER INTERFACE ==========

    function promptForFrameRate(detectedRate, isDropFrame) {
        // Create dialog
        var dlg = new Window("dialog", "Select Frame Rate");

        dlg.add("statictext", undefined, "Select the frame rate for this composition:");

        var rateGroup = dlg.add("group");
        rateGroup.orientation = "column";
        rateGroup.alignChildren = "left";

        var rates = [
            { label: "23.976 fps (Film)", value: 23.976, drop: false },
            { label: "24 fps (Film)", value: 24, drop: false },
            { label: "25 fps (PAL)", value: 25, drop: false },
            { label: "29.97 fps Drop Frame (NTSC)", value: 29.97, drop: true },
            { label: "29.97 fps Non-Drop (NTSC)", value: 29.97, drop: false },
            { label: "30 fps", value: 30, drop: false },
            { label: "50 fps (PAL)", value: 50, drop: false },
            { label: "59.94 fps (NTSC)", value: 59.94, drop: false },
            { label: "60 fps", value: 60, drop: false }
        ];

        // Determine which rate to pre-select based on detected values
        var defaultIndex = 5; // Default to 30fps
        for (var i = 0; i < rates.length; i++) {
            if (rates[i].value === detectedRate && rates[i].drop === isDropFrame) {
                defaultIndex = i;
                break;
            }
        }

        var rateDropdown = rateGroup.add("dropdownlist", undefined, []);
        for (var j = 0; j < rates.length; j++) {
            rateDropdown.add("item", rates[j].label);
        }
        rateDropdown.selection = defaultIndex;

        // Buttons
        var btnGroup = dlg.add("group");
        btnGroup.add("button", undefined, "OK", { name: "ok" });
        btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

        if (dlg.show() === 1) {
            var selectedIdx = rateDropdown.selection.index;
            return {
                frameRate: rates[selectedIdx].value,
                isDropFrame: rates[selectedIdx].drop
            };
        }
        return null; // User cancelled
    }

    // ========== USER FEEDBACK ==========

    function showResults(successCount, failedImports, skippedFiles, compName) {
        var message = "Composition '" + compName + "' created!\n\n";
        message += "Successfully added: " + successCount + " layers\n";

        if (failedImports.length > 0) {
            message += "\nFailed to import (" + failedImports.length + "):\n";
            for (var i = 0; i < failedImports.length && i < 10; i++) {
                message += "  - " + failedImports[i] + "\n";
            }
            if (failedImports.length > 10) {
                message += "  ... and " + (failedImports.length - 10) + " more\n";
            }
        }

        if (skippedFiles.length > 0) {
            message += "\nSkipped files (" + skippedFiles.length + "):\n";
            for (var j = 0; j < skippedFiles.length && j < 10; j++) {
                message += "  - " + skippedFiles[j] + "\n";
            }
            if (skippedFiles.length > 10) {
                message += "  ... and " + (skippedFiles.length - 10) + " more\n";
            }
        }

        alert(message);
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        // 1. Select EDL file
        var edlFile = selectEDLFile();
        if (!edlFile) {
            alert("Script cancelled: No EDL file selected.");
            return;
        }

        // 2. Parse EDL
        var edlData;
        try {
            edlData = parseEDL(edlFile);
        } catch (e) {
            alert("Error parsing EDL: " + e.message);
            return;
        }

        // 3. Filter to video events only
        var videoEvents = [];
        for (var i = 0; i < edlData.events.length; i++) {
            var trackType = edlData.events[i].trackType;
            if (trackType.indexOf("V") === 0) {
                videoEvents.push(edlData.events[i]);
            }
        }

        if (videoEvents.length === 0) {
            alert("No video events found in EDL.");
            return;
        }

        // 4. Prompt for frame rate (pre-select based on EDL's FCM if present)
        var frameRateResult = promptForFrameRate(edlData.frameRate, edlData.isDropFrame);
        if (!frameRateResult) {
            alert("Script cancelled.");
            return;
        }
        edlData.frameRate = frameRateResult.frameRate;
        edlData.isDropFrame = frameRateResult.isDropFrame;

        // 5. Check if EDL has embedded source file paths
        var pathStats = checkEmbeddedPaths(videoEvents);
        var needsFolderSelection = false;
        var fallbackFolder = null;

        if (pathStats.withExistingFiles === pathStats.total) {
            // All files found via embedded paths - no folder needed
            var proceedDlg = new Window("dialog", "Ready to Import");
            proceedDlg.add("statictext", undefined, "Title: " + edlData.title);
            proceedDlg.add("statictext", undefined, "Video Events: " + videoEvents.length);
            proceedDlg.add("statictext", undefined, "Source Files: All " + pathStats.total + " found");
            proceedDlg.add("statictext", undefined, "");
            var proceedBtnGroup = proceedDlg.add("group");
            proceedBtnGroup.add("button", undefined, "Import", { name: "ok" });
            proceedBtnGroup.add("button", undefined, "Cancel", { name: "cancel" });
            if (proceedDlg.show() !== 1) {
                return;
            }
        } else if (pathStats.withExistingFiles > 0) {
            // Some files found, some missing
            var choiceDlg = new Window("dialog", "Source Files Found: " + pathStats.withExistingFiles + " of " + pathStats.total);
            choiceDlg.add("statictext", undefined, "Some source files are missing.");
            choiceDlg.add("statictext", undefined, "");
            var choiceBtnGroup = choiceDlg.add("group");
            var selectFolderBtn = choiceBtnGroup.add("button", undefined, "Select Folder");
            var proceedAnywayBtn = choiceBtnGroup.add("button", undefined, "Proceed Anyway");
            var cancelBtn = choiceBtnGroup.add("button", undefined, "Cancel");
            selectFolderBtn.onClick = function() { choiceDlg.close(1); };
            proceedAnywayBtn.onClick = function() { choiceDlg.close(2); };
            cancelBtn.onClick = function() { choiceDlg.close(3); };
            var choiceResult = choiceDlg.show();
            if (choiceResult === 3) {
                return;
            }
            if (choiceResult === 1) {
                fallbackFolder = selectSourceFolder();
            }
        } else if (pathStats.withPaths > 0) {
            // Has paths but files don't exist at those locations
            alert(
                "EDL contains " + pathStats.withPaths + " source file paths,\n" +
                "but none of the files exist at those locations.\n\n" +
                "Please select a folder containing the source files."
            );
            fallbackFolder = selectSourceFolder();
            if (!fallbackFolder) {
                alert("Script cancelled: No source folder selected.");
                return;
            }
        } else {
            // No embedded paths at all
            fallbackFolder = selectSourceFolder();
            if (!fallbackFolder) {
                alert("Script cancelled: No source folder selected.");
                return;
            }
        }

        // 6. Resolve all source files (will prompt for missing files one by one)
        var resolveResult = resolveSourceFiles(videoEvents, fallbackFolder);

        // Check if user cancelled
        if (resolveResult.cancelled) {
            alert("Import cancelled.");
            return;
        }

        // Check if any files were resolved
        var resolvedCount = 0;
        for (var key in resolveResult.resolved) {
            if (resolveResult.resolved.hasOwnProperty(key)) {
                resolvedCount++;
            }
        }

        if (resolvedCount === 0) {
            alert("No source files were linked. Cannot create composition.");
            return;
        }

        // 7. Calculate duration and create composition
        var duration = calculateDuration(videoEvents, edlData.frameRate, edlData.isDropFrame);
        var comp = createComposition(edlData, duration + 1); // Add 1 second padding

        // 8. Import footage and add layers
        var successCount = 0;
        var failedImports = [];
        var importedFootage = {}; // Cache to avoid re-importing same source

        for (var j = 0; j < videoEvents.length; j++) {
            var event = videoEvents[j];
            var sourceFile = resolveResult.resolved[j];

            if (!sourceFile) {
                continue; // Already reported as missing
            }

            // Check cache for already imported footage
            var cacheKey = sourceFile.fsName;
            var footageItem = importedFootage[cacheKey];
            if (!footageItem) {
                footageItem = importFootage(sourceFile);
                if (footageItem) {
                    importedFootage[cacheKey] = footageItem;
                }
            }

            if (!footageItem) {
                failedImports.push(event.clipName || event.sourceName);
                continue;
            }

            // Add layer with timing
            try {
                addLayerWithTiming(comp, footageItem, event, edlData.frameRate, edlData.isDropFrame);
                successCount++;
            } catch (e) {
                failedImports.push((event.clipName || event.sourceName) + " (timing error: " + e.message + ")");
            }
        }

        // 9. Show results
        var skippedNames = [];
        for (var s = 0; s < resolveResult.skipped.length; s++) {
            var skippedIdx = resolveResult.skipped[s];
            skippedNames.push(videoEvents[skippedIdx].clipName || videoEvents[skippedIdx].sourceName);
        }
        showResults(successCount, failedImports, skippedNames, comp.name);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("EDL to Composition");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
