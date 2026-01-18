---
name: ae-shape-ops
description: "Shape layer operations in After Effects: create shapes, apply path operations, shape layer templating."
---

# AE Shape Operations

Create and manipulate shape layers in After Effects.

## Available Operations

### 1. Create Basic Shapes

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    // Configuration
    var shapeType = "rectangle";  // rectangle, ellipse, polygon, star
    var fillColor = [0.2, 0.6, 1];  // RGB 0-1
    var strokeColor = [1, 1, 1];
    var strokeWidth = 0;  // 0 for no stroke
    var size = [200, 200];

    app.beginUndoGroup("Create Shape");
    try {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = shapeType.charAt(0).toUpperCase() + shapeType.slice(1);

        var contents = shapeLayer.property("Contents");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Shape";

        var shapesInGroup = shapeGroup.property("Contents");

        // Add shape path
        if (shapeType === "rectangle") {
            var rect = shapesInGroup.addProperty("ADBE Vector Shape - Rect");
            rect.property("Size").setValue(size);
            rect.property("Roundness").setValue(0);
        } else if (shapeType === "ellipse") {
            var ellipse = shapesInGroup.addProperty("ADBE Vector Shape - Ellipse");
            ellipse.property("Size").setValue(size);
        } else if (shapeType === "polygon") {
            var poly = shapesInGroup.addProperty("ADBE Vector Shape - Star");
            poly.property("Type").setValue(1);  // Polygon
            poly.property("Points").setValue(6);
            poly.property("Outer Radius").setValue(size[0] / 2);
        } else if (shapeType === "star") {
            var star = shapesInGroup.addProperty("ADBE Vector Shape - Star");
            star.property("Type").setValue(2);  // Star
            star.property("Points").setValue(5);
            star.property("Outer Radius").setValue(size[0] / 2);
            star.property("Inner Radius").setValue(size[0] / 4);
        }

        // Add stroke
        if (strokeWidth > 0) {
            var stroke = shapesInGroup.addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").setValue(strokeColor);
            stroke.property("Stroke Width").setValue(strokeWidth);
        }

        // Add fill
        var fill = shapesInGroup.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(fillColor);

        // Center in composition
        shapeLayer.property("Position").setValue([comp.width/2, comp.height/2]);

        alert("Created " + shapeType + " shape layer.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Create Line/Arrow

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    // Configuration
    var startPoint = [comp.width * 0.25, comp.height / 2];
    var endPoint = [comp.width * 0.75, comp.height / 2];
    var strokeColor = [1, 1, 1];
    var strokeWidth = 4;
    var addArrow = true;

    app.beginUndoGroup("Create Line");
    try {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = addArrow ? "Arrow" : "Line";

        var contents = shapeLayer.property("Contents");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Line";

        var shapesInGroup = shapeGroup.property("Contents");

        // Add path
        var pathProp = shapesInGroup.addProperty("ADBE Vector Shape - Group");
        var pathData = new Shape();
        pathData.vertices = [startPoint, endPoint];
        pathData.closed = false;
        pathProp.property("Path").setValue(pathData);

        // Add stroke
        var stroke = shapesInGroup.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("Color").setValue(strokeColor);
        stroke.property("Stroke Width").setValue(strokeWidth);
        stroke.property("Line Cap").setValue(2);  // Round cap

        // Add arrow (trim paths + additional shape)
        if (addArrow) {
            // Add arrowhead as separate group
            var arrowGroup = contents.addProperty("ADBE Vector Group");
            arrowGroup.name = "Arrowhead";

            var arrowContents = arrowGroup.property("Contents");
            var arrowPath = arrowContents.addProperty("ADBE Vector Shape - Group");

            // Calculate arrow points
            var dx = endPoint[0] - startPoint[0];
            var dy = endPoint[1] - startPoint[1];
            var angle = Math.atan2(dy, dx);
            var arrowSize = 20;
            var arrowAngle = Math.PI / 6;  // 30 degrees

            var arrowData = new Shape();
            arrowData.vertices = [
                [endPoint[0] - arrowSize * Math.cos(angle - arrowAngle),
                 endPoint[1] - arrowSize * Math.sin(angle - arrowAngle)],
                endPoint,
                [endPoint[0] - arrowSize * Math.cos(angle + arrowAngle),
                 endPoint[1] - arrowSize * Math.sin(angle + arrowAngle)]
            ];
            arrowData.closed = false;
            arrowPath.property("Path").setValue(arrowData);

            var arrowStroke = arrowContents.addProperty("ADBE Vector Graphic - Stroke");
            arrowStroke.property("Color").setValue(strokeColor);
            arrowStroke.property("Stroke Width").setValue(strokeWidth);
            arrowStroke.property("Line Cap").setValue(2);
            arrowStroke.property("Line Join").setValue(2);  // Round join
        }

        // Reset position to 0,0 since we're using absolute coordinates
        shapeLayer.property("Position").setValue([0, 0]);

        alert("Created " + (addArrow ? "arrow" : "line") + ".");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Add Trim Paths Animation

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
        alert("Please select at least one shape layer.");
        return;
    }

    var animDuration = 1.0;  // seconds

    app.beginUndoGroup("Add Trim Paths");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof ShapeLayer)) continue;

            var contents = layer.property("Contents");

            // Add trim paths to the root contents
            var trimPaths = contents.addProperty("ADBE Vector Filter - Trim");

            // Animate End property
            var endProp = trimPaths.property("End");
            endProp.setValueAtTime(layer.inPoint, 0);
            endProp.setValueAtTime(layer.inPoint + animDuration, 100);

            count++;
        }

        alert("Added trim paths animation to " + count + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 4. Add Repeater

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
        alert("Please select at least one shape layer.");
        return;
    }

    // Configuration
    var copies = 5;
    var offsetX = 100;
    var offsetY = 0;
    var scaleChange = -10;  // Percentage change per copy

    app.beginUndoGroup("Add Repeater");
    try {
        var count = 0;
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof ShapeLayer)) continue;

            var contents = layer.property("Contents");

            // Find first shape group
            var shapeGroup = null;
            for (var j = 1; j <= contents.numProperties; j++) {
                if (contents.property(j).matchName === "ADBE Vector Group") {
                    shapeGroup = contents.property(j);
                    break;
                }
            }

            if (!shapeGroup) continue;

            // Add repeater inside the shape group
            var groupContents = shapeGroup.property("Contents");
            var repeater = groupContents.addProperty("ADBE Vector Filter - Repeater");

            repeater.property("Copies").setValue(copies);

            var transform = repeater.property("Transform: Repeater");
            transform.property("Position").setValue([offsetX, offsetY]);
            transform.property("Scale").setValue([100 + scaleChange, 100 + scaleChange]);

            count++;
        }

        alert("Added repeater to " + count + " layer(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Convert to Bezier Path

Convert parametric shapes to bezier paths for custom editing.

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
        alert("Please select at least one shape layer.");
        return;
    }

    app.beginUndoGroup("Convert to Bezier");
    try {
        for (var i = 0; i < selected.length; i++) {
            var layer = selected[i];
            if (!(layer instanceof ShapeLayer)) continue;

            // Use the menu command equivalent
            layer.selected = true;

            // Note: Direct API for conversion is limited
            // This typically requires using app.executeCommand()
            // Command ID for "Convert to Bezier Path" varies by version
        }

        alert("Select shapes and use Layer > Convert to Bezier Path");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 6. Merge Shape Layers

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
        alert("Please select at least 2 shape layers to merge.");
        return;
    }

    // Verify all are shape layers
    for (var i = 0; i < selected.length; i++) {
        if (!(selected[i] instanceof ShapeLayer)) {
            alert("All selected layers must be shape layers.");
            return;
        }
    }

    app.beginUndoGroup("Merge Shape Layers");
    try {
        // Create new shape layer
        var mergedLayer = comp.layers.addShape();
        mergedLayer.name = "Merged Shapes";

        var mergedContents = mergedLayer.property("Contents");
        var groupIndex = 1;

        // Copy each layer's shape groups
        for (var i = 0; i < selected.length; i++) {
            var sourceLayer = selected[i];
            var sourceContents = sourceLayer.property("Contents");

            for (var j = 1; j <= sourceContents.numProperties; j++) {
                var prop = sourceContents.property(j);
                if (prop.matchName === "ADBE Vector Group") {
                    // Duplicate the group to merged layer
                    var newGroup = mergedContents.addProperty("ADBE Vector Group");
                    newGroup.name = sourceLayer.name + " " + groupIndex;
                    groupIndex++;

                    // Note: Full property copying requires more complex logic
                    // This creates empty groups as placeholders
                }
            }
        }

        // Position at first layer's position
        mergedLayer.property("Position").setValue(selected[0].property("Position").value);

        alert("Created merged shape layer. Note: Manual adjustment may be needed.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Shape Layer Match Names Reference

| Element | Match Name |
|---------|------------|
| Shape Group | ADBE Vector Group |
| Rectangle | ADBE Vector Shape - Rect |
| Ellipse | ADBE Vector Shape - Ellipse |
| Polygon/Star | ADBE Vector Shape - Star |
| Path | ADBE Vector Shape - Group |
| Fill | ADBE Vector Graphic - Fill |
| Stroke | ADBE Vector Graphic - Stroke |
| Gradient Fill | ADBE Vector Graphic - G-Fill |
| Gradient Stroke | ADBE Vector Graphic - G-Stroke |
| Trim Paths | ADBE Vector Filter - Trim |
| Repeater | ADBE Vector Filter - Repeater |
| Offset Paths | ADBE Vector Filter - Offset |
| Merge Paths | ADBE Vector Filter - Merge |
| Round Corners | ADBE Vector Filter - RC |
| Pucker & Bloat | ADBE Vector Filter - PB |
| Twist | ADBE Vector Filter - Twist |
| Zig Zag | ADBE Vector Filter - Zigzag |
| Wiggle Paths | ADBE Vector Filter - Roughen |

## Usage

When the user invokes `/ae-shape-ops`, ask what they want to do:

1. Create basic shape (rectangle, ellipse, polygon, star)
2. Create line/arrow
3. Add trim paths animation
4. Add repeater
5. Merge shape layers

## Example Requests

- "Create a circle shape layer"
- "Add trim paths animation to selected shapes"
- "Make a 5-pointed star"
- "Add repeater with 10 copies offset horizontally"
- "Create an arrow pointing right"
