---
name: ps-uxp-modal-execution
description: "Photoshop UXP executeAsModal patterns: progress reporting, cancellation, history suspension, and interactive mode. Essential for all document modifications."
---

# UXP executeAsModal Patterns

**All document modifications in Photoshop UXP MUST be wrapped in `executeAsModal`.** This is the most critical concept in UXP development.

## Why executeAsModal?

- Photoshop can only have one modal operation at a time
- Ensures proper state management during document modifications
- Enables progress reporting and cancellation
- Prevents conflicts with user actions

## Basic Pattern

```javascript
const { app, core } = require('photoshop');

async function simpleOperation() {
    await core.executeAsModal(async (executionContext) => {
        // All document modifications go here
        const doc = app.activeDocument;
        await doc.activeLayer.rotate(45);

    }, { commandName: "Rotate Layer" });
}
```

## With Progress Reporting

For operations taking more than a second, report progress to keep the user informed.

```javascript
async function longOperation() {
    await core.executeAsModal(async (executionContext) => {
        const doc = app.activeDocument;
        const layers = doc.layers;
        const total = layers.length;

        for (let i = 0; i < total; i++) {
            // Report progress (value: 0.0 to 1.0)
            executionContext.reportProgress({
                value: i / total,
                commandName: `Processing layer ${i + 1} of ${total}`
            });

            // Process layer...
            await processLayer(layers[i]);
        }

    }, { commandName: "Process All Layers" });
}
```

## With Cancellation Support

Allow users to cancel long-running operations.

```javascript
async function cancellableOperation() {
    await core.executeAsModal(async (executionContext) => {
        const doc = app.activeDocument;
        const items = getItemsToProcess();

        for (let i = 0; i < items.length; i++) {
            // Check if user clicked Cancel
            if (executionContext.isCancelled) {
                throw new Error("Operation cancelled by user");
            }

            executionContext.reportProgress({
                value: i / items.length
            });

            await processItem(items[i]);
        }

    }, { commandName: "Long Operation" });
}
```

### Using onCancel Callback

```javascript
async function operationWithCleanup() {
    let cleanup = null;

    await core.executeAsModal(async (executionContext) => {
        // Set up cancellation handler
        executionContext.onCancel = () => {
            console.log("User requested cancellation");
            // Cleanup can be done here or after the modal
            cleanup = "rollback";
        };

        for (let i = 0; i < 1000; i++) {
            if (executionContext.isCancelled) {
                break;  // Exit gracefully
            }
            await doWork(i);
        }

    }, { commandName: "With Cleanup" });

    // Handle cleanup outside modal
    if (cleanup === "rollback") {
        console.log("Performing rollback...");
    }
}
```

## History Suspension (Single Undo State)

Group multiple operations into a single undo state using `suspendHistory`.

```javascript
async function batchWithSingleUndo() {
    await core.executeAsModal(async (executionContext) => {
        const hostControl = executionContext.hostControl;
        const doc = app.activeDocument;

        // Start history suspension
        const suspensionID = await hostControl.suspendHistory({
            documentID: doc.id,
            name: "Batch Rename Layers"  // Undo menu text
        });

        try {
            // All operations here create a SINGLE undo state
            for (const layer of doc.layers) {
                layer.name = "Layer_" + layer.id;
            }

            // Multiple modifications...
            await applyEffects();
            await adjustColors();
            await resizeDocument();

        } catch (error) {
            // If error occurs, the entire batch can be undone
            throw error;

        } finally {
            // ALWAYS resume history
            await hostControl.resumeHistory(suspensionID);
        }

    }, { commandName: "Batch Rename Layers" });
}
```

### History Suspension with Commit Option

```javascript
const suspensionID = await hostControl.suspendHistory({
    documentID: doc.id,
    name: "My Operation"
});

try {
    // ... operations ...

    // Commit changes (default behavior)
    await hostControl.resumeHistory(suspensionID, true);

} catch (error) {
    // Rollback changes - revert to state before suspension
    await hostControl.resumeHistory(suspensionID, false);
    throw error;
}
```

