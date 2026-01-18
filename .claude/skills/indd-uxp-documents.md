---
name: indd-uxp-documents
description: "InDesign UXP document and page operations: creating documents, opening/saving, page management, spreads, layers, and document properties."
---

# InDesign UXP: Documents and Pages

## Overview

Document and page management in InDesign UXP using modern JavaScript (ES6+). Covers creating documents, opening/saving files, page operations, spreads, layers, and document preferences.

**Requires**: InDesign v18.0+ (v18.4+ for `require('indesign')`)

## Module Import

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;
```

## Creating Documents

### Basic Document Creation

```javascript
const { app } = require('indesign');

// Create document with default settings
const doc = app.documents.add();

// Create with specific settings
const doc = app.documents.add({
    documentPreferences: {
        pageWidth: "8.5in",
        pageHeight: "11in",
        pagesPerDocument: 10,
        facingPages: false
    }
});
```

### Document Presets

```javascript
// A4 Document
const a4Doc = app.documents.add({
    documentPreferences: {
        pageWidth: "210mm",
        pageHeight: "297mm",
        pagesPerDocument: 1
    }
});

// Letter Document
const letterDoc = app.documents.add({
    documentPreferences: {
        pageWidth: "8.5in",
        pageHeight: "11in",
        pagesPerDocument: 1
    }
});

// Square Document
const squareDoc = app.documents.add({
    documentPreferences: {
        pageWidth: "6in",
        pageHeight: "6in",
        pagesPerDocument: 1
    }
});
```

### Full Document Options

```javascript
const doc = app.documents.add({
    documentPreferences: {
        pageWidth: "8.5in",
        pageHeight: "11in",
        pagesPerDocument: 20,
        facingPages: true,
        pageOrientation: PageOrientation.PORTRAIT,
        columnCount: 2,
        columnGutter: "0.1667in"
    },
    marginPreferences: {
        top: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
        right: "0.5in"
    }
});
```

## Opening Documents

### Open with File Dialog

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function openDocument() {
    const file = await fs.getFileForOpening({
        types: ["indd", "idml"]
    });

    if (file) {
        const doc = app.open(file);
        console.log(`Opened: ${doc.name}`);
        return doc;
    }
    return null;
}
```

### Open Recent

```javascript
// Access app's active document
const doc = app.activeDocument;

// Check if document exists
if (doc) {
    console.log(`Active document: ${doc.name}`);
} else {
    console.log("No document open");
}
```

## Saving Documents

### Save Document

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Save existing document (if already has path)
doc.save();

// Save As (with dialog)
async function saveDocumentAs(doc) {
    const file = await fs.getFileForSaving("document.indd", {
        types: ["indd"]
    });

    if (file) {
        doc.save(file);
        console.log(`Saved to: ${file.nativePath}`);
    }
}
```

### Export Formats

```javascript
async function exportDocument(doc) {
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

    // Export to EPUB
    const epubFile = await fs.getFileForSaving("output.epub", { types: ["epub"] });
    if (epubFile) {
        doc.exportFile(ExportFormat.EPUB, epubFile);
    }

    // Export to HTML
    const htmlFile = await fs.getFileForSaving("output.html", { types: ["html"] });
    if (htmlFile) {
        doc.exportFile(ExportFormat.HTML, htmlFile);
    }
}
```

### PDF Export Options

```javascript
async function exportToPDF(doc) {
    const pdfFile = await fs.getFileForSaving("output.pdf", { types: ["pdf"] });

    if (pdfFile) {
        // Configure PDF export preferences
        app.pdfExportPreferences.pageRange = PageRange.ALL_PAGES;
        app.pdfExportPreferences.exportLayers = false;
        app.pdfExportPreferences.viewPDF = true;

        doc.exportFile(ExportFormat.PDF_TYPE, pdfFile);
    }
}
```

## Closing Documents

```javascript
// Close without saving
doc.close(SaveOptions.NO);

