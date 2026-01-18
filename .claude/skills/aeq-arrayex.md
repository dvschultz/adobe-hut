---
name: aeq-arrayex
description: AEQuery extended array class with iteration, filtering, and utility methods
---

# AEQuery arrayEx

`aeq.arrayEx` is an extended array class that provides modern array methods for ExtendScript. All AEQuery selectors return `arrayEx` objects.

## Creating arrayEx

```javascript
// From selector (returns arrayEx)
var layers = aeq('activecomp layer');

// Direct construction
var arr = new aeq.arrayEx([item1, item2, item3]);

// From regular array
var arr = new aeq.arrayEx(regularArray);

// Empty arrayEx
var arr = new aeq.arrayEx();
```

## Iteration Methods

### forEach(callback)

Executes a function for each element:

```javascript
var layers = aeq('activecomp layer');

layers.forEach(function(layer, index, array) {
    $.writeln(index + ': ' + layer.name);
});

// With context (this)
layers.forEach(function(layer) {
    this.count++;
}, { count: 0 });
```

### map(callback)

Creates new array with transformed values:

```javascript
var layers = aeq('activecomp layer');

// Get array of layer names
var names = layers.map(function(layer) {
    return layer.name;
});

// Get array of positions
var positions = layers.map(function(layer) {
    return layer.position.value;
});

// Transform to objects
var info = layers.map(function(layer) {
    return {
        name: layer.name,
        index: layer.index,
        enabled: layer.enabled
    };
});
```

### filter(callback)

Returns elements that pass a test:

```javascript
var layers = aeq('activecomp layer');

// Filter to text layers
var textLayers = layers.filter(function(layer) {
    return layer instanceof TextLayer;
});

// Filter to enabled layers
var enabled = layers.filter(function(layer) {
    return layer.enabled;
});

// Filter by name
var bgLayers = layers.filter(function(layer) {
    return layer.name.indexOf('BG') === 0;
});

// Complex filter
var editableLayers = layers.filter(function(layer) {
    return layer.enabled && !layer.locked && !layer.shy;
});
```

### find(callback)

Returns first matching element (or undefined):

```javascript
var layers = aeq('activecomp layer');

// Find by name
var controller = layers.find(function(layer) {
    return layer.name === 'Controller';
});

// Find first text layer
var firstText = layers.find(function(layer) {
    return layer instanceof TextLayer;
});

// Check if found
if (controller) {
    $.writeln('Found: ' + controller.name);
} else {
    $.writeln('Not found');
}
```

### findIndex(callback)

Returns index of first matching element (or -1):

```javascript
var layers = aeq('activecomp layer');

// Find index of layer by name
var idx = layers.findIndex(function(layer) {
    return layer.name === 'Background';
});

if (idx !== -1) {
    $.writeln('Found at index: ' + idx);
}
```

### every(callback)

Returns true if all elements pass the test:

```javascript
var layers = aeq('activecomp layer:is(selected)');

// Check if all selected layers are enabled
var allEnabled = layers.every(function(layer) {
    return layer.enabled;
});

// Check if all are text layers
var allText = layers.every(function(layer) {
    return layer instanceof TextLayer;
});

if (allEnabled) {
    $.writeln('All layers are enabled');
}
```

### some(callback)

Returns true if any element passes the test:

```javascript
var layers = aeq('activecomp layer');

// Check if any layer is locked
var hasLocked = layers.some(function(layer) {
    return layer.locked;
});

// Check if any layer has effects
var hasEffects = layers.some(function(layer) {
    return layer.property('Effects').numProperties > 0;
});

if (hasLocked) {
    alert('Warning: Some layers are locked');
}
```

### indexOf(element)

Returns index of element (or -1):

```javascript
var layers = aeq('activecomp layer');
var myLayer = comp.layer('Background');

var idx = layers.indexOf(myLayer);
if (idx !== -1) {
    $.writeln('Layer is at index: ' + idx);
}
```

## Utility Methods

### groupBy(callback)

Groups elements by a key function:

```javascript
var layers = aeq('activecomp layer');

// Group by layer type
var byType = layers.groupBy(function(layer) {
    if (layer instanceof TextLayer) return 'text';
    if (layer instanceof ShapeLayer) return 'shape';
    if (layer instanceof CameraLayer) return 'camera';
    if (layer instanceof LightLayer) return 'light';
    return 'other';
});

// Result: { text: [...], shape: [...], camera: [...], light: [...], other: [...] }
$.writeln('Text layers: ' + byType.text.length);
$.writeln('Shape layers: ' + byType.shape.length);

// Group by enabled state
var byEnabled = layers.groupBy(function(layer) {
    return layer.enabled ? 'enabled' : 'disabled';
});

// Group by first letter of name
var byLetter = layers.groupBy(function(layer) {
    return layer.name.charAt(0).toUpperCase();
});
```

