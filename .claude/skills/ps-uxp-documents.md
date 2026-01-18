---
name: ps-uxp-documents
description: "Photoshop UXP document operations: creation, saving, image size, canvas, color modes, history, and export options."
---

# UXP Document Operations

Complete guide to document manipulation in Photoshop UXP.

## Document Access

```javascript
const { app } = require('photoshop');

// All open documents
const docs = app.documents;
console.log(`${docs.length} documents open`);

// Active document
const doc = app.activeDocument;
if (!doc) {
    console.log("No document open");
}

// Iterate documents
for (const document of app.documents) {
    console.log(document.name);
}

// Access by index
const firstDoc = app.documents[0];
```

## Document Properties

```javascript
const doc = app.activeDocument;

// Identity
doc.id;                      // Unique identifier
doc.name;                    // Filename (e.g., "image.psd")
doc.title;                   // Document title
doc.path;                    // Full path (if saved)
doc.saved;                   // Has unsaved changes?

// Dimensions
doc.width;                   // Width in pixels
doc.height;                  // Height in pixels
doc.resolution;              // Resolution (PPI)
doc.pixelAspectRatio;        // Pixel aspect ratio

// Color
doc.mode;                    // DocumentMode enum
doc.bitsPerChannel;          // BitsPerChannelType enum
doc.colorProfileName;        // ICC profile name

// Collections
doc.layers;                  // LayerCollection
doc.layerComps;              // LayerCompCollection
doc.channels;                // ChannelCollection
doc.pathItems;               // PathItemCollection
doc.historyStates;           // HistoryStateCollection
doc.guides;                  // GuideCollection
doc.colorSamplers;           // ColorSamplerCollection

// Active elements
doc.activeLayer;             // Currently active layer
doc.activeLayers;            // Array of selected layers
doc.activeHistoryState;      // Current history state
doc.backgroundLayer;         // Background layer (if exists)
```

## Creating Documents

### Using app.createDocument()

```javascript
const { app, core, constants } = require('photoshop');

await core.executeAsModal(async () => {
    // Basic document
    const doc = await app.createDocument({
        name: "My Document",
        width: 1920,
        height: 1080,
        resolution: 300,
        mode: constants.NewDocumentMode.RGB,
        fill: constants.DocumentFill.WHITE
    });

    // Transparent background
    const transparentDoc = await app.createDocument({
        name: "Transparent",
        width: 800,
        height: 600,
        resolution: 72,
        mode: constants.NewDocumentMode.RGB,
        fill: constants.DocumentFill.TRANSPARENT
    });

    // With color profile
    const profileDoc = await app.createDocument({
        name: "Profiled",
        width: 1000,
        height: 1000,
        resolution: 300,
        mode: constants.NewDocumentMode.CMYK,
        profile: "U.S. Web Coated (SWOP) v2"
    });

}, { commandName: "Create Document" });
```

### Document Mode Options

```javascript
const { NewDocumentMode } = constants;

NewDocumentMode.BITMAP;
NewDocumentMode.GRAYSCALE;
NewDocumentMode.RGB;
NewDocumentMode.CMYK;
NewDocumentMode.LAB;
```

### Document Fill Options

```javascript
const { DocumentFill } = constants;

DocumentFill.WHITE;
DocumentFill.BACKGROUNDCOLOR;
DocumentFill.TRANSPARENT;
```

## Opening Documents

```javascript
const { app, core } = require('photoshop');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Open with file picker
const file = await fs.getFileForOpening({
    types: ["psd", "psb", "jpg", "png", "tif"]
});

if (file) {
    await core.executeAsModal(async () => {
        const doc = await app.open(file);
        console.log(`Opened: ${doc.name}`);
    }, { commandName: "Open Document" });
}
```

## Saving Documents

### Save (Overwrite)

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    await doc.save();
}, { commandName: "Save" });
```

### Save As

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Get save location
    const file = await fs.getFileForSaving("output.psd", {
        types: ["psd"]
    });

    if (file) {
        // Save as PSD
        await doc.saveAs(file);

        // Save as copy (keeps original open)
        await doc.saveAs(file, {}, true);  // asCopy = true
    }

}, { commandName: "Save As" });
```

### Save with Format Options via batchPlay

