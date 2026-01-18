---
name: ae-expression-link
description: "Property linking in After Effects: create controller nulls, link properties to controls, set up slider/checkbox/color controls."
---

# AE Expression Link

Set up property linking and controller systems in After Effects.

## Available Operations

### 1. Create Controller Null with Controls

Create a null object with various control effects.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    // Configuration
    var controllerName = prompt("Controller name:", "Controls");
    if (!controllerName) return;

    app.beginUndoGroup("Create Controller");
    try {
        var controller = comp.layers.addNull();
        controller.name = controllerName;
        controller.moveToEnd();

        var effects = controller.property("Effects");

        // Add common controls
        var slider1 = effects.addProperty("ADBE Slider Control");
        slider1.name = "Amount";
        slider1.property("Slider").setValue(50);

        var slider2 = effects.addProperty("ADBE Slider Control");
        slider2.name = "Speed";
        slider2.property("Slider").setValue(1);

        var checkbox = effects.addProperty("ADBE Checkbox Control");
        checkbox.name = "Enable";
        checkbox.property("Checkbox").setValue(1);

        var color = effects.addProperty("ADBE Color Control");
        color.name = "Color";
        color.property("Color").setValue([1, 0.5, 0]);

        var point = effects.addProperty("ADBE Point Control");
        point.name = "Position Offset";

        alert("Created controller '" + controllerName + "' with:\n" +
              "- Amount (Slider)\n" +
              "- Speed (Slider)\n" +
              "- Enable (Checkbox)\n" +
              "- Color (Color)\n" +
              "- Position Offset (Point)\n\n" +
              "Link properties using expressions like:\n" +
              "thisComp.layer('" + controllerName + "').effect('Amount')('Slider')");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Link Selected Property to Slider

Link a property on selected layers to a slider control.

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
        alert("Please select at least one layer.");
        return;
    }

    var propertyPath = prompt(
        "Property to link (e.g., Opacity, Scale, Position):",
        "Opacity"
    );
    if (!propertyPath) return;

    var controllerName = prompt("Controller layer name:", "Controls");
    if (!controllerName) return;

    var sliderName = prompt("Slider name:", propertyPath + " Control");
    if (!sliderName) return;

    app.beginUndoGroup("Link to Slider");
    try {
        // Find or create controller
        var controller = findOrCreateController(comp, controllerName);

        // Find or create slider
        var slider = findOrCreateSlider(controller, sliderName);

        // Get initial value from first selected layer
        var firstProp = selected[0].property("Transform").property(propertyPath);
        var initialValue = 100;
        if (firstProp) {
            if (firstProp.value instanceof Array) {
                initialValue = firstProp.value[0];
            } else {
                initialValue = firstProp.value;
            }
        }
        slider.property("Slider").setValue(initialValue);

        // Build expression
        var expression = "thisComp.layer('" + controllerName + "').effect('" + sliderName + "')('Slider')";

        // Apply to selected layers
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var prop = layer.property("Transform").property(propertyPath);

            if (prop && prop.canSetExpression) {
                if (prop.value instanceof Array) {
                    // For multi-dimensional properties
                    var dims = prop.value.length;
                    if (dims === 2) {
                        prop.expression = "[" + expression + ", " + expression + "]";
                    } else if (dims === 3) {
                        prop.expression = "[" + expression + ", " + expression + ", " + expression + "]";
                    }
                } else {
                    prop.expression = expression;
                }
                count++;
            }
        }

        alert("Linked " + count + " layer(s) to '" + sliderName + "' slider.");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function findOrCreateController(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name && comp.layer(i).nullLayer) {
                return comp.layer(i);
            }
        }
        var controller = comp.layers.addNull();
        controller.name = name;
        controller.moveToEnd();
        return controller;
    }

    function findOrCreateSlider(controller, name) {
        var effects = controller.property("Effects");
        for (var i = 1; i <= effects.numProperties; i++) {
            if (effects.property(i).name === name) {
                return effects.property(i);
            }
        }
        var slider = effects.addProperty("ADBE Slider Control");
        slider.name = name;
        return slider;
    }

})();
```

### 3. Link Color Properties

Link color properties (fill, stroke, etc.) to a color control.

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
        alert("Please select at least one layer.");
        return;
    }

    var colorName = prompt("Color control name:", "Primary Color");
    if (!colorName) return;

    var controllerName = prompt("Controller layer name:", "Controls");
    if (!controllerName) return;

    app.beginUndoGroup("Link Colors");
    try {
        var controller = findOrCreateController(comp, controllerName);

        // Create color control
        var colorCtrl = controller.property("Effects").addProperty("ADBE Color Control");
        colorCtrl.name = colorName;
        colorCtrl.property("Color").setValue([1, 0.5, 0]);

        var expression = "thisComp.layer('" + controllerName + "').effect('" + colorName + "')('Color')";

        // Look for color properties to link
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];

            // Text layers - fill color
            if (layer instanceof TextLayer) {
                var sourceText = layer.property("Source Text");
                if (sourceText) {
                    // Note: Text fill color requires different approach via expressions
                    alert("For text layers, use text animator expressions to link colors.");
                }
            }

            // Shape layers - look for fill
            if (layer instanceof ShapeLayer) {
                var contents = layer.property("Contents");
                count += linkShapeColors(contents, expression);
            }

            // Effect colors
            var effects = layer.property("Effects");
            if (effects) {
                for (var j = 1; j <= effects.numProperties; j++) {
                    var effect = effects.property(j);
                    count += linkEffectColors(effect, expression);
                }
            }
        }

        alert("Linked " + count + " color property(ies) to '" + colorName + "'.");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function findOrCreateController(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name && comp.layer(i).nullLayer) {
                return comp.layer(i);
            }
        }
        var controller = comp.layers.addNull();
        controller.name = name;
        controller.moveToEnd();
        return controller;
    }

    function linkShapeColors(group, expression) {
        var count = 0;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);

            if (prop.matchName === "ADBE Vector Graphic - Fill") {
                var colorProp = prop.property("Color");
                if (colorProp && colorProp.canSetExpression) {
                    colorProp.expression = expression;
                    count++;
                }
            } else if (prop.matchName === "ADBE Vector Graphic - Stroke") {
                var strokeColor = prop.property("Color");
                if (strokeColor && strokeColor.canSetExpression) {
                    strokeColor.expression = expression;
                    count++;
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                count += linkShapeColors(prop, expression);
            }
        }
        return count;
    }

    function linkEffectColors(effect, expression) {
        var count = 0;
        for (var i = 1; i <= effect.numProperties; i++) {
            var prop = effect.property(i);
            if (prop.propertyValueType === PropertyValueType.COLOR) {
                if (prop.canSetExpression) {
                    prop.expression = expression;
                    count++;
                }
            }
        }
        return count;
    }

})();
```

