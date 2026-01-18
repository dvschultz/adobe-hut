---
name: ppro-uxp-actions
description: "Premiere Pro UXP action system: executeTransaction, CompoundAction, undo grouping, and operation batching for edit operations."
---

# Premiere Pro UXP: Actions and Transactions

## Overview

Premiere Pro UXP uses an action-based system for edit operations. This ensures:
- Operations can be undone/redone as a group
- Proper state management during edits
- Consistent behavior across the application

## executeTransaction

The primary way to group operations for undo support.

### Basic Usage

```javascript
const premierepro = require("premierepro");

const project = premierepro.app.project;

await project.executeTransaction(async () => {
    // All operations here become a single undo step
    clip1.name = "New Name 1";
    clip2.name = "New Name 2";
    await clip3.move(newPosition);
}, "Rename and Move Clips");
```

### Structure

```javascript
await project.executeTransaction(
    async () => {
        // Operations to perform
    },
    "Undo History Name"  // What appears in Edit > Undo
);
```

### Important Rules

1. **Always use for modifications**: Any operation that changes the project should be in a transaction
2. **Name it descriptively**: The name appears in the Undo menu
3. **Handle errors inside**: Use try/catch within the transaction
4. **Await async operations**: All async calls inside must be awaited

### Error Handling

```javascript
await project.executeTransaction(async () => {
    try {
        await clip.setInPoint(newInPoint);
        await clip.setOutPoint(newOutPoint);
    } catch (error) {
        console.error("Operation failed:", error);
        throw error;  // Re-throw to roll back transaction
    }
}, "Trim Clip");
```

## CompoundAction

For more complex operation grouping with explicit action management.

### Creating Compound Actions

```javascript
const { Action, CompoundAction } = require("premierepro");

// Create a compound action
const compoundAction = new CompoundAction("Batch Edit");
```

### Adding Actions

```javascript
// Create individual actions and add to compound
const action1 = new Action("Rename", async () => {
    clip.name = "New Name";
});

const action2 = new Action("Move", async () => {
    await clip.move(newPosition);
});

compoundAction.addAction(action1);
compoundAction.addAction(action2);
```

### Executing Compound Actions

```javascript
const project = premierepro.app.project;

await project.executeTransaction(async () => {
    await compoundAction.execute();
}, "Batch Edit");
```

## Common Patterns

### Single Operation Transaction

```javascript
async function renameClip(clip, newName) {
    const project = premierepro.app.project;

    await project.executeTransaction(async () => {
        clip.name = newName;
    }, "Rename Clip");
}
```

### Multiple Clips, Same Operation

```javascript
async function renameSelectedClips(prefix) {
    const project = premierepro.app.project;
    const sequence = project.activeSequence;

    const selected = getSelectedClips(sequence);

    await project.executeTransaction(async () => {
        for (let i = 0; i < selected.length; i++) {
            selected[i].name = `${prefix}_${i + 1}`;
        }
    }, "Batch Rename Selected");
}
```

### Multiple Operations, Single Undo

```javascript
async function trimAndMove(clip, trimFrames, newPosition, frameRate) {
    const { TickTime } = require("premierepro");
    const project = premierepro.app.project;

    const trimTime = TickTime.fromFrames(trimFrames, frameRate);

    await project.executeTransaction(async () => {
        // Trim from head
        const newInPoint = clip.inPoint.add(trimTime);
        await clip.setInPoint(newInPoint);

        // Trim from tail
        const newOutPoint = clip.outPoint.subtract(trimTime);
        await clip.setOutPoint(newOutPoint);

        // Move to new position
        await clip.move(newPosition);
    }, "Trim and Move");
}
```

### Conditional Operations

