---
name: ps-uxp-reference
description: "Photoshop UXP quick reference: module imports, constants, version requirements, common patterns, and error codes."
---

# UXP Quick Reference

Fast lookup for Photoshop UXP development.

## Module Imports

```javascript
// Photoshop modules
const { app, core, action, constants } = require('photoshop');

// Imaging API
const imaging = require('photoshop').imaging;

// UXP Storage
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Node-style fs (limited)
const fsNode = require('fs');
```

## Constants Cheat Sheet

### BlendMode

```javascript
const { BlendMode } = constants;

// Normal
BlendMode.NORMAL
BlendMode.DISSOLVE

// Darken
BlendMode.DARKEN
BlendMode.MULTIPLY
BlendMode.COLORBURN
BlendMode.LINEARBURN
BlendMode.DARKERCOLOR

// Lighten
BlendMode.LIGHTEN
BlendMode.SCREEN
BlendMode.COLORDODGE
BlendMode.LINEARDODGE
BlendMode.LIGHTERCOLOR

// Contrast
BlendMode.OVERLAY
BlendMode.SOFTLIGHT
BlendMode.HARDLIGHT
BlendMode.VIVIDLIGHT
BlendMode.LINEARLIGHT
BlendMode.PINLIGHT
BlendMode.HARDMIX

// Inversion
BlendMode.DIFFERENCE
BlendMode.EXCLUSION
BlendMode.SUBTRACT
BlendMode.DIVIDE

// Component
BlendMode.HUE
BlendMode.SATURATION
BlendMode.COLOR
BlendMode.LUMINOSITY
```

### LayerKind

```javascript
const { LayerKind } = constants;

// Basic
LayerKind.NORMAL              // Pixel layer
LayerKind.TEXT                // Text layer
LayerKind.SMARTOBJECT         // Smart object
LayerKind.GROUP               // Layer group

// Fill layers
LayerKind.SOLIDFILL
LayerKind.GRADIENTFILL
LayerKind.PATTERNFILL

// Adjustment layers
LayerKind.LEVELS
LayerKind.CURVES
LayerKind.BRIGHTNESSCONTRAST
LayerKind.COLORBALANCE
LayerKind.HUESATURATION
LayerKind.SELECTIVECOLOR
LayerKind.CHANNELMIXER
LayerKind.GRADIENTMAP
LayerKind.PHOTOFILTER
LayerKind.EXPOSURE
LayerKind.INVERSION
LayerKind.POSTERIZE
LayerKind.THRESHOLD
LayerKind.BLACKANDWHITE
LayerKind.VIBRANCE
LayerKind.COLORLOOKUP

// Other
LayerKind.SHAPELAYER
LayerKind.VIDEO
LayerKind.LAYER3D
```

### AnchorPosition

```javascript
const { AnchorPosition } = constants;

AnchorPosition.TOPLEFT
AnchorPosition.TOPCENTER
AnchorPosition.TOPRIGHT
AnchorPosition.MIDDLELEFT
AnchorPosition.MIDDLECENTER
AnchorPosition.MIDDLERIGHT
AnchorPosition.BOTTOMLEFT
AnchorPosition.BOTTOMCENTER
AnchorPosition.BOTTOMRIGHT
```

### SelectionType

```javascript
const { SelectionType } = constants;

SelectionType.REPLACE       // New selection
SelectionType.EXTEND        // Add (Shift)
SelectionType.DIMINISH      // Subtract (Alt)
SelectionType.INTERSECT     // Intersect (Shift+Alt)
```

### ResampleMethod

```javascript
const { ResampleMethod } = constants;

ResampleMethod.NONE              // No resampling
ResampleMethod.NEARESTNEIGHBOR   // Fastest, blocky
ResampleMethod.BILINEAR          // Medium quality
ResampleMethod.BICUBIC           // High quality
ResampleMethod.BICUBICSMOOTHER   // Best for enlargement
ResampleMethod.BICUBICSHARPER    // Best for reduction
ResampleMethod.PRESERVEDETAILS   // AI-enhanced
ResampleMethod.DEEPUPSCALE       // Neural (v24.0+)
```

### SaveOptions

```javascript
const { SaveOptions } = constants;

SaveOptions.DONOTSAVECHANGES
SaveOptions.SAVECHANGES
SaveOptions.PROMPTTOSAVECHANGES
```

### DocumentMode

```javascript
const { DocumentMode } = constants;

DocumentMode.BITMAP
DocumentMode.GRAYSCALE
DocumentMode.INDEXEDCOLOR
DocumentMode.RGB
DocumentMode.CMYK
DocumentMode.LAB
DocumentMode.MULTICHANNEL
DocumentMode.DUOTONE
```

### ElementPlacement

```javascript
const { ElementPlacement } = constants;

ElementPlacement.PLACEBEFORE
ElementPlacement.PLACEAFTER
ElementPlacement.PLACEATBEGINNING
ElementPlacement.PLACEATEND
ElementPlacement.PLACEINSIDE
```

## Common Patterns

### Minimal Operation Template

```javascript
const { app, core } = require('photoshop');

await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    // Do work...
}, { commandName: "My Operation" });
```

### Full Template with History Suspension

