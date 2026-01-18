---
name: ps-uxp-events
description: "Photoshop UXP event system: notification listeners, available events, and real-time document monitoring."
---

# UXP Event System

Listen for and respond to Photoshop events in real-time.

## Overview

```javascript
const { action } = require('photoshop');

// Add a listener
const listener = await action.addNotificationListener(
    ["eventName"],           // Events to listen for
    (event, descriptor) => { // Callback function
        console.log("Event:", event);
        console.log("Data:", descriptor);
    }
);

// Remove listener when done
await action.removeNotificationListener(["eventName"]);
// or
await listener.removeListener();
```

## Adding Listeners

### Single Event

```javascript
const { action } = require('photoshop');

const listener = await action.addNotificationListener(
    ["save"],
    (event, descriptor) => {
        console.log("Document saved!");
        console.log("Document ID:", descriptor.documentID);
    }
);
```

### Multiple Events

```javascript
const listener = await action.addNotificationListener(
    ["open", "close", "save"],
    (event, descriptor) => {
        switch (event) {
            case "open":
                console.log("Document opened:", descriptor.documentID);
                break;
            case "close":
                console.log("Document closed");
                break;
            case "save":
                console.log("Document saved");
                break;
        }
    }
);
```

### All Events (Debugging)

```javascript
// Listen to all events - useful for discovering event names
const listener = await action.addNotificationListener(
    ["all"],
    (event, descriptor) => {
        console.log("Event:", event);
        console.log("Descriptor:", JSON.stringify(descriptor, null, 2));
    }
);
```

## Common Events

### Document Events

| Event | Triggered When |
|-------|----------------|
| `"open"` | Document is opened |
| `"close"` | Document is closed |
| `"save"` | Document is saved |
| `"newDocument"` | New document created |
| `"imageSize"` | Image size changed |
| `"canvasSize"` | Canvas size changed |
| `"changeMode"` | Color mode changed |

### Layer Events

| Event | Triggered When |
|-------|----------------|
| `"make"` | New layer/object created |
| `"delete"` | Layer/object deleted |
| `"select"` | Selection or layer selection changed |
| `"set"` | Property changed |
| `"move"` | Layer moved |
| `"duplicate"` | Layer duplicated |
| `"mergeVisible"` | Layers merged |
| `"flattenImage"` | Document flattened |

### Transform Events

| Event | Triggered When |
|-------|----------------|
| `"transform"` | Transform applied |
| `"rotate"` | Rotation applied |
| `"flip"` | Flip applied |

### Filter Events

| Event | Triggered When |
|-------|----------------|
| `"gaussianBlur"` | Gaussian blur applied |
| `"unsharpMask"` | Unsharp mask applied |
| Various filter names | Specific filter applied |

### Selection Events

| Event | Triggered When |
|-------|----------------|
| `"set"` (with selection target) | Selection changed |
| `"inverse"` | Selection inverted |
| `"feather"` | Selection feathered |

### History Events

| Event | Triggered When |
|-------|----------------|
| `"undo"` | Undo performed |
| `"redo"` | Redo performed |

## Event Descriptor Structure

The descriptor parameter contains event-specific data:

```javascript
const listener = await action.addNotificationListener(
    ["save"],
    (event, descriptor) => {
        // Common properties
        descriptor.documentID;     // Document ID
        descriptor._obj;           // Event/object type

        // Event-specific properties vary
        console.log(JSON.stringify(descriptor, null, 2));
    }
);
```

### Example: Open Event Descriptor

```javascript
{
    "_obj": "open",
    "documentID": 123,
    "null": {
        "_path": "/path/to/file.psd",
        "_kind": "local"
    }
}
```

### Example: Layer Selection Descriptor

```javascript
{
    "_obj": "select",
    "layerID": [456],
    "documentID": 123
}
```

## Removing Listeners

### By Event Names

```javascript
// Remove specific event listeners
await action.removeNotificationListener(["save"]);

// Remove multiple
await action.removeNotificationListener(["open", "close", "save"]);
```

### By Listener Reference

```javascript
const listener = await action.addNotificationListener(
    ["save"],
    callback
);

// Later...
await listener.removeListener();
```

## Practical Patterns

### Auto-Save Reminder

```javascript
let lastSaveTime = Date.now();
const REMINDER_INTERVAL = 5 * 60 * 1000; // 5 minutes

await action.addNotificationListener(
    ["save"],
    () => {
        lastSaveTime = Date.now();
    }
);

// Check periodically
setInterval(async () => {
    if (Date.now() - lastSaveTime > REMINDER_INTERVAL) {
        if (app.activeDocument && !app.activeDocument.saved) {
            // Could show a panel notification instead
            console.log("Reminder: You haven't saved in 5 minutes");
        }
    }
}, 60000);
```

