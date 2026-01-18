---
name: ps-uxp-layers
description: "Photoshop UXP layer manipulation: properties, creation, transforms, filters, grouping, and management. Covers all LayerKind types."
---

# UXP Layer Operations

Complete guide to layer manipulation in Photoshop UXP.

## Layer Properties

```javascript
const { app, constants } = require('photoshop');
const doc = app.activeDocument;
const layer = doc.activeLayer;

// Identity
layer.id;                    // Unique persistent ID
layer.name;                  // Layer name (read/write)
layer.kind;                  // LayerKind enum
layer.typename;              // Type as string

// Visibility & State
layer.visible;               // Boolean (read/write)
layer.locked;                // Boolean (read/write)
layer.allLocked;             // Fully locked (read/write)
layer.positionLocked;        // Position locked
layer.transparentPixelsLocked; // Transparency locked
layer.isBackgroundLayer;     // Is background layer
layer.isGroupEnd;            // Is end of group

// Appearance
layer.opacity;               // 0-100 (read/write)
layer.fillOpacity;           // 0-100 (read/write)
layer.blendMode;             // BlendMode enum (read/write)

// Geometry
layer.bounds;                // { left, top, right, bottom }
layer.boundsNoEffects;       // Bounds without effects

// Relationships
layer.parent;                // Parent layer/group
layer.linkedLayers;          // Array of linked layers
```

## LayerKind Reference

```javascript
const { LayerKind } = constants;

// Pixel Layers
LayerKind.NORMAL;            // Regular pixel layer
LayerKind.SMARTOBJECT;       // Smart Object

// Text
LayerKind.TEXT;              // Text layer

// Vector
LayerKind.SOLIDFILL;         // Solid color fill
LayerKind.GRADIENTFILL;      // Gradient fill
LayerKind.PATTERNFILL;       // Pattern fill
LayerKind.SHAPELAYER;        // Vector shape

// Adjustment Layers
LayerKind.LEVELS;
LayerKind.CURVES;
LayerKind.BRIGHTNESSCONTRAST;
LayerKind.COLORBALANCE;
LayerKind.HUESATURATION;
LayerKind.SELECTIVECOLOR;
LayerKind.CHANNELMIXER;
LayerKind.GRADIENTMAP;
LayerKind.PHOTOFILTER;
LayerKind.EXPOSURE;
LayerKind.INVERSION;
LayerKind.POSTERIZE;
LayerKind.THRESHOLD;
LayerKind.BLACKANDWHITE;
LayerKind.VIBRANCE;
LayerKind.COLORLOOKUP;

// Groups
LayerKind.GROUP;             // Layer group

// 3D (legacy)
LayerKind.LAYER3D;

// Video
LayerKind.VIDEO;
```

## Creating Layers

### Basic Layer Creation

```javascript
const { app, core, constants } = require('photoshop');

await core.executeAsModal(async () => {
    const doc = app.activeDocument;

    // Create basic layer
    const newLayer = await doc.createLayer({
        name: "My Layer",
        opacity: 100,
        blendMode: constants.BlendMode.NORMAL
    });

    // Create pixel layer (v25.0+)
    const pixelLayer = await doc.createPixelLayer({
        name: "Pixel Layer"
    });

    // Create text layer (v25.0+)
    const textLayer = await doc.createTextLayer({
        name: "Text Layer"
    });

    // Create layer group
    const group = await doc.createLayerGroup({
        name: "My Group"
    });

    // Create group from existing layers
    const groupFromLayers = await doc.createLayerGroup({
        name: "Grouped Layers",
        fromLayers: [layer1, layer2, layer3]
    });

}, { commandName: "Create Layers" });
```

### Create Layer via batchPlay

```javascript
const { action } = require('photoshop');

await core.executeAsModal(async () => {
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

    // Solid color fill layer
    await action.batchPlay([{
        _obj: "make",
        _target: [{ _ref: "contentLayer" }],
        using: {
            _obj: "contentLayer",
            type: {
                _obj: "solidColorLayer",
                color: {
                    _obj: "RGBColor",
                    red: 255,
                    green: 0,
                    blue: 0
                }
            }
        }
    }], {});

    // Adjustment layer (Curves)
    await action.batchPlay([{
        _obj: "make",
        _target: [{ _ref: "adjustmentLayer" }],
        using: {
            _obj: "adjustmentLayer",
            type: { _obj: "curves" }
        }
    }], {});

}, { commandName: "Create via batchPlay" });
```

## Transform Operations

### DOM Methods (v25.0+)