```javascript
const { action } = require('photoshop');

await core.executeAsModal(async () => {
    // Save as JPEG
    await action.batchPlay([{
        _obj: "save",
        as: {
            _obj: "JPEG",
            quality: 10,                    // 0-12
            formatOptions: {
                _enum: "formatOptionsType",
                _value: "optimizedBaseline"
            },
            matteColor: { _enum: "matteColor", _value: "none" }
        },
        in: {
            _path: "/path/to/output.jpg",
            _kind: "local"
        },
        copy: true                          // Save as copy
    }], {});

    // Save as PNG
    await action.batchPlay([{
        _obj: "save",
        as: {
            _obj: "PNGFormat",
            compression: 6,                 // 0-9
            interlace: false
        },
        in: {
            _path: "/path/to/output.png",
            _kind: "local"
        },
        copy: true
    }], {});

    // Save as TIFF
    await action.batchPlay([{
        _obj: "save",
        as: {
            _obj: "TIFF",
            imageCompression: {
                _enum: "TIFFEncoding",
                _value: "TIFFLZW"            // or "TIFFNone", "TIFFZip"
            },
            layers: true                     // Preserve layers
        },
        in: {
            _path: "/path/to/output.tif",
            _kind: "local"
        },
        copy: true
    }], {});

}, { commandName: "Save Format" });
```

## Closing Documents

```javascript
const { constants } = require('photoshop');

await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Close without saving
    await doc.close(constants.SaveOptions.DONOTSAVECHANGES);

    // Close and save
    await doc.close(constants.SaveOptions.SAVECHANGES);

    // Prompt user
    await doc.close(constants.SaveOptions.PROMPTTOSAVECHANGES);

}, { commandName: "Close" });
```

## Image Size Operations

### Resize Image

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Resize to specific dimensions
    await doc.resizeImage(
        1920,                              // width (pixels)
        1080,                              // height (pixels)
        300,                               // resolution (PPI)
        constants.ResampleMethod.BICUBICSHARPER
    );

    // Resize with auto-calculated dimension
    await doc.resizeImage(
        1920,                              // width
        undefined,                         // auto-calculate height
        null,                              // keep resolution
        constants.ResampleMethod.BILINEAR
    );

}, { commandName: "Resize Image" });
```

### Resample Methods

```javascript
const { ResampleMethod } = constants;

ResampleMethod.NEARESTNEIGHBOR;    // Fastest, blocky
ResampleMethod.BILINEAR;           // Medium quality
ResampleMethod.BICUBIC;            // High quality
ResampleMethod.BICUBICSMOOTHER;    // Best for enlargement
ResampleMethod.BICUBICSHARPER;     // Best for reduction
ResampleMethod.PRESERVEDETAILS;    // AI-enhanced
ResampleMethod.DEEPUPSCALE;        // Neural upscaling (v24.0+)
```

### Change Resolution Only

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Change resolution without resampling (changes print size)
    await doc.resizeImage(
        doc.width,
        doc.height,
        300,                               // new resolution
        constants.ResampleMethod.NONE      // no resampling
    );

}, { commandName: "Change Resolution" });
```

## Canvas Operations

### Resize Canvas

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Resize canvas (centered)
    await doc.resizeCanvas(
        2000,                              // new width
        2000,                              // new height
        constants.AnchorPosition.MIDDLECENTER
    );

    // Add canvas to one side
    await doc.resizeCanvas(
        doc.width + 200,                   // add 200px to width
        doc.height,
        constants.AnchorPosition.MIDDLELEFT // anchor left, expand right
    );

}, { commandName: "Resize Canvas" });
```

### Crop

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Crop to bounds
    await doc.crop({
        left: 100,
        top: 100,
        right: 900,
        bottom: 700
    });

    // Crop with rotation
    await doc.crop(
        { left: 0, top: 0, right: 800, bottom: 600 },
        15,                                // angle in degrees
        800,                               // width
        600                                // height
    );

}, { commandName: "Crop" });
```

### Rotate Canvas

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    await doc.rotateCanvas(90);   // Rotate 90 degrees clockwise
    await doc.rotateCanvas(-90);  // Counter-clockwise
    await doc.rotateCanvas(180);  // Flip upside down

}, { commandName: "Rotate Canvas" });
```

### Trim

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Trim transparent pixels
    await doc.trim(
        constants.TrimType.TRANSPARENT,
        true,  // top
        true,  // left
        true,  // bottom
        true   // right
    );

    // Trim based on top-left pixel color
    await doc.trim(constants.TrimType.TOPLEFT);

    // Trim based on bottom-right pixel color
    await doc.trim(constants.TrimType.BOTTOMRIGHT);

}, { commandName: "Trim" });
```

### Reveal All

