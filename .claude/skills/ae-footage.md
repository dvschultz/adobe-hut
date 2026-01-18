---
name: ae-footage
description: "Footage management in After Effects: batch import, replace footage, relink missing files, consolidate project."
---

# AE Footage Management

Manage footage items in After Effects projects including import, replacement, relinking, and organization.

## Available Operations

### 1. Batch Import with Settings

Import multiple files from a folder with specific settings.

```javascript
#target aftereffects

(function() {
    var folder = Folder.selectDialog("Select folder containing footage");
    if (!folder) return;

    // Configuration
    var config = {
        extensions: ["*.mov", "*.mp4", "*.avi", "*.mxf", "*.jpg", "*.png", "*.tif", "*.psd", "*.ai"],
        importSequences: true,  // Import image sequences
        targetFolder: null      // Project folder to import into (null = root)
    };

    // Create or find target folder in project
    var targetFolderName = prompt("Import into project folder (leave empty for root):", "");
    if (targetFolderName !== "") {
        // Find or create folder
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof FolderItem &&
                app.project.item(i).name === targetFolderName) {
                config.targetFolder = app.project.item(i);
                break;
            }
        }
        if (!config.targetFolder) {
            config.targetFolder = app.project.items.addFolder(targetFolderName);
        }
    }

    app.beginUndoGroup("Batch Import");
    try {
        var importCount = 0;
        var files = [];

        // Collect files
        for (var e = 0; e < config.extensions.length; e++) {
            var matched = folder.getFiles(config.extensions[e]);
            for (var m = 0; m < matched.length; m++) {
                files.push(matched[m]);
            }
        }

        if (files.length === 0) {
            alert("No supported files found in folder.");
            return;
        }

        // Import files
        for (var f = 0; f < files.length; f++) {
            var file = files[f];

            try {
                var importOptions = new ImportOptions(file);

                // Check if it's part of a sequence
                if (config.importSequences && isSequenceFile(file.name)) {
                    importOptions.sequence = true;
                }

                var footage = app.project.importFile(importOptions);

                if (config.targetFolder) {
                    footage.parentFolder = config.targetFolder;
                }

                importCount++;
            } catch (err) {
                $.writeln("Failed to import: " + file.name + " - " + err.message);
            }
        }

        alert("Imported " + importCount + " file(s) from:\n" + folder.fsName);

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function isSequenceFile(filename) {
        // Check if filename matches sequence pattern (e.g., file_0001.jpg)
        return /[\._]\d{3,}\./.test(filename);
    }

})();
```

### 2. Replace Footage

Replace a footage item with a new file across all uses in the project.

```javascript
#target aftereffects

(function() {
    var selectedItems = app.project.selection;

    if (selectedItems.length === 0) {
        alert("Please select a footage item in the Project panel.");
        return;
    }

    var footage = selectedItems[0];
    if (!(footage instanceof FootageItem)) {
        alert("Please select a footage item (not a composition).");
        return;
    }

    var newFile = File.openDialog("Select replacement file");
    if (!newFile) return;

    app.beginUndoGroup("Replace Footage");
    try {
        footage.replace(newFile);
        alert("Replaced footage '" + footage.name + "' with:\n" + newFile.name);
    } catch (e) {
        alert("Error replacing footage: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Replace Footage by Name Pattern

Replace multiple footage items matching a pattern.

```javascript
#target aftereffects

