---
name: ae-batch-export
description: "Batch render operations: add compositions to render queue, apply output module templates, set output paths, queue in Adobe Media Encoder."
---

# AE Batch Export

Automate render queue and export operations in After Effects.

## Available Operations

### 1. Add All Comps to Render Queue

Add all compositions in the project to the render queue.

```javascript
#target aftereffects

(function() {
    if (app.project.numItems === 0) {
        alert("Project is empty.");
        return;
    }

    // Configuration
    var skipNestedComps = true;  // Skip comps that are used in other comps
    var outputFolder = Folder.selectDialog("Select output folder");

    if (!outputFolder) {
        alert("No folder selected.");
        return;
    }

    app.beginUndoGroup("Add All Comps to Queue");
    try {
        var comps = [];
        var nestedComps = {};

        // First pass: identify nested comps
        if (skipNestedComps) {
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item instanceof CompItem) {
                    for (var j = 1; j <= item.numLayers; j++) {
                        var layer = item.layer(j);
                        if (layer.source instanceof CompItem) {
                            nestedComps[layer.source.id] = true;
                        }
                    }
                }
            }
        }

        // Second pass: collect non-nested comps
        for (var k = 1; k <= app.project.numItems; k++) {
            var item2 = app.project.item(k);
            if (item2 instanceof CompItem) {
                if (!skipNestedComps || !nestedComps[item2.id]) {
                    comps.push(item2);
                }
            }
        }

        if (comps.length === 0) {
            alert("No compositions found to render.");
            return;
        }

        // Add to render queue
        for (var m = 0; m < comps.length; m++) {
            var comp = comps[m];
            var rqItem = app.project.renderQueue.items.add(comp);

            // Set output file
            var outputFile = new File(outputFolder.fsName + "/" + comp.name + ".mov");
            rqItem.outputModule(1).file = outputFile;
        }

        alert("Added " + comps.length + " composition(s) to render queue.\n\n" +
              "Output folder: " + outputFolder.fsName);

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Add Selected Comps to Render Queue

```javascript
#target aftereffects

