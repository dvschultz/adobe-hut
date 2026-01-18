---
name: aeq-ui
description: AEQuery UI building utilities for ScriptUI dialogs and palettes
---

# AEQuery UI Utilities

AEQuery provides utilities for building ScriptUI interfaces quickly with simplified APIs.

## Creating Windows

### aeq.ui.createDialog(title, options)

Creates a modal dialog:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');
// or with options
var dialog = aeq.ui.createDialog('My Dialog', {
    resizeable: true
});
```

### aeq.ui.createWindow(title, options)

Creates a floating palette window:

```javascript
var window = aeq.ui.createWindow('My Palette');
```

### aeq.ui.createMainWindow(thisObj, title, options)

Creates a dockable panel (for script panels):

```javascript
// Use in your main script entry
(function(thisObj) {
    var panel = aeq.ui.createMainWindow(thisObj, 'My Panel');

    // Add controls...

    if (panel instanceof Window) {
        panel.show();
    }
})(this);
```

## Container Methods

All window types return a container object with methods for adding controls.

### addStaticText(text)

Adds a label:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

dialog.addStaticText('Enter a value:');
dialog.addStaticText('This is informational text');
```

### addButton(label, onClick)

Adds a clickable button:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

dialog.addButton('Click Me', function() {
    alert('Button clicked!');
});

// Button with reference
var myButton = dialog.addButton('Process', function() {
    processLayers();
    dialog.close();
});
```

### addCheckbox(label, defaultValue, onChange)

Adds a checkbox:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

// Basic checkbox
var enableOption = dialog.addCheckbox('Enable feature', true);

// With change handler
var autoSave = dialog.addCheckbox('Auto-save', false, function(checked) {
    $.writeln('Auto-save: ' + checked);
});

// Get value later
var isEnabled = enableOption.getValue();
```

### addEditText(defaultValue, onChange)

Adds a text input field:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

// Basic text input
var nameInput = dialog.addEditText('Default Name');

// With change handler
var prefixInput = dialog.addEditText('Layer_', function(text) {
    $.writeln('Prefix changed to: ' + text);
});

// Get value later
var name = nameInput.text;
```

### addSlider(defaultValue, min, max, onChange)

Adds a slider control:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

// Basic slider (0-100)
var opacity = dialog.addSlider(100, 0, 100);

// With change handler
var blur = dialog.addSlider(10, 0, 50, function(value) {
    $.writeln('Blur: ' + value);
});

// Get value later
var currentOpacity = opacity.value;
```

### addDropdown(items, onChange)

Adds a dropdown menu:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

// Basic dropdown
var format = dialog.addDropdown(['PNG', 'JPEG', 'TIFF']);

// With change handler
var quality = dialog.addDropdown(['Low', 'Medium', 'High'], function(selection) {
    $.writeln('Quality: ' + selection.text);
});

// Set selection
format.selection = 1;  // Select 'JPEG'

// Get selection
var selected = format.selection.text;
```

### addPanel(label)

Adds a panel container (returns a new container):

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

// Create panel
var optionsPanel = dialog.addPanel('Options');

// Add controls to panel
optionsPanel.addCheckbox('Option 1', true);
optionsPanel.addCheckbox('Option 2', false);
optionsPanel.addCheckbox('Option 3', true);

// Create another panel
var settingsPanel = dialog.addPanel('Settings');
settingsPanel.addSlider(50, 0, 100);
```

### addGroup()

Adds a horizontal group (returns a new container):

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

// Content
dialog.addStaticText('Configure your settings:');
dialog.addEditText('value');

// Button group at bottom
var buttons = dialog.addGroup();
buttons.addButton('OK', function() {
    // Process
    dialog.close();
});
buttons.addButton('Cancel', function() {
    dialog.close();
});
```

## ListBox

### addListBox(items)

Adds a list box control:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');

var list = dialog.addListBox(['Item 1', 'Item 2', 'Item 3']);
```

### ListBox Methods

```javascript
var list = dialog.addListBox([]);

// Add items
list.addItem('New Item');
list.addItem('Another Item');

// Get selection
var selected = list.getSelection();  // Returns selected item

// Move items
list.moveUp(1);    // Move item at index 1 up
list.moveDown(0);  // Move item at index 0 down

// Remove items
list.removeItem(0);  // Remove first item

// Get all items
var items = list.items;
```

### ListBox Example

```javascript
var dialog = aeq.ui.createDialog('Layer Manager');

var layerList = dialog.addListBox([]);

// Populate from comp
var comp = aeq.getActiveComp();
if (comp) {
    for (var i = 1; i <= comp.numLayers; i++) {
        layerList.addItem(comp.layer(i).name);
    }
}

// Buttons
var btnGroup = dialog.addGroup();
btnGroup.addButton('Move Up', function() {
    var idx = layerList.selection ? layerList.selection.index : -1;
    if (idx > 0) {
        layerList.moveUp(idx);
    }
});
btnGroup.addButton('Move Down', function() {
    var idx = layerList.selection ? layerList.selection.index : -1;
    if (idx >= 0 && idx < layerList.items.length - 1) {
        layerList.moveDown(idx);
    }
});

dialog.show();
```

## TreeView

### addTreeView()

Adds a hierarchical tree view:

```javascript
var dialog = aeq.ui.createDialog('Project Structure');

var tree = dialog.addTreeView();
```

### TreeView Methods

