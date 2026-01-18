---
name: indd-uxp-objects
description: "InDesign UXP page items and graphics: rectangles, ovals, polygons, placing images, positioning, transformations, groups, and effects."
---

# InDesign UXP: Page Items and Graphics

## Overview

Page item creation and manipulation in InDesign UXP using modern JavaScript (ES6+). Covers shapes (rectangles, ovals, polygons), placing images, positioning with geometricBounds, transformations, groups, and visual effects.

**Requires**: InDesign v18.0+ (v18.4+ for `require('indesign')`)

## Module Import

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;
```

## Creating Shapes

### Rectangles

```javascript
const { app } = require('indesign');
const doc = app.activeDocument;
const page = doc.pages.item(0);

// Basic rectangle
const rect = page.rectangles.add({
    geometricBounds: [50, 50, 200, 300]  // [y1, x1, y2, x2]
});

// Rectangle with fill and stroke
const styledRect = page.rectangles.add({
    geometricBounds: [250, 50, 400, 300],
    fillColor: doc.swatches.itemByName("Black"),
    strokeColor: doc.swatches.itemByName("None"),
    strokeWeight: 0
});

// Rectangle on specific layer
const rect = page.rectangles.add({
    geometricBounds: [50, 350, 200, 500],
    itemLayer: doc.layers.itemByName("Graphics")
});
```

### Ovals

```javascript
// Basic oval
const oval = page.ovals.add({
    geometricBounds: [50, 50, 200, 250]
});

// Circle (equal width and height)
const circle = page.ovals.add({
    geometricBounds: [50, 300, 200, 450]  // 150pt square = circle
});

// Styled oval
oval.fillColor = doc.colors.itemByName("Red");
oval.strokeColor = doc.swatches.itemByName("Black");
oval.strokeWeight = 2;
```

### Polygons

```javascript
// Basic polygon (hexagon)
const polygon = page.polygons.add({
    geometricBounds: [50, 50, 200, 200],
    numberOfSides: 6
});

// Triangle
const triangle = page.polygons.add({
    geometricBounds: [50, 250, 200, 400],
    numberOfSides: 3
});

// Star
const star = page.polygons.add({
    geometricBounds: [50, 450, 200, 600],
    numberOfSides: 5,
    insetPercentage: 50  // Creates star points
});

// Pentagon
const pentagon = page.polygons.add({
    geometricBounds: [250, 50, 400, 200],
    numberOfSides: 5,
    insetPercentage: 0  // Regular polygon (no star)
});
```

### Graphic Lines

```javascript
// Horizontal line
const hLine = page.graphicLines.add({
    geometricBounds: [100, 50, 100, 300]  // y1=y2 for horizontal
});

// Vertical line
const vLine = page.graphicLines.add({
    geometricBounds: [50, 350, 200, 350]  // x1=x2 for vertical
});

// Line properties
hLine.strokeColor = doc.swatches.itemByName("Black");
hLine.strokeWeight = 2;
hLine.strokeType = doc.strokeStyles.itemByName("Solid");

// Dashed line
vLine.strokeType = doc.strokeStyles.itemByName("Dashed");
```

## Geometric Bounds

### Understanding Bounds

```javascript
// geometricBounds = [y1, x1, y2, x2]
// [top, left, bottom, right]
// Origin is top-left of page/spread

const rect = page.rectangles.add({
    geometricBounds: [
        72,    // y1: top (1 inch from top)
        72,    // x1: left (1 inch from left)
        216,   // y2: bottom (3 inches from top)
        288    // x2: right (4 inches from left)
    ]
});

// Result: 2" tall x 3" wide rectangle at (1", 1")
```

### Reading Bounds

```javascript
const item = page.rectangles.item(0);

// Get bounds
const bounds = item.geometricBounds;
const [top, left, bottom, right] = bounds;

console.log(`Top: ${top}, Left: ${left}`);
console.log(`Bottom: ${bottom}, Right: ${right}`);
console.log(`Width: ${right - left}, Height: ${bottom - top}`);

