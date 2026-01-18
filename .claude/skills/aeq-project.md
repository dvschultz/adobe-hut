---
name: aeq-project
description: AEQuery project management utilities for folders, imports, and selections
---

# AEQuery Project Management

AEQuery provides utilities for managing After Effects projects including folders, imports, and selections.

## aeq.project Namespace

### Folder Operations

#### aeq.project.findFolder(name)

Finds a folder by name:

```javascript
var folder = aeq.project.findFolder('Assets');

if (folder) {
    $.writeln('Found folder: ' + folder.name);
} else {
    $.writeln('Folder not found');
}
```

#### aeq.project.getFolder(id)

Gets a folder by item ID:

```javascript
var folder = aeq.project.getFolder(123);

if (folder) {
    $.writeln('Folder: ' + folder.name);
}
```

#### aeq.project.getOrCreateFolder(name)

Gets an existing folder or creates it:

```javascript
// Get or create in project root
var folder = aeq.project.getOrCreateFolder('Renders');

// Always returns a FolderItem
$.writeln('Using folder: ' + folder.name);
```

#### aeq.project.getFolders()

Gets all folders in the project:

```javascript
var folders = aeq.project.getFolders();  // Returns aeq.arrayEx

folders.forEach(function(folder) {
    $.writeln('Folder: ' + folder.name);
});
```

### Import Operations

#### aeq.project.importFile(path)

Imports a single file:

```javascript
var footage = aeq.project.importFile('/path/to/video.mov');

if (footage) {
    $.writeln('Imported: ' + footage.name);

    // Add to composition
    var comp = aeq.getActiveComp();
    if (comp) {
        comp.layers.add(footage);
    }
}
```

#### aeq.project.importFiles(paths)

Imports multiple files:

```javascript
var files = [
    '/path/to/video1.mov',
    '/path/to/video2.mov',
    '/path/to/image.png'
];

var imported = aeq.project.importFiles(files);  // Returns aeq.arrayEx

$.writeln('Imported ' + imported.length + ' files');

imported.forEach(function(item) {
    $.writeln('  - ' + item.name);
});
```

#### aeq.project.importSequence(path)

Imports an image sequence:

```javascript
// Path to first frame
var sequence = aeq.project.importSequence('/path/to/frames/frame_0001.png');

if (sequence) {
    $.writeln('Imported sequence: ' + sequence.name);
    $.writeln('Duration: ' + sequence.duration + 's');
}
```

#### aeq.project.simpleImportFile(path)

Simplified import that auto-detects file type:

```javascript
var item = aeq.project.simpleImportFile('/path/to/file.psd');

// Handles:
// - Regular footage
// - PSD/AI files
// - Sequences (if filename has frame numbers)
```

### Selection Operations

#### aeq.project.getSelectedComps()

Gets selected compositions:

```javascript
var comps = aeq.project.getSelectedComps();  // Returns aeq.arrayEx

if (comps.length === 0) {
    alert('No compositions selected');
    return;
}

comps.forEach(function(comp) {
    $.writeln('Selected comp: ' + comp.name);
});
```

#### aeq.project.getSelectedFolders()

Gets selected folders:

```javascript
var folders = aeq.project.getSelectedFolders();  // Returns aeq.arrayEx

folders.forEach(function(folder) {
    $.writeln('Selected folder: ' + folder.name);
});
```

#### aeq.project.getSelectedFootage()

Gets selected footage items:

```javascript
var footage = aeq.project.getSelectedFootage();  // Returns aeq.arrayEx

footage.forEach(function(item) {
    $.writeln('Selected footage: ' + item.name);
    $.writeln('  Path: ' + (item.file ? item.file.fsName : 'No file'));
});
```

### Organization Operations

#### aeq.project.moveToFolder(item, folder)

Moves an item to a folder:

```javascript
var footage = aeq.project.importFile('/path/to/video.mov');
var folder = aeq.project.getOrCreateFolder('Imported');

aeq.project.moveToFolder(footage, folder);
```

### Save Operations

#### aeq.project.save()

Saves the project:

```javascript
aeq.project.save();
$.writeln('Project saved');
```

#### aeq.project.quickSave()

Saves with timestamp (incremental save):

```javascript
aeq.project.quickSave();
// Saves as "projectName_YYYYMMDD_HHMMSS.aep"
```