// Close and save
doc.close(SaveOptions.YES);

// Close with prompt
doc.close(SaveOptions.PROMPT);

// Close all documents
function closeAllDocuments(save = false) {
    while (app.documents.length > 0) {
        app.documents.item(0).close(save ? SaveOptions.YES : SaveOptions.NO);
    }
}
```

## Document Properties

### Read Properties

```javascript
const doc = app.activeDocument;

// Identity
console.log("Name:", doc.name);
console.log("Full path:", doc.fullName);
console.log("Saved:", doc.saved);
console.log("Modified:", doc.modified);

// Dimensions
const prefs = doc.documentPreferences;
console.log("Page width:", prefs.pageWidth);
console.log("Page height:", prefs.pageHeight);
console.log("Page count:", doc.pages.length);
console.log("Spread count:", doc.spreads.length);

// Settings
console.log("Facing pages:", prefs.facingPages);
console.log("Column count:", prefs.columnCount);
```

### Modify Document Settings

```javascript
const doc = app.activeDocument;
const prefs = doc.documentPreferences;

// Change page size
prefs.pageWidth = "10in";
prefs.pageHeight = "8in";

// Change orientation
prefs.pageOrientation = PageOrientation.LANDSCAPE;

// Change columns
prefs.columnCount = 3;
prefs.columnGutter = "0.25in";
```

### Margin Preferences

```javascript
const doc = app.activeDocument;
const margins = doc.marginPreferences;

margins.top = "1in";
margins.bottom = "1in";
margins.left = "0.75in";
margins.right = "0.75in";

// For facing pages, use inside/outside
margins.columnCount = 2;
```

## Page Management

### Accessing Pages

```javascript
const doc = app.activeDocument;

// First page
const firstPage = doc.pages.item(0);

// Last page
const lastPage = doc.pages.lastItem();

// Page by index
const page5 = doc.pages.item(4);  // 0-indexed

// Page by name
const namedPage = doc.pages.itemByName("iii");  // For roman numerals

// Iterate all pages
for (let i = 0; i < doc.pages.length; i++) {
    const page = doc.pages.item(i);
    console.log(`Page ${i + 1}: ${page.name}`);
}
```

### Adding Pages

```javascript
const doc = app.activeDocument;

// Add single page at end
const newPage = doc.pages.add();

// Add page at specific location
const pageBefore = doc.pages.add(LocationOptions.BEFORE, doc.pages.item(0));
const pageAfter = doc.pages.add(LocationOptions.AFTER, doc.pages.item(2));
const pageAtEnd = doc.pages.add(LocationOptions.AT_END);
const pageAtBeginning = doc.pages.add(LocationOptions.AT_BEGINNING);

// Add multiple pages
function addPages(doc, count) {
    for (let i = 0; i < count; i++) {
        doc.pages.add();
    }
}
```

### Removing Pages

```javascript
// Remove specific page
doc.pages.item(5).remove();

// Remove last page
doc.pages.lastItem().remove();

// Remove range of pages
function removePageRange(doc, start, end) {
    // Remove from end to avoid index shifting
    for (let i = end; i >= start; i--) {
        doc.pages.item(i).remove();
    }
}
```

### Moving Pages

```javascript
// Move page to different position
const page = doc.pages.item(5);
page.move(LocationOptions.BEFORE, doc.pages.item(0));

// Move page to end
page.move(LocationOptions.AT_END);

// Move to specific spread
page.move(LocationOptions.AFTER, doc.spreads.item(2).pages.lastItem());
```

### Duplicating Pages

```javascript
// Duplicate page
const original = doc.pages.item(0);
const duplicate = original.duplicate();

// Duplicate to specific location
const dup = original.duplicate(LocationOptions.AT_END);
```

### Page Properties

```javascript
const page = doc.pages.item(0);