(function() {
    var selectedItems = app.project.selection;
    if (selectedItems.length === 0) {
        alert("Please select compositions in the Project panel.");
        return;
    }

    var outputFolder = Folder.selectDialog("Select output folder");
    if (!outputFolder) return;

    app.beginUndoGroup("Add Selected to Queue");
    try {
        var count = 0;
        for (var i = 0; i < selectedItems.length; i++) {
            var item = selectedItems[i];
            if (item instanceof CompItem) {
                var rqItem = app.project.renderQueue.items.add(item);
                rqItem.outputModule(1).file = new File(outputFolder.fsName + "/" + item.name + ".mov");
                count++;
            }
        }

        alert("Added " + count + " composition(s) to render queue.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Apply Output Module Template

Apply an output module template to all queued items.

```javascript
#target aftereffects

(function() {
    var rq = app.project.renderQueue;

    if (rq.numItems === 0) {
        alert("Render queue is empty.");
        return;
    }

    // Get available templates
    var templates = [];
    try {
        // Common template names (actual names depend on user's system)
        templates = [
            "Lossless",
            "Lossless with Alpha",
            "H.264",
            "ProRes 422",
            "ProRes 4444"
        ];
    } catch (e) {
        // Templates list not available via script
    }

    var templateName = prompt(
        "Enter output module template name:\n\n" +
        "Common templates:\n" +
        "- Lossless\n" +
        "- Lossless with Alpha\n" +
        "- H.264\n" +
        "(Must match exactly as shown in Output Module settings)",
        "Lossless"
    );

    if (!templateName) return;

    app.beginUndoGroup("Apply Output Template");
    try {
        var count = 0;
        for (var i = 1; i <= rq.numItems; i++) {
            var rqItem = rq.item(i);

            // Only apply to queued items
            if (rqItem.status === RQItemStatus.QUEUED) {
                try {
                    rqItem.outputModule(1).applyTemplate(templateName);
                    count++;
                } catch (e) {
                    alert("Template '" + templateName + "' not found.\n\n" +
                          "Check Edit > Templates > Output Module for available templates.");
                    return;
                }
            }
        }

        alert("Applied template '" + templateName + "' to " + count + " item(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 4. Set Output Paths with Pattern

Set output paths for all queued items using a naming pattern.

```javascript
#target aftereffects

(function() {
    var rq = app.project.renderQueue;

    if (rq.numItems === 0) {
        alert("Render queue is empty.");
        return;
    }

    var outputFolder = Folder.selectDialog("Select output folder");
    if (!outputFolder) return;

    var extension = prompt("File extension (without dot):", "mov");
    if (!extension) return;

    var prefix = prompt("Filename prefix (optional):", "");
    var suffix = prompt("Filename suffix (optional):", "");

    app.beginUndoGroup("Set Output Paths");
    try {
        var count = 0;
        for (var i = 1; i <= rq.numItems; i++) {
            var rqItem = rq.item(i);

            if (rqItem.status === RQItemStatus.QUEUED) {
                var compName = rqItem.comp.name;
                var fileName = prefix + compName + suffix + "." + extension;
                var outputFile = new File(outputFolder.fsName + "/" + fileName);

                rqItem.outputModule(1).file = outputFile;
                count++;
            }
        }

        alert("Set output paths for " + count + " item(s).\n" +
              "Output folder: " + outputFolder.fsName);
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Clear Render Queue

Remove all items from the render queue.

```javascript
#target aftereffects

(function() {
    var rq = app.project.renderQueue;

    if (rq.numItems === 0) {
        alert("Render queue is already empty.");
        return;
    }

    var confirm = prompt("Type 'yes' to clear " + rq.numItems + " item(s) from render queue:", "");

    if (confirm !== "yes") {
        alert("Cancelled.");
        return;
    }

    app.beginUndoGroup("Clear Render Queue");
    try {
        while (rq.numItems > 0) {
            rq.item(1).remove();
        }
        alert("Render queue cleared.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 6. Queue in Adobe Media Encoder

Add compositions to Adobe Media Encoder queue instead of AE's render queue.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var outputFolder = Folder.selectDialog("Select output folder");
    if (!outputFolder) return;

    app.beginUndoGroup("Queue in AME");
    try {
        // Add to render queue first
        var rqItem = app.project.renderQueue.items.add(comp);

        // Set output
        var outputFile = new File(outputFolder.fsName + "/" + comp.name + ".mp4");
        rqItem.outputModule(1).file = outputFile;

        // Queue to AME
        // Note: This requires the AME to be installed and configured
        app.project.renderQueue.queueInAME(true);

        alert("Queued '" + comp.name + "' in Adobe Media Encoder.\n\n" +
              "Note: AME should open with the composition in its queue.");

    } catch (e) {
        alert("Error: " + e.message + "\n\n" +
              "Make sure Adobe Media Encoder is installed.");
    }
    app.endUndoGroup();

})();
```

### 7. Render Current Queue

Start rendering all queued items.

```javascript
#target aftereffects

(function() {
    var rq = app.project.renderQueue;

    if (rq.numItems === 0) {
        alert("Render queue is empty.");
        return;
    }

    // Count queued items
    var queuedCount = 0;
    for (var i = 1; i <= rq.numItems; i++) {
        if (rq.item(i).status === RQItemStatus.QUEUED) {
            queuedCount++;
        }
    }

    if (queuedCount === 0) {
        alert("No items are queued for rendering.");
        return;
    }

    var confirm = prompt("Start rendering " + queuedCount + " item(s)?\nType 'yes' to begin:", "");

    if (confirm !== "yes") {
        alert("Cancelled.");
        return;
    }

    // Start render
    try {
        rq.render();
        alert("Rendering complete!");
    } catch (e) {
        alert("Render error: " + e.message);
    }

})();
```

## Output Module Template Reference

Common templates (names may vary by installation):

| Template | Use Case |
|----------|----------|
| Lossless | Highest quality, large files |
| Lossless with Alpha | Preserve transparency |
| H.264 | Web/general distribution |
| ProRes 422 | Professional editing (Mac) |
| ProRes 4444 | Professional with alpha (Mac) |
| PNG Sequence | Frame-by-frame output |
| TIFF Sequence | High quality frames |

## Usage

When the user invokes `/ae-batch-export`, ask what they want to do:

1. Add all comps to render queue
2. Add selected comps to render queue
3. Apply output module template
4. Set output paths
5. Clear render queue
6. Queue in Adobe Media Encoder
7. Start rendering

## Example Requests

- "Add all compositions to render queue as ProRes"
- "Export all comps to H.264 in a specific folder"
- "Clear the render queue"
- "Set up batch render for all my comps"
- "Queue this comp in Media Encoder"