(function() {
    var searchPattern = prompt("Find footage names containing:", "");
    if (!searchPattern) return;

    var replaceFolder = Folder.selectDialog("Select folder with replacement files");
    if (!replaceFolder) return;

    app.beginUndoGroup("Replace by Pattern");
    try {
        var replacements = 0;
        var notFound = [];

        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);

            if (item instanceof FootageItem) {
                if (item.name.indexOf(searchPattern) !== -1) {
                    // Try to find replacement file
                    var replacementFile = findFileInFolder(replaceFolder, item.name);

                    if (replacementFile) {
                        item.replace(replacementFile);
                        replacements++;
                    } else {
                        notFound.push(item.name);
                    }
                }
            }
        }

        var message = "Replaced " + replacements + " footage item(s).";
        if (notFound.length > 0) {
            message += "\n\nNot found (" + notFound.length + "):\n";
            for (var j = 0; j < Math.min(notFound.length, 10); j++) {
                message += "- " + notFound[j] + "\n";
            }
        }

        alert(message);

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function findFileInFolder(folder, originalName) {
        // Try exact match first
        var files = folder.getFiles();
        for (var f = 0; f < files.length; f++) {
            if (files[f] instanceof File && files[f].name === originalName) {
                return files[f];
            }
        }

        // Try without extension match
        var baseName = originalName.replace(/\.[^.]+$/, "");
        for (var g = 0; g < files.length; g++) {
            if (files[g] instanceof File) {
                var compareBase = files[g].name.replace(/\.[^.]+$/, "");
                if (compareBase === baseName) {
                    return files[g];
                }
            }
        }

        return null;
    }

})();
```

### 4. Relink Missing Footage

Find and relink missing footage items.

```javascript
#target aftereffects

(function() {
    var missingItems = [];

    // Find all missing footage
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FootageItem) {
            if (item.mainSource instanceof FileSource) {
                if (item.mainSource.missingFootagePath !== "") {
                    missingItems.push(item);
                }
            }
        }
    }

    if (missingItems.length === 0) {
        alert("No missing footage found in project.");
        return;
    }

    var searchFolder = Folder.selectDialog(
        "Found " + missingItems.length + " missing item(s).\n" +
        "Select folder to search for replacements:"
    );

    if (!searchFolder) return;

    app.beginUndoGroup("Relink Missing");
    try {
        var relinked = 0;
        var stillMissing = [];

        // Build lookup of files in search folder
        var folderFiles = buildFileLookup(searchFolder);

        for (var j = 0; j < missingItems.length; j++) {
            var item = missingItems[j];
            var missingPath = item.mainSource.missingFootagePath;
            var missingName = getFileName(missingPath);

            // Try to find file in lookup
            var found = folderFiles[missingName.toLowerCase()];

            if (found) {
                item.replace(found);
                relinked++;
            } else {
                stillMissing.push(missingName);
            }
        }

        var message = "Relinked " + relinked + " of " + missingItems.length + " missing item(s).";

        if (stillMissing.length > 0) {
            message += "\n\nStill missing (" + stillMissing.length + "):\n";
            for (var k = 0; k < Math.min(stillMissing.length, 10); k++) {
                message += "- " + stillMissing[k] + "\n";
            }
        }

        alert(message);

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function getFileName(path) {
        var parts = path.split(/[\/\\]/);
        return parts[parts.length - 1];
    }

    function buildFileLookup(folder) {
        var lookup = {};
        var files = folder.getFiles();

        for (var f = 0; f < files.length; f++) {
            if (files[f] instanceof File) {
                lookup[files[f].name.toLowerCase()] = files[f];
            } else if (files[f] instanceof Folder) {
                // Recursively search subfolders
                var subLookup = buildFileLookup(files[f]);
                for (var key in subLookup) {
                    if (!lookup[key]) {
                        lookup[key] = subLookup[key];
                    }
                }
            }
        }

        return lookup;
    }

})();
```

### 5. List All Footage

Generate a list of all footage items in the project.

```javascript
#target aftereffects