### 4. Create Master Scale Control

Link scale of multiple layers to a single control.

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
        alert("Please select layers to control.");
        return;
    }

    var controllerName = prompt("Controller layer name:", "Controls");
    if (!controllerName) return;

    app.beginUndoGroup("Create Scale Control");
    try {
        var controller = findOrCreateController(comp, controllerName);
        var effects = controller.property("Effects");

        // Create slider
        var slider = effects.addProperty("ADBE Slider Control");
        slider.name = "Master Scale";
        slider.property("Slider").setValue(100);

        var expression = "var s = thisComp.layer('" + controllerName + "').effect('Master Scale')('Slider');\n" +
                         "[s, s]";

        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var scaleProp = layer.property("Transform").property("Scale");

            if (scaleProp && scaleProp.canSetExpression) {
                scaleProp.expression = expression;
                count++;
            }
        }

        alert("Linked scale of " + count + " layer(s) to 'Master Scale' slider.");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function findOrCreateController(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name && comp.layer(i).nullLayer) {
                return comp.layer(i);
            }
        }
        var controller = comp.layers.addNull();
        controller.name = name;
        controller.moveToEnd();
        return controller;
    }

})();
```

### 5. Create Visibility Toggle

Link layer opacity to checkbox controls.

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
        alert("Please select layers to control.");
        return;
    }

    var controllerName = prompt("Controller layer name:", "Controls");
    if (!controllerName) return;

    app.beginUndoGroup("Create Visibility Toggles");
    try {
        var controller = findOrCreateController(comp, controllerName);
        var effects = controller.property("Effects");

        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            var checkboxName = "Show " + layer.name;

            // Create checkbox
            var checkbox = effects.addProperty("ADBE Checkbox Control");
            checkbox.name = checkboxName;
            checkbox.property("Checkbox").setValue(1);

            // Link opacity
            var opacityProp = layer.property("Transform").property("Opacity");
            if (opacityProp && opacityProp.canSetExpression) {
                opacityProp.expression =
                    "var show = thisComp.layer('" + controllerName + "').effect('" + checkboxName + "')('Checkbox');\n" +
                    "show ? 100 : 0;";
                count++;
            }
        }

        alert("Created " + count + " visibility toggle(s).");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function findOrCreateController(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name && comp.layer(i).nullLayer) {
                return comp.layer(i);
            }
        }
        var controller = comp.layers.addNull();
        controller.name = name;
        controller.moveToEnd();
        return controller;
    }

})();
```