```javascript
var tree = dialog.addTreeView();

// Add root nodes
var node1 = tree.addNode('Folder 1');
var node2 = tree.addNode('Folder 2');

// Add child nodes
var child1 = tree.addNode('Item 1', node1);
var child2 = tree.addNode('Item 2', node1);

// Add nested children
var grandchild = tree.addNode('Sub-item', child1);

// Expand/collapse
tree.expandNodes();    // Expand all nodes
tree.collapseNodes();  // Collapse all nodes
```

### TreeView Example

```javascript
var dialog = aeq.ui.createDialog('Project Browser');

var tree = dialog.addTreeView();

// Build tree from project
var project = app.project;
for (var i = 1; i <= project.numItems; i++) {
    var item = project.item(i);
    if (item instanceof FolderItem) {
        var folderNode = tree.addNode(item.name);
        // Add folder contents
        for (var j = 1; j <= item.numItems; j++) {
            tree.addNode(item.item(j).name, folderNode);
        }
    }
}

tree.expandNodes();

dialog.show();
```

## Window Methods

### show()

Shows the dialog/window:

```javascript
var dialog = aeq.ui.createDialog('My Dialog');
// ... add controls ...

// Show and check result
if (dialog.show() === 1) {
    // User clicked OK
    processData();
} else {
    // User clicked Cancel or closed window
}
```

### close()

Closes the window:

```javascript
dialog.addButton('Cancel', function() {
    dialog.close();
});
```

### layout()

Refreshes the window layout:

```javascript
// After dynamically adding controls
dialog.layout();
```

## Complete Dialog Example

```javascript
#include 'aequery.js'

(function() {
    var dialog = aeq.ui.createDialog('Batch Layer Processor');

    // Instructions
    dialog.addStaticText('Configure batch processing settings:');

    // Input panel
    var inputPanel = dialog.addPanel('Layer Selection');
    var selectedOnly = inputPanel.addCheckbox('Selected layers only', true);
    var includeHidden = inputPanel.addCheckbox('Include hidden layers', false);

    // Processing panel
    var processPanel = dialog.addPanel('Processing');
    var prefixInput = processPanel.addEditText('Layer_');
    processPanel.addStaticText('Prefix for renamed layers');

    var opacitySlider = processPanel.addSlider(100, 0, 100);
    processPanel.addStaticText('Opacity (0-100)');

    // Output panel
    var outputPanel = dialog.addPanel('Output');
    var formatDropdown = outputPanel.addDropdown(['None', 'Add to Render Queue', 'Export PNG']);
    formatDropdown.selection = 0;

    // Buttons
    var buttons = dialog.addGroup();
    buttons.addButton('Process', function() {
        processLayers({
            selectedOnly: selectedOnly.getValue(),
            includeHidden: includeHidden.getValue(),
            prefix: prefixInput.text,
            opacity: opacitySlider.value,
            outputFormat: formatDropdown.selection.index
        });
        dialog.close();
    });
    buttons.addButton('Cancel', function() {
        dialog.close();
    });

    dialog.show();

    function processLayers(options) {
        var comp = aeq.getActiveComp();
        if (!comp) {
            alert('No active composition');
            return;
        }

        aeq.createUndoGroup('Batch Process Layers', function() {
            var selector = options.selectedOnly ?
                'layer:is(selected)' : 'layer';

            aeq(selector, comp).forEach(function(layer, index) {
                // Skip hidden if option not checked
                if (!options.includeHidden && !layer.enabled) {
                    return;
                }

                // Rename with prefix
                layer.name = options.prefix + (index + 1);

                // Set opacity
                layer.opacity.setValue(options.opacity);
            });
        });

        alert('Processing complete!');
    }
})();
```

## Dockable Panel Example

```javascript
#include 'aequery.js'

(function(thisObj) {
    var panel = aeq.ui.createMainWindow(thisObj, 'Quick Tools');

    // Tools section
    var tools = panel.addPanel('Layer Tools');

    tools.addButton('Select All Text', function() {
        aeq.createUndoGroup('Select Text Layers', function() {
            aeq('activecomp layer').attr('selected', false);
            aeq('activecomp layer:is(TextLayer)').attr('selected', true);
        });
    });

    tools.addButton('Toggle Selected', function() {
        aeq.createUndoGroup('Toggle Enabled', function() {
            aeq('activecomp layer:is(selected)').forEach(function(layer) {
                layer.enabled = !layer.enabled;
            });
        });
    });

    tools.addButton('Lock All', function() {
        aeq.createUndoGroup('Lock All', function() {
            aeq('activecomp layer').attr('locked', true);
        });
    });

    tools.addButton('Unlock All', function() {
        aeq.createUndoGroup('Unlock All', function() {
            aeq('activecomp layer').attr('locked', false);
        });
    });

    // Settings section
    var settings = panel.addPanel('Quick Settings');
    var preserveSelection = settings.addCheckbox('Preserve selection', true);

    // Show if floating window
    if (panel instanceof Window) {
        panel.show();
    }
})(this);
```

## Tips

1. **Use panels to organize** - Group related controls in panels
2. **Use groups for horizontal layout** - Buttons typically go in groups
3. **Store control references** - Save references to get values later
4. **Use change handlers** - React to user input immediately
5. **Check dialog result** - `show() === 1` means OK was clicked
6. **Use createMainWindow for panels** - Makes dockable script panels
