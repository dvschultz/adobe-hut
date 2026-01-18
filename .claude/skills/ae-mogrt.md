---
name: ae-mogrt
description: "Motion Graphics Template (.mogrt) helpers: add properties to Essential Graphics Panel, export as mogrt, manage template properties."
---

# AE MOGRT (Motion Graphics Templates)

Create and manage Motion Graphics Templates in After Effects.

## Overview

Motion Graphics Templates (.mogrt) allow you to create editable templates for Premiere Pro. This skill helps with:

- Adding properties to Essential Graphics Panel
- Setting up controller expressions
- Exporting compositions as .mogrt
- Managing template property visibility

## Key Concepts

### Essential Graphics Panel

The Essential Graphics Panel (EGP) is accessed via `Window > Essential Graphics`. Properties added here become editable in Premiere Pro.

### Supported Property Types

| Property Type | Controller Type |
|---------------|-----------------|
| Slider Control | Numeric values |
| Checkbox Control | Boolean on/off |
| Color Control | Color picker |
| Point Control | X/Y coordinates |
| Dropdown Menu Control | Selection list |
| Layer Control | Layer selection |
| Source Text | Editable text |

## Scripts

### 1. Add Slider Controllers

Create slider controls that can be linked to properties.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    // Configuration
    var controllerName = "Controls";
    var sliders = [
        { name: "Size", value: 100, min: 0, max: 200 },
        { name: "Speed", value: 1, min: 0, max: 5 },
        { name: "Amount", value: 50, min: 0, max: 100 }
    ];

    app.beginUndoGroup("Add Slider Controllers");
    try {
        // Find or create controller null
        var controller = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === controllerName && comp.layer(i).nullLayer) {
                controller = comp.layer(i);
                break;
            }
        }

        if (!controller) {
            controller = comp.layers.addNull();
            controller.name = controllerName;
            controller.moveToEnd();
        }

        // Add sliders
        var effects = controller.property("Effects");
        for (var j = 0; j < sliders.length; j++) {
            var sliderConfig = sliders[j];

            // Check if slider already exists
            var exists = false;
            for (var k = 1; k <= effects.numProperties; k++) {
                if (effects.property(k).name === sliderConfig.name) {
                    exists = true;
                    break;
                }
            }

            if (!exists) {
                var slider = effects.addProperty("ADBE Slider Control");
                slider.name = sliderConfig.name;
                slider.property("Slider").setValue(sliderConfig.value);
            }
        }

        alert("Added " + sliders.length + " slider controller(s) to '" + controllerName + "'.\n\n" +
              "To add to Essential Graphics Panel:\n" +
              "1. Open Window > Essential Graphics\n" +
              "2. Drag the slider properties to the panel");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Add Color Controllers

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var controllerName = "Controls";
    var colors = [
        { name: "Primary Color", value: [0.2, 0.6, 1] },    // Blue
        { name: "Secondary Color", value: [1, 0.4, 0.2] },  // Orange
        { name: "Background Color", value: [0.1, 0.1, 0.1] } // Dark gray
    ];

    app.beginUndoGroup("Add Color Controllers");
    try {
        // Find or create controller null
        var controller = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === controllerName && comp.layer(i).nullLayer) {
                controller = comp.layer(i);
                break;
            }
        }

        if (!controller) {
            controller = comp.layers.addNull();
            controller.name = controllerName;
            controller.moveToEnd();
        }

        var effects = controller.property("Effects");
        for (var j = 0; j < colors.length; j++) {
            var colorConfig = colors[j];

            var colorCtrl = effects.addProperty("ADBE Color Control");
            colorCtrl.name = colorConfig.name;
            colorCtrl.property("Color").setValue(colorConfig.value);
        }

        alert("Added " + colors.length + " color controller(s).\n\n" +
              "Link properties using expressions:\n" +
              "thisComp.layer('" + controllerName + "').effect('Primary Color')('Color')");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Add Checkbox Controllers

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var controllerName = "Controls";
    var checkboxes = [
        { name: "Show Title", value: true },
        { name: "Show Subtitle", value: true },
        { name: "Enable Animation", value: true }
    ];

    app.beginUndoGroup("Add Checkbox Controllers");
    try {
        var controller = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === controllerName && comp.layer(i).nullLayer) {
                controller = comp.layer(i);
                break;
            }
        }

        if (!controller) {
            controller = comp.layers.addNull();
            controller.name = controllerName;
            controller.moveToEnd();
        }

        var effects = controller.property("Effects");
        for (var j = 0; j < checkboxes.length; j++) {
            var cbConfig = checkboxes[j];

            var checkbox = effects.addProperty("ADBE Checkbox Control");
            checkbox.name = cbConfig.name;
            checkbox.property("Checkbox").setValue(cbConfig.value ? 1 : 0);
        }

        alert("Added " + checkboxes.length + " checkbox controller(s).\n\n" +
              "Use in expressions:\n" +
              "var show = thisComp.layer('" + controllerName + "').effect('Show Title')('Checkbox');\n" +
              "show ? 100 : 0;  // For opacity");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 4. Add Dropdown Controller

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var controllerName = "Controls";

    app.beginUndoGroup("Add Dropdown Controller");
    try {
        var controller = null;
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === controllerName && comp.layer(i).nullLayer) {
                controller = comp.layer(i);
                break;
            }
        }

        if (!controller) {
            controller = comp.layers.addNull();
            controller.name = controllerName;
            controller.moveToEnd();
        }

        var effects = controller.property("Effects");

        // Add dropdown menu control
        var dropdown = effects.addProperty("ADBE Dropdown Control");
        dropdown.name = "Style";

        // Set dropdown items (requires AE 17.0+)
        // The dropdown is configured via the Essential Graphics panel
        // or by editing the dropdown property directly

        alert("Added dropdown controller.\n\n" +
              "To configure options:\n" +
              "1. Select the dropdown effect\n" +
              "2. Click 'Edit' in Effect Controls\n" +
              "3. Add your options\n\n" +
              "Use in expressions:\n" +
              "var style = thisComp.layer('" + controllerName + "').effect('Style')('Menu').value;\n" +
              "if (style == 1) { /* Option 1 */ }");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Link Text to Source Text Property

