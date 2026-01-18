---
name: indd-uxp-styles
description: "InDesign UXP styles: paragraph styles, character styles, object styles, table styles, cell styles, and programmatic style management."
---

# InDesign UXP: Styles

## Overview

Style management in InDesign UXP using modern JavaScript (ES6+). Covers paragraph styles, character styles, object styles, table styles, cell styles, and programmatic creation and application.

**Requires**: InDesign v18.0+ (v18.4+ for `require('indesign')`)

## Module Import

```javascript
const { app } = require('indesign');
```

## Paragraph Styles

### Accessing Paragraph Styles

```javascript
const { app } = require('indesign');
const doc = app.activeDocument;

// All paragraph styles
const pStyles = doc.paragraphStyles;

// By name
const bodyStyle = doc.paragraphStyles.itemByName("Body Copy");

// By index
const firstStyle = doc.paragraphStyles.item(0);

// List all styles
for (let i = 0; i < pStyles.length; i++) {
    const style = pStyles.item(i);
    console.log(style.name);
}
```

### Creating Paragraph Styles

```javascript
// Basic style
const basicStyle = doc.paragraphStyles.add({
    name: "Body Text"
});

// Full-featured style
const headingStyle = doc.paragraphStyles.add({
    name: "Heading 1",
    appliedFont: app.fonts.itemByName("Helvetica Neue"),
    fontStyle: "Bold",
    pointSize: 24,
    leading: 28,
    spaceBefore: "18pt",
    spaceAfter: "6pt",
    justification: Justification.LEFT_ALIGN,
    fillColor: doc.swatches.itemByName("Black"),
    hyphenation: false,
    keepWithNext: 1
});

// Style with indents
const listStyle = doc.paragraphStyles.add({
    name: "Bullet List",
    leftIndent: "0.25in",
    firstLineIndent: "-0.25in",
    spaceBefore: "3pt",
    spaceAfter: "3pt"
});
```

### Paragraph Style Properties

```javascript
const style = doc.paragraphStyles.itemByName("Body Copy");

// Font properties
style.appliedFont = app.fonts.itemByName("Times New Roman");
style.fontStyle = "Regular";
style.pointSize = 11;
style.leading = 14;

// Alignment
style.justification = Justification.LEFT_JUSTIFY;

// Indents
style.leftIndent = "0in";
style.rightIndent = "0in";
style.firstLineIndent = "0.25in";

// Spacing
style.spaceBefore = "0pt";
style.spaceAfter = "6pt";

// Color
style.fillColor = doc.colors.itemByName("Black");

// Hyphenation
style.hyphenation = true;
style.hyphenateBeforeLast = 3;
style.hyphenateAfterFirst = 2;

// Keep options
style.keepAllLinesTogether = false;
style.keepWithNext = 0;
style.keepFirstLines = 2;
style.keepLastLines = 2;

// Drop caps
style.dropCapLines = 0;
style.dropCapCharacters = 0;
```

### Style Based On

```javascript
// Create base style
const baseStyle = doc.paragraphStyles.add({
    name: "Base Body",
    appliedFont: app.fonts.itemByName("Minion Pro"),
    pointSize: 10,
    leading: 12
});

// Create derived style
const emphasisStyle = doc.paragraphStyles.add({
    name: "Body Emphasis",
    basedOn: baseStyle,
    fontStyle: "Italic"
});

// Changes to baseStyle will cascade to emphasisStyle
```

### Next Style

```javascript
const headingStyle = doc.paragraphStyles.add({
    name: "Heading",
    pointSize: 18,
    fontStyle: "Bold"
});

const bodyStyle = doc.paragraphStyles.add({
    name: "Body",
    pointSize: 10
});

// Set next style - pressing Enter after Heading applies Body
headingStyle.nextStyle = bodyStyle;
```

### Applying Paragraph Styles

```javascript
const style = doc.paragraphStyles.itemByName("Body Copy");
const frame = doc.textFrames.item(0);
const story = frame.parentStory;

// Apply to paragraph
story.paragraphs.item(0).appliedParagraphStyle = style;

// Apply to all paragraphs
for (let i = 0; i < story.paragraphs.length; i++) {
    story.paragraphs.item(i).appliedParagraphStyle = style;
}

// Apply to selection (in plugin UI context)
if (app.selection.length > 0) {
    app.selection[0].appliedParagraphStyle = style;
}
```

