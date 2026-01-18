---
name: indd-uxp-tables
description: "InDesign UXP table operations: creating tables, rows, columns, cell formatting, table styles, merging, and text-to-table conversion."
---

# InDesign UXP: Tables

## Overview

Table creation and manipulation in InDesign UXP using modern JavaScript (ES6+). Covers creating tables, working with rows/columns/cells, formatting, styles, and data import.

**Requires**: InDesign v18.0+ (v18.4+ for `require('indesign')`)

## Module Import

```javascript
const { app } = require('indesign');
```

## Creating Tables

### Basic Table Creation

```javascript
const { app } = require('indesign');
const doc = app.activeDocument;
const frame = doc.textFrames.item(0);
const story = frame.parentStory;

// Create table at insertion point
const table = story.insertionPoints.item(0).tables.add({
    bodyRowCount: 4,
    columnCount: 3
});

// Set column widths
table.columns.item(0).width = "1.5in";
table.columns.item(1).width = "2in";
table.columns.item(2).width = "1.5in";
```

### Table with Headers

```javascript
const table = story.insertionPoints.item(0).tables.add({
    bodyRowCount: 5,
    columnCount: 4,
    headerRowCount: 1,
    footerRowCount: 0
});

// Fill header
const headers = ["Name", "Email", "Phone", "Status"];
for (let c = 0; c < headers.length; c++) {
    table.rows.item(0).cells.item(c).contents = headers[c];
}
```

### Table from Text

```javascript
// Create text with tab/return delimiters
const textFrame = page.textFrames.add({
    geometricBounds: [50, 50, 400, 550]
});

textFrame.contents = "Name\tAge\tCity\n" +
    "John\t25\tNew York\n" +
    "Jane\t30\tLos Angeles\n" +
    "Bob\t35\tChicago";

// Convert to table
const text = textFrame.parentStory.texts.item(0);
const table = text.convertToTable("\t", "\n");
```

## Table Structure

### Accessing Rows

```javascript
const table = story.tables.item(0);

// By index
const firstRow = table.rows.item(0);
const lastRow = table.rows.lastItem();

// All rows
for (let r = 0; r < table.rows.length; r++) {
    const row = table.rows.item(r);
    console.log(`Row ${r}: ${row.cells.length} cells`);
}

// Header/footer rows
const headerRows = table.headerRowCount;
const footerRows = table.footerRowCount;
const bodyRows = table.bodyRowCount;
```

### Accessing Columns

```javascript
// By index
const firstCol = table.columns.item(0);
const lastCol = table.columns.lastItem();

// All columns
for (let c = 0; c < table.columns.length; c++) {
    const col = table.columns.item(c);
    console.log(`Column ${c}: width ${col.width}`);
}
```

### Accessing Cells

```javascript
// Single cell by index
const cell = table.cells.item(0);  // First cell

// Cell by row/column position
const cell = table.rows.item(1).cells.item(2);  // Row 1, Column 2

// Cell range
const range = table.cells.itemByRange(0, 5);

// All cells
for (let i = 0; i < table.cells.length; i++) {
    const cell = table.cells.item(i);
    console.log(cell.contents);
}

// Iterate by row/column
for (let r = 0; r < table.rows.length; r++) {
    for (let c = 0; c < table.columns.length; c++) {
        const cell = table.rows.item(r).cells.item(c);
        console.log(`[${r},${c}]: ${cell.contents}`);
    }
}
```

## Adding Rows and Columns

### Add Rows

```javascript
// Add row at end
table.rows.add();

// Add row at specific position
table.rows.add(LocationOptions.BEFORE, table.rows.item(0));  // At top
table.rows.add(LocationOptions.AFTER, table.rows.item(2));   // After row 2

// Add multiple rows
for (let i = 0; i < 5; i++) {
    table.rows.add();
}
```

### Add Columns

