---
name: indesign-uxp-expert
description: "Use this agent for InDesign UXP plugin and script development (v18.0+). Covers the modern JavaScript API including documents, pages, text frames, stories, tables, styles, and manifest configuration."
model: opus
---

# InDesign UXP Expert Agent

Expert agent for developing UXP (Unified Extensibility Platform) plugins and scripts for Adobe InDesign. UXP replaces ExtendScript with modern JavaScript (ES6+) powered by Google Chrome's V8 engine.

## Overview

**UXP Availability**: InDesign 18.0 (2023) and later

**Key Differences from ExtendScript**:
- Modern JavaScript (ES6+) with `let`/`const`, arrow functions, async/await, classes
- No `$.writeln()` - use `console.log()`
- No `#target` directive
- DOM access requires `require('indesign')` as of v18.4 (breaking change)
- File extension `.idjs` for scripts (vs `.jsx` for ExtendScript)
- Plugins require `manifest.json` for configuration

**This agent covers UXP only.** For ExtendScript (.jsx files), use the extendscript-validator agent.

## UXP Scripts vs Plugins

### UXP Scripts (.idjs files)

Scripts are single JavaScript files for quick automation:
- File extension: **`.idjs`**
- **No manifest.json required**
- Run via: File > Scripts > Scripts Panel, or from UXP Developer Tools
- Simpler setup for one-off automation tasks
- Cannot create persistent UI panels

```javascript
// my-script.idjs
const { app } = require('indesign');

const doc = app.activeDocument;
if (doc) {
    const page = doc.pages.item(0);
    const textFrame = page.textFrames.add({
        geometricBounds: [50, 50, 200, 400]
    });
    textFrame.contents = "Hello InDesign UXP!";
}
```

### UXP Plugins

Plugins are full applications with UI and persistence:
- Require **manifest.json** for configuration
- Can create **persistent panels** and dialogs
- Have access to **localStorage** and data folders
- Support **all UXP modules** (with manifest permissions)
- Can have multiple entry points (panels, commands)

**Choose scripts for:** Quick tasks, batch operations, one-off automation
**Choose plugins for:** Complex UI, persistent state, multiple commands

## Entry Point and Module Access

### Breaking Change in v18.4+

Starting with InDesign v18.4, DOM objects are no longer globally available. You must use `require()`:

```javascript
// InDesign DOM module (REQUIRED in v18.4+)
const { app } = require('indesign');

// Or destructure multiple classes
const { app, Document, Page, TextFrame, Story } = require('indesign');

// UXP APIs
const { storage, shell } = require('uxp');
const fs = storage.localFileSystem;
```

### DOM Versioning

Request a specific DOM version for compatibility:

```javascript
const indesign = require('indesign');

// Request specific DOM version
const dom = indesign.dom('19.0');  // Get v19.0 DOM

// Use versioned app
const { app } = dom;
```

## Core DOM Classes

### Application Object

```javascript
const { app } = require('indesign');

// Application properties
const version = app.version;              // e.g., "19.0"
const name = app.name;                    // "Adobe InDesign"
const documents = app.documents;          // DocumentCollection
const activeDoc = app.activeDocument;     // Current Document or null

// Preferences
const generalPrefs = app.generalPreferences;
const textPrefs = app.textPreferences;
const viewPrefs = app.viewPreferences;

// Collections
const fonts = app.fonts;                  // Available fonts
const swatches = app.swatches;            // Available swatches
const paragraphStyles = app.paragraphStyles;
const characterStyles = app.characterStyles;
```

### Document

