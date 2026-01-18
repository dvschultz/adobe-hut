---
name: ppro-uxp-project
description: "Premiere Pro UXP project and media management: opening projects, importing media, project items, bins, and project-level operations."
---

# Premiere Pro UXP: Project and Media Management

## Getting the Project

```javascript
const premierepro = require("premierepro");

const app = premierepro.app;
const project = app.project;

// Check if project is open
if (!project) {
    console.error("No project is open");
    return;
}
```

## Project Properties

```javascript
// Basic properties
const name = project.name;          // Project name (without extension)
const path = project.path;          // Full file path

// Active sequence
const sequence = project.activeSequence;

// All sequences in project
const sequences = project.sequences;

// Root item (project panel root)
const rootItem = project.rootItem;
```

## Importing Media

### Import Files

```javascript
// Import single file
await project.importFiles(["/path/to/video.mp4"]);

// Import multiple files
await project.importFiles([
    "/path/to/video1.mp4",
    "/path/to/video2.mov",
    "/path/to/audio.wav"
]);

// Import to specific bin
const targetBin = await findOrCreateBin(project, "Imports");
await project.importFiles(["/path/to/file.mp4"], targetBin);
```

### Import Image Sequence

```javascript
// Import as image sequence (frames must be numbered)
await project.importFiles(["/path/to/sequence_0001.png"], {
    importAsImageSequence: true
});
```

## Project Items (ProjectItem)

### Navigating Project Items

```javascript
// Get root item
const root = project.rootItem;

// Get children
const children = root.children;

// Iterate items
for (const item of children) {
    console.log(`${item.name} - Type: ${item.type}`);
}
```

### Item Types

```javascript
// Check item type
const item = project.rootItem.children[0];

switch (item.type) {
    case 'bin':
        // Folder/bin
        const binChildren = item.children;
        break;
    case 'clip':
        // Media clip (video, audio, image)
        const mediaPath = item.getMediaPath();
        break;
    case 'sequence':
        // Sequence
        break;
}
```

### Getting Item Properties

```javascript
// Basic properties
const name = item.name;
const type = item.type;

// Media path (for clips)
const mediaPath = item.getMediaPath();

// Duration
const duration = item.duration;  // TickTime

// In/out points
const inPoint = item.inPoint;
const outPoint = item.outPoint;

// Check if item is offline
const isOffline = item.isOffline();
```

### Setting Item Properties

```javascript
// Rename item
item.name = "New Name";

// Set in/out points for source
const { TickTime } = require("premierepro");
await item.setInPoint(TickTime.fromSeconds(2));
await item.setOutPoint(TickTime.fromSeconds(10));

// Clear in/out points
await item.clearInPoint();
await item.clearOutPoint();
```

## Working with Bins

### Create Bin

```javascript
// Create bin at root level
const newBin = await project.rootItem.createBin("My Folder");

// Create nested bin
const subBin = await newBin.createBin("Subfolder");
```

### Find Bin by Name

```javascript
function findBin(parentItem, binName) {
    for (const child of parentItem.children) {
        if (child.type === 'bin' && child.name === binName) {
            return child;
        }
    }
    return null;
}

// Usage
const footageBin = findBin(project.rootItem, "Footage");
```

### Find or Create Bin

```javascript
async function findOrCreateBin(project, binName, parent = null) {
    const searchParent = parent || project.rootItem;

    // Search for existing bin
    for (const child of searchParent.children) {
        if (child.type === 'bin' && child.name === binName) {
            return child;
        }
    }

    // Create if not found
    return await searchParent.createBin(binName);
}
```

### Move Items to Bin

```javascript
// Move item to different bin
await item.moveBin(targetBin);

// Move multiple items
for (const item of itemsToMove) {
    await item.moveBin(targetBin);
}
```

### Recursively Get All Items

```javascript
function getAllItems(parentItem, results = []) {
    for (const child of parentItem.children) {
        results.push(child);
        if (child.type === 'bin') {
            getAllItems(child, results);
        }
    }
    return results;
}

// Get all items in project
const allItems = getAllItems(project.rootItem);

// Filter to clips only
const clips = allItems.filter(item => item.type === 'clip');
```