### attr(attributeName, [newValue])

Get or set attributes on all elements:

```javascript
var layers = aeq('activecomp layer:is(selected)');

// Get attribute from all (returns array)
var names = layers.attr('name');
var positions = layers.attr('position');  // Returns position properties

// Set attribute on all
layers.attr('enabled', false);  // Disable all
layers.attr('locked', true);    // Lock all
layers.attr('shy', false);      // Unshy all

// Toggle with function
layers.attr('enabled', function(layer, currentValue) {
    return !currentValue;  // Toggle enabled state
});
```

### first()

Returns first element:

```javascript
var layers = aeq('activecomp layer');

var firstLayer = layers.first();
if (firstLayer) {
    $.writeln('First layer: ' + firstLayer.name);
}

// Chained with filter
var firstText = aeq('activecomp layer')
    .filter(function(l) { return l instanceof TextLayer; })
    .first();
```

### insertAt(index, element)

Inserts element at specified index:

```javascript
var arr = new aeq.arrayEx(['a', 'b', 'd']);

arr.insertAt(2, 'c');
// Result: ['a', 'b', 'c', 'd']

arr.insertAt(0, 'start');
// Result: ['start', 'a', 'b', 'c', 'd']
```

## Method Chaining

Chain multiple operations for powerful data pipelines:

```javascript
var result = aeq('activecomp layer')
    // Filter to text layers
    .filter(function(layer) {
        return layer instanceof TextLayer;
    })
    // Filter to enabled
    .filter(function(layer) {
        return layer.enabled;
    })
    // Get names
    .map(function(layer) {
        return layer.name;
    });

// Or combine in single filter
var textNames = aeq('activecomp layer')
    .filter(function(l) {
        return l instanceof TextLayer && l.enabled;
    })
    .map(function(l) { return l.name; });
```

### Complex Pipeline Example

```javascript
// Group selected layers by type, then process each group
var grouped = aeq('activecomp layer:is(selected)')
    .groupBy(function(layer) {
        if (layer instanceof TextLayer) return 'text';
        if (layer instanceof ShapeLayer) return 'shape';
        return 'other';
    });

// Process text layers
if (grouped.text) {
    new aeq.arrayEx(grouped.text).forEach(function(layer) {
        layer.shy = true;
    });
}

// Process shape layers
if (grouped.shape) {
    new aeq.arrayEx(grouped.shape).forEach(function(layer) {
        layer.locked = true;
    });
}
```

## Practical Examples

### Batch Rename Layers

```javascript
aeq('activecomp layer:is(selected)').forEach(function(layer, index) {
    layer.name = 'Layer_' + (index + 1).toString();
});
```

### Collect Layer Info

```javascript
var info = aeq('activecomp layer').map(function(layer) {
    return {
        name: layer.name,
        type: layer.constructor.name,
        index: layer.index,
        inPoint: layer.inPoint,
        outPoint: layer.outPoint
    };
});

// Write to file
aeq.writeFile('/path/to/output.json', JSON.stringify(info, null, 2));
```

### Find Duplicate Names

```javascript
var layers = aeq('activecomp layer');
var names = layers.attr('name');

var duplicates = names.filter(function(name, index) {
    return names.indexOf(name) !== index;
});

if (duplicates.length > 0) {
    alert('Duplicate names found:\n' + duplicates.join('\n'));
}
```

### Disable Layers by Pattern

```javascript
aeq('activecomp layer')
    .filter(function(layer) {
        return layer.name.indexOf('_temp') !== -1;
    })
    .attr('enabled', false);
```

### Count Layers by Type

```javascript
var counts = {};

aeq('activecomp layer').forEach(function(layer) {
    var type = layer.constructor.name;
    counts[type] = (counts[type] || 0) + 1;
});

for (var type in counts) {
    $.writeln(type + ': ' + counts[type]);
}
```

### Select Layers Programmatically

```javascript
// Deselect all
aeq('activecomp layer').attr('selected', false);

// Select only text layers
aeq('activecomp layer:is(TextLayer)').attr('selected', true);
```

### Find Layers Without Effects

```javascript
var noEffects = aeq('activecomp layer').filter(function(layer) {
    var effects = layer.property('Effects');
    return effects === null || effects.numProperties === 0;
});

$.writeln('Layers without effects: ' + noEffects.length);
```

### Get Unique Parent Layers

```javascript
var parents = aeq('activecomp layer')
    .map(function(layer) {
        return layer.parent;
    })
    .filter(function(parent) {
        return parent !== null;
    });

// Remove duplicates
var unique = [];
parents.forEach(function(parent) {
    if (unique.indexOf(parent) === -1) {
        unique.push(parent);
    }
});
```