// Page bounds (read-only)
const bounds = page.bounds;  // [y1, x1, y2, x2]

// Applied master
page.appliedMaster = doc.masterSpreads.itemByName("A-Master");

// Applied section
console.log("Section:", page.appliedSection.name);

// Page items on page
const pageItems = page.allPageItems;
const textFrames = page.textFrames;
const rectangles = page.rectangles;
```

## Spreads

### Accessing Spreads

```javascript
const doc = app.activeDocument;

// First spread
const firstSpread = doc.spreads.item(0);

// All spreads
for (let i = 0; i < doc.spreads.length; i++) {
    const spread = doc.spreads.item(i);
    console.log(`Spread ${i + 1} has ${spread.pages.length} pages`);
}
```

### Spread Properties

```javascript
const spread = doc.spreads.item(0);

// Pages in spread
const pages = spread.pages;
console.log(`Pages in spread: ${pages.length}`);

// All items on spread
const items = spread.allPageItems;

// Spread bounds
const bounds = spread.pages.item(0).bounds;
```

### Adding Spreads

```javascript
// Add spread at end
const newSpread = doc.spreads.add();

// Add spread at location
const spreadBefore = doc.spreads.add(LocationOptions.BEFORE, doc.spreads.item(0));
```

## Layers

### Accessing Layers

```javascript
const doc = app.activeDocument;

// First layer
const layer = doc.layers.item(0);

// Layer by name
const textLayer = doc.layers.itemByName("Text");
const imagesLayer = doc.layers.itemByName("Images");

// Iterate layers
for (let i = 0; i < doc.layers.length; i++) {
    const layer = doc.layers.item(i);
    console.log(`Layer: ${layer.name}, Visible: ${layer.visible}`);
}
```

### Creating Layers

```javascript
// Create new layer
const newLayer = doc.layers.add({
    name: "New Layer"
});

// Create with properties
const layer = doc.layers.add({
    name: "Background",
    visible: true,
    locked: false,
    printable: true,
    layerColor: UIColors.LIGHT_BLUE
});
```

### Layer Properties

```javascript
const layer = doc.layers.item(0);

// Read/write properties
layer.name = "My Layer";
layer.visible = true;
layer.locked = false;
layer.printable = true;
layer.layerColor = UIColors.RED;

// Read-only
console.log("Item count:", layer.allPageItems.length);
```

### Layer Operations

```javascript
// Move layer
layer.move(LocationOptions.BEFORE, doc.layers.item(0));

// Duplicate layer
const duplicate = layer.duplicate();

// Delete layer
layer.remove();

// Merge layers
layer.merge([doc.layers.itemByName("Layer 2")]);
```

### Target Layer for New Items

```javascript
// Set active layer (new items will be created on this layer)
doc.activeLayer = doc.layers.itemByName("Text");

// Create item on specific layer
const textFrame = page.textFrames.add({
    geometricBounds: [50, 50, 200, 400],
    itemLayer: doc.layers.itemByName("Text")
});
```

## Master Pages

### Accessing Masters

```javascript
const doc = app.activeDocument;

// All master spreads
const masters = doc.masterSpreads;

// Master by name
const masterA = doc.masterSpreads.itemByName("A-Master");

// Master by prefix
const masterB = doc.masterSpreads.itemByName("B-Master");
```

### Creating Masters

```javascript
// Create new master spread
const newMaster = doc.masterSpreads.add({
    namePrefix: "C",
    baseName: "Content"
});

// Full name will be "C-Content"
```

### Applying Masters

```javascript
// Apply master to page
const page = doc.pages.item(0);
page.appliedMaster = doc.masterSpreads.itemByName("A-Master");

// Apply no master
page.appliedMaster = NothingEnum.NOTHING;