## Finding Items

### Find by Name

```javascript
function findItemByName(parentItem, name, recursive = true) {
    for (const child of parentItem.children) {
        if (child.name === name) {
            return child;
        }
        if (recursive && child.type === 'bin') {
            const found = findItemByName(child, name, true);
            if (found) return found;
        }
    }
    return null;
}
```

### Find by Extension

```javascript
function findItemsByExtension(parentItem, extension) {
    const results = [];
    const ext = extension.toLowerCase();

    function search(item) {
        for (const child of item.children) {
            if (child.type === 'clip') {
                const path = child.getMediaPath() || '';
                if (path.toLowerCase().endsWith(ext)) {
                    results.push(child);
                }
            } else if (child.type === 'bin') {
                search(child);
            }
        }
    }

    search(parentItem);
    return results;
}

// Find all MP4 files
const mp4Files = findItemsByExtension(project.rootItem, '.mp4');
```

### Find Offline Items

```javascript
function findOfflineItems(parentItem) {
    const offline = [];

    function search(item) {
        for (const child of item.children) {
            if (child.type === 'clip' && child.isOffline()) {
                offline.push(child);
            } else if (child.type === 'bin') {
                search(child);
            }
        }
    }

    search(parentItem);
    return offline;
}
```

## Working with Sequences

### Get All Sequences

```javascript
const sequences = project.sequences;

for (const seq of sequences) {
    console.log(`Sequence: ${seq.name}`);
}
```

### Create New Sequence

```javascript
// Create sequence with default settings
const newSequence = await project.createSequence("My Sequence");

// Create sequence from preset
const sequence = await project.createSequence("HD Sequence", presetId);
```

### Find Sequence by Name

```javascript
function findSequence(project, name) {
    for (const seq of project.sequences) {
        if (seq.name === name) {
            return seq;
        }
    }
    return null;
}
```

### Set Active Sequence

```javascript
// Open sequence in timeline
project.activeSequence = sequence;
```

## Project Operations

### Save Project

```javascript
// Save (to current location)
await project.save();

// Save As
await project.saveAs("/path/to/new-project.prproj");
```

### Close Project

```javascript
await project.close();

// Close without saving
await project.close(false);
```

### Project Metadata

```javascript
// Get project path info
const projectPath = project.path;
const projectDir = projectPath.substring(0, projectPath.lastIndexOf('/'));
```

## Complete Example: Organize Imports

```javascript
const premierepro = require("premierepro");

async function organizeByType() {
    const project = premierepro.app.project;
    if (!project) {
        console.error("No project open");
        return;
    }

    await project.executeTransaction(async () => {
        // Create bins for each type
        const videoBin = await findOrCreateBin(project, "Video");
        const audioBin = await findOrCreateBin(project, "Audio");
        const imageBin = await findOrCreateBin(project, "Images");

        // Get all clips
        const allItems = getAllItems(project.rootItem);
        const clips = allItems.filter(item => item.type === 'clip');

        for (const clip of clips) {
            const path = (clip.getMediaPath() || '').toLowerCase();

            if (path.match(/\.(mp4|mov|avi|mkv|mxf)$/)) {
                await clip.moveBin(videoBin);
            } else if (path.match(/\.(wav|mp3|aac|aiff)$/)) {
                await clip.moveBin(audioBin);
            } else if (path.match(/\.(jpg|jpeg|png|tiff|psd)$/)) {
                await clip.moveBin(imageBin);
            }
        }
    }, "Organize by Type");

    console.log("Organization complete!");
}

async function findOrCreateBin(project, name) {
    for (const child of project.rootItem.children) {
        if (child.type === 'bin' && child.name === name) {
            return child;
        }
    }
    return await project.rootItem.createBin(name);
}

function getAllItems(parent, results = []) {
    for (const child of parent.children) {
        results.push(child);
        if (child.type === 'bin') {
            getAllItems(child, results);
        }
    }
    return results;
}
```
