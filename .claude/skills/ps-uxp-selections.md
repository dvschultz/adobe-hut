---
name: ps-uxp-selections
description: "Photoshop UXP Selection API (v25.0+): shape selections, modification, operations, and boundary transforms."
---

# UXP Selection API

The Selection class (v25.0+) provides comprehensive selection operations in Photoshop UXP.

## Selection Properties

```javascript
const { app } = require('photoshop');
const doc = app.activeDocument;
const selection = doc.selection;

// Properties
selection.bounds;      // { left, top, right, bottom } or null if no selection
selection.solid;       // true if selection is contiguous (no gaps)
selection.typename;    // "Selection"

// Check if selection exists
if (selection.bounds) {
    console.log("Selection exists");
    console.log(`Bounds: ${JSON.stringify(selection.bounds)}`);
} else {
    console.log("No active selection");
}
```

## SelectionType Enum

```javascript
const { constants } = require('photoshop');
const { SelectionType } = constants;

SelectionType.REPLACE;      // Replace current selection
SelectionType.EXTEND;       // Add to selection (Shift)
SelectionType.DIMINISH;     // Subtract from selection (Alt/Option)
SelectionType.INTERSECT;    // Intersect with selection (Shift+Alt)
```

## Creating Selections

### Rectangle Selection

```javascript
const { app, core, constants } = require('photoshop');

await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    const selection = doc.selection;

    // Basic rectangle
    await selection.selectRectangle({
        left: 100,
        top: 100,
        right: 500,
        bottom: 400
    });

    // With options
    await selection.selectRectangle(
        { left: 100, top: 100, right: 500, bottom: 400 },
        constants.SelectionType.REPLACE,  // selection type
        0,                                 // feather (pixels)
        true                               // antiAlias
    );

    // Add to existing selection
    await selection.selectRectangle(
        { left: 600, top: 100, right: 800, bottom: 400 },
        constants.SelectionType.EXTEND
    );

    // Subtract from selection
    await selection.selectRectangle(
        { left: 200, top: 200, right: 400, bottom: 300 },
        constants.SelectionType.DIMINISH
    );

}, { commandName: "Rectangle Selection" });
```

### Ellipse Selection

```javascript
await core.executeAsModal(async () => {
    const selection = doc.selection;

    // Basic ellipse
    await selection.selectEllipse({
        left: 100,
        top: 100,
        right: 400,
        bottom: 300
    });

    // With feathering
    await selection.selectEllipse(
        { left: 100, top: 100, right: 400, bottom: 300 },
        constants.SelectionType.REPLACE,
        10,     // 10px feather
        true    // antiAlias
    );

    // Perfect circle (equal bounds)
    const cx = doc.width / 2;
    const cy = doc.height / 2;
    const radius = 200;
    await selection.selectEllipse({
        left: cx - radius,
        top: cy - radius,
        right: cx + radius,
        bottom: cy + radius
    });

}, { commandName: "Ellipse Selection" });
```

### Polygon Selection

```javascript
await core.executeAsModal(async () => {
    const selection = doc.selection;

    // Triangle
    await selection.selectPolygon([
        { x: 400, y: 100 },   // top point
        { x: 200, y: 400 },   // bottom left
        { x: 600, y: 400 }    // bottom right
    ]);

    // Complex polygon with feathering
    await selection.selectPolygon(
        [
            { x: 100, y: 100 },
            { x: 300, y: 50 },
            { x: 500, y: 100 },
            { x: 450, y: 300 },
            { x: 250, y: 350 },
            { x: 50, y: 250 }
        ],
        constants.SelectionType.REPLACE,
        5,      // feather
        true    // antiAlias
    );

}, { commandName: "Polygon Selection" });
```

### Row and Column Selections

```javascript
await core.executeAsModal(async () => {
    const selection = doc.selection;

    // Select single pixel row
    await selection.selectRow(
        100,    // y position
        constants.SelectionType.REPLACE
    );

    // Select single pixel column
    await selection.selectColumn(
        200,    // x position
        constants.SelectionType.REPLACE
    );

}, { commandName: "Row/Column Selection" });
```