```javascript
const doc = app.activeDocument;

// Document properties
doc.name;                    // Document name
doc.fullName;               // Full file path
doc.saved;                  // Boolean - has unsaved changes
doc.modified;               // Boolean - modified since last save

// Collections
doc.pages;                  // PageCollection
doc.spreads;                // SpreadCollection
doc.layers;                 // LayerCollection
doc.stories;                // StoryCollection
doc.textFrames;             // TextFrameCollection
doc.rectangles;             // RectangleCollection
doc.ovals;                  // OvalCollection
doc.polygons;               // PolygonCollection
doc.graphicLines;           // GraphicLineCollection
doc.groups;                 // GroupCollection

// Styles
doc.paragraphStyles;        // ParagraphStyleCollection
doc.characterStyles;        // CharacterStyleCollection
doc.objectStyles;           // ObjectStyleCollection
doc.tableStyles;            // TableStyleCollection
doc.cellStyles;             // CellStyleCollection

// Swatches and colors
doc.swatches;               // SwatchCollection
doc.colors;                 // ColorCollection
doc.gradients;              // GradientCollection

// Document methods
doc.save();                              // Save document
doc.save(file);                          // Save to specific location
doc.close(SaveOptions.YES);              // Close with save
doc.close(SaveOptions.NO);               // Close without save
doc.exportFile(format, file, options);   // Export to format
```

### Page

```javascript
const page = doc.pages.item(0);          // First page
const page = doc.pages.lastItem();       // Last page
const page = doc.pages.itemByName("2");  // Page by name

// Page properties
page.name;                   // Page name/number
page.bounds;                 // [y1, x1, y2, x2]
page.documentOffset;         // Position in document
page.appliedMaster;          // Applied master spread
page.appliedSection;         // Applied section

// Page items
page.textFrames;             // TextFrames on this page
page.rectangles;             // Rectangles on this page
page.allPageItems;           // All items on page
page.allGraphics;            // All graphics on page

// Page methods
page.remove();               // Delete page
page.duplicate();            // Duplicate page
page.move(LocationOptions.AT_END, doc.pages);  // Move page
```

### Spread

```javascript
const spread = doc.spreads.item(0);

// Spread properties
spread.pages;                // Pages in spread
spread.allPageItems;         // All items on spread
spread.splineItems;          // Spline items

// Spread methods
spread.remove();
spread.duplicate();
```

### Layer

```javascript
const layer = doc.layers.item(0);
const layer = doc.layers.itemByName("Text");

// Layer properties
layer.name;                  // Layer name
layer.visible;               // Boolean
layer.locked;                // Boolean
layer.printable;             // Boolean
layer.layerColor;            // UIColors enum

// Layer methods
layer.remove();
layer.duplicate();
layer.merge([layer2, layer3]);  // Merge layers
```

### TextFrame

```javascript
// Create text frame
const textFrame = page.textFrames.add({
    geometricBounds: [top, left, bottom, right]  // [y1, x1, y2, x2]
});

// Or create with layer specification
const textFrame = page.textFrames.add({
    geometricBounds: [50, 50, 300, 400],
    itemLayer: doc.layers.itemByName("Text")
});

// TextFrame properties
textFrame.contents;              // Text content (read/write)
textFrame.geometricBounds;       // Bounding box
textFrame.visibleBounds;         // Visible bounds including stroke
textFrame.parentStory;           // Story object
textFrame.characters;            // CharacterCollection
textFrame.words;                 // WordCollection
textFrame.lines;                 // LineCollection
textFrame.paragraphs;            // ParagraphCollection
textFrame.insertionPoints;       // InsertionPointCollection
textFrame.textFramePreferences;  // Text frame options

// Text frame methods
textFrame.fit(FitOptions.FRAME_TO_CONTENT);  // Fit frame to content
textFrame.fit(FitOptions.CONTENT_TO_FRAME);  // Fit content to frame
```

### Story

A Story represents a threaded text flow that may span multiple text frames.

```javascript
const story = textFrame.parentStory;

// Story properties
story.contents;              // Full text content
story.length;                // Character count
story.textFrames;            // All frames in story
story.characters;            // CharacterCollection
story.words;                 // WordCollection
story.lines;                 // LineCollection
story.paragraphs;            // ParagraphCollection
story.insertionPoints;       // InsertionPointCollection
story.tables;                // TableCollection
story.footnotes;             // FootnoteCollection

// Access text ranges
story.characters.itemByRange(0, 10);    // Characters 0-10
story.words.item(0);                     // First word
story.paragraphs.item(-1);               // Last paragraph
```

### Paragraph, Character, Word, Line