## Auto-Close Documents

Register documents to be automatically closed if the operation fails.

```javascript
async function createTempDocument() {
    await core.executeAsModal(async (executionContext) => {
        const hostControl = executionContext.hostControl;

        // Create a new document
        const tempDoc = await app.createDocument({
            width: 1000,
            height: 1000,
            name: "Temp Processing"
        });

        // Register for auto-close on failure
        await hostControl.registerAutoCloseDocument(tempDoc.id);

        try {
            // Process the document...
            await doProcessing(tempDoc);

            // If successful, unregister to keep document open
            await hostControl.unregisterAutoCloseDocument(tempDoc.id);

        } catch (error) {
            // Document will be automatically closed
            throw error;
        }

    }, { commandName: "Process Temp Document" });
}
```

## Interactive Mode

Use interactive mode when your operation needs to show a Photoshop dialog.

```javascript
async function operationWithDialog() {
    await core.executeAsModal(async (executionContext) => {
        const { action } = require('photoshop');

        // Show the Gaussian Blur dialog
        await action.batchPlay([{
            _obj: "gaussianBlur",
            radius: { _unit: "pixelsUnit", _value: 10 }
        }], {
            dialogOptions: "display"  // Show dialog to user
        });

    }, {
        commandName: "Blur with Options",
        interactive: true  // Required for dialogs
    });
}
```

## executeAsModal Options Reference

```javascript
await core.executeAsModal(targetFunction, {
    commandName: "Operation Name",   // Required: shown in progress bar
    descriptor: { custom: "data" },  // Optional: passed to targetFunction
    interactive: true,               // Optional: allows user input (v23.3+)
    timeOut: 5                       // Optional: retry duration in seconds (v25.10+)
});
```

The target function receives two parameters:
- `executionContext` - Contains `isCancelled`, `onCancel`, `reportProgress`, `hostControl`
- `descriptor` - The custom object passed in options

## Timeout and Retry Behavior (v25.10+)

Starting in Photoshop v25.10, `executeAsModal` has improved handling when another operation holds modal state:

**Previous behavior (pre-v25.10):**
- Immediately threw error code 9 if modal state was busy

**New behavior (v25.10+):**
- Automatically retries until the `timeOut` duration is exhausted
- Default timeout is **1 second**
- Error messages now **identify the blocking plugin**

```javascript
await core.executeAsModal(async () => {
    await doWork();
}, {
    commandName: "My Operation",
    timeOut: 5  // Wait up to 5 seconds for modal state to become available
});
```

### Identifying the Blocking Plugin

When the timeout is exhausted, the error message includes the blocking plugin's ID:

```javascript
try {
    await core.executeAsModal(async () => {
        await doWork();
    }, { commandName: "Op", timeOut: 3 });

} catch (error) {
    if (error.number === 9) {
        // Error message format: "Plugin: com.adobe.pluginID is running a modal command"
        console.log("Blocked by:", error.message);

        // Debugging tips:
        // - If it's YOUR plugin: You likely forgot an `await` statement
        // - If it's a third-party plugin: Disable during development
        // - If it's Adobe plugin: Report in Adobe forums
    }
}
```

## Error Handling: Error Code 9

Error code 9 means Photoshop is already in a modal state (another operation is running).

```javascript
async function safeOperation() {
    try {
        await core.executeAsModal(async () => {
            await doWork();
        }, {
            commandName: "My Operation",
            timeOut: 3  // Wait up to 3 seconds (v25.10+)
        });

    } catch (error) {
        if (error.number === 9) {
            // Photoshop is still busy after timeout
            console.log("Modal conflict:", error.message);
            await app.showAlert(
                "Photoshop is busy. Please wait for the current " +
                "operation to complete and try again."
            );
        } else {
            throw error;
        }
    }
}
```

## Nested Modal Calls (Avoid!)

