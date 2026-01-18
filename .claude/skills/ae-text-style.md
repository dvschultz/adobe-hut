---
name: ae-text-style
description: "Apply text styling (font, size, color) to After Effects text layers and set up text animators."
---

# AE Text Style

Apply and manipulate text styling in After Effects including fonts, sizes, colors, and text animators.

## Available Operations

### 1. Apply Font and Size

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one text layer.");
        return;
    }

    // Configuration - modify as needed
    var config = {
        font: "Arial-BoldMT",  // PostScript name
        fontSize: 72,
        tracking: 0,
        leading: "auto"  // or number for manual leading
    };

    app.beginUndoGroup("Apply Text Style");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof TextLayer)) continue;

            var sourceText = layer.property("Source Text");
            var textDoc = sourceText.value;

            textDoc.font = config.font;
            textDoc.fontSize = config.fontSize;
            textDoc.tracking = config.tracking;

            if (config.leading !== "auto") {
                textDoc.leading = config.leading;
            }

            sourceText.setValue(textDoc);
            count++;
        }

        alert("Applied styling to " + count + " text layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Apply Colors

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one text layer.");
        return;
    }

    // Configuration (RGB values 0-1)
    var config = {
        fillColor: [1, 1, 1],     // White
        strokeColor: [0, 0, 0],   // Black
        strokeWidth: 2,
        applyFill: true,
        applyStroke: true
    };

    app.beginUndoGroup("Apply Text Colors");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof TextLayer)) continue;

            var sourceText = layer.property("Source Text");
            var textDoc = sourceText.value;

            textDoc.applyFill = config.applyFill;
            textDoc.applyStroke = config.applyStroke;

            if (config.applyFill) {
                textDoc.fillColor = config.fillColor;
            }

            if (config.applyStroke) {
                textDoc.strokeColor = config.strokeColor;
                textDoc.strokeWidth = config.strokeWidth;
            }

            sourceText.setValue(textDoc);
            count++;
        }

        alert("Applied colors to " + count + " text layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Set Text Justification

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one text layer.");
        return;
    }

    // Options: LEFT_JUSTIFY, RIGHT_JUSTIFY, CENTER_JUSTIFY,
    //          FULL_JUSTIFY_LASTLINE_LEFT, FULL_JUSTIFY_LASTLINE_RIGHT,
    //          FULL_JUSTIFY_LASTLINE_CENTER, FULL_JUSTIFY_LASTLINE_FULL
    var justification = ParagraphJustification.CENTER_JUSTIFY;

    app.beginUndoGroup("Set Text Justification");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof TextLayer)) continue;

            var sourceText = layer.property("Source Text");
            var textDoc = sourceText.value;
            textDoc.justification = justification;
            sourceText.setValue(textDoc);
            count++;
        }

        alert("Set justification for " + count + " text layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 4. Add Text Animator (Fade In)

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one text layer.");
        return;
    }

    var animDuration = 1.0;  // Animation duration in seconds

    app.beginUndoGroup("Add Fade In Animator");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof TextLayer)) continue;

            var textProp = layer.property("ADBE Text Properties");
            var animators = textProp.property("ADBE Text Animators");

            // Add animator
            var animator = animators.addProperty("ADBE Text Animator");
            animator.name = "Fade In";

            // Add selector
            var selectors = animator.property("ADBE Text Selectors");
            var selector = selectors.addProperty("ADBE Text Selector");

            // Configure range selector
            var advanced = selector.property("ADBE Text Range Advanced");
            advanced.property("ADBE Text Range Units").setValue(1);  // Percentage
            advanced.property("ADBE Text Selector Smoothness").setValue(100);

            // Animate the start property
            var startProp = selector.property("ADBE Text Range Start");
            startProp.setValueAtTime(layer.inPoint, 0);
            startProp.setValueAtTime(layer.inPoint + animDuration, 100);

            // Add opacity property
            var animatorProps = animator.property("ADBE Text Animator Properties");
            var opacityProp = animatorProps.addProperty("ADBE Text Opacity");
            opacityProp.setValue(0);
        }

        alert("Added fade in animator to " + selected.length + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Add Character-by-Character Reveal

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one text layer.");
        return;
    }

    var charsPerSecond = 20;  // Characters revealed per second

    app.beginUndoGroup("Add Character Reveal");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof TextLayer)) continue;

            // Get character count
            var sourceText = layer.property("Source Text");
            var textDoc = sourceText.value;
            var charCount = textDoc.text.length;

            var revealDuration = charCount / charsPerSecond;

            var textProp = layer.property("ADBE Text Properties");
            var animators = textProp.property("ADBE Text Animators");

            // Add animator
            var animator = animators.addProperty("ADBE Text Animator");
            animator.name = "Character Reveal";

            // Add selector
            var selectors = animator.property("ADBE Text Selectors");
            var selector = selectors.addProperty("ADBE Text Selector");

            // Configure range selector - based on index
            var advanced = selector.property("ADBE Text Range Advanced");
            advanced.property("ADBE Text Range Based On").setValue(1);  // Characters
            advanced.property("ADBE Text Range Units").setValue(1);  // Percentage

            // Animate the end property
            var endProp = selector.property("ADBE Text Range End");
            endProp.setValueAtTime(layer.inPoint, 0);
            endProp.setValueAtTime(layer.inPoint + revealDuration, 100);

            // Add opacity property
            var animatorProps = animator.property("ADBE Text Animator Properties");
            var opacityProp = animatorProps.addProperty("ADBE Text Opacity");
            opacityProp.setValue(0);
        }

        alert("Added character reveal to " + selected.length + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 6. Copy Text Style Between Layers

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length < 2) {
        alert("Select source text layer first, then target layer(s).");
        return;
    }

    var source = selected[0];
    if (!(source instanceof TextLayer)) {
        alert("First selected layer must be a text layer.");
        return;
    }

    app.beginUndoGroup("Copy Text Style");
    try {
        var sourceText = source.property("Source Text");
        var sourceDoc = sourceText.value;

        var count = 0;
        for (var i = 1; i < selected.length; i++) {
            var target = selected[i];
            if (!(target instanceof TextLayer)) continue;

            var targetText = target.property("Source Text");
            var targetDoc = targetText.value;

            // Copy style properties
            targetDoc.font = sourceDoc.font;
            targetDoc.fontSize = sourceDoc.fontSize;
            targetDoc.fillColor = sourceDoc.fillColor;
            targetDoc.strokeColor = sourceDoc.strokeColor;
            targetDoc.strokeWidth = sourceDoc.strokeWidth;
            targetDoc.applyFill = sourceDoc.applyFill;
            targetDoc.applyStroke = sourceDoc.applyStroke;
            targetDoc.tracking = sourceDoc.tracking;
            targetDoc.leading = sourceDoc.leading;
            targetDoc.justification = sourceDoc.justification;

            targetText.setValue(targetDoc);
            count++;
        }

        alert("Copied style to " + count + " text layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Common Font PostScript Names

| Display Name | PostScript Name |
|--------------|-----------------|
| Arial | Arial-BoldMT, ArialMT |
| Helvetica | Helvetica-Bold, Helvetica |
| Helvetica Neue | HelveticaNeue-Bold, HelveticaNeue |
| Futura | Futura-Bold, Futura-Medium |
| Avenir | Avenir-Black, Avenir-Heavy |
| Open Sans | OpenSans-Bold, OpenSans-Regular |
| Roboto | Roboto-Bold, Roboto-Regular |
| Montserrat | Montserrat-Bold, Montserrat-Regular |

## Usage

When the user invokes `/ae-text-style`, ask what they want to do:

1. Apply font and size
2. Apply colors
3. Set justification
4. Add fade in animator
5. Add character reveal
6. Copy style between layers

## Example Requests

- "Make all text layers use Helvetica Bold at 48pt"
- "Set text color to white with black stroke"
- "Add a typewriter effect to my text"
- "Copy the text style from layer 1 to all other text layers"
- "Center align all text layers"