```javascript
// Add column at end
table.columns.add();

// Add column at specific position
table.columns.add(LocationOptions.BEFORE, table.columns.item(0));  // At left
table.columns.add(LocationOptions.AFTER, table.columns.item(1));   // After col 1

// Set width of new column
const newCol = table.columns.add();
newCol.width = "2in";
```

### Remove Rows and Columns

```javascript
// Remove row
table.rows.item(2).remove();

// Remove last row
table.rows.lastItem().remove();

// Remove column
table.columns.item(0).remove();

// Remove range of rows (remove from end to avoid index shift)
for (let r = table.rows.length - 1; r >= 5; r--) {
    table.rows.item(r).remove();
}
```

## Cell Content

### Setting Cell Content

```javascript
const cell = table.rows.item(0).cells.item(0);

// Set text content
cell.contents = "Hello World";

// Append content
cell.insertionPoints.lastItem().contents = " more text";

// Clear content
cell.contents = "";
```

### Populating Table Data

```javascript
function populateTable(table, data) {
    // data = [["A1", "B1", "C1"], ["A2", "B2", "C2"], ...]

    for (let r = 0; r < data.length; r++) {
        // Add row if needed
        if (r >= table.rows.length) {
            table.rows.add();
        }

        for (let c = 0; c < data[r].length; c++) {
            // Add column if needed
            if (c >= table.columns.length) {
                table.columns.add();
            }

            table.rows.item(r).cells.item(c).contents = data[r][c];
        }
    }
}

// Usage
const data = [
    ["Product", "Price", "Qty"],
    ["Widget A", "$10.00", "100"],
    ["Widget B", "$15.00", "50"],
    ["Widget C", "$8.00", "200"]
];

populateTable(table, data);
```

### Reading Cell Content

```javascript
function tableToArray(table) {
    const data = [];

    for (let r = 0; r < table.rows.length; r++) {
        const rowData = [];
        for (let c = 0; c < table.columns.length; c++) {
            rowData.push(table.rows.item(r).cells.item(c).contents);
        }
        data.push(rowData);
    }

    return data;
}

const tableData = tableToArray(table);
console.log(JSON.stringify(tableData, null, 2));
```

## Cell Formatting

### Cell Dimensions

```javascript
const cell = table.cells.item(0);

// Dimensions
cell.width = "2in";
cell.height = "0.5in";

// Row/column dimensions
table.rows.item(0).height = "0.75in";
table.columns.item(0).width = "3in";

// Auto-fit
table.rows.item(0).autoGrow = true;  // Row grows with content
```

### Cell Insets

```javascript
const cell = table.cells.item(0);

// Set insets (padding)
cell.topInset = "4pt";
cell.bottomInset = "4pt";
cell.leftInset = "6pt";
cell.rightInset = "6pt";

// All cells in table
for (let i = 0; i < table.cells.length; i++) {
    const c = table.cells.item(i);
    c.topInset = "3pt";
    c.bottomInset = "3pt";
    c.leftInset = "4pt";
    c.rightInset = "4pt";
}
```

### Cell Fill

```javascript
const cell = table.cells.item(0);

// Background color
cell.fillColor = doc.swatches.itemByName("Yellow");
cell.fillTint = 50;  // 50% tint

// No fill
cell.fillColor = doc.swatches.itemByName("None");
```

### Cell Strokes (Borders)

```javascript
const cell = table.cells.item(0);

// Individual borders
cell.topEdgeStrokeColor = doc.swatches.itemByName("Black");
cell.topEdgeStrokeWeight = 1;

cell.bottomEdgeStrokeColor = doc.swatches.itemByName("Black");
cell.bottomEdgeStrokeWeight = 1;

cell.leftEdgeStrokeColor = doc.swatches.itemByName("Black");
cell.leftEdgeStrokeWeight = 0.5;

cell.rightEdgeStrokeColor = doc.swatches.itemByName("Black");
cell.rightEdgeStrokeWeight = 0.5;

// Stroke type
cell.topEdgeStrokeType = doc.strokeStyles.itemByName("Solid");
```