### Cleanup Operations

#### aeq.project.reduceToQueuedComps()

Removes unused items, keeping only queued compositions and their dependencies:

```javascript
// Warning: This removes items from the project!
aeq.project.reduceToQueuedComps();
$.writeln('Project reduced to queued compositions');
```

## Practical Examples

### Organized Import Workflow

```javascript
#include 'aequery.js'

(function() {
    // Select files to import
    var files = aeq.file.selectFiles({
        prompt: 'Select footage to import',
        filter: '*.{mov,mp4,png,jpg,psd}'
    });

    if (!files || files.length === 0) {
        return;
    }

    aeq.createUndoGroup('Import and Organize', function() {
        // Create or get folders
        var videoFolder = aeq.project.getOrCreateFolder('Video');
        var imageFolder = aeq.project.getOrCreateFolder('Images');
        var psdFolder = aeq.project.getOrCreateFolder('PSDs');

        files.forEach(function(file) {
            var item = aeq.project.simpleImportFile(file.fsName);
            if (!item) return;

            // Organize by type
            var ext = file.name.split('.').pop().toLowerCase();

            if (ext === 'mov' || ext === 'mp4') {
                aeq.project.moveToFolder(item, videoFolder);
            } else if (ext === 'psd') {
                aeq.project.moveToFolder(item, psdFolder);
            } else {
                aeq.project.moveToFolder(item, imageFolder);
            }
        });
    });

    alert('Imported ' + files.length + ' files');
})();
```

### Batch Add Selected Footage to Comp

```javascript
#include 'aequery.js'

aeq.createUndoGroup('Add Footage to Comp', function() {
    var comp = aeq.getActiveComp();
    if (!comp) {
        alert('Please select a composition');
        return;
    }

    var footage = aeq.project.getSelectedFootage();
    if (footage.length === 0) {
        alert('Please select footage items in the project panel');
        return;
    }

    footage.forEach(function(item) {
        comp.layers.add(item);
    });

    alert('Added ' + footage.length + ' items to ' + comp.name);
});
```

### Process All Compositions

```javascript
#include 'aequery.js'

// Get all compositions via selector
var allComps = aeq('comp');

$.writeln('Found ' + allComps.length + ' compositions');

allComps.forEach(function(comp) {
    $.writeln('Comp: ' + comp.name);
    $.writeln('  Size: ' + comp.width + 'x' + comp.height);
    $.writeln('  Duration: ' + comp.duration + 's');
    $.writeln('  Layers: ' + comp.numLayers);
    $.writeln('');
});
```

### Find Unused Footage

```javascript
#include 'aequery.js'

(function() {
    var unusedItems = [];

    // Check all footage items
    aeq.forEachItem(function(item) {
        if (item instanceof FootageItem) {
            if (item.usedIn.length === 0) {
                unusedItems.push(item);
            }
        }
    });

    if (unusedItems.length === 0) {
        alert('No unused footage found');
        return;
    }

    // Report unused items
    var report = 'Unused footage (' + unusedItems.length + ' items):\n\n';
    unusedItems.forEach(function(item) {
        report += '- ' + item.name + '\n';
    });

    // Option to delete
    var dialog = aeq.ui.createDialog('Unused Footage');
    dialog.addStaticText(report);

    var buttons = dialog.addGroup();
    buttons.addButton('Delete All', function() {
        aeq.createUndoGroup('Delete Unused', function() {
            unusedItems.forEach(function(item) {
                item.remove();
            });
        });
        alert('Deleted ' + unusedItems.length + ' items');
        dialog.close();
    });
    buttons.addButton('Cancel', function() {
        dialog.close();
    });

    dialog.show();
})();
```

### Collect Project Assets

```javascript
#include 'aequery.js'

(function() {
    var outputFolder = Folder.selectDialog('Select folder to collect assets');
    if (!outputFolder) return;

    var collected = 0;
    var errors = [];

    aeq.forEachItem(function(item) {
        if (item instanceof FootageItem && item.file) {
            var sourceFile = item.file;
            if (sourceFile.exists) {
                var destPath = aeq.file.joinPath(
                    outputFolder.fsName,
                    sourceFile.name
                );
                var destFile = new File(destPath);

                if (sourceFile.copy(destFile)) {
                    collected++;
                } else {
                    errors.push(item.name);
                }
            }
        }
    });

    var message = 'Collected ' + collected + ' files';
    if (errors.length > 0) {
        message += '\n\nFailed to copy:\n' + errors.join('\n');
    }
    alert(message);
})();
```