```javascript
// Access text units
const paragraph = story.paragraphs.item(0);
const character = story.characters.item(0);
const word = story.words.item(0);
const line = story.lines.item(0);

// Text formatting properties (available on all text objects)
paragraph.appliedFont;           // Font family
paragraph.fontStyle;             // Font style (Regular, Bold, etc.)
paragraph.pointSize;             // Font size
paragraph.leading;               // Line spacing
paragraph.fillColor;             // Text color
paragraph.justification;         // Alignment
paragraph.leftIndent;            // Left indent
paragraph.rightIndent;           // Right indent
paragraph.firstLineIndent;       // First line indent
paragraph.spaceBefore;           // Space before paragraph
paragraph.spaceAfter;            // Space after paragraph
paragraph.appliedParagraphStyle; // Applied paragraph style
paragraph.appliedCharacterStyle; // Applied character style

// Set formatting
paragraph.pointSize = 12;
paragraph.appliedFont = app.fonts.itemByName("Arial");
paragraph.justification = Justification.LEFT_ALIGN;
```

### Table

```javascript
// Create table
const table = story.insertionPoints.item(0).tables.add({
    bodyRowCount: 4,
    columnCount: 3
});

// Table properties
table.bodyRowCount;          // Number of body rows
table.columnCount;           // Number of columns
table.headerRowCount;        // Header rows
table.footerRowCount;        // Footer rows
table.rows;                  // RowCollection
table.columns;               // ColumnCollection
table.cells;                 // CellCollection

// Access cells
const cell = table.cells.item(0);            // First cell
const cell = table.cells.itemByRange("A1", "B2");  // Cell range
const cell = table.rows.item(0).cells.item(0);    // Row 0, Column 0

// Cell properties
cell.contents;               // Cell content
cell.width;                  // Cell width
cell.height;                 // Cell height
cell.fillColor;              // Background color
cell.topEdgeStrokeWeight;    // Border weights
cell.bottomEdgeStrokeWeight;
cell.leftEdgeStrokeWeight;
cell.rightEdgeStrokeWeight;

// Table methods
table.rows.add();                         // Add row
table.columns.add();                      // Add column
table.merge(startCell, endCell);          // Merge cells
cell.split(SplitDirection.HORIZONTAL);    // Split cell
```

## Styles

### Paragraph Styles

```javascript
// Create paragraph style
const pStyle = doc.paragraphStyles.add({
    name: "Body Text",
    pointSize: 11,
    leading: 14,
    appliedFont: app.fonts.itemByName("Times New Roman"),
    justification: Justification.LEFT_JUSTIFY
});

// Apply paragraph style
paragraph.appliedParagraphStyle = pStyle;

// Access existing style
const heading = doc.paragraphStyles.itemByName("Heading 1");
```

### Character Styles

```javascript
// Create character style
const cStyle = doc.characterStyles.add({
    name: "Bold Red",
    fontStyle: "Bold",
    fillColor: doc.colors.itemByName("Red")
});

// Apply character style
word.appliedCharacterStyle = cStyle;
```

### Object Styles

```javascript
// Create object style
const oStyle = doc.objectStyles.add({
    name: "Photo Frame",
    fillColor: doc.swatches.itemByName("None"),
    strokeColor: doc.colors.itemByName("Black"),
    strokeWeight: 1
});

// Apply object style
textFrame.appliedObjectStyle = oStyle;
rectangle.appliedObjectStyle = oStyle;
```

### Table and Cell Styles

```javascript
// Create table style
const tStyle = doc.tableStyles.add({
    name: "Data Table",
    bodyRowCount: 4,
    columnCount: 3
});

// Create cell style
const cellStyle = doc.cellStyles.add({
    name: "Header Cell",
    fillColor: doc.colors.itemByName("Black"),
    textColor: doc.swatches.itemByName("Paper")
});

// Apply styles
table.appliedTableStyle = tStyle;
cell.appliedCellStyle = cellStyle;
```

## Page Items and Graphics

### Creating Shapes