// Visible bounds (includes stroke weight)
const visibleBounds = item.visibleBounds;
```

### Setting Bounds

```javascript
const item = page.rectangles.item(0);

// Move and resize by setting bounds
item.geometricBounds = [100, 100, 300, 400];

// Just move (keep same size)
const [top, left, bottom, right] = item.geometricBounds;
const width = right - left;
const height = bottom - top;
const newTop = 50;
const newLeft = 50;
item.geometricBounds = [newTop, newLeft, newTop + height, newLeft + width];
```

## Positioning

### Move Items

```javascript
const item = page.rectangles.item(0);

// Move to absolute position
item.move([100, 200]);  // [x, y] destination

// Move relative (using transform)
const currentBounds = item.geometricBounds;
const offsetX = 50;
const offsetY = 25;
item.geometricBounds = [
    currentBounds[0] + offsetY,
    currentBounds[1] + offsetX,
    currentBounds[2] + offsetY,
    currentBounds[3] + offsetX
];
```

### Center on Page

```javascript
function centerOnPage(item, page) {
    const pageBounds = page.bounds;  // [y1, x1, y2, x2]
    const pageWidth = pageBounds[3] - pageBounds[1];
    const pageHeight = pageBounds[2] - pageBounds[0];

    const itemBounds = item.geometricBounds;
    const itemWidth = itemBounds[3] - itemBounds[1];
    const itemHeight = itemBounds[2] - itemBounds[0];

    const newLeft = pageBounds[1] + (pageWidth - itemWidth) / 2;
    const newTop = pageBounds[0] + (pageHeight - itemHeight) / 2;

    item.geometricBounds = [
        newTop,
        newLeft,
        newTop + itemHeight,
        newLeft + itemWidth
    ];
}

centerOnPage(rect, page);
```

### Align Items

```javascript
function alignLeft(items) {
    if (items.length < 2) return;

    // Find leftmost position
    let minLeft = Infinity;
    for (const item of items) {
        const left = item.geometricBounds[1];
        if (left < minLeft) minLeft = left;
    }

    // Align all to left
    for (const item of items) {
        const bounds = item.geometricBounds;
        const width = bounds[3] - bounds[1];
        item.geometricBounds = [bounds[0], minLeft, bounds[2], minLeft + width];
    }
}

function distributeHorizontally(items) {
    if (items.length < 3) return;

    // Sort by left position
    items.sort((a, b) => a.geometricBounds[1] - b.geometricBounds[1]);

    const first = items[0].geometricBounds;
    const last = items[items.length - 1].geometricBounds;

    const totalWidth = last[3] - first[1];
    const spacing = totalWidth / (items.length - 1);

    for (let i = 1; i < items.length - 1; i++) {
        const item = items[i];
        const bounds = item.geometricBounds;
        const width = bounds[3] - bounds[1];
        const height = bounds[2] - bounds[0];
        const newLeft = first[1] + (spacing * i) - width / 2;

        item.geometricBounds = [bounds[0], newLeft, bounds[0] + height, newLeft + width];
    }
}
```

## Placing Images

### Basic Image Placement

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function placeImage() {
    const doc = app.activeDocument;
    const page = doc.pages.item(0);

    // Get image file
    const file = await fs.getFileForOpening({
        types: ["jpg", "jpeg", "png", "psd", "ai", "tif", "tiff", "pdf"]
    });

    if (!file) return;

    // Create frame
    const frame = page.rectangles.add({
        geometricBounds: [50, 50, 400, 500]
    });

    // Place image
    frame.place(file);

    return frame;
}
```

### Fit Options

```javascript
const frame = page.rectangles.item(0);

// Fit proportionally (may leave gaps)
frame.fit(FitOptions.PROPORTIONALLY);

// Fill frame proportionally (may crop)
frame.fit(FitOptions.FILL_PROPORTIONALLY);

// Fit content to frame (may distort)
frame.fit(FitOptions.CONTENT_TO_FRAME);

// Fit frame to content
frame.fit(FitOptions.FRAME_TO_CONTENT);

// Center content in frame
frame.fit(FitOptions.CENTER_CONTENT);
```

