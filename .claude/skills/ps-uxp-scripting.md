---
name: ps-uxp-scripting
description: "Photoshop UXP scripting with .psjs files: standalone scripts, execution methods, module access, dialogs, and differences from plugins. Available in Photoshop v23.5+."
---

# UXP Scripting (.psjs Files)

UXP Scripting allows running standalone JavaScript files in Photoshop without creating a full plugin. Available since Photoshop v23.5.

## Overview

| Feature | UXP Scripts (.psjs) | UXP Plugins |
|---------|---------------------|-------------|
| File format | Single `.psjs` file | Folder with manifest.json |
| Execution | Run on demand | Persistent |
| Modal context | Automatic | Requires executeAsModal |
| UI | Dialogs only | Panels and dialogs |
| Storage | No localStorage | Full storage access |
| Permissions | Managed by Photoshop | Defined in manifest |
| Setup | None | Manifest configuration |

## File Extension

UXP scripts use the **`.psjs`** file extension (Photoshop JavaScript).

```javascript
// my-script.psjs
const { app } = require('photoshop');

// Script code runs in automatic modal context
const doc = app.activeDocument;
if (doc) {
    doc.activeLayer.name = "Processed";
}
```

## Running Scripts

### Method 1: File Menu
```
File > Scripts > Browse...
```
Select any `.psjs` file from the dialog.

### Method 2: Double-Click
Double-click any `.psjs` file in your file explorer to run it in Photoshop.

### Method 3: Drag and Drop
- **Mac**: Drag `.psjs` file onto Photoshop icon in Dock
- **Mac/Windows**: Drop file onto any part of Photoshop window (not on an open document)

### Method 4: UXP Developer Tool (Debugging)
1. Install UXP Developer Tool (UDT) from Adobe Creative Cloud
2. Enable Development Mode in Photoshop: Preferences > Plugins > Enable Developer Mode
3. Use UDT to load and debug scripts with breakpoints and console

## Automatic Modal Context

Unlike plugins, scripts run in an **automatic modal execution context**. This means:

- No need to wrap code in `executeAsModal()`
- Document modifications work directly
- Progress bar appears automatically after 2-3 seconds
- User can cancel with Escape key

```javascript
// In a SCRIPT (.psjs) - modal context is automatic
const { app } = require('photoshop');

const doc = app.activeDocument;
// Direct modification works!
await doc.activeLayer.rotate(45);
await doc.resizeImage(1920, 1080);
```

```javascript
// In a PLUGIN - must use executeAsModal
const { app, core } = require('photoshop');

// This is required in plugins, not scripts
await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    await doc.activeLayer.rotate(45);
}, { commandName: "Rotate" });
```

## Available Modules

Scripts have access to a subset of UXP modules:

```javascript
// Photoshop API (full access)
const { app, core, action, constants } = require('photoshop');
const imaging = require('photoshop').imaging;

// UXP modules (limited)
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Node-style fs (limited functionality)
const fsNode = require('fs');

// Shell module (requires UXP Manifest v5 features)
const { shell } = require('uxp');
```

### Module Limitations in Scripts

| Module | Available | Notes |
|--------|-----------|-------|
| `photoshop` | Yes | Full API access |
| `uxp.storage` | Yes | File dialogs work |
| `fs` | Yes | Limited functionality |
| `uxp.shell` | Partial | Some features |
| `localStorage` | **No** | Plugins only |
| `getDataFolder()` | **No** | Plugins only |

## File System Access

Scripts can access the file system through user dialogs:

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Open file dialog
const file = await fs.getFileForOpening({
    types: ["psd", "jpg", "png"]
});

if (file) {
    const content = await file.read({ format: storage.formats.binary });
    console.log("File size:", content.byteLength);
}

// Save file dialog
const saveFile = await fs.getFileForSaving("output.png", {
    types: ["png"]
});

if (saveFile) {
    await saveFile.write(binaryData, { format: storage.formats.binary });
}