### Text Formatting in Cells

```javascript
const cell = table.cells.item(0);

// Access text in cell
const text = cell.texts.item(0);

// Apply paragraph style
text.appliedParagraphStyle = doc.paragraphStyles.itemByName("Table Body");

// Direct formatting
text.pointSize = 10;
text.appliedFont = app.fonts.itemByName("Arial");
text.justification = Justification.CENTER_ALIGN;
text.fillColor = doc.swatches.itemByName("Black");
```

### Vertical Alignment

```javascript
const cell = table.cells.item(0);

// Vertical justification
cell.verticalJustification = VerticalJustification.TOP_ALIGN;
// Options: TOP_ALIGN, CENTER_ALIGN, BOTTOM_ALIGN, JUSTIFY_ALIGN
```

### Text Rotation

```javascript
const cell = table.cells.item(0);

// Rotate text in cell
cell.textRotation = 90;  // 0, 90, 180, or 270
```

## Merging and Splitting Cells

### Merge Cells

```javascript
// Merge range of cells using itemByRange
const startCell = table.rows.item(0).cells.item(0);
const endCell = table.rows.item(0).cells.item(2);

// Use cells.itemByRange().merge() - the preferred method
table.cells.itemByRange(startCell, endCell).merge();

// Alternative: merge a vertical range
const cellRange = table.cells.itemByRange(
    table.rows.item(1).cells.item(0),
    table.rows.item(3).cells.item(0)
);
cellRange.merge();
```

### Unmerge Cells

```javascript
// Unmerge a merged cell
const mergedCell = table.cells.item(0);
mergedCell.unmerge();
```

### Split Cells

```javascript
const cell = table.cells.item(0);

// Split horizontally (creates rows)
cell.split(SplitDirection.HORIZONTAL);

// Split vertically (creates columns)
cell.split(SplitDirection.VERTICAL);
```

## Table Styles

### Apply Table Style

```javascript
// Create or get table style (use isValid check, not try/catch)
let tableStyle = doc.tableStyles.itemByName("Data Table");
if (!tableStyle.isValid) {
    tableStyle = doc.tableStyles.add({
        name: "Data Table"
    });
}

// Apply to table
table.appliedTableStyle = tableStyle;
```

### Apply Cell Styles

```javascript
const headerCellStyle = doc.cellStyles.itemByName("Header Cell");
const bodyCellStyle = doc.cellStyles.itemByName("Body Cell");

// Apply to header row
for (let c = 0; c < table.columns.length; c++) {
    table.rows.item(0).cells.item(c).appliedCellStyle = headerCellStyle;
}

// Apply to body rows
for (let r = 1; r < table.rows.length; r++) {
    for (let c = 0; c < table.columns.length; c++) {
        table.rows.item(r).cells.item(c).appliedCellStyle = bodyCellStyle;
    }
}
```

## Table Properties

### Table Borders

```javascript
// Outer borders
table.topBorderStrokeColor = doc.swatches.itemByName("Black");
table.topBorderStrokeWeight = 2;

table.bottomBorderStrokeColor = doc.swatches.itemByName("Black");
table.bottomBorderStrokeWeight = 2;

table.leftBorderStrokeColor = doc.swatches.itemByName("Black");
table.leftBorderStrokeWeight = 2;

table.rightBorderStrokeColor = doc.swatches.itemByName("Black");
table.rightBorderStrokeWeight = 2;
```

### Alternating Fills

```javascript
// Alternating row fills
table.startRowFillColor = doc.swatches.itemByName("None");
table.startRowFillTint = 100;
table.startRowFillCount = 1;

table.endRowFillColor = doc.colors.itemByName("Light Gray");
table.endRowFillTint = 30;
table.endRowFillCount = 1;

// Skip first row (header)
table.skipFirstAlternatingFillRows = 1;
```

### Space Before/After

```javascript
table.spaceBefore = "12pt";
table.spaceAfter = "12pt";
```