Make text layers editable in the Essential Graphics Panel.

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

    app.beginUndoGroup("Setup Editable Text");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof TextLayer)) continue;

            // The Source Text property can be directly added to Essential Graphics
            // No additional setup needed - just drag to EGP

            count++;
        }

        alert("Selected " + count + " text layer(s).\n\n" +
              "To make editable in Premiere:\n" +
              "1. Open Window > Essential Graphics\n" +
              "2. Select the composition\n" +
              "3. Drag the 'Source Text' property from each text layer to the panel\n" +
              "4. Rename as needed for clarity");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 6. Setup Full Controller System

Create a complete controller setup for a MOGRT template.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    app.beginUndoGroup("Setup MOGRT Controllers");
    try {
        // Create controller null
        var controller = comp.layers.addNull();
        controller.name = "MOGRT Controls";
        controller.moveToEnd();
        controller.shy = true;

        var effects = controller.property("Effects");

        // Add color controls
        var primaryColor = effects.addProperty("ADBE Color Control");
        primaryColor.name = "Primary Color";
        primaryColor.property("Color").setValue([0.2, 0.5, 1]);

        var secondaryColor = effects.addProperty("ADBE Color Control");
        secondaryColor.name = "Secondary Color";
        secondaryColor.property("Color").setValue([1, 0.3, 0.3]);

        // Add text options
        var showTitle = effects.addProperty("ADBE Checkbox Control");
        showTitle.name = "Show Title";
        showTitle.property("Checkbox").setValue(1);

        var showSubtitle = effects.addProperty("ADBE Checkbox Control");
        showSubtitle.name = "Show Subtitle";
        showSubtitle.property("Checkbox").setValue(1);

        // Add animation controls
        var animSpeed = effects.addProperty("ADBE Slider Control");
        animSpeed.name = "Animation Speed";
        animSpeed.property("Slider").setValue(1);

        var animStyle = effects.addProperty("ADBE Dropdown Control");
        animStyle.name = "Animation Style";

        // Add size control
        var scale = effects.addProperty("ADBE Slider Control");
        scale.name = "Overall Scale";
        scale.property("Slider").setValue(100);

        alert("Created MOGRT controller system on layer '" + controller.name + "'.\n\n" +
              "Next steps:\n" +
              "1. Open Window > Essential Graphics\n" +
              "2. Click 'Master: " + comp.name + "'\n" +
              "3. Drag each control property to the panel\n" +
              "4. Add any text layers' Source Text\n" +
              "5. Use File > Export > Motion Graphics Template\n\n" +
              "Link properties using expressions like:\n" +
              "thisComp.layer('" + controller.name + "').effect('Primary Color')('Color')");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Expression Templates for Linking

### Link to Color Control
```javascript
thisComp.layer("MOGRT Controls").effect("Primary Color")("Color")
```

### Link to Slider Control
```javascript
thisComp.layer("MOGRT Controls").effect("Overall Scale")("Slider")
```

### Link to Checkbox (for visibility)
```javascript
var show = thisComp.layer("MOGRT Controls").effect("Show Title")("Checkbox");
show ? 100 : 0;
```

### Link to Dropdown
```javascript
var style = thisComp.layer("MOGRT Controls").effect("Animation Style")("Menu").value;
if (style == 1) {
    // Fade
    linear(time, inPoint, inPoint + 0.5, 0, 100);
} else if (style == 2) {
    // Scale
    linear(time, inPoint, inPoint + 0.5, 0, 100);
} else {
    // None
    100;
}
```

## Exporting as MOGRT

1. Open the composition
2. Go to `Window > Essential Graphics`
3. Set the composition as Master
4. Drag properties to the panel and rename for clarity
5. Set property defaults and constraints
6. Go to `File > Export > Motion Graphics Template`
7. Choose destination and save

## Usage

When the user invokes `/ae-mogrt`, ask what they want to set up:

1. Slider controllers
2. Color controllers
3. Checkbox controllers
4. Dropdown controller
5. Make text editable
6. Full controller system setup

## Example Requests

- "Set up a MOGRT template with editable colors and text"
- "Add slider controls for animation speed"
- "Create a dropdown to switch between animation styles"
- "Make my lower third template editable in Premiere"
- "Set up Essential Graphics controls for my title template"