```javascript
async function processClips(clips, options) {
    const project = premierepro.app.project;

    await project.executeTransaction(async () => {
        for (const clip of clips) {
            if (options.rename && options.prefix) {
                clip.name = options.prefix + clip.name;
            }

            if (options.trim && options.trimFrames) {
                const { TickTime } = require("premierepro");
                const trimTime = TickTime.fromFrames(options.trimFrames, options.frameRate);
                await clip.setInPoint(clip.inPoint.add(trimTime));
            }
        }
    }, "Process Clips");
}
```

### Nested Transactions (Not Recommended)

```javascript
// DON'T DO THIS - transactions shouldn't be nested
// Instead, put all operations in one transaction

// BAD:
await project.executeTransaction(async () => {
    await project.executeTransaction(async () => {  // WRONG!
        // ...
    }, "Inner");
}, "Outer");

// GOOD:
await project.executeTransaction(async () => {
    // All operations flat
    operation1();
    operation2();
    operation3();
}, "All Operations");
```

## Read-Only Operations

Some operations don't need transactions:

```javascript
// These are read-only, no transaction needed
const sequence = project.activeSequence;
const clips = sequence.videoTracks[0].clips;
const name = clips[0].name;
const position = sequence.playerPosition;

// This DOES need a transaction (modification)
await project.executeTransaction(async () => {
    clips[0].name = "New Name";
}, "Rename");
```

## Transaction Best Practices

### Do

```javascript
// Group related operations
await project.executeTransaction(async () => {
    for (const clip of clips) {
        clip.name = processName(clip.name);
    }
}, "Process Names");

// Name transactions clearly
await project.executeTransaction(async () => {
    // ...
}, "Add 5-Frame Handles to All Clips");

// Handle errors
await project.executeTransaction(async () => {
    try {
        await riskyOperation();
    } catch (e) {
        console.error("Failed:", e);
        // Transaction will be rolled back
        throw e;
    }
}, "Risky Operation");
```

### Don't

```javascript
// DON'T: Forget to await
await project.executeTransaction(async () => {
    clip.move(newPosition);  // Missing await!
}, "Move");

// DON'T: Use vague names
await project.executeTransaction(async () => {
    // ...
}, "Edit");  // Too vague!

// DON'T: Mix read and write without transaction
const clips = track.clips;  // OK - read
clip.name = "New";  // BAD - write without transaction!
```

## Complete Example: Batch Processor

```javascript
const premierepro = require("premierepro");

class BatchProcessor {
    constructor() {
        this.operations = [];
    }

    addRename(clip, newName) {
        this.operations.push({
            type: 'rename',
            clip: clip,
            newName: newName
        });
    }

    addMove(clip, newPosition) {
        this.operations.push({
            type: 'move',
            clip: clip,
            position: newPosition
        });
    }

    addTrim(clip, inPointDelta, outPointDelta) {
        this.operations.push({
            type: 'trim',
            clip: clip,
            inDelta: inPointDelta,
            outDelta: outPointDelta
        });
    }

    async execute(transactionName) {
        const project = premierepro.app.project;

        if (this.operations.length === 0) {
            console.log("No operations to execute");
            return;
        }

        await project.executeTransaction(async () => {
            for (const op of this.operations) {
                switch (op.type) {
                    case 'rename':
                        op.clip.name = op.newName;
                        break;
                    case 'move':
                        await op.clip.move(op.position);
                        break;
                    case 'trim':
                        if (op.inDelta) {
                            const newIn = op.clip.inPoint.add(op.inDelta);
                            await op.clip.setInPoint(newIn);
                        }
                        if (op.outDelta) {
                            const newOut = op.clip.outPoint.add(op.outDelta);
                            await op.clip.setOutPoint(newOut);
                        }
                        break;
                }
            }
        }, transactionName);

        console.log(`Executed ${this.operations.length} operations`);
        this.operations = [];
    }
}

// Usage
const processor = new BatchProcessor();
processor.addRename(clip1, "Shot_001");
processor.addRename(clip2, "Shot_002");
processor.addMove(clip3, newPosition);
await processor.execute("Batch Edit Clips");
```