### 6. Create Follow/Delay System

Set up layers to follow another layer with delay.

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
        alert("Select leader layer first, then follower layer(s).");
        return;
    }

    var leader = selected[0];
    var followers = selected.slice(1);

    var delayPerLayer = parseFloat(prompt("Delay between layers (frames):", "2"));
    if (isNaN(delayPerLayer)) return;

    var delaySeconds = delayPerLayer / comp.frameRate;

    app.beginUndoGroup("Create Follow System");
    try {
        for (var i = 0; i < followers.length; i++) {
            var follower = followers[i];
            var delay = delaySeconds * (i + 1);

            var positionProp = follower.property("Transform").property("Position");
            if (positionProp && positionProp.canSetExpression) {
                positionProp.expression =
                    "thisComp.layer('" + leader.name + "').transform.position.valueAtTime(time - " + delay + ")";
            }

            var rotationProp = follower.property("Transform").property("Rotation");
            if (rotationProp && rotationProp.canSetExpression) {
                rotationProp.expression =
                    "thisComp.layer('" + leader.name + "').transform.rotation.valueAtTime(time - " + delay + ")";
            }
        }

        alert("Created follow system:\n" +
              "Leader: " + leader.name + "\n" +
              "Followers: " + followers.length + " layer(s)\n" +
              "Delay: " + delayPerLayer + " frames between each");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Expression Templates

### Link to Slider
```javascript
thisComp.layer("Controls").effect("My Slider")("Slider")
```

### Link to Checkbox (on/off)
```javascript
var enabled = thisComp.layer("Controls").effect("Enable")("Checkbox");
enabled ? value : 0;
```

### Link to Color
```javascript
thisComp.layer("Controls").effect("My Color")("Color")
```

### Link to Point
```javascript
var offset = thisComp.layer("Controls").effect("Offset")("Point");
value + offset;
```

### Link to Dropdown
```javascript
var menu = thisComp.layer("Controls").effect("Style")("Menu").value;
if (menu == 1) {
    // Option 1
} else if (menu == 2) {
    // Option 2
} else {
    // Default
}
```

### Link with Multiplier
```javascript
var mult = thisComp.layer("Controls").effect("Multiplier")("Slider") / 100;
value * mult;
```

### Link with Offset
```javascript
var offset = thisComp.layer("Controls").effect("Offset")("Slider");
value + offset;
```

## Usage

When the user invokes `/ae-expression-link`, ask what they want to do:

1. Create controller null with controls
2. Link property to slider
3. Link colors to control
4. Create master scale control
5. Create visibility toggles
6. Create follow/delay system

## Example Requests

- "Create a controller null with sliders and color pickers"
- "Link the opacity of these layers to a slider"
- "Make a master color control for my shapes"
- "Set up layers to follow the leader with delay"
- "Create on/off toggles for each layer"