## Character Styles

### Creating Character Styles

```javascript
// Basic character style
const boldStyle = doc.characterStyles.add({
    name: "Bold",
    fontStyle: "Bold"
});

// Full-featured character style
const highlightStyle = doc.characterStyles.add({
    name: "Highlight",
    fillColor: doc.colors.itemByName("Yellow"),
    underline: true
});

// Superscript style
const supStyle = doc.characterStyles.add({
    name: "Superscript",
    position: Position.SUPERSCRIPT,
    pointSize: 7
});
```

### Character Style Properties

```javascript
const style = doc.characterStyles.item(0);

// Font
style.appliedFont = app.fonts.itemByName("Arial");
style.fontStyle = "Bold Italic";
style.pointSize = 12;

// Color
style.fillColor = doc.swatches.itemByName("Red");
style.strokeColor = doc.swatches.itemByName("None");

// Effects
style.underline = true;
style.underlineColor = doc.swatches.itemByName("Black");
style.underlineWeight = 1;
style.underlineOffset = -2;

style.strikeThru = false;
style.capitalization = Capitalization.NORMAL;

// Position
style.position = Position.NORMAL;  // SUPERSCRIPT, SUBSCRIPT
style.baselineShift = 0;

// Tracking
style.tracking = 0;
```

### Applying Character Styles

```javascript
const style = doc.characterStyles.itemByName("Bold");
const story = frame.parentStory;

// Apply to word
story.words.item(0).appliedCharacterStyle = style;

// Apply to character range
story.characters.itemByRange(10, 20).appliedCharacterStyle = style;

// Remove character style (use [None])
const noneStyle = doc.characterStyles.itemByName("[None]");
story.words.item(0).appliedCharacterStyle = noneStyle;
```

## Object Styles

### Creating Object Styles

```javascript
// Basic object style
const frameStyle = doc.objectStyles.add({
    name: "Photo Frame"
});

// Configure stroke and fill
frameStyle.fillColor = doc.swatches.itemByName("None");
frameStyle.strokeColor = doc.swatches.itemByName("Black");
frameStyle.strokeWeight = 1;

// Full-featured object style
const captionStyle = doc.objectStyles.add({
    name: "Caption Box",
    fillColor: doc.swatches.itemByName("Paper"),
    strokeColor: doc.swatches.itemByName("Black"),
    strokeWeight: 0.5
});
```

### Object Style Properties

```javascript
const style = doc.objectStyles.itemByName("Photo Frame");

// Fill
style.fillColor = doc.swatches.itemByName("None");
style.fillTint = 100;

// Stroke
style.strokeColor = doc.swatches.itemByName("Black");
style.strokeWeight = 2;
style.strokeType = doc.strokeStyles.itemByName("Solid");

// Corner options
style.topLeftCornerOption = CornerOptions.ROUNDED_CORNER;
style.topRightCornerOption = CornerOptions.ROUNDED_CORNER;
style.bottomLeftCornerOption = CornerOptions.ROUNDED_CORNER;
style.bottomRightCornerOption = CornerOptions.ROUNDED_CORNER;
style.topLeftCornerRadius = "0.125in";
style.topRightCornerRadius = "0.125in";
style.bottomLeftCornerRadius = "0.125in";
style.bottomRightCornerRadius = "0.125in";

// Effects (drop shadow, etc.)
style.enableStrokeAndCornerOptions = true;
```

### Text Frame Object Styles

```javascript
// Object style with text frame options
const textBoxStyle = doc.objectStyles.add({
    name: "Sidebar Text"
});

// Enable text frame options
textBoxStyle.enableTextFrameGeneralOptions = true;
textBoxStyle.enableTextFrameBaselineOptions = true;

// Configure via text frame preferences
// Note: Object styles use property settings directly
```

### Applying Object Styles

```javascript
const style = doc.objectStyles.itemByName("Photo Frame");

// Apply to frame
const rect = doc.rectangles.item(0);
rect.appliedObjectStyle = style;

// Apply to text frame
const textFrame = doc.textFrames.item(0);
textFrame.appliedObjectStyle = style;

// Apply to multiple objects
const selection = app.selection;
for (const item of selection) {
    item.appliedObjectStyle = style;
}
```