### Create Folder Structure

```javascript
#include 'aequery.js'

aeq.createUndoGroup('Create Folder Structure', function() {
    // Create standard folder structure
    var folders = [
        'Footage',
        'Footage/Video',
        'Footage/Audio',
        'Footage/Images',
        'Comps',
        'Comps/Main',
        'Comps/Precomps',
        'Assets',
        'Assets/Logos',
        'Assets/Graphics',
        'Solids',
        'Renders'
    ];

    folders.forEach(function(path) {
        var parts = path.split('/');
        var parent = app.project.rootFolder;

        parts.forEach(function(part) {
            var existing = null;

            // Look for existing folder
            for (var i = 1; i <= parent.numItems; i++) {
                var item = parent.item(i);
                if (item instanceof FolderItem && item.name === part) {
                    existing = item;
                    break;
                }
            }

            if (existing) {
                parent = existing;
            } else {
                var newFolder = parent.items.addFolder(part);
                parent = newFolder;
            }
        });
    });

    alert('Folder structure created');
});
```

### Replace Missing Footage

```javascript
#include 'aequery.js'

(function() {
    var missingItems = [];

    // Find missing footage
    aeq.forEachItem(function(item) {
        if (item instanceof FootageItem) {
            if (item.footageMissing) {
                missingItems.push(item);
            }
        }
    });

    if (missingItems.length === 0) {
        alert('No missing footage found');
        return;
    }

    // Show dialog
    var dialog = aeq.ui.createDialog('Missing Footage');
    dialog.addStaticText('Found ' + missingItems.length + ' missing items:');

    var list = dialog.addListBox([]);
    missingItems.forEach(function(item) {
        list.addItem(item.name);
    });

    var buttons = dialog.addGroup();
    buttons.addButton('Relink Selected', function() {
        var idx = list.selection ? list.selection.index : -1;
        if (idx === -1) {
            alert('Please select an item');
            return;
        }

        var item = missingItems[idx];
        var newFile = File.openDialog('Select replacement for: ' + item.name);
        if (newFile) {
            item.replace(newFile);
            list.removeItem(idx);
            missingItems.splice(idx, 1);

            if (missingItems.length === 0) {
                alert('All footage relinked');
                dialog.close();
            }
        }
    });
    buttons.addButton('Close', function() {
        dialog.close();
    });

    dialog.show();
})();
```

## aeq.renderqueue Namespace

### Queue Operations

#### aeq.renderqueue.queue(comp)

Adds a composition to the render queue:

```javascript
var comp = aeq.getActiveComp();
if (comp) {
    var rqItem = aeq.renderqueue.queue(comp);
    $.writeln('Added to render queue');
}
```

#### aeq.renderqueue.clear()

Clears the render queue:

```javascript
aeq.renderqueue.clear();
$.writeln('Render queue cleared');
```

#### aeq.renderqueue.getQueuedComps()

Gets compositions in the render queue:

```javascript
var comps = aeq.renderqueue.getQueuedComps();  // Returns aeq.arrayEx

comps.forEach(function(comp) {
    $.writeln('Queued: ' + comp.name);
});
```

#### aeq.renderqueue.getSettings(rqItem)

Gets render settings for a queue item:

```javascript
var rqItem = app.project.renderQueue.item(1);
var settings = aeq.renderqueue.getSettings(rqItem);

$.writeln('Settings: ' + JSON.stringify(settings));
```

### Render Queue Example

```javascript
#include 'aequery.js'

(function() {
    // Get selected compositions
    var comps = aeq.project.getSelectedComps();

    if (comps.length === 0) {
        alert('Please select compositions to render');
        return;
    }

    // Clear existing queue
    aeq.renderqueue.clear();

    // Add each comp to queue
    comps.forEach(function(comp) {
        var rqItem = aeq.renderqueue.queue(comp);

        // Set output path
        var outputPath = aeq.file.joinPath(
            Folder.desktop.fsName,
            comp.name + '.mov'
        );
        rqItem.outputModule(1).file = new File(outputPath);
    });

    alert('Added ' + comps.length + ' compositions to render queue');
})();
```