// Apply master to range
function applyMasterToRange(doc, masterName, startPage, endPage) {
    const master = doc.masterSpreads.itemByName(masterName);
    for (let i = startPage; i <= endPage; i++) {
        doc.pages.item(i).appliedMaster = master;
    }
}
```

### Master Page Items

```javascript
const master = doc.masterSpreads.item(0);
const masterPage = master.pages.item(0);

// Add items to master
const masterFrame = masterPage.textFrames.add({
    geometricBounds: [700, 50, 750, 550],
    contents: "Footer text"
});

// Master items appear on all pages using this master
```

## Sections

### Creating Sections

```javascript
// Create section starting at page
const section = doc.sections.add(doc.pages.item(4), {
    name: "Chapter 2",
    pageNumberStart: 1,
    pageNumberStyle: PageNumberStyle.ARABIC
});
```

### Section Properties

```javascript
const section = doc.sections.item(0);

section.name = "Front Matter";
section.pageNumberStyle = PageNumberStyle.LOWER_ROMAN;
section.pageNumberStart = 1;
section.sectionPrefix = "FM-";
section.includeSectionPrefix = true;
```

## Document Presets

### Save Document Preset

```javascript
// Create reusable document preset
const preset = app.documentPresets.add({
    name: "My Standard",
    pageWidth: "8.5in",
    pageHeight: "11in",
    top: "0.5in",
    bottom: "0.5in",
    left: "0.5in",
    right: "0.5in",
    columnCount: 2,
    columnGutter: "0.1667in"
});
```

### Use Document Preset

```javascript
// Create document from preset
const preset = app.documentPresets.itemByName("My Standard");
const doc = app.documents.add(true, preset);
```

## Complete Example: Document Setup

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function createNewsletter() {
    // Create document
    const doc = app.documents.add({
        documentPreferences: {
            pageWidth: "8.5in",
            pageHeight: "11in",
            pagesPerDocument: 8,
            facingPages: true,
            columnCount: 3,
            columnGutter: "0.1667in"
        },
        marginPreferences: {
            top: "0.75in",
            bottom: "0.5in",
            left: "0.5in",
            right: "0.5in"
        }
    });

    // Create layers
    const bgLayer = doc.layers.add({ name: "Background" });
    const imgLayer = doc.layers.add({ name: "Images" });
    const textLayer = doc.layers.add({ name: "Text" });

    // Setup master spread
    const master = doc.masterSpreads.item(0);
    const masterPage = master.pages.item(0);

    // Add footer to master
    const footer = masterPage.textFrames.add({
        geometricBounds: [700, 50, 750, 550],
        itemLayer: textLayer
    });
    footer.contents = "Newsletter - Page ";
    footer.parentStory.insertionPoints.lastItem().specialCharacters = SpecialCharacters.AUTO_PAGE_NUMBER;

    // Apply master to all pages
    for (let i = 0; i < doc.pages.length; i++) {
        doc.pages.item(i).appliedMaster = master;
    }

    console.log("Newsletter document created with " + doc.pages.length + " pages");
    return doc;
}

// Run the function
createNewsletter();
```

## Common Patterns

### Check for Active Document

```javascript
function getActiveDocument() {
    const doc = app.activeDocument;
    if (!doc) {
        throw new Error("No document open");
    }
    return doc;
}
```

### Batch Process Documents

```javascript
async function batchProcess() {
    const folder = await fs.getFolder();
    if (!folder) return;

    const entries = await folder.getEntries();

    for (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.indd')) {
            const doc = app.open(entry);
            // Process...
            doc.save();
            doc.close(SaveOptions.NO);
        }
    }
}
```

### Create Document from Template

```javascript
async function createFromTemplate() {
    // Open template
    const templateFile = await fs.getFileForOpening({ types: ["indt"] });
    if (!templateFile) return;

    const doc = app.open(templateFile);

    // Save as new document
    const saveFile = await fs.getFileForSaving("new-doc.indd", { types: ["indd"] });
    if (saveFile) {
        doc.save(saveFile);
    }

    return doc;
}
```