```javascript
await core.executeAsModal(async () => {
    const layer = doc.activeLayer;

    // Rotate
    await layer.rotate(45);  // Degrees
    await layer.rotate(90, constants.AnchorPosition.TOPLEFT);

    // Scale (percentage)
    await layer.scale(150, 150);  // 150% width and height
    await layer.scale(200, 100, constants.AnchorPosition.MIDDLECENTER);

    // Translate (pixels)
    await layer.translate(100, 50);  // Move right 100, down 50

    // Skew (degrees)
    await layer.skew(15, 0);  // Horizontal skew 15 degrees

    // Flip
    await layer.flip("horizontal");
    await layer.flip("vertical");

}, { commandName: "Transform Layer" });
```

### Transform via batchPlay

```javascript
await core.executeAsModal(async () => {
    // Free transform
    await action.batchPlay([{
        _obj: "transform",
        freeTransformCenterState: {
            _enum: "quadCenterState",
            _value: "QCSAverage"
        },
        width: { _unit: "percentUnit", _value: 150 },
        height: { _unit: "percentUnit", _value: 150 },
        angle: { _unit: "angleUnit", _value: 45 },
        interfaceIconFrameDimmed: {
            _enum: "interpolationType",
            _value: "bicubicSharper"
        }
    }], {});

    // Position absolutely
    await action.batchPlay([{
        _obj: "transform",
        position: {
            _obj: "paint",
            horizontal: { _unit: "pixelsUnit", _value: 100 },
            vertical: { _unit: "pixelsUnit", _value: 100 }
        }
    }], {});

}, { commandName: "Transform" });
```

## Filter Methods (v23.0+)

```javascript
await core.executeAsModal(async () => {
    const layer = doc.activeLayer;

    // Blur filters
    await layer.applyGaussianBlur(5.0);      // radius in pixels
    await layer.applyMotionBlur(45, 20);     // angle, distance
    await layer.applyRadialBlur(
        10,                                   // amount
        constants.RadialBlurMethod.SPIN,      // method
        constants.RadialBlurQuality.BEST      // quality
    );

    // Sharpen filters
    await layer.applySharpen();
    await layer.applySharpenMore();
    await layer.applyUnsharpMask(100, 1.0, 0);  // amount%, radius, threshold

    // Noise filters
    await layer.applyAddNoise(
        10,                                   // amount
        constants.NoiseDistribution.GAUSSIAN, // distribution
        false                                 // monochromatic
    );
    await layer.applyDustAndScratches(2, 0);  // radius, threshold
    await layer.applyMedianNoise(2);          // radius

    // Other filters
    await layer.applyHighPass(3.0);           // radius
    await layer.applyMaximum(1, constants.PreserveShape.SQUARENESS);
    await layer.applyMinimum(1, constants.PreserveShape.ROUNDNESS);
    await layer.applyOffset(
        50, 50,                               // horizontal, vertical
        constants.OffsetUndefinedAreas.WRAPAROUND
    );

}, { commandName: "Apply Filters" });
```

## Layer Management

### Duplicate

```javascript
await core.executeAsModal(async () => {
    const layer = doc.activeLayer;

    // Basic duplicate
    const copy = await layer.duplicate();

    // Duplicate with options
    const copy2 = await layer.duplicate(
        doc.layers[0],                        // relative to
        constants.ElementPlacement.PLACEAFTER // placement
    );

    // Duplicate to another document
    const copy3 = await layer.duplicate(otherDoc);

}, { commandName: "Duplicate" });
```

### Delete

```javascript
await core.executeAsModal(async () => {
    await layer.delete();
}, { commandName: "Delete Layer" });
```

### Move

```javascript
await core.executeAsModal(async () => {
    const layer = doc.activeLayer;

    // Move relative to another layer
    await layer.move(targetLayer, constants.ElementPlacement.PLACEBEFORE);
    await layer.move(targetLayer, constants.ElementPlacement.PLACEAFTER);
    await layer.move(group, constants.ElementPlacement.PLACEINSIDE);

}, { commandName: "Move Layer" });
```

### Merge

```javascript
await core.executeAsModal(async () => {
    // Merge down (into layer below)
    await layer.merge();

    // Merge visible layers
    await doc.mergeVisibleLayers();

    // Flatten entire document
    await doc.flatten();

}, { commandName: "Merge" });
```

### Link Layers

```javascript
await core.executeAsModal(async () => {
    const layer1 = doc.layers[0];
    const layer2 = doc.layers[1];

    // Link layers
    await layer1.link(layer2);

    // Get linked layers
    const linked = layer1.linkedLayers;

    // Unlink
    await layer1.unlink();

}, { commandName: "Link Layers" });
```

### Rasterize

```javascript
await core.executeAsModal(async () => {
    // Rasterize entire layer (effects, vector, etc.)
    await layer.rasterize(constants.RasterizeType.ENTIRELAYER);

    // Other rasterize options
    await textLayer.rasterize(constants.RasterizeType.TEXTCONTENTS);
    await smartObject.rasterize(constants.RasterizeType.LINKEDLAYERS);

}, { commandName: "Rasterize" });
```