```javascript
await core.executeAsModal(async () => {
    // Expand canvas to show all layer content
    await doc.revealAll();
}, { commandName: "Reveal All" });
```

## Color Mode Operations

### Change Mode

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Change to grayscale
    await doc.changeMode(constants.ChangeMode.GRAYSCALE);

    // Change to CMYK
    await doc.changeMode(constants.ChangeMode.CMYK);

    // Change to RGB
    await doc.changeMode(constants.ChangeMode.RGB);

}, { commandName: "Change Mode" });
```

### Convert Color Profile

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    await doc.convertProfile(
        "sRGB IEC61966-2.1",               // target profile
        constants.Intent.PERCEPTUAL,        // rendering intent
        true,                               // black point compensation
        false                               // dither
    );

}, { commandName: "Convert Profile" });
```

### Rendering Intents

```javascript
const { Intent } = constants;

Intent.PERCEPTUAL;
Intent.SATURATION;
Intent.RELATIVECOLORIMETRIC;
Intent.ABSOLUTECOLORIMETRIC;
```

## Flatten and Merge

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Flatten (merge all layers into background)
    await doc.flatten();

    // Merge visible layers
    await doc.mergeVisibleLayers();

}, { commandName: "Flatten" });
```

## Document Duplicate

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Basic duplicate
    const copy = await doc.duplicate();

    // Duplicate with name
    const namedCopy = await doc.duplicate("Copy of " + doc.name);

    // Duplicate and flatten
    const flatCopy = await doc.duplicate("Flattened Copy", true);

}, { commandName: "Duplicate Document" });
```

## History States

```javascript
const doc = app.activeDocument;

// Get history states
const states = doc.historyStates;
console.log(`${states.length} history states`);

// Current state
const current = doc.activeHistoryState;
console.log(`Current: ${current.name}`);

// Revert to previous state
await core.executeAsModal(async () => {
    doc.activeHistoryState = states[states.length - 2];
}, { commandName: "Undo" });
```

## Suspend History

```javascript
await core.executeAsModal(async (executionContext) => {
    // Method 1: Using hostControl (preferred)
    const hostControl = executionContext.hostControl;
    const suspensionID = await hostControl.suspendHistory({
        documentID: doc.id,
        name: "My Batch Operation"
    });

    try {
        // All operations here = single undo
        await doManyThings();
    } finally {
        await hostControl.resumeHistory(suspensionID);
    }

    // Method 2: Using doc.suspendHistory (simpler)
    await doc.suspendHistory("Alternative Method", async () => {
        await doManyThings();
    });

}, { commandName: "Batch" });
```

## Guides

```javascript
const doc = app.activeDocument;

// Get guides
for (const guide of doc.guides) {
    console.log(`Guide at ${guide.coordinate}, ${guide.direction}`);
}

// Add guides via batchPlay
await core.executeAsModal(async () => {
    await action.batchPlay([{
        _obj: "make",
        _target: [{ _ref: "guide" }],
        new: {
            _obj: "guide",
            position: { _unit: "pixelsUnit", _value: 100 },
            orientation: { _enum: "orientation", _value: "horizontal" }
        }
    }], {});
}, { commandName: "Add Guide" });
```

## Complete Example: Batch Document Processing

```javascript
const { app, core, constants } = require('photoshop');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function batchProcessImages() {
    // Select input folder
    const inputFolder = await fs.getFolder();
    if (!inputFolder) return;

    // Get output folder
    const outputFolder = await fs.getFolder();
    if (!outputFolder) return;

    // Get image files
    const entries = await inputFolder.getEntries();
    const imageFiles = entries.filter(e =>
        e.isFile && /\.(jpg|jpeg|png|psd)$/i.test(e.name)
    );

    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];

        await core.executeAsModal(async (executionContext) => {
            executionContext.reportProgress({
                value: i / imageFiles.length,
                commandName: `Processing ${file.name}`
            });

            // Open document
            const doc = await app.open(file);

            // Process
            await doc.resizeImage(
                1200, undefined, null,
                constants.ResampleMethod.BICUBICSHARPER
            );

            // Save
            const outputFile = await outputFolder.createFile(
                file.name.replace(/\.[^.]+$/, '.jpg'),
                { overwrite: true }
            );

            await action.batchPlay([{
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

            // Close without saving PSD changes
            await doc.close(constants.SaveOptions.DONOTSAVECHANGES);

        }, { commandName: "Batch Process" });
    }

    await app.showAlert(`Processed ${imageFiles.length} images!`);
}

batchProcessImages();
```
