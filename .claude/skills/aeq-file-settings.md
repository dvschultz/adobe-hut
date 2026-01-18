---
name: aeq-file-settings
description: AEQuery file operations and persistent settings storage
---

# AEQuery File Operations & Settings

AEQuery provides utilities for file system operations and persistent settings storage.

## aeq.file Namespace

### Getting Files and Folders

#### aeq.file.getFile(path)

Gets a File object from a path:

```javascript
var file = aeq.file.getFile('/path/to/file.jsx');

if (file.exists) {
    $.writeln('File found: ' + file.name);
}
```

#### aeq.file.getFolder(path)

Gets a Folder object from a path:

```javascript
var folder = aeq.file.getFolder('/path/to/folder');

if (folder.exists) {
    $.writeln('Folder found: ' + folder.name);
}
```

#### aeq.file.getFiles(folder, filter)

Gets files in a folder (non-recursive):

```javascript
var folder = aeq.file.getFolder('/path/to/folder');

// Get all files
var allFiles = aeq.file.getFiles(folder);

// Get with filter (glob pattern)
var movFiles = aeq.file.getFiles(folder, '*.mov');
var psdFiles = aeq.file.getFiles(folder, '*.psd');
var images = aeq.file.getFiles(folder, '*.{png,jpg,jpeg}');

// Process files
allFiles.forEach(function(file) {
    $.writeln(file.name);
});
```

#### aeq.file.getFilesRecursive(folder, filter)

Gets files recursively (including subfolders):

```javascript
var folder = aeq.file.getFolder('/path/to/project');

// Get all files in all subfolders
var allFiles = aeq.file.getFilesRecursive(folder);

// Get all video files recursively
var videos = aeq.file.getFilesRecursive(folder, '*.{mov,mp4,avi}');

$.writeln('Found ' + videos.length + ' video files');
```

### File Selection Dialogs

#### aeq.file.selectFiles(options)

Opens a file selection dialog:

```javascript
// Basic file selection
var files = aeq.file.selectFiles();

// With options
var files = aeq.file.selectFiles({
    prompt: 'Select video files',
    filter: '*.mov'
});

// With multiple file types
var files = aeq.file.selectFiles({
    prompt: 'Select media files',
    filter: '*.{mov,mp4,png,jpg}'
});

if (files && files.length > 0) {
    files.forEach(function(file) {
        $.writeln('Selected: ' + file.fsName);
    });
}
```

### Path Utilities

#### aeq.file.joinPath(basePath, ...parts)

Joins path components:

```javascript
var path = aeq.file.joinPath('/Users', 'Documents', 'Projects', 'file.jsx');
// Result: /Users/Documents/Projects/file.jsx

var outputPath = aeq.file.joinPath(projectFolder, 'output', 'renders');
```

#### aeq.file.normalizePath(path)

Normalizes path separators:

```javascript
var normalized = aeq.file.normalizePath('path//to\\file.jsx');
// Result: path/to/file.jsx

// Handles mixed separators
var clean = aeq.file.normalizePath('C:\\Users\\name//Documents\\file.txt');
```

#### aeq.file.pathIsAbsolute(path)

Checks if path is absolute:

```javascript
var isAbs1 = aeq.file.pathIsAbsolute('/Users/Documents');  // true (Mac/Linux)
var isAbs2 = aeq.file.pathIsAbsolute('C:/Users');           // true (Windows)
var isAbs3 = aeq.file.pathIsAbsolute('relative/path');      // false
```

#### aeq.file.ensureFolderExists(path)

Creates folder if it doesn't exist:

```javascript
// Create output folder
aeq.file.ensureFolderExists('/path/to/output');

// Create nested folders
aeq.file.ensureFolderExists('/path/to/project/renders/final');
```

### Reading and Writing Files

#### aeq.readFile(path, encoding)

Reads file contents:

```javascript
// Read text file
var contents = aeq.readFile('/path/to/file.txt');

if (contents !== null) {
    $.writeln('File contents:');
    $.writeln(contents);
} else {
    $.writeln('Could not read file');
}

// Read with encoding
var utf8Contents = aeq.readFile('/path/to/file.txt', 'UTF-8');
```

#### aeq.writeFile(path, contents, options)

Writes contents to file:

```javascript
// Write text file
aeq.writeFile('/path/to/output.txt', 'Hello, World!');

// Write with encoding
aeq.writeFile('/path/to/output.txt', 'Content with encoding', {
    encoding: 'UTF-8'
});

// Write JSON
var data = {
    name: 'Project',
    layers: ['Layer 1', 'Layer 2']
};
aeq.writeFile('/path/to/data.json', JSON.stringify(data, null, 2));
```

### Practical Examples

#### Export Layer List to File

```javascript
var comp = aeq.getActiveComp();
if (!comp) return;

var lines = [];
lines.push('Layer List for: ' + comp.name);
lines.push('========================');

aeq('layer', comp).forEach(function(layer, index) {
    lines.push((index + 1) + '. ' + layer.name);
});

var outputPath = aeq.file.joinPath(
    Folder.desktop.fsName,
    'layer_list.txt'
);

aeq.writeFile(outputPath, lines.join('\n'));
alert('Exported to: ' + outputPath);
```

#### Batch Import Files

```javascript
var files = aeq.file.selectFiles({
    prompt: 'Select files to import',
    filter: '*.{mov,mp4,png,jpg}'
});

if (files && files.length > 0) {
    aeq.createUndoGroup('Batch Import', function() {
        files.forEach(function(file) {
            aeq.project.importFile(file.fsName);
        });
    });

    alert('Imported ' + files.length + ' files');
}
```

---

## aeq.settings Namespace

AEQuery provides persistent settings storage using After Effects' built-in settings system. Settings persist between sessions.

### Saving Settings

#### aeq.settings.save(sectionName, keyName, value)

Saves a setting:

```javascript
// Save string
aeq.settings.save('myScript', 'lastPath', '/path/to/folder');

// Save number
aeq.settings.save('myScript', 'blurAmount', 10);

// Save boolean (as string)
aeq.settings.save('myScript', 'autoSave', true);

// Save array (as string)
aeq.settings.save('myScript', 'recentFiles', ['file1.aep', 'file2.aep', 'file3.aep']);
```

### Getting Settings

#### aeq.settings.get(sectionName, keyName)

Gets a setting as string:

```javascript
var path = aeq.settings.get('myScript', 'lastPath');

if (path) {
    $.writeln('Last path: ' + path);
} else {
    $.writeln('No saved path');
}
```

#### aeq.settings.getAsBool(sectionName, keyName)

Gets a setting as boolean:

```javascript
var autoSave = aeq.settings.getAsBool('myScript', 'autoSave');

if (autoSave) {
    // Auto-save enabled
}
```

#### aeq.settings.getAsInt(sectionName, keyName)

Gets a setting as integer:

```javascript
var count = aeq.settings.getAsInt('myScript', 'count');
$.writeln('Count: ' + count);

// Returns 0 if not set or not a number
```

#### aeq.settings.getAsFloat(sectionName, keyName)

Gets a setting as float:

```javascript
var scale = aeq.settings.getAsFloat('myScript', 'scale');
$.writeln('Scale: ' + scale);

// Returns 0.0 if not set or not a number
```

#### aeq.settings.getAsArray(sectionName, keyName)

Gets a setting as array:

```javascript
var recentFiles = aeq.settings.getAsArray('myScript', 'recentFiles');

if (recentFiles && recentFiles.length > 0) {
    recentFiles.forEach(function(file) {
        $.writeln('Recent: ' + file);
    });
}
```

### Initializing Settings

#### aeq.settings.initSetting(sectionName, keyName, defaultValue)

Sets a default value only if the setting doesn't exist:

```javascript
// Initialize with defaults (only sets if not already saved)
aeq.settings.initSetting('myScript', 'blurAmount', 10);
aeq.settings.initSetting('myScript', 'autoSave', false);
aeq.settings.initSetting('myScript', 'quality', 'high');

// Now get values (will have defaults if never set)
var blur = aeq.settings.getAsInt('myScript', 'blurAmount');
```

### Practical Examples

#### Remember Last Used Path

```javascript
#include 'aequery.js'

(function() {
    // Get last used path or default to desktop
    var lastPath = aeq.settings.get('myScript', 'lastPath');
    if (!lastPath) {
        lastPath = Folder.desktop.fsName;
    }

    // Show folder dialog
    var folder = Folder(lastPath).selectDlg('Select output folder');
    if (!folder) return;

    // Save the path for next time
    aeq.settings.save('myScript', 'lastPath', folder.fsName);

    // Continue with processing...
    $.writeln('Processing to: ' + folder.fsName);
})();
```

#### Save/Restore Dialog Settings