## Converting Tables

### Table to Text

```javascript
// Convert table to text
const text = table.convertToText("\t", "\n");
// First param: column separator
// Second param: row separator
```

### Resize to Fit

```javascript
// Resize columns to fit content
for (let c = 0; c < table.columns.length; c++) {
    const col = table.columns.item(c);
    // Note: Auto-fit requires iterating through cells
}

// Equalize column widths
const totalWidth = 6;  // inches
const colWidth = totalWidth / table.columns.length;
for (let c = 0; c < table.columns.length; c++) {
    table.columns.item(c).width = `${colWidth}in`;
}
```

## Complete Examples

### Create Formatted Data Table

```javascript
const { app } = require('indesign');

function createDataTable(page, bounds, data, options = {}) {
    const doc = page.parent;

    // Create text frame
    const frame = page.textFrames.add({
        geometricBounds: bounds
    });

    // Create table
    const table = frame.parentStory.insertionPoints.item(0).tables.add({
        bodyRowCount: data.length - 1,  // Minus header
        columnCount: data[0].length,
        headerRowCount: 1
    });

    // Populate data
    for (let r = 0; r < data.length; r++) {
        for (let c = 0; c < data[r].length; c++) {
            table.rows.item(r).cells.item(c).contents = String(data[r][c]);
        }
    }

    // Format header row
    const headerRow = table.rows.item(0);
    for (let c = 0; c < table.columns.length; c++) {
        const cell = headerRow.cells.item(c);
        cell.fillColor = doc.swatches.itemByName("Black");
        cell.texts.item(0).fillColor = doc.swatches.itemByName("Paper");
        cell.texts.item(0).fontStyle = "Bold";
        cell.texts.item(0).justification = Justification.CENTER_ALIGN;
        cell.verticalJustification = VerticalJustification.CENTER_ALIGN;
    }

    // Format body rows
    for (let r = 1; r < table.rows.length; r++) {
        for (let c = 0; c < table.columns.length; c++) {
            const cell = table.rows.item(r).cells.item(c);
            cell.verticalJustification = VerticalJustification.CENTER_ALIGN;

            // Alternating row colors
            if (r % 2 === 0) {
                cell.fillColor = doc.swatches.itemByName("None");
            } else {
                // Light gray - create if doesn't exist (use isValid check)
                let lightGray = doc.colors.itemByName("Light Gray");
                if (!lightGray.isValid) {
                    lightGray = doc.colors.add({
                        name: "Light Gray",
                        model: ColorModel.PROCESS,
                        colorValue: [0, 0, 0, 10]
                    });
                }
                cell.fillColor = lightGray;
            }
        }
    }

    // Set borders
    table.topBorderStrokeWeight = 1;
    table.bottomBorderStrokeWeight = 1;
    table.leftBorderStrokeWeight = 1;
    table.rightBorderStrokeWeight = 1;

    return table;
}

// Usage
const data = [
    ["Name", "Department", "Salary"],
    ["John Smith", "Engineering", "$85,000"],
    ["Jane Doe", "Marketing", "$75,000"],
    ["Bob Johnson", "Sales", "$90,000"],
    ["Alice Brown", "Engineering", "$95,000"]
];

const table = createDataTable(
    app.activeDocument.pages.item(0),
    [50, 50, 300, 550],
    data
);
```

### Import CSV to Table

