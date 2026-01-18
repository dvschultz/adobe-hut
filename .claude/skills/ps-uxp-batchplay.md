---
name: ps-uxp-batchplay
description: "Photoshop UXP batchPlay API: action descriptors, dialog options, chaining operations, and discovering commands. The low-level API for operations not in the DOM."
---

# UXP batchPlay API

batchPlay is the low-level API for Photoshop operations not exposed through the DOM. It uses action descriptors (the same system as Actions in Photoshop).

## Overview

batchPlay is the evolution of ExtendScript's `executeAction()`:
- ExtendScript used complex `ActionDescriptor` classes to build commands
- batchPlay uses simple **JSON objects** (called "actionJSON")
- Much more **readable and compact** than ExtendScript
- Can execute **multiple commands** in a single call (hence "batch")
- Provides access to features not yet available in the DOM API

## Basic Structure

```javascript
const { action } = require('photoshop');

const result = await action.batchPlay([
    {
        _obj: "commandName",           // The action to perform
        _target: [...],                // Target specification (optional)
        param1: value1,                // Parameters vary by command
        param2: value2
    }
], {
    synchronousExecution: false,       // Always use false (async)
    dialogOptions: "dontDisplay"       // "display", "dontDisplay", "silent"
});
```

## Dialog Options

| Option | Description |
|--------|-------------|
| `"display"` | Show any dialogs normally |
| `"dontDisplay"` | Skip dialogs, use provided/default values |
| `"silent"` | Skip dialogs and suppress errors |

```javascript
// Show filter dialog for user adjustment
await action.batchPlay([{
    _obj: "gaussianBlur",
    radius: { _unit: "pixelsUnit", _value: 10 }
}], { dialogOptions: "display" });

// Apply silently with specified values
await action.batchPlay([{
    _obj: "gaussianBlur",
    radius: { _unit: "pixelsUnit", _value: 10 }
}], { dialogOptions: "dontDisplay" });
```

## Target Specification

Targets specify which object(s) an action applies to.

### By Reference Type

```javascript
// Current/active layer
{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }

// Layer by ID
{ _ref: "layer", _id: 123 }

// Layer by index (1-based)
{ _ref: "layer", _index: 1 }

// Layer by name
{ _ref: "layer", _name: "Background" }

// Document
{ _ref: "document", _enum: "ordinal", _value: "targetEnum" }

// Document by ID
{ _ref: "document", _id: 456 }

// Application
{ _ref: "application", _enum: "ordinal", _value: "targetEnum" }
```

### Compound Targets

```javascript
// Property of a layer
_target: [
    { _property: "opacity" },
    { _ref: "layer", _id: 123 }
]

// Property of a document
_target: [
    { _property: "resolution" },
    { _ref: "document", _enum: "ordinal", _value: "targetEnum" }
]
```

## Common Operations

### Select Layer

```javascript
// Select layer by ID
await action.batchPlay([{
    _obj: "select",
    _target: [{ _ref: "layer", _id: layerId }],
    makeVisible: false,
    layerID: [layerId]
}], {});

// Select multiple layers
await action.batchPlay([{
    _obj: "select",
    _target: [{ _ref: "layer", _id: firstLayerId }],
    selectionModifier: { _enum: "selectionModifierType", _value: "addToSelection" },
    makeVisible: false
}], {});
```

### Create Layer

```javascript
// New blank layer
await action.batchPlay([{
    _obj: "make",
    _target: [{ _ref: "layer" }],
    using: {
        _obj: "layer",
        name: "New Layer",
        opacity: { _unit: "percentUnit", _value: 100 },
        mode: { _enum: "blendMode", _value: "normal" }
    }
}], {});

// New layer group
await action.batchPlay([{
    _obj: "make",
    _target: [{ _ref: "layerSection" }],
    using: {
        _obj: "layerSection",
        name: "New Group"
    }
}], {});
```

### Delete Layer

```javascript
await action.batchPlay([{
    _obj: "delete",
    _target: [{ _ref: "layer", _id: layerId }]
}], {});
```

### Duplicate Layer

```javascript
await action.batchPlay([{
    _obj: "duplicate",
    _target: [{ _ref: "layer", _id: layerId }],
    name: "Copy of Layer"
}], {});
```

### Move Layer

```javascript
// Move layer to index
await action.batchPlay([{
    _obj: "move",
    _target: [{ _ref: "layer", _id: layerId }],
    to: { _ref: "layer", _index: 2 }
}], {});
```

### Set Layer Properties

```javascript
// Set opacity
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "layer", _id: layerId }],
    to: {
        _obj: "layer",
        opacity: { _unit: "percentUnit", _value: 50 }
    }
}], {});

// Set blend mode
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "layer", _id: layerId }],
    to: {
        _obj: "layer",
        mode: { _enum: "blendMode", _value: "multiply" }
    }
}], {});

// Rename layer
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "layer", _id: layerId }],
    to: {
        _obj: "layer",
        name: "New Name"
    }
}], {});
```

