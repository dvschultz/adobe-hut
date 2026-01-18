---
name: ae-expression-debug
description: "Expression troubleshooting in After Effects: validate syntax, find expression errors, convert expressions to keyframes."
---

# AE Expression Debug

Find, fix, and convert expressions in After Effects.

## Available Operations

### 1. Find All Expression Errors

Scan the project or composition for expression errors.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var errors = [];

    // Scan all layers
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        scanPropertyGroup(layer, layer.name, errors);
    }

    if (errors.length === 0) {
        alert("No expression errors found in this composition.");
    } else {
        var report = "Found " + errors.length + " expression error(s):\n\n";
        for (var j = 0; j < errors.length; j++) {
            report += (j + 1) + ". " + errors[j].path + "\n";
            report += "   Error: " + errors[j].error + "\n\n";
        }

        // Save or display
        var saveFile = File.saveDialog("Save error report", "*.txt");
        if (saveFile) {
            saveFile.open("w");
            saveFile.write(report);
            saveFile.close();
            alert("Error report saved to:\n" + saveFile.fsName);
        } else {
            alert(report.substring(0, 2000));  // Truncate for alert dialog
        }
    }

    function scanPropertyGroup(group, path, errors) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            var propPath = path + " > " + prop.name;

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "") {
                    if (prop.expressionError !== "") {
                        errors.push({
                            path: propPath,
                            error: prop.expressionError,
                            expression: prop.expression
                        });
                    }
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                scanPropertyGroup(prop, propPath, errors);
            }
        }
    }

})();
```

### 2. List All Expressions

Generate a report of all expressions in the composition.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var expressions = [];

    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);
        collectExpressions(layer, layer.name, expressions);
    }

    if (expressions.length === 0) {
        alert("No expressions found in this composition.");
        return;
    }

    var report = "Found " + expressions.length + " expression(s):\n\n";
    for (var j = 0; j < expressions.length; j++) {
        var expr = expressions[j];
        report += "=== " + expr.path + " ===\n";
        report += "Status: " + (expr.error ? "ERROR: " + expr.error : "OK") + "\n";
        report += "Enabled: " + (expr.enabled ? "Yes" : "No") + "\n";
        report += "Expression:\n" + expr.expression + "\n\n";
    }

    var saveFile = File.saveDialog("Save expression report", "*.txt");
    if (saveFile) {
        saveFile.open("w");
        saveFile.write(report);
        saveFile.close();
        alert("Saved " + expressions.length + " expressions to:\n" + saveFile.fsName);
    }

    function collectExpressions(group, path, list) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            var propPath = path + " > " + prop.name;

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "") {
                    list.push({
                        path: propPath,
                        expression: prop.expression,
                        error: prop.expressionError,
                        enabled: prop.expressionEnabled
                    });
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                collectExpressions(prop, propPath, list);
            }
        }
    }

})();
```

### 3. Disable All Expressions

Disable (but don't delete) all expressions in the composition.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    app.beginUndoGroup("Disable All Expressions");
    try {
        var count = 0;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            count += disableExpressions(layer);
        }

        alert("Disabled " + count + " expression(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function disableExpressions(group) {
        var count = 0;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "" && prop.expressionEnabled) {
                    prop.expressionEnabled = false;
                    count++;
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                count += disableExpressions(prop);
            }
        }
        return count;
    }

})();
```

### 4. Enable All Expressions

Re-enable all expressions that were disabled.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    app.beginUndoGroup("Enable All Expressions");
    try {
        var count = 0;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            count += enableExpressions(layer);
        }

        alert("Enabled " + count + " expression(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function enableExpressions(group) {
        var count = 0;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "" && !prop.expressionEnabled) {
                    prop.expressionEnabled = true;
                    count++;
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                count += enableExpressions(prop);
            }
        }
        return count;
    }

})();
```

### 5. Delete All Expressions