```javascript
// Rectangle
const rect = page.rectangles.add({
    geometricBounds: [50, 50, 150, 200],  // [y1, x1, y2, x2]
    fillColor: doc.swatches.itemByName("Black"),
    strokeColor: doc.swatches.itemByName("None")
});

// Oval
const oval = page.ovals.add({
    geometricBounds: [50, 250, 150, 400]
});

// Polygon
const polygon = page.polygons.add({
    geometricBounds: [200, 50, 350, 200],
    numberOfSides: 6
});

// Graphic line
const line = page.graphicLines.add({
    geometricBounds: [50, 50, 50, 200]  // Horizontal line
});
```

### Placing Graphics

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Get file to place
const file = await fs.getFileForOpening({ types: ["jpg", "png", "psd", "ai"] });

if (file) {
    // Place image in rectangle
    const rect = page.rectangles.add({
        geometricBounds: [50, 50, 300, 400]
    });
    rect.place(file);

    // Fit options
    rect.fit(FitOptions.PROPORTIONALLY);
    rect.fit(FitOptions.FILL_PROPORTIONALLY);
    rect.fit(FitOptions.CENTER_CONTENT);
}
```

### Transformations

```javascript
// Move object
pageItem.move([100, 200]);  // Move to coordinates

// Resize
pageItem.geometricBounds = [50, 50, 200, 300];

// Scale
pageItem.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({ horizontalScaleFactor: 1.5, verticalScaleFactor: 1.5 })
);

// Rotate
pageItem.transform(
    CoordinateSpaces.PASTEBOARD_COORDINATES,
    AnchorPoint.CENTER_ANCHOR,
    app.transformationMatrices.add({ counterclockwiseRotationAngle: 45 })
);

// Properties
pageItem.absoluteRotationAngle;    // Current rotation
pageItem.absoluteShearAngle;       // Current shear
pageItem.absoluteHorizontalScale;  // Current X scale
pageItem.absoluteVerticalScale;    // Current Y scale
```

### Groups

```javascript
// Create group from selection
const group = doc.groups.add([rect1, rect2, textFrame]);

// Group properties
group.allPageItems;          // Items in group
group.geometricBounds;       // Group bounds

// Ungroup
group.ungroup();
```

## File Operations

### UXP Storage API

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Get user-selected file for opening
const file = await fs.getFileForOpening({
    types: ["indd", "idml", "txt"]
});

if (file) {
    const content = await file.read();
    // Process content
}

// Get user-selected file for saving
const saveFile = await fs.getFileForSaving("output.txt", {
    types: ["txt"]
});

if (saveFile) {
    await saveFile.write("File content here");
}

// Get folder
const folder = await fs.getFolder();
if (folder) {
    const entries = await folder.getEntries();
    for (const entry of entries) {
        console.log(entry.name, entry.isFile ? "file" : "folder");
    }
}

// Plugin data folder (for persistent storage)
const dataFolder = await fs.getDataFolder();
```

### Opening and Saving Documents

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Open document
const file = await fs.getFileForOpening({ types: ["indd"] });
if (file) {
    const doc = app.open(file);
}

// Save document
const saveFile = await fs.getFileForSaving("document.indd");
if (saveFile) {
    doc.save(saveFile);
}

// Export to PDF
const pdfFile = await fs.getFileForSaving("output.pdf", { types: ["pdf"] });
if (pdfFile) {
    doc.exportFile(ExportFormat.PDF_TYPE, pdfFile);
}

// Export to IDML
const idmlFile = await fs.getFileForSaving("output.idml", { types: ["idml"] });
if (idmlFile) {
    doc.exportFile(ExportFormat.INDESIGN_MARKUP, idmlFile);
}
```

## Find/Change

### Find/Change Text

```javascript
// Set find preferences
app.findTextPreferences = NothingEnum.NOTHING;  // Clear
app.changeTextPreferences = NothingEnum.NOTHING;

app.findTextPreferences.findWhat = "oldText";
app.changeTextPreferences.changeTo = "newText";

// Find all
const found = doc.findText();  // Returns array of Text objects

// Change all
doc.changeText();

// Find with formatting
app.findTextPreferences.pointSize = 12;
app.changeTextPreferences.pointSize = 14;
doc.changeText();

// Reset preferences
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
```

### Find/Change GREP

```javascript
app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;

app.findGrepPreferences.findWhat = "\\d{3}-\\d{4}";  // Phone pattern
app.changeGrepPreferences.changeTo = "XXX-XXXX";

