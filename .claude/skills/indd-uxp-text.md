---
name: indd-uxp-text
description: "InDesign UXP text operations: text frames, stories, paragraphs, characters, text formatting, find/change, and text threading."
---

# InDesign UXP: Text and Typography

## Overview

Text manipulation in InDesign UXP using modern JavaScript (ES6+). Covers text frames, stories, paragraphs, characters, formatting, find/change operations, and text threading.

**Requires**: InDesign v18.0+ (v18.4+ for `require('indesign')`)

## Module Import

```javascript
const { app } = require('indesign');
```

## Text Frames

### Creating Text Frames

```javascript
const { app } = require('indesign');
const doc = app.activeDocument;
const page = doc.pages.item(0);

// Basic text frame
const textFrame = page.textFrames.add({
    geometricBounds: [50, 50, 200, 400]  // [y1, x1, y2, x2]
});

// Set content
textFrame.contents = "Hello InDesign UXP!";

// Text frame with layer
const textFrame = page.textFrames.add({
    geometricBounds: [50, 50, 200, 400],
    itemLayer: doc.layers.itemByName("Text")
});
```

### Text Frame Properties

```javascript
const frame = doc.textFrames.item(0);

// Content
frame.contents;              // Full text content (read/write)
frame.contents = "New text"; // Replace content

// Geometry
frame.geometricBounds;       // [y1, x1, y2, x2]
frame.visibleBounds;         // Bounds including stroke

// Text properties
frame.parentStory;           // Story object
frame.characters;            // CharacterCollection
frame.words;                 // WordCollection
frame.lines;                 // LineCollection
frame.paragraphs;            // ParagraphCollection
frame.insertionPoints;       // InsertionPointCollection

// Frame options
frame.textFramePreferences.columns;              // Column count
frame.textFramePreferences.columnGutter;         // Gutter width
frame.textFramePreferences.insetSpacing;         // Text inset
frame.textFramePreferences.verticalJustification; // Vertical alignment
```

### Text Frame Preferences

```javascript
const frame = page.textFrames.add({
    geometricBounds: [50, 50, 400, 300]
});

const prefs = frame.textFramePreferences;

// Columns
prefs.textColumnCount = 2;
prefs.textColumnGutter = "0.125in";

// Inset
prefs.insetSpacing = ["0.1in", "0.1in", "0.1in", "0.1in"];  // [top, left, bottom, right]

// Vertical justification
prefs.verticalJustification = VerticalJustification.TOP_ALIGN;
// Options: TOP_ALIGN, CENTER_ALIGN, BOTTOM_ALIGN, JUSTIFY_ALIGN

// First baseline
prefs.firstBaselineOffset = FirstBaseline.ASCENT;
prefs.minimumFirstBaselineOffset = "0in";

// Auto-size
prefs.autoSizingType = AutoSizingTypeEnum.HEIGHT_ONLY;
prefs.autoSizingReferencePoint = AutoSizingReferenceEnum.TOP_CENTER_POINT;
```

### Fit Frame to Content

```javascript
// Fit frame to content
frame.fit(FitOptions.FRAME_TO_CONTENT);

// Fit content to frame
frame.fit(FitOptions.CONTENT_TO_FRAME);

// Other options
frame.fit(FitOptions.CENTER_CONTENT);
frame.fit(FitOptions.PROPORTIONALLY);
frame.fit(FitOptions.FILL_PROPORTIONALLY);
```

## Stories

A Story represents a text flow that may span multiple linked text frames.

### Story Basics

```javascript
const story = frame.parentStory;

// Story properties
story.contents;              // Full text content
story.length;                // Character count
story.textFrames;            // All frames in story

// Text collections
story.characters;            // All characters
story.words;                 // All words
story.lines;                 // All lines
story.paragraphs;            // All paragraphs
story.insertionPoints;       // All insertion points
story.tables;                // All tables
story.footnotes;             // All footnotes
```

### Accessing Text Ranges

```javascript
const story = frame.parentStory;

// Single items
const firstChar = story.characters.item(0);
const firstWord = story.words.item(0);
const firstPara = story.paragraphs.item(0);
const lastPara = story.paragraphs.lastItem();

// Item by range
const chars = story.characters.itemByRange(0, 10);
const words = story.words.itemByRange(0, 5);

// Negative index for end
const lastWord = story.words.item(-1);
```