**Never nest executeAsModal calls.** This will cause error code 9.

```javascript
// WRONG - will fail with error 9
async function wrongApproach() {
    await core.executeAsModal(async () => {
        await doSomething();

        // This FAILS - already in modal state!
        await core.executeAsModal(async () => {
            await doMore();
        }, { commandName: "Inner" });

    }, { commandName: "Outer" });
}

// CORRECT - sequential modal calls
async function correctApproach() {
    await core.executeAsModal(async () => {
        await doSomething();
    }, { commandName: "First" });

    await core.executeAsModal(async () => {
        await doMore();
    }, { commandName: "Second" });
}
```

## Complete Template

```javascript
const { app, core } = require('photoshop');

async function robustOperation(options) {
    const doc = app.activeDocument;
    if (!doc) {
        await app.showAlert("Please open a document first.");
        return { success: false, error: "No document" };
    }

    try {
        await core.executeAsModal(async (executionContext) => {
            const hostControl = executionContext.hostControl;

            // Suspend history for single undo
            const suspensionID = await hostControl.suspendHistory({
                documentID: doc.id,
                name: options.historyName || "Operation"
            });

            try {
                const items = options.items || [];
                const total = items.length;

                for (let i = 0; i < total; i++) {
                    // Check cancellation
                    if (executionContext.isCancelled) {
                        throw new Error("Cancelled");
                    }

                    // Report progress
                    executionContext.reportProgress({
                        value: i / total,
                        commandName: `Processing ${i + 1}/${total}`
                    });

                    // Do work
                    await options.processItem(items[i], i);
                }

                // Commit on success
                await hostControl.resumeHistory(suspensionID, true);

            } catch (error) {
                // Rollback on error
                await hostControl.resumeHistory(suspensionID, false);
                throw error;
            }

        }, { commandName: options.commandName || "Operation" });

        return { success: true };

    } catch (error) {
        if (error.number === 9) {
            await app.showAlert("Photoshop is busy. Please try again.");
        } else if (error.message !== "Cancelled") {
            console.error(error);
            await app.showAlert(`Error: ${error.message}`);
        }
        return { success: false, error: error.message };
    }
}

// Usage
await robustOperation({
    commandName: "Apply Effects",
    historyName: "Batch Effects",
    items: doc.layers,
    processItem: async (layer, index) => {
        await layer.applyGaussianBlur(2.0);
    }
});
```

## Scripts vs Plugins: Modal Context

**UXP Scripts (.psjs files)** run in an automatic modal context - you don't need executeAsModal:

```javascript
// In a SCRIPT (.psjs) - modal context is automatic
const { app } = require('photoshop');

const doc = app.activeDocument;
// Works directly in scripts!
await doc.activeLayer.rotate(45);
```

**UXP Plugins** require executeAsModal for all document modifications:

```javascript
// In a PLUGIN - executeAsModal is required
const { app, core } = require('photoshop');

await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    await doc.activeLayer.rotate(45);
}, { commandName: "Rotate" });
```

## Event Notifications During Modal State

During an active `executeAsModal` (non-interactive mode):
- Photoshop silences event notifications
- Other plugins cannot listen to your batchPlay commands
- Similar behavior to Actions panel execution

Plugins can register for modal scope events:
- `"modalJavaScriptScopeEnter"` - Fired when modal scope begins
- `"modalJavaScriptScopeExit"` - Fired when modal scope ends

## Best Practices

1. **One modal at a time** - Never nest executeAsModal calls
2. **Always use `await`** - Without await, execution continues while modal runs
3. **Always check isCancelled** in loops
4. **Report progress** for operations > 1 second
5. **Use suspendHistory** for batch operations
6. **Handle error code 9** gracefully
7. **Keep modal operations short** - don't block too long
8. **Use interactive: true** only when showing dialogs
9. **Always resume history** in a finally block
10. **Use timeOut option** (v25.10+) to handle busy states gracefully