// Folder selection
const folder = await fs.getFolder();
if (folder) {
    const entries = await folder.getEntries();
    for (const entry of entries) {
        console.log(entry.name);
    }
}
```

## Dialogs in Scripts

Scripts can show dialogs but **cannot create persistent panels**.

### Simple Alert

```javascript
const { app } = require('photoshop');
await app.showAlert("Operation complete!");
```

### Custom Dialog with DOM Elements

```javascript
async function showInputDialog() {
    const dialog = document.createElement("dialog");

    const form = document.createElement("form");
    form.style.padding = "20px";

    const label = document.createElement("sp-label");
    label.textContent = "Enter layer name:";

    const input = document.createElement("sp-textfield");
    input.id = "layerName";
    input.value = "New Layer";

    const buttonGroup = document.createElement("div");
    buttonGroup.style.marginTop = "16px";
    buttonGroup.style.display = "flex";
    buttonGroup.style.gap = "8px";

    const cancelBtn = document.createElement("sp-button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.setAttribute("variant", "secondary");
    cancelBtn.onclick = () => dialog.close("cancel");

    const okBtn = document.createElement("sp-button");
    okBtn.textContent = "OK";
    okBtn.setAttribute("variant", "cta");
    okBtn.onclick = () => dialog.close("ok");

    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(okBtn);

    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(buttonGroup);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    const result = await dialog.showModal();
    const value = input.value;

    dialog.remove();

    return result === "ok" ? value : null;
}

// Usage
const layerName = await showInputDialog();
if (layerName) {
    app.activeDocument.activeLayer.name = layerName;
}
```

### Using Spectrum Web Components

Scripts support Adobe's Spectrum Web Components for consistent UI:

```javascript
// Available components: sp-button, sp-textfield, sp-checkbox,
// sp-dropdown, sp-slider, sp-label, sp-divider, etc.

const checkbox = document.createElement("sp-checkbox");
checkbox.textContent = "Apply to all layers";
checkbox.checked = false;
```

## Script Limitations

1. **No Persistent Storage**: Cannot use `localStorage` or plugin data folders
2. **No Panels**: Can only show transient dialogs
3. **No Inter-Script Communication**: Cannot call other scripts
4. **Single Execution**: Script ends when code completes
5. **Limited Module Access**: Some UXP modules unavailable
6. **No Event Listeners**: Cannot persistently monitor Photoshop events

## Complete Script Example

```javascript
// batch-resize.psjs - Resize all open documents
const { app, constants } = require('photoshop');
const { storage } = require('uxp');

async function batchResize() {
    const docs = app.documents;

    if (docs.length === 0) {
        await app.showAlert("No documents open!");
        return;
    }

    // Get output folder
    const outputFolder = await storage.localFileSystem.getFolder();
    if (!outputFolder) {
        return; // User cancelled
    }

    const targetWidth = 1920;
    let processed = 0;

    for (const doc of docs) {
        try {
            // Make this document active
            await app.activeDocument = doc;

            // Calculate new height maintaining aspect ratio
            const ratio = doc.height / doc.width;
            const newHeight = Math.round(targetWidth * ratio);

            // Resize
            await doc.resizeImage(
                targetWidth,
                newHeight,
                doc.resolution,
                constants.ResampleMethod.BICUBICSHARPER
            );

            // Save as JPEG
            const outputFile = await outputFolder.createFile(
                doc.name.replace(/\.[^.]+$/, '_resized.jpg'),
                { overwrite: true }
            );

            await require('photoshop').action.batchPlay([{
                _obj: "save",
                as: {
                    _obj: "JPEG",
                    quality: 10
                },
                in: {
                    _path: outputFile.nativePath,
                    _kind: "local"
                },
                copy: true
            }], {});

            processed++;

        } catch (e) {
            console.error(`Error processing ${doc.name}:`, e);
        }
    }

    await app.showAlert(`Resized ${processed} of ${docs.length} documents!`);
}

// Run the script
batchResize();
```

## Debugging Scripts

### Using Console

```javascript
console.log("Debug message");
console.warn("Warning message");
console.error("Error message");

// View in UXP Developer Tool console
```

### Using UXP Developer Tool

1. Open UXP Developer Tool
2. Connect to Photoshop
3. Load your `.psjs` script
4. Set breakpoints
5. Click "Run" to execute with debugging

### Error Handling

```javascript
try {
    const doc = app.activeDocument;
    if (!doc) {
        throw new Error("No document open");
    }

    await doc.activeLayer.rotate(45);

} catch (e) {
    console.error("Script error:", e.message);
    await app.showAlert(`Error: ${e.message}`);
}
```

## When to Use Scripts vs Plugins

**Use Scripts (.psjs) when:**
- Running one-off automation tasks
- Batch processing files
- Quick prototyping
- No persistent UI needed
- No settings to save between runs

**Use Plugins when:**
- Building a tool with persistent UI panel
- Need to save user preferences
- Monitoring Photoshop events continuously
- Complex multi-step workflows with state
- Distributing to other users

## Converting Script to Plugin

To convert a working script into a plugin:

1. Create a folder structure:
   ```
   my-plugin/
   ├── manifest.json
   ├── index.html
   └── index.js
   ```

2. Create manifest.json:
   ```json
   {
     "manifestVersion": 5,
     "id": "com.example.myplugin",
     "name": "My Plugin",
     "version": "1.0.0",
     "main": "index.html",
     "host": {
       "app": "PS",
       "minVersion": "23.5.0"
     }
   }
   ```

3. Move script code to `index.js` and wrap modifications in `executeAsModal()`

4. Add UI in `index.html` if needed