### Adding Text

```javascript
const story = frame.parentStory;

// Append text
story.insertionPoints.lastItem().contents = "\nNew paragraph";

// Insert at beginning
story.insertionPoints.item(0).contents = "Prefix: ";

// Insert at specific position
story.insertionPoints.item(50).contents = "[INSERT]";

// Replace all content
story.contents = "Completely new text";
```

## Text Formatting

### Character Properties

```javascript
const text = story.characters.itemByRange(0, 10);

// Font
text.appliedFont = app.fonts.itemByName("Arial");
text.fontStyle = "Bold";
text.pointSize = 14;

// Color
text.fillColor = doc.swatches.itemByName("Black");
text.strokeColor = doc.swatches.itemByName("None");

// Style
text.underline = true;
text.strikeThru = false;
text.capitalization = Capitalization.ALL_CAPS;

// Tracking and kerning
text.tracking = 25;           // In 1/1000 em
text.kerningMethod = "Optical";
text.kerningValue = 0;

// Baseline
text.baselineShift = 2;       // Points

// Scale
text.horizontalScale = 100;   // Percentage
text.verticalScale = 100;

// Position
text.position = Position.SUPERSCRIPT;
// Options: NORMAL, SUPERSCRIPT, SUBSCRIPT
```

### Paragraph Properties

```javascript
const para = story.paragraphs.item(0);

// Alignment
para.justification = Justification.LEFT_ALIGN;
// Options: LEFT_ALIGN, CENTER_ALIGN, RIGHT_ALIGN, LEFT_JUSTIFIED,
//          RIGHT_JUSTIFIED, CENTER_JUSTIFIED, FULLY_JUSTIFIED

// Indents
para.leftIndent = "0.25in";
para.rightIndent = "0.25in";
para.firstLineIndent = "0.5in";

// Spacing
para.spaceBefore = "12pt";
para.spaceAfter = "6pt";

// Leading
para.leading = "14pt";
// Or auto leading
para.autoLeading = 120;  // Percentage

// Hyphenation
para.hyphenation = true;
para.hyphenateBeforeLast = 3;
para.hyphenateAfterFirst = 2;
para.hyphenateLadderLimit = 3;

// Keeps
para.keepWithNext = 1;
para.keepAllLinesTogether = false;
para.keepFirstLines = 2;
para.keepLastLines = 2;

// Drop caps
para.dropCapLines = 3;
para.dropCapCharacters = 1;
```

### Finding Fonts

```javascript
// List available fonts
for (let i = 0; i < app.fonts.length; i++) {
    const font = app.fonts.item(i);
    console.log(font.name);  // e.g., "Arial\tRegular"
}

// Get font by name
const arial = app.fonts.itemByName("Arial");
const arialBold = app.fonts.itemByName("Arial\tBold");

// Apply font
text.appliedFont = arial;
text.fontStyle = "Bold";  // Or set separately
```

## Find/Change Text

### Basic Find/Change

```javascript
const { app } = require('indesign');

// Clear previous preferences
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;

// Set find criteria
app.findTextPreferences.findWhat = "old text";
app.changeTextPreferences.changeTo = "new text";

// Perform find/change in document
doc.changeText();

// Clean up
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
```

### Find Only (Get Results)

```javascript
app.findTextPreferences = NothingEnum.NOTHING;
app.findTextPreferences.findWhat = "searchTerm";

// Find all instances
const found = doc.findText();

console.log(`Found ${found.length} instances`);

for (const text of found) {
    console.log(`Found at: ${text.parentStory.textFrames.item(0).name}`);
}

app.findTextPreferences = NothingEnum.NOTHING;
```

### Find/Change with Formatting

```javascript
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;

// Find text with specific formatting
app.findTextPreferences.findWhat = "";
app.findTextPreferences.pointSize = 10;

// Change to different formatting
app.changeTextPreferences.pointSize = 12;
app.changeTextPreferences.appliedFont = app.fonts.itemByName("Arial");

doc.changeText();

app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
```

### Find/Change Styles