## Table Styles

### Creating Table Styles

```javascript
// Basic table style
const tableStyle = doc.tableStyles.add({
    name: "Data Table"
});

// Configure table style
tableStyle.topBorderStrokeColor = doc.swatches.itemByName("Black");
tableStyle.topBorderStrokeWeight = 1;
tableStyle.bottomBorderStrokeColor = doc.swatches.itemByName("Black");
tableStyle.bottomBorderStrokeWeight = 1;
tableStyle.leftBorderStrokeColor = doc.swatches.itemByName("Black");
tableStyle.leftBorderStrokeWeight = 0.5;
tableStyle.rightBorderStrokeColor = doc.swatches.itemByName("Black");
tableStyle.rightBorderStrokeWeight = 0.5;

// Row strokes
tableStyle.rowStrokeColor = doc.swatches.itemByName("Black");
tableStyle.rowStrokeWeight = 0.5;

// Column strokes
tableStyle.columnStrokeColor = doc.swatches.itemByName("Black");
tableStyle.columnStrokeWeight = 0.5;
```

### Table Style Properties

```javascript
const style = doc.tableStyles.itemByName("Data Table");

// Border strokes
style.topBorderStrokeWeight = 2;
style.bottomBorderStrokeWeight = 2;
style.leftBorderStrokeWeight = 2;
style.rightBorderStrokeWeight = 2;

// Internal strokes
style.rowStrokeWeight = 0.5;
style.columnStrokeWeight = 0.5;

// Row fills (alternating)
style.startRowFillColor = doc.swatches.itemByName("None");
style.endRowFillColor = doc.colors.itemByName("Light Gray");
style.startRowFillCount = 1;
style.endRowFillCount = 1;

// Column fills (alternating)
style.startColumnFillColor = doc.swatches.itemByName("None");
style.endColumnFillColor = doc.swatches.itemByName("None");

// Space before/after
style.spaceBefore = "6pt";
style.spaceAfter = "6pt";
```

### Applying Table Styles

```javascript
const tableStyle = doc.tableStyles.itemByName("Data Table");
const table = story.tables.item(0);

table.appliedTableStyle = tableStyle;
```

## Cell Styles

### Creating Cell Styles

```javascript
// Header cell style
const headerCellStyle = doc.cellStyles.add({
    name: "Header Cell"
});

// Configure cell style
headerCellStyle.fillColor = doc.colors.itemByName("Dark Blue");
headerCellStyle.topInset = "3pt";
headerCellStyle.bottomInset = "3pt";
headerCellStyle.leftInset = "4pt";
headerCellStyle.rightInset = "4pt";

// Body cell style
const bodyCellStyle = doc.cellStyles.add({
    name: "Body Cell"
});

bodyCellStyle.fillColor = doc.swatches.itemByName("None");
bodyCellStyle.topInset = "2pt";
bodyCellStyle.bottomInset = "2pt";
bodyCellStyle.leftInset = "4pt";
bodyCellStyle.rightInset = "4pt";
```

### Cell Style Properties

```javascript
const style = doc.cellStyles.itemByName("Header Cell");

// Fill
style.fillColor = doc.swatches.itemByName("Black");
style.fillTint = 100;

// Insets
style.topInset = "4pt";
style.bottomInset = "4pt";
style.leftInset = "6pt";
style.rightInset = "6pt";

// Strokes
style.topEdgeStrokeColor = doc.swatches.itemByName("Black");
style.topEdgeStrokeWeight = 1;
style.bottomEdgeStrokeColor = doc.swatches.itemByName("Black");
style.bottomEdgeStrokeWeight = 1;
style.leftEdgeStrokeColor = doc.swatches.itemByName("Black");
style.leftEdgeStrokeWeight = 0.5;
style.rightEdgeStrokeColor = doc.swatches.itemByName("Black");
style.rightEdgeStrokeWeight = 0.5;

// Vertical alignment
style.verticalJustification = VerticalJustification.CENTER_ALIGN;

// Text rotation
style.textRotation = 0;  // or 90, 180, 270

// Associated paragraph style for text in cells
style.appliedParagraphStyle = doc.paragraphStyles.itemByName("Table Header");
```