### Get Layer Info

```javascript
// Get specific property
const result = await action.batchPlay([{
    _obj: "get",
    _target: [
        { _property: "name" },
        { _ref: "layer", _id: layerId }
    ]
}], {});
const layerName = result[0].name;

// Get multiple properties
const result = await action.batchPlay([{
    _obj: "multiGet",
    _target: [{ _ref: "layer", _id: layerId }],
    extendedReference: [
        ["name"],
        ["opacity"],
        ["visible"],
        ["bounds"]
    ]
}], {});
```

### Apply Filters

```javascript
// Gaussian Blur
await action.batchPlay([{
    _obj: "gaussianBlur",
    radius: { _unit: "pixelsUnit", _value: 5.0 }
}], {});

// Unsharp Mask
await action.batchPlay([{
    _obj: "unsharpMask",
    amount: { _unit: "percentUnit", _value: 100 },
    radius: { _unit: "pixelsUnit", _value: 1.0 },
    threshold: 0
}], {});

// Motion Blur
await action.batchPlay([{
    _obj: "motionBlur",
    angle: 45,
    distance: { _unit: "pixelsUnit", _value: 20 }
}], {});

// High Pass
await action.batchPlay([{
    _obj: "highPass",
    radius: { _unit: "pixelsUnit", _value: 3.0 }
}], {});
```

### Fill Operations

```javascript
// Fill with foreground color
await action.batchPlay([{
    _obj: "fill",
    using: { _enum: "fillContents", _value: "foregroundColor" },
    opacity: { _unit: "percentUnit", _value: 100 },
    mode: { _enum: "blendMode", _value: "normal" }
}], {});

// Fill with specific color
await action.batchPlay([{
    _obj: "fill",
    using: { _enum: "fillContents", _value: "color" },
    color: {
        _obj: "RGBColor",
        red: 255,
        green: 0,
        blue: 0
    },
    opacity: { _unit: "percentUnit", _value: 100 }
}], {});
```

### Selection Operations

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

// Select rectangle
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: {
        _obj: "rectangle",
        top: { _unit: "pixelsUnit", _value: 0 },
        left: { _unit: "pixelsUnit", _value: 0 },
        bottom: { _unit: "pixelsUnit", _value: 100 },
        right: { _unit: "pixelsUnit", _value: 100 }
    }
}], {});

// Feather selection
await action.batchPlay([{
    _obj: "feather",
    radius: { _unit: "pixelsUnit", _value: 10 }
}], {});

// Inverse selection
await action.batchPlay([{
    _obj: "inverse"
}], {});
```

### Transform Operations

```javascript
// Free transform
await action.batchPlay([{
    _obj: "transform",
    freeTransformCenterState: { _enum: "quadCenterState", _value: "QCSAverage" },
    width: { _unit: "percentUnit", _value: 150 },
    height: { _unit: "percentUnit", _value: 150 },
    angle: { _unit: "angleUnit", _value: 45 }
}], {});

// Flip horizontal
await action.batchPlay([{
    _obj: "flip",
    axis: { _enum: "orientation", _value: "horizontal" }
}], {});
```

### Document Operations

```javascript
// Resize image
await action.batchPlay([{
    _obj: "imageSize",
    width: { _unit: "pixelsUnit", _value: 1920 },
    height: { _unit: "pixelsUnit", _value: 1080 },
    resolution: { _unit: "densityUnit", _value: 300 },
    resampleMethod: { _enum: "interpolationType", _value: "bicubicSharper" },
    constrainProportions: true
}], {});

// Resize canvas
await action.batchPlay([{
    _obj: "canvasSize",
    width: { _unit: "pixelsUnit", _value: 2000 },
    height: { _unit: "pixelsUnit", _value: 2000 },
    horizontal: { _enum: "horizontalLocation", _value: "center" },
    vertical: { _enum: "verticalLocation", _value: "center" }
}], {});

// Flatten image
await action.batchPlay([{
    _obj: "flattenImage"
}], {});

// Merge visible
await action.batchPlay([{
    _obj: "mergeVisible"
}], {});
```

### Save/Export

```javascript
// Save as JPEG
await action.batchPlay([{
    _obj: "save",
    as: {
        _obj: "JPEG",
        quality: 10,  // 0-12
        matteColor: { _enum: "matteColor", _value: "none" }
    },
    in: { _path: "/path/to/output.jpg", _kind: "local" },
    copy: true
}], {});

// Save as PNG
await action.batchPlay([{
    _obj: "save",
    as: {
        _obj: "PNGFormat",
        compression: 6,  // 0-9
        interlace: false
    },
    in: { _path: "/path/to/output.png", _kind: "local" },
    copy: true
}], {});