```javascript
app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;

// Find by paragraph style
app.findTextPreferences.appliedParagraphStyle =
    doc.paragraphStyles.itemByName("Body Copy");

// Change to different style
app.changeTextPreferences.appliedParagraphStyle =
    doc.paragraphStyles.itemByName("Body Copy New");

doc.changeText();

app.findTextPreferences = NothingEnum.NOTHING;
app.changeTextPreferences = NothingEnum.NOTHING;
```

### GREP Find/Change

```javascript
app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;

// Find pattern (regex)
app.findGrepPreferences.findWhat = "\\d{3}-\\d{3}-\\d{4}";  // Phone number
app.changeGrepPreferences.changeTo = "XXX-XXX-XXXX";

doc.changeGrep();

// Find email addresses
app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;
app.findGrepPreferences.findWhat = "[\\w.]+@[\\w.]+\\.[a-z]{2,}";

const emails = doc.findGrep();
console.log(`Found ${emails.length} email addresses`);

app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;
```

### GREP with Captured Groups

```javascript
app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;

// Capture and reorder
app.findGrepPreferences.findWhat = "(\\w+), (\\w+)";  // "Last, First"
app.changeGrepPreferences.changeTo = "$2 $1";         // "First Last"

doc.changeGrep();

app.findGrepPreferences = NothingEnum.NOTHING;
app.changeGrepPreferences = NothingEnum.NOTHING;
```

## Text Threading

### Check Threading

```javascript
const frame = doc.textFrames.item(0);

// Check if frame is threaded
const prevFrame = frame.previousTextFrame;  // null if first
const nextFrame = frame.nextTextFrame;      // null if last

// Get all frames in story
const allFrames = frame.parentStory.textFrames;
console.log(`Story spans ${allFrames.length} frames`);
```

### Create Threaded Frames

```javascript
const page = doc.pages.item(0);

// Create first frame
const frame1 = page.textFrames.add({
    geometricBounds: [50, 50, 350, 250]
});
frame1.contents = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(20);

// Create second frame
const frame2 = page.textFrames.add({
    geometricBounds: [50, 300, 350, 500]
});

// Thread frames
frame1.nextTextFrame = frame2;

// Now text will flow from frame1 to frame2
```

### Break Threading

```javascript
// Unlink frame from previous
frame.previousTextFrame = NothingEnum.NOTHING;

// Unlink frame from next
frame.nextTextFrame = NothingEnum.NOTHING;
```

### Check for Overset Text

```javascript
const frame = doc.textFrames.item(0);

// Check if text overflows
if (frame.overflows) {
    console.log("Text is overset - needs more frames");

    // Get overset text
    const story = frame.parentStory;
    const oversetChars = story.characters.length - frame.characters.length;
    console.log(`${oversetChars} characters overset`);
}
```

### Auto-Thread to New Frames

```javascript
function autoThread(frame, maxPages = 10) {
    let currentFrame = frame;
    let pageCount = 0;
    const doc = frame.parentTextFrame ? frame.parentTextFrame.parent.parent : app.activeDocument;

    while (currentFrame.overflows && pageCount < maxPages) {
        // Add new page
        const newPage = doc.pages.add();
        pageCount++;

        // Create new frame on new page
        const newFrame = newPage.textFrames.add({
            geometricBounds: currentFrame.geometricBounds
        });

        // Link frames
        currentFrame.nextTextFrame = newFrame;
        currentFrame = newFrame;
    }

    return pageCount;
}
```

## Special Characters

### Insert Special Characters

```javascript
const story = frame.parentStory;
const insertPoint = story.insertionPoints.lastItem();

// Page numbers
insertPoint.specialCharacters = SpecialCharacters.AUTO_PAGE_NUMBER;
insertPoint.specialCharacters = SpecialCharacters.NEXT_PAGE_NUMBER;
insertPoint.specialCharacters = SpecialCharacters.PREVIOUS_PAGE_NUMBER;

// Section marker
insertPoint.specialCharacters = SpecialCharacters.SECTION_MARKER;

// Breaks
insertPoint.specialCharacters = SpecialCharacters.COLUMN_BREAK;
insertPoint.specialCharacters = SpecialCharacters.FRAME_BREAK;
insertPoint.specialCharacters = SpecialCharacters.PAGE_BREAK;
insertPoint.specialCharacters = SpecialCharacters.FORCED_LINE_BREAK;

// Spaces
insertPoint.specialCharacters = SpecialCharacters.EM_SPACE;
insertPoint.specialCharacters = SpecialCharacters.EN_SPACE;
insertPoint.specialCharacters = SpecialCharacters.NONBREAKING_SPACE;
insertPoint.specialCharacters = SpecialCharacters.THIN_SPACE;

// Hyphens
insertPoint.specialCharacters = SpecialCharacters.NONBREAKING_HYPHEN;
insertPoint.specialCharacters = SpecialCharacters.DISCRETIONARY_HYPHEN;
```