## Modifying Selections

### Expand

```javascript
await core.executeAsModal(async () => {
    await selection.expand(10);  // Expand by 10 pixels
}, { commandName: "Expand" });
```

### Contract

```javascript
await core.executeAsModal(async () => {
    await selection.contract(5);  // Contract by 5 pixels
}, { commandName: "Contract" });
```

### Feather

```javascript
await core.executeAsModal(async () => {
    await selection.feather(15);  // Add 15px feather
}, { commandName: "Feather" });
```

### Smooth

```javascript
await core.executeAsModal(async () => {
    await selection.smooth(5);  // Smooth with 5px radius
}, { commandName: "Smooth" });
```

### Grow (Magic Wand-like expansion)

```javascript
await core.executeAsModal(async () => {
    await selection.grow(
        32,     // tolerance (0-255)
        true    // antiAlias
    );
}, { commandName: "Grow" });
```

### Similar (Select similar colors)

```javascript
await core.executeAsModal(async () => {
    await selection.similar(
        32,     // tolerance (0-255)
        true    // antiAlias
    );
}, { commandName: "Similar" });
```

### Border

```javascript
await core.executeAsModal(async () => {
    // Select border of current selection
    await selection.selectBorder(10);  // 10px border width
}, { commandName: "Border" });
```

## Selection Operations

### Deselect

```javascript
await core.executeAsModal(async () => {
    await selection.deselect();
}, { commandName: "Deselect" });
```

### Inverse

```javascript
await core.executeAsModal(async () => {
    await selection.inverse();
}, { commandName: "Inverse" });
```

### Select All

```javascript
await core.executeAsModal(async () => {
    // Select entire canvas
    await selection.selectRectangle({
        left: 0,
        top: 0,
        right: doc.width,
        bottom: doc.height
    });
}, { commandName: "Select All" });

// Or via batchPlay
await core.executeAsModal(async () => {
    await action.batchPlay([{
        _obj: "set",
        _target: [{ _ref: "channel", _property: "selection" }],
        to: { _enum: "ordinal", _value: "allEnum" }
    }], {});
}, { commandName: "Select All" });
```

### Load Selection from Channel

```javascript
await core.executeAsModal(async () => {
    const channel = doc.channels[0];  // First alpha channel

    await selection.load(
        channel,
        constants.SelectionType.REPLACE,
        false   // invert
    );
}, { commandName: "Load Selection" });
```

### Save Selection to Channel

```javascript
await core.executeAsModal(async () => {
    const channel = doc.channels[0];

    await selection.save(
        channel,
        constants.SelectionType.REPLACE
    );
}, { commandName: "Save Selection" });
```

### Make Work Path

```javascript
await core.executeAsModal(async () => {
    // Convert selection to work path
    await selection.makeWorkPath(2.0);  // tolerance in pixels
}, { commandName: "Make Work Path" });
```

## Boundary Transforms

Transform the selection boundary (marching ants) without affecting content.

### Translate Boundary

```javascript
await core.executeAsModal(async () => {
    await selection.translateBoundary(
        100,    // deltaX (positive = right)
        50      // deltaY (positive = down)
    );
}, { commandName: "Move Selection" });
```

### Resize Boundary

```javascript
await core.executeAsModal(async () => {
    await selection.resizeBoundary(
        150,    // horizontal scale (%)
        100,    // vertical scale (%)
        constants.AnchorPosition.MIDDLECENTER
    );
}, { commandName: "Scale Selection" });
```

### Rotate Boundary

```javascript
await core.executeAsModal(async () => {
    await selection.rotateBoundary(
        45,     // angle in degrees
        constants.AnchorPosition.MIDDLECENTER
    );
}, { commandName: "Rotate Selection" });
```

## Selection via batchPlay

For additional control or pre-v25.0 compatibility.

### Select All

```javascript
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _enum: "ordinal", _value: "allEnum" }
}], {});
```

### Deselect

```javascript
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: { _enum: "ordinal", _value: "none" }
}], {});
```