Remove all expressions from the composition (irreversible).

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var count = countExpressions(comp);
    if (count === 0) {
        alert("No expressions found.");
        return;
    }

    var confirm = prompt(
        "WARNING: This will delete " + count + " expression(s).\n" +
        "Type 'delete' to confirm:",
        ""
    );

    if (confirm !== "delete") {
        alert("Cancelled.");
        return;
    }

    app.beginUndoGroup("Delete All Expressions");
    try {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            deleteExpressions(layer);
        }

        alert("Deleted " + count + " expression(s).");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function countExpressions(comp) {
        var count = 0;
        for (var i = 1; i <= comp.numLayers; i++) {
            count += countInGroup(comp.layer(i));
        }
        return count;
    }

    function countInGroup(group) {
        var count = 0;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "") count++;
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                count += countInGroup(prop);
            }
        }
        return count;
    }

    function deleteExpressions(group) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "" && prop.canSetExpression) {
                    prop.expression = "";
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                deleteExpressions(prop);
            }
        }
    }

})();
```

### 6. Bake Expressions to Keyframes

Convert expression-driven values to keyframes.

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
        alert("Please select layers with expressions to bake.");
        return;
    }

    var frameStep = parseInt(prompt("Keyframe every N frames:", "1"), 10);
    if (isNaN(frameStep) || frameStep < 1) {
        alert("Invalid frame step.");
        return;
    }

    var timeStep = frameStep / comp.frameRate;

    app.beginUndoGroup("Bake Expressions");
    try {
        var bakedCount = 0;

        for (var i = 0; i < selected.length; i++) {
            bakedCount += bakeLayer(selected[i], comp, timeStep);
        }

        alert("Baked " + bakedCount + " expression(s) to keyframes.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

    function bakeLayer(layer, comp, timeStep) {
        var count = 0;
        bakeGroup(layer, comp, timeStep, function() { count++; });
        return count;
    }

    function bakeGroup(group, comp, timeStep, callback) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);

            if (prop.propertyType === PropertyType.PROPERTY) {
                if (prop.expression !== "" && prop.expressionEnabled && prop.canSetExpression) {
                    bakeProperty(prop, comp, timeStep);
                    callback();
                }
            } else if (prop.propertyType === PropertyType.INDEXED_GROUP ||
                       prop.propertyType === PropertyType.NAMED_GROUP) {
                bakeGroup(prop, comp, timeStep, callback);
            }
        }
    }

    function bakeProperty(prop, comp, timeStep) {
        var start = comp.workAreaStart;
        var end = start + comp.workAreaDuration;
        var samples = [];

        // Sample values
        for (var t = start; t <= end; t += timeStep) {
            samples.push({
                time: t,
                value: prop.valueAtTime(t, false)
            });
        }

        // Remove expression
        prop.expression = "";

        // Set keyframes
        for (var j = 0; j < samples.length; j++) {
            prop.setValueAtTime(samples[j].time, samples[j].value);
        }
    }

})();
```

### 7. Validate Expression Syntax

Check if an expression has valid syntax without applying it.

```javascript
#target aftereffects

(function() {
    var expression = prompt(
        "Enter expression to validate:",
        "wiggle(2, 50)"
    );

    if (!expression) return;

    // Try to create a test composition and layer
    var testComp = app.project.items.addComp("_Expression_Test", 100, 100, 1, 1, 30);

    try {
        var testLayer = testComp.layers.addNull();
        var testProp = testLayer.property("Position");

        testProp.expression = expression;

        if (testProp.expressionError !== "") {
            alert("INVALID Expression:\n\n" + testProp.expressionError);
        } else {
            alert("VALID Expression\n\nThe expression syntax is correct.");
        }

    } catch (e) {
        alert("Error testing expression:\n" + e.message);
    }

    // Clean up
    testComp.remove();

})();
```

## Common Expression Errors and Fixes

### Error: "undefined is not an object"
**Cause**: Reference to non-existent layer or property
**Fix**: Check layer/property names, use `try-catch` for safety

```javascript
// Before (error-prone)
thisComp.layer("Control").effect("Slider")("Slider")

// After (safer)
try {
    thisComp.layer("Control").effect("Slider")("Slider")
} catch(e) {
    50  // fallback value
}
```

### Error: "Cannot access..."
**Cause**: Circular dependency or accessing before availability
**Fix**: Use `valueAtTime` with offset or check time

```javascript
// Before
thisComp.layer("Other").position

// After (with delay to prevent circular)
thisComp.layer("Other").position.valueAtTime(time - thisComp.frameDuration)
```

### Error: "Property not found"
**Cause**: Incorrect property path
**Fix**: Use correct property name or match name

```javascript
// These are equivalent:
layer.position
layer.transform.position
layer.property("Position")
layer.property("ADBE Position")
```

### Error: "Expected expression but got..."
**Cause**: Syntax error (usually ES6+ syntax)
**Fix**: Use ES3-compatible syntax

```javascript
// Before (ES6 - won't work)
const x = 5;
let y = [1, 2, 3].map(n => n * 2);

// After (ES3 - works)
var x = 5;
var arr = [1, 2, 3];
var y = [];
for (var i = 0; i < arr.length; i++) {
    y.push(arr[i] * 2);
}
```

## Usage

When the user invokes `/ae-expression-debug`, ask what they need:

1. Find all expression errors
2. List all expressions
3. Disable all expressions
4. Enable all expressions
5. Delete all expressions
6. Bake expressions to keyframes
7. Validate expression syntax

## Example Requests

- "Find all broken expressions in my comp"
- "Convert all expressions to keyframes"
- "List every expression in this composition"
- "Disable expressions for performance testing"
- "Check if this expression is valid before I use it"