### Place Multiple Images

```javascript
async function placeMultipleImages(page, positions) {
    const files = await fs.getFileForOpening({
        types: ["jpg", "png", "psd"],
        allowMultiple: true
    });

    if (!files || files.length === 0) return;

    const frames = [];

    for (let i = 0; i < files.length && i < positions.length; i++) {
        const frame = page.rectangles.add({
            geometricBounds: positions[i]
        });
        frame.place(files[i]);
        frame.fit(FitOptions.FILL_PROPORTIONALLY);
        frames.push(frame);
    }

    return frames;
}

// Usage
const positions = [
    [50, 50, 250, 250],
    [50, 300, 250, 500],
    [300, 50, 500, 250],
    [300, 300, 500, 500]
];

placeMultipleImages(page, positions);
```

### Access Placed Image

```javascript
const frame = page.rectangles.item(0);

// Get placed graphic
const graphic = frame.allGraphics[0];

if (graphic) {
    console.log("File path:", graphic.itemLink.filePath);
    console.log("Original width:", graphic.actualPpi);

    // Relink to different file
    // graphic.itemLink.relink(newFile);
}
```

## Transformations

### Scale

```javascript
const item = page.rectangles.item(0);

// Scale uniformly
function scaleItem(item, scaleFactor) {
    const bounds = item.geometricBounds;
    const centerX = (bounds[1] + bounds[3]) / 2;
    const centerY = (bounds[0] + bounds[2]) / 2;
    const halfWidth = (bounds[3] - bounds[1]) / 2 * scaleFactor;
    const halfHeight = (bounds[2] - bounds[0]) / 2 * scaleFactor;

    item.geometricBounds = [
        centerY - halfHeight,
        centerX - halfWidth,
        centerY + halfHeight,
        centerX + halfWidth
    ];
}

scaleItem(item, 1.5);  // Scale to 150%

// Using transform matrix
item.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({
        horizontalScaleFactor: 1.5,
        verticalScaleFactor: 1.5
    })
);
```

### Rotate

```javascript
const item = page.rectangles.item(0);

// Rotate using transform
item.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({
        counterclockwiseRotationAngle: 45
    })
);

// Read rotation
console.log("Rotation:", item.absoluteRotationAngle);

// Reset rotation
item.absoluteRotationAngle = 0;
```

### Shear/Skew

```javascript
const item = page.rectangles.item(0);

// Shear transform
item.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({
        horizontalShearAngle: 15
    })
);

// Read shear
console.log("Shear:", item.absoluteShearAngle);
```

### Flip

```javascript
const item = page.rectangles.item(0);

// Flip horizontal
item.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({
        horizontalScaleFactor: -1
    })
);

// Flip vertical
item.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({
        verticalScaleFactor: -1
    })
);
```

## Fill and Stroke

### Fill Properties

```javascript
const item = page.rectangles.item(0);

// Solid fill
item.fillColor = doc.swatches.itemByName("Black");
item.fillTint = 100;  // 100% opacity

// No fill
item.fillColor = doc.swatches.itemByName("None");

// Fill with tint
item.fillColor = doc.swatches.itemByName("Red");
item.fillTint = 50;  // 50% tint
```

### Stroke Properties

```javascript
const item = page.rectangles.item(0);

// Stroke color and weight
item.strokeColor = doc.swatches.itemByName("Black");
item.strokeWeight = 2;  // points

// Stroke type
item.strokeType = doc.strokeStyles.itemByName("Solid");
item.strokeType = doc.strokeStyles.itemByName("Dashed");
item.strokeType = doc.strokeStyles.itemByName("Dotted");

// Stroke alignment
item.strokeAlignment = StrokeAlignment.CENTER_ALIGNMENT;
// Options: CENTER_ALIGNMENT, INSIDE_ALIGNMENT, OUTSIDE_ALIGNMENT

// No stroke
item.strokeColor = doc.swatches.itemByName("None");
```