### Track Layer Changes

```javascript
const layerHistory = [];

await action.addNotificationListener(
    ["make", "delete", "select", "set"],
    (event, descriptor) => {
        if (descriptor._target && descriptor._target[0]?._ref === "layer") {
            layerHistory.push({
                event: event,
                time: new Date(),
                layerID: descriptor.layerID || descriptor._target[0]._id,
                documentID: descriptor.documentID
            });

            console.log(`Layer event: ${event}`, layerHistory[layerHistory.length - 1]);
        }
    }
);
```

### Document Open/Close Tracking

```javascript
const openDocuments = new Set();

await action.addNotificationListener(
    ["open", "close", "newDocument"],
    (event, descriptor) => {
        const docID = descriptor.documentID;

        if (event === "open" || event === "newDocument") {
            openDocuments.add(docID);
            console.log(`Document opened. Total: ${openDocuments.size}`);
        } else if (event === "close") {
            openDocuments.delete(docID);
            console.log(`Document closed. Total: ${openDocuments.size}`);
        }
    }
);
```

### Filter Application Log

```javascript
const filterLog = [];

await action.addNotificationListener(
    ["gaussianBlur", "unsharpMask", "motionBlur", "highPass"],
    (event, descriptor) => {
        filterLog.push({
            filter: event,
            settings: descriptor,
            timestamp: new Date()
        });
        console.log(`Filter applied: ${event}`);
    }
);
```

### Selection Change Monitor

```javascript
await action.addNotificationListener(
    ["set"],
    (event, descriptor) => {
        // Check if this is a selection change
        if (descriptor._target &&
            descriptor._target[0]?._property === "selection") {
            console.log("Selection changed");

            // Get new selection bounds
            const doc = app.activeDocument;
            if (doc && doc.selection.bounds) {
                console.log("Bounds:", doc.selection.bounds);
            }
        }
    }
);
```

## Plugin Lifecycle Integration

### Start Listeners on Plugin Load

```javascript
// In your main plugin file
let listeners = [];

async function setupListeners() {
    const docListener = await action.addNotificationListener(
        ["open", "close", "save"],
        handleDocumentEvent
    );
    listeners.push(docListener);

    const layerListener = await action.addNotificationListener(
        ["make", "delete"],
        handleLayerEvent
    );
    listeners.push(layerListener);
}

async function cleanupListeners() {
    for (const listener of listeners) {
        await listener.removeListener();
    }
    listeners = [];
}

// Call setupListeners() when plugin initializes
// Call cleanupListeners() when plugin unloads
```

### Panel-Based Listener Management

```javascript
// panel.js
let isListening = false;
let listener = null;

document.getElementById("toggleListening").addEventListener("click", async () => {
    if (isListening) {
        await listener.removeListener();
        listener = null;
        isListening = false;
        console.log("Stopped listening");
    } else {
        listener = await action.addNotificationListener(
            ["all"],
            (event, descriptor) => {
                updateEventLog(event, descriptor);
            }
        );
        isListening = true;
        console.log("Started listening");
    }
});
```

## Discovering Event Names

To find the exact event name for a Photoshop operation:

```javascript
// Start listening to all events
const debugListener = await action.addNotificationListener(
    ["all"],
    (event, descriptor) => {
        console.log("=== EVENT ===");
        console.log("Name:", event);
        console.log("Descriptor:", JSON.stringify(descriptor, null, 2));
        console.log("=============");
    }
);

// Perform the operation manually in Photoshop
// Check the console for the event name

// Don't forget to remove when done
// await debugListener.removeListener();
```

## Best Practices

1. **Remove listeners** when no longer needed to prevent memory leaks
2. **Use specific events** rather than "all" in production
3. **Keep callbacks lightweight** - don't do heavy processing in event handlers
4. **Debounce rapid events** if needed (e.g., "set" can fire rapidly)
5. **Handle errors** in callbacks to prevent silent failures
6. **Test with "all"** first to discover event names, then switch to specific events
7. **Store listener references** if you need to remove them later
8. **Use event descriptors** to filter relevant changes

## Limitations

- Cannot prevent events (listen-only)
- Some events may fire multiple times for single actions
- Event names are not fully documented - use "all" to discover
- Callbacks are asynchronous - order not guaranteed
- Heavy callbacks can impact Photoshop performance