```javascript
const { app } = require('indesign');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function importCSVToTable() {
    const doc = app.activeDocument;
    const page = doc.pages.item(0);

    // Get CSV file
    const file = await fs.getFileForOpening({ types: ["csv", "txt"] });
    if (!file) return;

    // Read content
    const content = await file.read();

    // Parse CSV
    const rows = content.split("\n")
        .filter(line => line.trim().length > 0)
        .map(line => line.split(",").map(cell => cell.trim()));

    if (rows.length === 0) {
        console.log("Empty file");
        return;
    }

    // Create text frame
    const frame = page.textFrames.add({
        geometricBounds: [50, 50, 700, 550]
    });

    // Create table
    const table = frame.parentStory.insertionPoints.item(0).tables.add({
        bodyRowCount: rows.length - 1,
        columnCount: rows[0].length,
        headerRowCount: 1
    });

    // Populate
    for (let r = 0; r < rows.length; r++) {
        for (let c = 0; c < rows[r].length; c++) {
            if (c < table.columns.length) {
                table.rows.item(r).cells.item(c).contents = rows[r][c];
            }
        }
    }

    console.log(`Imported ${rows.length} rows, ${rows[0].length} columns`);
    return table;
}

importCSVToTable();
```

### Generate Invoice Table

```javascript
function createInvoiceTable(page, items) {
    // items = [{description, qty, price}, ...]

    const doc = page.parent;

    // Create frame
    const frame = page.textFrames.add({
        geometricBounds: [200, 50, 600, 550]
    });

    // Create table (header + items + subtotal/tax/total)
    const table = frame.parentStory.insertionPoints.item(0).tables.add({
        bodyRowCount: items.length + 3,
        columnCount: 4,
        headerRowCount: 1
    });

    // Set column widths
    table.columns.item(0).width = "3in";    // Description
    table.columns.item(1).width = "0.75in"; // Qty
    table.columns.item(2).width = "1in";    // Price
    table.columns.item(3).width = "1in";    // Total

    // Header
    const headers = ["Description", "Qty", "Unit Price", "Total"];
    for (let c = 0; c < headers.length; c++) {
        const cell = table.rows.item(0).cells.item(c);
        cell.contents = headers[c];
        cell.fillColor = doc.swatches.itemByName("Black");
        cell.texts.item(0).fillColor = doc.swatches.itemByName("Paper");
        cell.texts.item(0).fontStyle = "Bold";
    }

    // Items
    let subtotal = 0;
    for (let i = 0; i < items.length; i++) {
        const row = table.rows.item(i + 1);
        const item = items[i];
        const lineTotal = item.qty * item.price;
        subtotal += lineTotal;

        row.cells.item(0).contents = item.description;
        row.cells.item(1).contents = String(item.qty);
        row.cells.item(2).contents = `$${item.price.toFixed(2)}`;
        row.cells.item(3).contents = `$${lineTotal.toFixed(2)}`;

        // Right-align numbers
        row.cells.item(1).texts.item(0).justification = Justification.RIGHT_ALIGN;
        row.cells.item(2).texts.item(0).justification = Justification.RIGHT_ALIGN;
        row.cells.item(3).texts.item(0).justification = Justification.RIGHT_ALIGN;
    }

    // Summary rows
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const summaryData = [
        ["Subtotal", subtotal],
        ["Tax (8%)", tax],
        ["Total", total]
    ];

    for (let i = 0; i < summaryData.length; i++) {
        const row = table.rows.item(items.length + 1 + i);
        const [label, value] = summaryData[i];

        // Merge first 3 columns for label
        table.merge(row.cells.item(0), row.cells.item(2));
        row.cells.item(0).contents = label;
        row.cells.item(0).texts.item(0).justification = Justification.RIGHT_ALIGN;
        row.cells.item(0).texts.item(0).fontStyle = "Bold";

        row.cells.item(1).contents = `$${value.toFixed(2)}`;
        row.cells.item(1).texts.item(0).justification = Justification.RIGHT_ALIGN;

        if (label === "Total") {
            row.cells.item(1).texts.item(0).fontStyle = "Bold";
        }
    }

    return table;
}

// Usage
const items = [
    { description: "Web Design Services", qty: 1, price: 2500 },
    { description: "Logo Design", qty: 1, price: 500 },
    { description: "Business Cards (box)", qty: 2, price: 75 },
    { description: "Hosting (annual)", qty: 1, price: 120 }
];

createInvoiceTable(app.activeDocument.pages.item(0), items);
```