```javascript
#include 'aequery.js'

(function() {
    // Initialize defaults
    aeq.settings.initSetting('batchProcessor', 'prefix', 'Layer_');
    aeq.settings.initSetting('batchProcessor', 'opacity', 100);
    aeq.settings.initSetting('batchProcessor', 'selectedOnly', true);

    // Create dialog
    var dialog = aeq.ui.createDialog('Batch Processor');

    // Restore saved settings
    var prefixInput = dialog.addEditText(
        aeq.settings.get('batchProcessor', 'prefix')
    );

    var opacitySlider = dialog.addSlider(
        aeq.settings.getAsInt('batchProcessor', 'opacity'),
        0, 100
    );

    var selectedOnly = dialog.addCheckbox(
        'Selected layers only',
        aeq.settings.getAsBool('batchProcessor', 'selectedOnly')
    );

    // Buttons
    var buttons = dialog.addGroup();
    buttons.addButton('Process', function() {
        // Save settings
        aeq.settings.save('batchProcessor', 'prefix', prefixInput.text);
        aeq.settings.save('batchProcessor', 'opacity', opacitySlider.value);
        aeq.settings.save('batchProcessor', 'selectedOnly', selectedOnly.getValue());

        // Process
        processLayers();
        dialog.close();
    });
    buttons.addButton('Cancel', function() {
        dialog.close();
    });

    dialog.show();

    function processLayers() {
        // Use the saved values
        var prefix = aeq.settings.get('batchProcessor', 'prefix');
        var opacity = aeq.settings.getAsInt('batchProcessor', 'opacity');
        // ...
    }
})();
```

#### Recent Files List

```javascript
#include 'aequery.js'

// Load recent files
function getRecentFiles() {
    return aeq.settings.getAsArray('myScript', 'recentFiles') || [];
}

// Add to recent files
function addRecentFile(filePath) {
    var recent = getRecentFiles();

    // Remove if already exists
    var index = recent.indexOf(filePath);
    if (index !== -1) {
        recent.splice(index, 1);
    }

    // Add to beginning
    recent.unshift(filePath);

    // Keep only last 10
    if (recent.length > 10) {
        recent = recent.slice(0, 10);
    }

    // Save
    aeq.settings.save('myScript', 'recentFiles', recent);
}

// Clear recent files
function clearRecentFiles() {
    aeq.settings.save('myScript', 'recentFiles', []);
}

// Usage
addRecentFile('/path/to/project1.aep');
addRecentFile('/path/to/project2.aep');

var recent = getRecentFiles();
$.writeln('Recent files:');
recent.forEach(function(file, index) {
    $.writeln((index + 1) + '. ' + file);
});
```

#### Export/Import Settings

```javascript
#include 'aequery.js'

// Export settings to JSON
function exportSettings() {
    var settings = {
        prefix: aeq.settings.get('myScript', 'prefix'),
        opacity: aeq.settings.getAsInt('myScript', 'opacity'),
        autoSave: aeq.settings.getAsBool('myScript', 'autoSave'),
        recentFiles: aeq.settings.getAsArray('myScript', 'recentFiles')
    };

    var file = File.saveDialog('Export settings', '*.json');
    if (file) {
        aeq.writeFile(file.fsName, JSON.stringify(settings, null, 2));
        alert('Settings exported');
    }
}

// Import settings from JSON
function importSettings() {
    var file = File.openDialog('Import settings', '*.json');
    if (file) {
        var contents = aeq.readFile(file.fsName);
        if (contents) {
            var settings = JSON.parse(contents);

            aeq.settings.save('myScript', 'prefix', settings.prefix);
            aeq.settings.save('myScript', 'opacity', settings.opacity);
            aeq.settings.save('myScript', 'autoSave', settings.autoSave);
            aeq.settings.save('myScript', 'recentFiles', settings.recentFiles);

            alert('Settings imported');
        }
    }
}
```

## Section Name Best Practices

1. **Use unique section names** - Include your script/company name to avoid conflicts
2. **Be consistent** - Use the same section name throughout your script
3. **Group related settings** - Use the same section for related functionality

```javascript
// Good: Unique, descriptive section names
aeq.settings.save('myCompany_layerProcessor', 'setting1', value);
aeq.settings.save('myCompany_layerProcessor', 'setting2', value);

// Bad: Generic names that might conflict
aeq.settings.save('settings', 'value', value);  // Too generic
```