```javascript
const { app, core } = require('photoshop');

async function myOperation() {
    const doc = app.activeDocument;
    if (!doc) {
        await app.showAlert("No document open");
        return;
    }

    await core.executeAsModal(async (executionContext) => {
        const hostControl = executionContext.hostControl;

        const suspensionID = await hostControl.suspendHistory({
            documentID: doc.id,
            name: "My Operation"
        });

        try {
            // All work here = single undo
        } finally {
            await hostControl.resumeHistory(suspensionID);
        }
    }, { commandName: "My Operation" });
}
```

### Iterate All Layers (Recursive)

```javascript
function forEachLayer(layers, callback) {
    for (const layer of layers) {
        callback(layer);
        if (layer.kind === constants.LayerKind.GROUP) {
            forEachLayer(layer.layers, callback);
        }
    }
}

forEachLayer(doc.layers, (layer) => {
    console.log(layer.name);
});
```

### Find Layer by ID

```javascript
function findLayerById(layers, id) {
    for (const layer of layers) {
        if (layer.id === id) return layer;
        if (layer.kind === constants.LayerKind.GROUP) {
            const found = findLayerById(layer.layers, id);
            if (found) return found;
        }
    }
    return null;
}
```

### File Save/Load

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Save JSON
const dataFolder = await fs.getDataFolder();
const file = await dataFolder.createFile("data.json", { overwrite: true });
await file.write(JSON.stringify(data), { format: storage.formats.utf8 });

// Load JSON
const file = await dataFolder.getEntry("data.json");
const data = JSON.parse(await file.read());
```

### User File Dialog

```javascript
// Open
const file = await fs.getFileForOpening({ types: ["psd", "jpg", "png"] });
if (file) { /* ... */ }

// Save
const file = await fs.getFileForSaving("output.png", { types: ["png"] });
if (file) { /* ... */ }

// Folder
const folder = await fs.getFolder();
if (folder) { /* ... */ }
```

## Version Requirements

| Feature | Version |
|---------|---------|
| UXP Basic API | v22.0 (2021) |
| executeAsModal | v22.1 |
| Layer filters (blur, etc.) | v23.0 (2022) |
| Imaging API (stable) | v23.0 |
| History suspension | v23.3 |
| Selection class | v24.0 (2023) |
| createPixelLayer/createTextLayer | v25.0 (2024) |
| Advanced Selection methods | v25.0 |
| Layer transforms (rotate, scale) | v25.0 |
| Deep Upscale | v24.0 |

## Check Version

```javascript
const version = app.version;  // e.g., "25.0.0"
const [major, minor, patch] = version.split('.').map(Number);

if (major >= 25) {
    // Use v25+ features
} else if (major >= 23) {
    // Use v23+ features
}
```

## Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 9 | Modal state busy | Another operation running; wait and retry |
| 8 | No such element | Layer/document doesn't exist |
| 16 | User cancelled | User clicked cancel; handle gracefully |
| 21 | General error | Check descriptor parameters |

### Handle Error 9

```javascript
try {
    await core.executeAsModal(async () => {
        // work
    }, { commandName: "Op" });
} catch (e) {
    if (e.number === 9) {
        await app.showAlert("Photoshop is busy. Try again.");
    } else {
        throw e;
    }
}
```

## batchPlay Quick Patterns

### Select Layer

```javascript
await action.batchPlay([{
    _obj: "select",
    _target: [{ _ref: "layer", _id: layerId }]
}], {});
```

### Set Layer Property

```javascript
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "layer", _id: layerId }],
    to: {
        _obj: "layer",
        opacity: { _unit: "percentUnit", _value: 50 }
    }
}], {});
```

### Apply Filter

```javascript
await action.batchPlay([{
    _obj: "gaussianBlur",
    radius: { _unit: "pixelsUnit", _value: 5.0 }
}], {});
```

### Fill Layer

```javascript
await action.batchPlay([{
    _obj: "fill",
    using: { _enum: "fillContents", _value: "foregroundColor" },
    opacity: { _unit: "percentUnit", _value: 100 }
}], {});
```

### Select All / Deselect

```javascript
// Select all
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _enum: "ordinal", _value: "allEnum" }
}], {});

// Deselect
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _enum: "ordinal", _value: "none" }
}], {});
```

## Performance Tips

1. **Batch operations** in single executeAsModal call
2. **Suspend history** for multiple modifications
3. **Use batchPlay chains** instead of multiple calls
4. **Avoid repeated DOM access** - cache references
5. **Dispose imaging data** to free memory
6. **Use dialogOptions: "dontDisplay"** for automation
7. **Check isCancelled** in loops
8. **Minimize layer iteration** - use targeted access when possible

## Debugging

```javascript
// Log to console
console.log("Debug:", value);

// Alert (blocking)
await app.showAlert("Message");

// Discover batchPlay events
await action.addNotificationListener(["all"], (event, desc) => {
    console.log(event, JSON.stringify(desc, null, 2));
});
```

## UXP vs ExtendScript Comparison

| Feature | UXP | ExtendScript |
|---------|-----|--------------|
| JavaScript | ES6+ | ES3 |
| Execution | Async | Sync |
| Variables | let/const | var only |
| Functions | Arrow functions | function only |
| Promises | Yes | No |
| Classes | Yes | Constructor functions |
| Modal | executeAsModal required | Direct access |
| Strings | Template literals | Concatenation only |
| Arrays | Modern methods | Basic only |

## Quick Links

- DOM methods are async - always `await`
- Properties are sync - no await needed
- All modifications need `executeAsModal`
- Use `suspendHistory` for single undo
- Layer IDs are persistent; indices change
- Always validate `app.activeDocument` exists