### Corner Options

```javascript
const rect = page.rectangles.item(0);

// Rounded corners
rect.topLeftCornerOption = CornerOptions.ROUNDED_CORNER;
rect.topRightCornerOption = CornerOptions.ROUNDED_CORNER;
rect.bottomLeftCornerOption = CornerOptions.ROUNDED_CORNER;
rect.bottomRightCornerOption = CornerOptions.ROUNDED_CORNER;

// Corner radius
rect.topLeftCornerRadius = "0.25in";
rect.topRightCornerRadius = "0.25in";
rect.bottomLeftCornerRadius = "0.25in";
rect.bottomRightCornerRadius = "0.25in";

// Other corner options
// CornerOptions.NONE
// CornerOptions.ROUNDED_CORNER
// CornerOptions.INSET_CORNER
// CornerOptions.INVERSE_ROUNDED_CORNER
// CornerOptions.BEVEL_CORNER
// CornerOptions.FANCY_CORNER
```

## Groups

### Creating Groups

```javascript
const doc = app.activeDocument;
const page = doc.pages.item(0);

// Create some items
const rect1 = page.rectangles.add({ geometricBounds: [50, 50, 150, 150] });
const rect2 = page.rectangles.add({ geometricBounds: [50, 200, 150, 300] });
const oval = page.ovals.add({ geometricBounds: [100, 125, 200, 225] });

// Group items
const group = doc.groups.add([rect1, rect2, oval]);
```

### Group Properties

```javascript
const group = doc.groups.item(0);

// Access items in group
const items = group.allPageItems;
console.log(`Group contains ${items.length} items`);

// Group bounds
const bounds = group.geometricBounds;

// Move group
group.geometricBounds = [100, 100, bounds[2] - bounds[0] + 100, bounds[3] - bounds[1] + 100];
```

### Ungroup

```javascript
const group = doc.groups.item(0);
group.ungroup();
```

### Nested Groups

```javascript
// Create inner group
const innerGroup = doc.groups.add([rect1, rect2]);

// Create outer group containing inner group
const outerGroup = doc.groups.add([innerGroup, rect3]);

// Access nested items
for (const item of outerGroup.allPageItems) {
    console.log(item.constructor.name);
}
```

## Layers

### Assign to Layer

```javascript
const item = page.rectangles.item(0);

// Move to layer
item.itemLayer = doc.layers.itemByName("Graphics");
```

### Create on Layer

```javascript
const rect = page.rectangles.add({
    geometricBounds: [50, 50, 200, 300],
    itemLayer: doc.layers.itemByName("Background")
});
```

## Locking and Visibility

```javascript
const item = page.rectangles.item(0);

// Lock/unlock
item.locked = true;
item.locked = false;

// Show/hide
item.visible = false;
item.visible = true;
```

## Duplicate and Delete

### Duplicate

```javascript
const item = page.rectangles.item(0);

// Duplicate in place
const duplicate = item.duplicate();

// Duplicate with offset
const dup = item.duplicate();
const bounds = dup.geometricBounds;
dup.geometricBounds = [
    bounds[0] + 20,
    bounds[1] + 20,
    bounds[2] + 20,
    bounds[3] + 20
];
```

### Delete

```javascript
const item = page.rectangles.item(0);
item.remove();
```

## Selection

### Get Selection

```javascript
const selection = app.selection;

if (selection.length > 0) {
    for (const item of selection) {
        console.log(`Selected: ${item.constructor.name}`);
    }
}
```

### Set Selection

```javascript
// Select single item
app.selection = [rect];

// Select multiple items
app.selection = [rect, oval, textFrame];

// Clear selection
app.selection = [];
```

## Complete Examples

### Create Photo Grid