## Working with Layer Groups

```javascript
await core.executeAsModal(async () => {
    // Create group
    const group = await doc.createLayerGroup({ name: "Effects" });

    // Create group from layers
    const selectedLayers = doc.activeLayers;
    const newGroup = await doc.createLayerGroup({
        name: "Grouped Selection",
        fromLayers: selectedLayers
    });

    // Iterate group contents
    for (const layer of group.layers) {
        console.log(layer.name);
    }

    // Check if layer is a group
    if (layer.kind === constants.LayerKind.GROUP) {
        console.log("This is a group with", layer.layers.length, "layers");
    }

}, { commandName: "Groups" });
```

## Iterating Layers

```javascript
// All layers (top-level)
for (const layer of doc.layers) {
    console.log(layer.name);
}

// Recursive iteration
function iterateLayers(layers, depth = 0) {
    for (const layer of layers) {
        console.log("  ".repeat(depth) + layer.name);
        if (layer.kind === constants.LayerKind.GROUP) {
            iterateLayers(layer.layers, depth + 1);
        }
    }
}
iterateLayers(doc.layers);

// Find layer by name
function findLayer(layers, name) {
    for (const layer of layers) {
        if (layer.name === name) return layer;
        if (layer.kind === constants.LayerKind.GROUP) {
            const found = findLayer(layer.layers, name);
            if (found) return found;
        }
    }
    return null;
}

// Find layer by ID
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

## Blend Modes Reference

```javascript
const { BlendMode } = constants;

// Normal modes
BlendMode.NORMAL;
BlendMode.DISSOLVE;

// Darken modes
BlendMode.DARKEN;
BlendMode.MULTIPLY;
BlendMode.COLORBURN;
BlendMode.LINEARBURN;
BlendMode.DARKERCOLOR;

// Lighten modes
BlendMode.LIGHTEN;
BlendMode.SCREEN;
BlendMode.COLORDODGE;
BlendMode.LINEARDODGE;
BlendMode.LIGHTERCOLOR;

// Contrast modes
BlendMode.OVERLAY;
BlendMode.SOFTLIGHT;
BlendMode.HARDLIGHT;
BlendMode.VIVIDLIGHT;
BlendMode.LINEARLIGHT;
BlendMode.PINLIGHT;
BlendMode.HARDMIX;

// Inversion modes
BlendMode.DIFFERENCE;
BlendMode.EXCLUSION;
BlendMode.SUBTRACT;
BlendMode.DIVIDE;

// Component modes
BlendMode.HUE;
BlendMode.SATURATION;
BlendMode.COLOR;
BlendMode.LUMINOSITY;

// Set blend mode
await core.executeAsModal(async () => {
    layer.blendMode = BlendMode.MULTIPLY;
}, { commandName: "Set Blend Mode" });
```

## Anchor Positions

```javascript
const { AnchorPosition } = constants;

AnchorPosition.TOPLEFT;
AnchorPosition.TOPCENTER;
AnchorPosition.TOPRIGHT;
AnchorPosition.MIDDLELEFT;
AnchorPosition.MIDDLECENTER;
AnchorPosition.MIDDLERIGHT;
AnchorPosition.BOTTOMLEFT;
AnchorPosition.BOTTOMCENTER;
AnchorPosition.BOTTOMRIGHT;
```

## Complete Example: Batch Layer Processing

```javascript
const { app, core, constants } = require('photoshop');

async function processAllLayers() {
    const doc = app.activeDocument;
    if (!doc) {
        await app.showAlert("No document open");
        return;
    }

    await core.executeAsModal(async (executionContext) => {
        const hostControl = executionContext.hostControl;

        const suspensionID = await hostControl.suspendHistory({
            documentID: doc.id,
            name: "Batch Process Layers"
        });

        try {
            const allLayers = getAllLayers(doc.layers);
            const pixelLayers = allLayers.filter(
                l => l.kind === constants.LayerKind.NORMAL
            );

            for (let i = 0; i < pixelLayers.length; i++) {
                if (executionContext.isCancelled) break;

                executionContext.reportProgress({
                    value: i / pixelLayers.length,
                    commandName: `Processing ${pixelLayers[i].name}`
                });

                const layer = pixelLayers[i];

                // Apply slight blur
                await layer.applyGaussianBlur(1.5);

                // Reduce opacity
                layer.opacity = 90;
            }

        } finally {
            await hostControl.resumeHistory(suspensionID);
        }

    }, { commandName: "Batch Process" });
}

function getAllLayers(layers) {
    let result = [];
    for (const layer of layers) {
        result.push(layer);
        if (layer.kind === constants.LayerKind.GROUP) {
            result = result.concat(getAllLayers(layer.layers));
        }
    }
    return result;
}

processAllLayers();
```