(function() {
    var footage = [];

    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FootageItem) {
            var info = {
                name: item.name,
                path: "",
                missing: false,
                usedIn: []
            };

            if (item.mainSource instanceof FileSource) {
                if (item.mainSource.missingFootagePath !== "") {
                    info.path = item.mainSource.missingFootagePath;
                    info.missing = true;
                } else {
                    info.path = item.file ? item.file.fsName : "Unknown";
                }
            }

            // Find usage
            for (var j = 1; j <= app.project.numItems; j++) {
                var comp = app.project.item(j);
                if (comp instanceof CompItem) {
                    for (var k = 1; k <= comp.numLayers; k++) {
                        if (comp.layer(k).source === item) {
                            info.usedIn.push(comp.name);
                            break;
                        }
                    }
                }
            }

            footage.push(info);
        }
    }

    // Generate report
    var report = "FOOTAGE REPORT\n";
    report += "==============\n";
    report += "Total items: " + footage.length + "\n\n";

    var missingCount = 0;
    var unusedCount = 0;

    for (var m = 0; m < footage.length; m++) {
        var f = footage[m];
        report += f.name;
        if (f.missing) {
            report += " [MISSING]";
            missingCount++;
        }
        if (f.usedIn.length === 0) {
            report += " [UNUSED]";
            unusedCount++;
        }
        report += "\n";
        report += "  Path: " + f.path + "\n";
        if (f.usedIn.length > 0) {
            report += "  Used in: " + f.usedIn.join(", ") + "\n";
        }
        report += "\n";
    }

    report += "Summary:\n";
    report += "- Missing: " + missingCount + "\n";
    report += "- Unused: " + unusedCount + "\n";

    // Save or display
    var saveFile = File.saveDialog("Save footage report", "*.txt");
    if (saveFile) {
        saveFile.open("w");
        saveFile.write(report);
        saveFile.close();
        alert("Report saved to: " + saveFile.fsName);
    } else {
        alert(report);
    }

})();
```

### 6. Remove Unused Footage

Remove footage items that aren't used in any composition.

```javascript
#target aftereffects

(function() {
    var unusedItems = [];

    // Find all unused footage
    for (var i = 1; i <= app.project.numItems; i++) {
        var item = app.project.item(i);
        if (item instanceof FootageItem) {
            if (item.usedIn.length === 0) {
                unusedItems.push(item);
            }
        }
    }

    if (unusedItems.length === 0) {
        alert("No unused footage found.");
        return;
    }

    var confirm = prompt(
        "Found " + unusedItems.length + " unused footage item(s).\n" +
        "Type 'delete' to remove them:",
        ""
    );

    if (confirm !== "delete") {
        alert("Cancelled.");
        return;
    }

    app.beginUndoGroup("Remove Unused Footage");
    try {
        // Remove in reverse order to avoid index issues
        for (var j = unusedItems.length - 1; j >= 0; j--) {
            unusedItems[j].remove();
        }
        alert("Removed " + unusedItems.length + " unused footage item(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 7. Collect Files

Copy all used footage to a new folder (project consolidation).

```javascript
#target aftereffects

(function() {
    var destFolder = Folder.selectDialog("Select destination folder for collected files");
    if (!destFolder) return;

    app.beginUndoGroup("Collect Files");
    try {
        var collected = 0;
        var failed = [];

        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);

            if (item instanceof FootageItem && item.file) {
                var sourceFile = item.file;

                if (sourceFile.exists) {
                    var destFile = new File(destFolder.fsName + "/" + sourceFile.name);

                    // Copy file
                    if (sourceFile.copy(destFile)) {
                        // Update footage reference
                        item.replace(destFile);
                        collected++;
                    } else {
                        failed.push(sourceFile.name);
                    }
                }
            }
        }

        var message = "Collected " + collected + " file(s) to:\n" + destFolder.fsName;

        if (failed.length > 0) {
            message += "\n\nFailed to copy (" + failed.length + "):\n";
            for (var j = 0; j < Math.min(failed.length, 10); j++) {
                message += "- " + failed[j] + "\n";
            }
        }

        alert(message);

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Usage

When the user invokes `/ae-footage`, ask what they want to do:

1. Batch import footage
2. Replace single footage item
3. Replace footage by pattern
4. Relink missing footage
5. List all footage (generate report)
6. Remove unused footage
7. Collect files (consolidate project)

## Example Requests

- "Import all footage from a folder"
- "Replace this footage with a new version"
- "Find and relink all missing files"
- "Generate a report of all footage in my project"
- "Remove unused footage from my project"
- "Collect all project files to a new folder"