### Text Variables

```javascript
// Insert text variable
const story = frame.parentStory;
const insertPoint = story.insertionPoints.lastItem();

// Find text variable by name
const variable = doc.textVariables.itemByName("Running Header");
insertPoint.textVariables.add(variable);
```

## Footnotes

### Create Footnote

```javascript
const story = frame.parentStory;
const insertPoint = story.insertionPoints.item(50);

// Insert footnote
const footnote = insertPoint.footnotes.add();
footnote.contents = "This is the footnote text.";
```

### Access Footnotes

```javascript
const story = frame.parentStory;

// All footnotes in story
for (let i = 0; i < story.footnotes.length; i++) {
    const fn = story.footnotes.item(i);
    console.log(`Footnote ${i + 1}: ${fn.contents}`);
}
```

## Complete Examples

### Format All Headings

```javascript
const { app } = require('indesign');

function formatHeadings(doc) {
    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;

    // Find lines that start with "Chapter"
    app.findGrepPreferences.findWhat = "^Chapter \\d+.*";
    app.changeGrepPreferences.appliedParagraphStyle =
        doc.paragraphStyles.itemByName("Heading 1");

    doc.changeGrep();

    app.findGrepPreferences = NothingEnum.NOTHING;
    app.changeGrepPreferences = NothingEnum.NOTHING;
}

formatHeadings(app.activeDocument);
```

### Create Pull Quote

```javascript
function createPullQuote(page, text, bounds) {
    const doc = page.parent;

    // Create text frame
    const frame = page.textFrames.add({
        geometricBounds: bounds
    });

    // Add quote marks and text
    frame.contents = `"${text}"`;

    // Style it
    const para = frame.parentStory.paragraphs.item(0);
    para.pointSize = 24;
    para.appliedFont = app.fonts.itemByName("Georgia");
    para.fontStyle = "Italic";
    para.justification = Justification.CENTER_ALIGN;
    para.fillColor = doc.swatches.itemByName("Black");

    return frame;
}
```

### Batch Replace Text

```javascript
function batchReplace(doc, replacements) {
    // replacements = [["old1", "new1"], ["old2", "new2"], ...]

    for (const [findText, replaceText] of replacements) {
        app.findTextPreferences = NothingEnum.NOTHING;
        app.changeTextPreferences = NothingEnum.NOTHING;

        app.findTextPreferences.findWhat = findText;
        app.changeTextPreferences.changeTo = replaceText;

        const count = doc.findText().length;
        doc.changeText();

        console.log(`Replaced "${findText}" with "${replaceText}" (${count} instances)`);
    }

    app.findTextPreferences = NothingEnum.NOTHING;
    app.changeTextPreferences = NothingEnum.NOTHING;
}

// Usage
batchReplace(doc, [
    ["colour", "color"],
    ["centre", "center"],
    ["organisation", "organization"]
]);
```

### Generate Table of Contents

```javascript
function getHeadings(doc) {
    const headings = [];
    const headingStyle = doc.paragraphStyles.itemByName("Heading 1");

    app.findTextPreferences = NothingEnum.NOTHING;
    app.findTextPreferences.appliedParagraphStyle = headingStyle;

    const found = doc.findText();

    for (const text of found) {
        // Get page number
        const page = text.parentTextFrames[0].parentPage;
        headings.push({
            text: text.contents.trim(),
            page: page.name
        });
    }

    app.findTextPreferences = NothingEnum.NOTHING;

    return headings;
}

function createTOC(doc, page) {
    const headings = getHeadings(doc);

    const tocFrame = page.textFrames.add({
        geometricBounds: [50, 50, 700, 550]
    });

    let tocText = "Table of Contents\n\n";

    for (const heading of headings) {
        tocText += `${heading.text}\t${heading.page}\n`;
    }

    tocFrame.contents = tocText;

    return tocFrame;
}
```