### Rectangle via batchPlay

```javascript
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: {
        _obj: "rectangle",
        top: { _unit: "pixelsUnit", _value: 100 },
        left: { _unit: "pixelsUnit", _value: 100 },
        bottom: { _unit: "pixelsUnit", _value: 400 },
        right: { _unit: "pixelsUnit", _value: 500 }
    },
    feather: { _unit: "pixelsUnit", _value: 0 },
    antiAlias: true
}], {});
```

### Ellipse via batchPlay

```javascript
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: {
        _obj: "ellipse",
        top: { _unit: "pixelsUnit", _value: 100 },
        left: { _unit: "pixelsUnit", _value: 100 },
        bottom: { _unit: "pixelsUnit", _value: 400 },
        right: { _unit: "pixelsUnit", _value: 500 }
    }
}], {});
```

### Color Range Selection

```javascript
await action.batchPlay([{
    _obj: "colorRange",
    fuzziness: 40,
    colors: {
        _enum: "colors",
        _value: "reds"  // "yellows", "greens", "cyans", "blues", "magentas"
    }
}], {});

// Or by sampled color
await action.batchPlay([{
    _obj: "colorRange",
    fuzziness: 40,
    minimum: {
        _obj: "RGBColor",
        red: 200,
        green: 0,
        blue: 0
    },
    maximum: {
        _obj: "RGBColor",
        red: 255,
        green: 50,
        blue: 50
    }
}], {});
```

### Magic Wand Selection

```javascript
await action.batchPlay([{
    _obj: "set",
    _target: [{ _ref: "channel", _property: "selection" }],
    to: {
        _obj: "point",
        horizontal: { _unit: "pixelsUnit", _value: 200 },
        vertical: { _unit: "pixelsUnit", _value: 200 }
    },
    tolerance: 32,
    antiAlias: true,
    contiguous: true,
    sampleAllLayers: false
}], {});
```

## Complete Example: Selection-Based Processing

```javascript
const { app, core, constants, action } = require('photoshop');

async function processWithSelection() {
    const doc = app.activeDocument;
    if (!doc) {
        await app.showAlert("Please open a document");
        return;
    }

    await core.executeAsModal(async (executionContext) => {
        const hostControl = executionContext.hostControl;
        const selection = doc.selection;

        const suspensionID = await hostControl.suspendHistory({
            documentID: doc.id,
            name: "Selection Processing"
        });

        try {
            // Create circular selection in center
            const cx = doc.width / 2;
            const cy = doc.height / 2;
            const radius = Math.min(doc.width, doc.height) * 0.3;

            await selection.selectEllipse({
                left: cx - radius,
                top: cy - radius,
                right: cx + radius,
                bottom: cy + radius
            });

            // Feather for smooth edges
            await selection.feather(20);

            // Create new layer
            const layer = await doc.createLayer({ name: "Vignette" });

            // Inverse selection
            await selection.inverse();

            // Fill with black (using foreground color)
            await action.batchPlay([{
                _obj: "fill",
                using: { _enum: "fillContents", _value: "color" },
                color: {
                    _obj: "RGBColor",
                    red: 0,
                    green: 0,
                    blue: 0
                },
                opacity: { _unit: "percentUnit", _value: 100 },
                mode: { _enum: "blendMode", _value: "normal" }
            }], {});

            // Set layer blend mode and opacity
            layer.blendMode = constants.BlendMode.MULTIPLY;
            layer.opacity = 50;

            // Deselect
            await selection.deselect();

        } finally {
            await hostControl.resumeHistory(suspensionID);
        }

    }, { commandName: "Create Vignette" });

    await app.showAlert("Vignette created!");
}

processWithSelection();
```

## Best Practices

1. **Check if selection exists** before modification operations
2. **Use appropriate SelectionType** for additive/subtractive operations
3. **Feather before operations** for smooth edges
4. **Deselect when done** to clean up
5. **Use batchPlay** for complex selections not in DOM API
6. **Save important selections** to channels for later use
7. **Combine selection methods** for precise selection work