### Applying Cell Styles

```javascript
const headerStyle = doc.cellStyles.itemByName("Header Cell");
const bodyStyle = doc.cellStyles.itemByName("Body Cell");

const table = story.tables.item(0);

// Apply to header row
for (let c = 0; c < table.columns.length; c++) {
    table.rows.item(0).cells.item(c).appliedCellStyle = headerStyle;
}

// Apply to body rows
for (let r = 1; r < table.rows.length; r++) {
    for (let c = 0; c < table.columns.length; c++) {
        table.rows.item(r).cells.item(c).appliedCellStyle = bodyStyle;
    }
}
```

## Style Groups

### Creating Style Groups

```javascript
// Paragraph style group
const pGroup = doc.paragraphStyleGroups.add({
    name: "Headings"
});

// Add styles to group
const h1 = pGroup.paragraphStyles.add({
    name: "H1",
    pointSize: 24
});

const h2 = pGroup.paragraphStyles.add({
    name: "H2",
    pointSize: 18
});

// Character style group
const cGroup = doc.characterStyleGroups.add({
    name: "Emphasis"
});

const bold = cGroup.characterStyles.add({
    name: "Bold",
    fontStyle: "Bold"
});
```

### Accessing Grouped Styles

```javascript
// Access style in group
const h1 = doc.paragraphStyleGroups.itemByName("Headings")
    .paragraphStyles.itemByName("H1");

// Or access all paragraph styles (including grouped)
const allPStyles = doc.allParagraphStyles;

for (let i = 0; i < allPStyles.length; i++) {
    console.log(allPStyles[i].name);
}
```

## Style Management

### Delete Style

```javascript
// Delete style (optionally replace with another)
const oldStyle = doc.paragraphStyles.itemByName("Old Style");
const replacementStyle = doc.paragraphStyles.itemByName("Body Copy");

oldStyle.remove(replacementStyle);  // Text using old style gets replacement
```

### Duplicate Style

```javascript
const original = doc.paragraphStyles.itemByName("Body Copy");
const duplicate = original.duplicate();
duplicate.name = "Body Copy Alternate";
```

### Find Unused Styles

```javascript
function findUnusedParagraphStyles(doc) {
    const unused = [];

    for (let i = 0; i < doc.paragraphStyles.length; i++) {
        const style = doc.paragraphStyles.item(i);

        // Skip built-in styles
        if (style.name === "[No Paragraph Style]" ||
            style.name === "[Basic Paragraph]") {
            continue;
        }

        // Search for usage
        app.findTextPreferences = NothingEnum.NOTHING;
        app.findTextPreferences.appliedParagraphStyle = style;

        const found = doc.findText();
        if (found.length === 0) {
            unused.push(style.name);
        }
    }

    app.findTextPreferences = NothingEnum.NOTHING;
    return unused;
}

const unused = findUnusedParagraphStyles(doc);
console.log("Unused styles:", unused);
```

## Import Styles