// Quick Export as PNG
await action.batchPlay([{
    _obj: "exportSelectionAsFileTypePressed",
    _target: [{ _ref: "layer", _id: layerId }],
    fileType: "png",
    quality: 32,
    metadata: 0,
    destFolder: "/path/to/folder/",
    sRGB: true,
    openWindow: false
}], {});
```

## Chaining Operations

```javascript
// Multiple operations in one call
const results = await action.batchPlay([
    {
        _obj: "select",
        _target: [{ _ref: "layer", _id: layer1Id }]
    },
    {
        _obj: "set",
        _target: [{ _ref: "layer", _enum: "ordinal", _value: "targetEnum" }],
        to: { _obj: "layer", opacity: { _unit: "percentUnit", _value: 50 } }
    },
    {
        _obj: "gaussianBlur",
        radius: { _unit: "pixelsUnit", _value: 3 }
    }
], {});

// Each result corresponds to each command
console.log(results[0]);  // select result
console.log(results[1]);  // set result
console.log(results[2]);  // blur result
```

## Discovering Action Descriptors

Finding the correct batchPlay descriptor format is essential. Here are the best methods:

### Method 1: Actions Panel "Copy As JavaScript" (Recommended)

This is the easiest and most reliable method:

1. Open the **Actions panel** in Photoshop (Window > Actions)
2. Click the **Create New Action** button and give it a name
3. Click **Record** and perform the operations you want to script
4. Click **Stop** to end recording
5. Select the action (or individual steps within it) in the panel
6. Click the panel **flyout menu** (three lines) → **"Copy As JavaScript"**
7. Paste into your code - it's already UXP-compatible!

```javascript
// Example output from "Copy As JavaScript":
async function gaussianBlur() {
    const result = await batchPlay(
        [{
            _obj: "gaussianBlur",
            radius: { _unit: "pixelsUnit", _value: 5 }
        }],
        { synchronousExecution: false }
    );
}
```

### Method 2: Alchemist Plugin

Install the [Alchemist](https://github.com/nickolasnikolic/alchemist) plugin (free):
- Available on GitHub and Adobe Marketplace
- Acts as a **real-time batchPlay inspector**
- Shows descriptors as you perform actions in Photoshop
- Can copy descriptors directly to clipboard
- Explore the full action tree
- **Essential tool** for UXP development

### Method 3: Notification Listener (Debugging)

Listen to all events and log descriptors to the console:

```javascript
// Start listening
const listener = await action.addNotificationListener(
    ["all"],
    (event, descriptor) => {
        console.log("=== ACTION ===");
        console.log("Event:", event);
        console.log("Descriptor:", JSON.stringify(descriptor, null, 2));
    }
);

// Now perform actions manually in Photoshop
// Check the UXP Developer Tool console for output

// When done, remove the listener
await listener.removeListener();
```

### Method 4: ScriptListener Plugin (Legacy)

The classic method from ExtendScript days:
1. Install ScriptListener plugin in `Photoshop/Plug-ins` folder
2. Perform actions - logs are written to `ScriptingListenerJS.log` on desktop
3. Convert the ExtendScript format to batchPlay format

**Note:** Output is verbose and needs conversion. Use "Copy As JavaScript" instead when possible.

### Comparing Discovery Methods

| Method | Ease | Output Format | Best For |
|--------|------|---------------|----------|
| Copy As JavaScript | Easy | Ready to use | Most cases |
| Alchemist | Easy | Ready to use | Complex exploration |
| Notification Listener | Medium | JSON | Debugging |
| ScriptListener | Hard | Needs conversion | Legacy/fallback |

## Unit Types

Common unit specifications:

```javascript
// Pixels
{ _unit: "pixelsUnit", _value: 100 }

// Percent
{ _unit: "percentUnit", _value: 50 }

// Points
{ _unit: "pointsUnit", _value: 12 }

// Angle (degrees)
{ _unit: "angleUnit", _value: 45 }

// Density (PPI)
{ _unit: "densityUnit", _value: 300 }

// Distance
{ _unit: "distanceUnit", _value: 10 }
```

## Error Handling

```javascript
try {
    const result = await action.batchPlay([{
        _obj: "someCommand",
        // ...
    }], {});

    // Check for errors in result
    if (result[0]._err) {
        console.error("Error:", result[0]._err);
    }

} catch (error) {
    // Handle execution errors
    console.error("batchPlay failed:", error.message);
}
```

## Best Practices

1. **Use DOM API when available** - batchPlay is for operations not in DOM
2. **Wrap in executeAsModal** - Required for document modifications
3. **Use dontDisplay** for automation - Skip dialogs in scripts
4. **Chain related operations** - More efficient than separate calls
5. **Handle errors** - Check both thrown errors and result._err
6. **Use Alchemist** - Essential for discovering descriptor formats
7. **Specify units explicitly** - Don't rely on defaults