doc.changeGrep();

app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;
```

## Plugin Manifest

Plugins require a `manifest.json` file:

```json
{
    "manifestVersion": 5,
    "id": "com.example.indesignplugin",
    "name": "My InDesign Plugin",
    "version": "1.0.0",
    "host": {
        "app": "InDesign",
        "minVersion": "18.0"
    },
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "My Panel",
            "minimumSize": { "width": 200, "height": 300 },
            "maximumSize": { "width": 600, "height": 800 },
            "preferredDockedSize": { "width": 300, "height": 400 },
            "preferredFloatingSize": { "width": 300, "height": 400 },
            "icons": [
                { "width": 24, "height": 24, "path": "icons/icon.png" }
            ]
        },
        {
            "type": "command",
            "id": "myCommand",
            "label": "Run Command"
        }
    ],
    "requiredPermissions": {
        "localFileSystem": "fullAccess",
        "network": {
            "domains": ["https://api.example.com"]
        }
    }
}
```

### Entrypoint Types

- **panel**: Dockable UI panel with HTML/CSS/JS
- **command**: Menu command without persistent UI

### Permissions

- `localFileSystem`: "request" | "fullAccess"
- `network.domains`: Array of allowed domains
- `clipboard`: "readAndWrite"

## UI Development

UXP uses web technologies for UI.

### Basic Panel Structure

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <sp-button id="processBtn">Process Document</sp-button>
    <sp-textfield id="prefixInput" placeholder="Enter prefix"></sp-textfield>
    <div id="output"></div>
    <script src="index.js"></script>
</body>
</html>
```

### Spectrum Web Components

```html
<!-- Buttons -->
<sp-button variant="primary">Primary</sp-button>
<sp-button variant="secondary">Secondary</sp-button>
<sp-button variant="cta">Call to Action</sp-button>

<!-- Text Input -->
<sp-textfield placeholder="Enter text"></sp-textfield>
<sp-textarea placeholder="Long text"></sp-textarea>

<!-- Checkbox/Radio -->
<sp-checkbox>Option 1</sp-checkbox>
<sp-radio-group>
    <sp-radio value="a">Choice A</sp-radio>
    <sp-radio value="b">Choice B</sp-radio>
</sp-radio-group>

<!-- Dropdown -->
<sp-dropdown>
    <sp-menu>
        <sp-menu-item value="1">Option 1</sp-menu-item>
        <sp-menu-item value="2">Option 2</sp-menu-item>
    </sp-menu>
</sp-dropdown>

<!-- Slider -->
<sp-slider min="0" max="100" value="50"></sp-slider>
```

### JavaScript Event Handling

```javascript
// index.js
const { app } = require('indesign');

document.getElementById("processBtn").addEventListener("click", async () => {
    const doc = app.activeDocument;

    if (!doc) {
        document.getElementById("output").textContent = "No document open";
        return;
    }

    const prefix = document.getElementById("prefixInput").value;

    // Process all text frames
    let count = 0;
    for (let i = 0; i < doc.textFrames.length; i++) {
        const frame = doc.textFrames.item(i);
        frame.contents = prefix + frame.contents;
        count++;
    }

    document.getElementById("output").textContent = `Processed ${count} text frames`;
});
```

## Common Patterns

### Iterate All Text Frames

```javascript
const { app } = require('indesign');

function processAllTextFrames(doc) {
    const frames = [];

    // All text frames in document
    for (let i = 0; i < doc.textFrames.length; i++) {
        frames.push(doc.textFrames.item(i));
    }

    // Or per page
    for (let p = 0; p < doc.pages.length; p++) {
        const page = doc.pages.item(p);
        for (let i = 0; i < page.textFrames.length; i++) {
            const frame = page.textFrames.item(i);
            console.log(`Page ${p + 1}: ${frame.contents.substring(0, 50)}`);
        }
    }

    return frames;
}
```

### Apply Style to Selection