### Import from Document

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function importStylesFromDocument() {
    const doc = app.activeDocument;

    // Select source document
    const sourceFile = await fs.getFileForOpening({ types: ["indd"] });
    if (!sourceFile) return;

    // Import paragraph styles
    doc.importStyles(
        ImportFormat.PARAGRAPH_STYLES_FORMAT,
        sourceFile,
        GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE
    );

    // Import character styles
    doc.importStyles(
        ImportFormat.CHARACTER_STYLES_FORMAT,
        sourceFile,
        GlobalClashResolutionStrategy.LOAD_ALL_WITH_OVERWRITE
    );
}
```

## Complete Examples

### Create Document Style System

```javascript
function createStyleSystem(doc) {
    // Create colors if needed (use isValid check, not try/catch)
    let darkBlue = doc.colors.itemByName("Dark Blue");
    if (!darkBlue.isValid) {
        darkBlue = doc.colors.add({
            name: "Dark Blue",
            model: ColorModel.PROCESS,
            colorValue: [100, 80, 0, 20]
        });
    }

    // Paragraph styles
    const baseBody = doc.paragraphStyles.add({
        name: "Base Body",
        appliedFont: app.fonts.itemByName("Minion Pro"),
        pointSize: 10,
        leading: 13,
        justification: Justification.LEFT_JUSTIFY,
        spaceBefore: "0pt",
        spaceAfter: "6pt",
        firstLineIndent: "0.25in"
    });

    const bodyNoIndent = doc.paragraphStyles.add({
        name: "Body - No Indent",
        basedOn: baseBody,
        firstLineIndent: "0in"
    });

    const heading1 = doc.paragraphStyles.add({
        name: "Heading 1",
        appliedFont: app.fonts.itemByName("Myriad Pro"),
        fontStyle: "Bold",
        pointSize: 18,
        leading: 22,
        fillColor: darkBlue,
        spaceBefore: "24pt",
        spaceAfter: "12pt",
        hyphenation: false,
        keepWithNext: 2
    });
    heading1.nextStyle = bodyNoIndent;

    const heading2 = doc.paragraphStyles.add({
        name: "Heading 2",
        basedOn: heading1,
        pointSize: 14,
        leading: 18,
        spaceBefore: "18pt",
        spaceAfter: "6pt"
    });
    heading2.nextStyle = bodyNoIndent;

    // Character styles
    const bold = doc.characterStyles.add({
        name: "Bold",
        fontStyle: "Bold"
    });

    const italic = doc.characterStyles.add({
        name: "Italic",
        fontStyle: "Italic"
    });

    const boldItalic = doc.characterStyles.add({
        name: "Bold Italic",
        fontStyle: "Bold Italic"
    });

    // Object styles
    const photoFrame = doc.objectStyles.add({
        name: "Photo Frame"
    });
    photoFrame.strokeColor = doc.swatches.itemByName("Black");
    photoFrame.strokeWeight = 1;
    photoFrame.fillColor = doc.swatches.itemByName("None");

    console.log("Style system created");
}

createStyleSystem(app.activeDocument);
```

### Apply Styles to Template

```javascript
function applyTemplateStyling(doc) {
    const story = doc.stories.item(0);

    // Apply heading style to first paragraph
    story.paragraphs.item(0).appliedParagraphStyle =
        doc.paragraphStyles.itemByName("Heading 1");

    // Apply body style to remaining paragraphs
    const bodyStyle = doc.paragraphStyles.itemByName("Base Body");
    for (let i = 1; i < story.paragraphs.length; i++) {
        story.paragraphs.item(i).appliedParagraphStyle = bodyStyle;
    }

    // Bold specific words
    const boldStyle = doc.characterStyles.itemByName("Bold");
    app.findTextPreferences = NothingEnum.NOTHING;
    app.findTextPreferences.findWhat = "important";

    const found = doc.findText();
    for (const text of found) {
        text.appliedCharacterStyle = boldStyle;
    }

    app.findTextPreferences = NothingEnum.NOTHING;
}
```

### Export Style Report

```javascript
function generateStyleReport(doc) {
    let report = "STYLE REPORT\n";
    report += "=".repeat(50) + "\n\n";

    report += "PARAGRAPH STYLES:\n";
    report += "-".repeat(30) + "\n";
    for (let i = 0; i < doc.paragraphStyles.length; i++) {
        const style = doc.paragraphStyles.item(i);
        report += `${style.name}\n`;
        report += `  Font: ${style.appliedFont.name} ${style.fontStyle}\n`;
        report += `  Size: ${style.pointSize}pt, Leading: ${style.leading}\n`;
        report += `  Based on: ${style.basedOn ? style.basedOn.name : 'None'}\n\n`;
    }

    report += "\nCHARACTER STYLES:\n";
    report += "-".repeat(30) + "\n";
    for (let i = 0; i < doc.characterStyles.length; i++) {
        const style = doc.characterStyles.item(i);
        report += `${style.name}\n`;
    }

    report += "\nOBJECT STYLES:\n";
    report += "-".repeat(30) + "\n";
    for (let i = 0; i < doc.objectStyles.length; i++) {
        const style = doc.objectStyles.item(i);
        report += `${style.name}\n`;
    }

    return report;
}

const report = generateStyleReport(app.activeDocument);
console.log(report);
```