```javascript
async function createPhotoGrid(page, rows, cols, margin, gutter) {
    const doc = page.parent;
    const bounds = page.bounds;

    const pageWidth = bounds[3] - bounds[1];
    const pageHeight = bounds[2] - bounds[0];

    const availWidth = pageWidth - (2 * margin) - ((cols - 1) * gutter);
    const availHeight = pageHeight - (2 * margin) - ((rows - 1) * gutter);

    const cellWidth = availWidth / cols;
    const cellHeight = availHeight / rows;

    const frames = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = bounds[1] + margin + (c * (cellWidth + gutter));
            const y = bounds[0] + margin + (r * (cellHeight + gutter));

            const frame = page.rectangles.add({
                geometricBounds: [y, x, y + cellHeight, x + cellWidth]
            });

            frame.strokeColor = doc.swatches.itemByName("Black");
            frame.strokeWeight = 0.5;
            frame.fillColor = doc.swatches.itemByName("None");

            frames.push(frame);
        }
    }

    return frames;
}

// Usage
createPhotoGrid(app.activeDocument.pages.item(0), 3, 4, 36, 12);
```

### Create Decorative Border

```javascript
function createDecorativeBorder(page, margin, strokeWeight) {
    const doc = page.parent;
    const bounds = page.bounds;

    const innerBounds = [
        bounds[0] + margin,
        bounds[1] + margin,
        bounds[2] - margin,
        bounds[3] - margin
    ];

    // Outer rectangle
    const outer = page.rectangles.add({
        geometricBounds: innerBounds
    });

    outer.fillColor = doc.swatches.itemByName("None");
    outer.strokeColor = doc.swatches.itemByName("Black");
    outer.strokeWeight = strokeWeight;

    // Inner rectangle (offset)
    const offset = 6;
    const inner = page.rectangles.add({
        geometricBounds: [
            innerBounds[0] + offset,
            innerBounds[1] + offset,
            innerBounds[2] - offset,
            innerBounds[3] - offset
        ]
    });

    inner.fillColor = doc.swatches.itemByName("None");
    inner.strokeColor = doc.swatches.itemByName("Black");
    inner.strokeWeight = strokeWeight / 2;

    // Corner ornaments
    const cornerSize = 20;
    const corners = [
        [innerBounds[0], innerBounds[1]],                          // Top-left
        [innerBounds[0], innerBounds[3] - cornerSize],             // Top-right
        [innerBounds[2] - cornerSize, innerBounds[1]],             // Bottom-left
        [innerBounds[2] - cornerSize, innerBounds[3] - cornerSize] // Bottom-right
    ];

    for (const [y, x] of corners) {
        const corner = page.rectangles.add({
            geometricBounds: [y, x, y + cornerSize, x + cornerSize]
        });
        corner.fillColor = doc.swatches.itemByName("Black");
        corner.strokeColor = doc.swatches.itemByName("None");
    }

    return doc.groups.add([outer, inner]);
}

createDecorativeBorder(app.activeDocument.pages.item(0), 36, 2);
```

### Batch Place and Fit Images

```javascript
async function batchPlaceImages(page, bounds, fitOption = FitOptions.FILL_PROPORTIONALLY) {
    const files = await fs.getFileForOpening({
        types: ["jpg", "png", "psd", "tif"],
        allowMultiple: true
    });

    if (!files || files.length === 0) return [];

    const frames = [];
    const cols = Math.ceil(Math.sqrt(files.length));
    const rows = Math.ceil(files.length / cols);

    const totalWidth = bounds[3] - bounds[1];
    const totalHeight = bounds[2] - bounds[0];
    const gutter = 10;

    const cellWidth = (totalWidth - (cols - 1) * gutter) / cols;
    const cellHeight = (totalHeight - (rows - 1) * gutter) / rows;

    for (let i = 0; i < files.length; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;

        const x = bounds[1] + col * (cellWidth + gutter);
        const y = bounds[0] + row * (cellHeight + gutter);

        const frame = page.rectangles.add({
            geometricBounds: [y, x, y + cellHeight, x + cellWidth]
        });

        frame.place(files[i]);
        frame.fit(fitOption);

        frames.push(frame);
    }

    return frames;
}

// Usage
batchPlaceImages(
    app.activeDocument.pages.item(0),
    [50, 50, 700, 550]
);
```