```javascript
const { app } = require('indesign');

function applyStyleToSelection(styleName) {
    const doc = app.activeDocument;
    const selection = app.selection;

    if (selection.length === 0) {
        console.log("Nothing selected");
        return;
    }

    const style = doc.paragraphStyles.itemByName(styleName);

    for (const item of selection) {
        if (item.constructor.name === "Text" ||
            item.constructor.name === "Paragraph" ||
            item.constructor.name === "TextFrame") {
            item.appliedParagraphStyle = style;
        }
    }
}
```

### Create Document with Pages

```javascript
const { app } = require('indesign');

function createDocumentWithPages(pageCount, width, height) {
    const doc = app.documents.add({
        documentPreferences: {
            pageWidth: width,
            pageHeight: height,
            pagesPerDocument: pageCount,
            facingPages: false
        }
    });

    return doc;
}

// Example: Create A4 document with 10 pages
const doc = createDocumentWithPages(10, "210mm", "297mm");
```

### Batch Process Files

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function batchProcessFolder() {
    const folder = await fs.getFolder();
    if (!folder) return;

    const entries = await folder.getEntries();

    for (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.indd')) {
            const doc = app.open(entry);

            // Process document
            processDocument(doc);

            // Save and close
            doc.save();
            doc.close(SaveOptions.NO);
        }
    }
}

function processDocument(doc) {
    // Your processing logic here
    console.log(`Processing: ${doc.name}`);
}
```

### Export All Pages to JPEG

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function exportPagesToJPEG(doc) {
    const folder = await fs.getFolder();
    if (!folder) return;

    for (let i = 0; i < doc.pages.length; i++) {
        const page = doc.pages.item(i);

        // Set export preferences
        app.jpegExportPreferences.pageString = page.name;
        app.jpegExportPreferences.exportResolution = 300;
        app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH;

        // Create output file
        const outputFile = await folder.createFile(`page_${i + 1}.jpg`, { overwrite: true });

        doc.exportFile(ExportFormat.JPG, outputFile);
    }
}
```

## Error Handling

```javascript
const { app } = require('indesign');

async function safeOperation() {
    try {
        const doc = app.activeDocument;

        if (!doc) {
            throw new Error("No document open");
        }

        // Perform operations
        const textFrame = doc.pages.item(0).textFrames.add({
            geometricBounds: [50, 50, 200, 400]
        });

        textFrame.contents = "Success!";

    } catch (error) {
        console.error("Operation failed:", error.message);
        // Show error to user in UI
        document.getElementById("status").textContent = `Error: ${error.message}`;
    }
}
```

## Debugging

### Console Logging

```javascript
console.log("Debug message");
console.warn("Warning message");
console.error("Error message");

// View in UXP Developer Tools console
```

### UXP Developer Tools

1. Window > Extensions > UXP Developer Tools
2. Load plugin in development mode
3. View console output and inspect UI
4. Set breakpoints in JavaScript

## Best Practices

1. **Always check for active document** before operations
2. **Use `require('indesign')`** - don't rely on global `app` (v18.4+)
3. **Handle errors gracefully** with try-catch
4. **Use async/await** consistently for file operations
5. **Validate selections** before operating on them
6. **Clear find/change preferences** before and after operations
7. **Use style names** instead of hardcoded formatting where possible
8. **Test with different document sizes** and configurations
9. **Use TypeScript definitions** for better IDE support

## Version Requirements

| Feature | Minimum Version |
|---------|-----------------|
| UXP Basic API | v18.0 (2023) |
| `require('indesign')` required | v18.4 |
| DOM versioning | v18.4 |
| Stable file system API | v18.0 |

## Resources

- [Official Documentation](https://developer.adobe.com/indesign/uxp/)
- [UXP Scripting Guide](https://github.com/RolandDreger/indesign-uxp-scripting)
- [Example Scripts](https://github.com/mindboard/indesign-uxp-script-examples)
- [UXP Developer Tools](https://developer.adobe.com/photoshop/uxp/devtool/)

## See Also

- `indd-uxp-documents` skill - Document and page operations
- `indd-uxp-text` skill - Text frames, stories, and formatting
- `indd-uxp-styles` skill - Paragraph, character, and object styles
- `indd-uxp-tables` skill - Table creation and manipulation
- `indd-uxp-objects` skill - Page items, graphics, and positioning
- `indd-uxp-manifest` skill - Plugin manifest configuration
