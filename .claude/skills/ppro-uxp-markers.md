---
name: ppro-uxp-markers
description: "Premiere Pro UXP marker operations: creating, reading, modifying, and removing sequence and clip markers."
---

# Premiere Pro UXP: Markers

## Overview

Markers in Premiere Pro can be placed on:
- **Sequences** (timeline markers)
- **Clips** (clip markers, travel with the clip)

## Accessing Markers

### Sequence Markers

```javascript
const premierepro = require("premierepro");

const sequence = premierepro.app.project.activeSequence;
const markers = sequence.markers;

// Iterate all markers
for (const marker of markers) {
    console.log(`${marker.name} at ${marker.time.toTimecode(24)}`);
}
```

### Clip Markers

```javascript
const clip = sequence.videoTracks[0].clips[0];
const clipMarkers = clip.markers;

for (const marker of clipMarkers) {
    console.log(`${marker.name} at ${marker.time.toTimecode(24)}`);
}
```

## Marker Properties

```javascript
const marker = markers[0];

// Basic properties
const name = marker.name;           // Marker name/label
const comments = marker.comments;   // Comment text
const time = marker.time;           // TickTime position
const duration = marker.duration;   // TickTime (for duration markers)

// Color (index)
const color = marker.color;         // 0-15 color index

// Marker type
const type = marker.type;           // 'comment', 'chapter', etc.
```

## Creating Markers

### Add Marker at Time

```javascript
const { TickTime } = require("premierepro");
const project = premierepro.app.project;

await project.executeTransaction(async () => {
    const time = TickTime.fromSeconds(10);
    const marker = await sequence.markers.createMarker(time);
    marker.name = "Chapter 1";
    marker.comments = "Introduction begins";
}, "Add Marker");
```

### Add Marker at Playhead

```javascript
await project.executeTransaction(async () => {
    const marker = await sequence.markers.createMarker(sequence.playerPosition);
    marker.name = "Note";
}, "Add Marker at Playhead");
```

### Add Duration Marker

```javascript
const { TickTime } = require("premierepro");

await project.executeTransaction(async () => {
    const startTime = TickTime.fromSeconds(5);
    const marker = await sequence.markers.createMarker(startTime);
    marker.name = "Important Section";
    marker.duration = TickTime.fromSeconds(10);  // 10 second duration
}, "Add Duration Marker");
```

### Add Clip Marker

```javascript
await project.executeTransaction(async () => {
    const clip = sequence.videoTracks[0].clips[0];
    const marker = await clip.markers.createMarker(clip.inPoint);
    marker.name = "Clip Start";
}, "Add Clip Marker");
```

## Modifying Markers

### Change Marker Properties

```javascript
await project.executeTransaction(async () => {
    const marker = sequence.markers[0];
    marker.name = "New Name";
    marker.comments = "Updated comment";
    marker.color = 3;  // Different color
}, "Update Marker");
```

### Move Marker

```javascript
const { TickTime } = require("premierepro");

await project.executeTransaction(async () => {
    const marker = sequence.markers[0];
    marker.time = TickTime.fromSeconds(20);
}, "Move Marker");
```

### Change Marker Duration

```javascript
const { TickTime } = require("premierepro");

await project.executeTransaction(async () => {
    const marker = sequence.markers[0];
    marker.duration = TickTime.fromSeconds(5);
}, "Change Marker Duration");
```

## Removing Markers

### Remove Single Marker

```javascript
await project.executeTransaction(async () => {
    const marker = sequence.markers[0];
    await sequence.markers.removeMarker(marker);
}, "Remove Marker");
```

### Remove All Markers

```javascript
await project.executeTransaction(async () => {
    while (sequence.markers.length > 0) {
        await sequence.markers.removeMarker(sequence.markers[0]);
    }
}, "Clear All Markers");
```

### Remove Markers in Range

```javascript
async function removeMarkersInRange(sequence, startTime, endTime) {
    const project = premierepro.app.project;

    const markersToRemove = [];
    for (const marker of sequence.markers) {
        if (marker.time.greaterThan(startTime) && marker.time.lessThan(endTime)) {
            markersToRemove.push(marker);
        }
    }

    await project.executeTransaction(async () => {
        for (const marker of markersToRemove) {
            await sequence.markers.removeMarker(marker);
        }
    }, "Remove Markers in Range");
}
```

## Finding Markers

### Find by Name

```javascript
function findMarkerByName(markers, name) {
    for (const marker of markers) {
        if (marker.name === name) {
            return marker;
        }
    }
    return null;
}

const chapterMarker = findMarkerByName(sequence.markers, "Chapter 1");
```

### Find Nearest Marker

```javascript
function findNearestMarker(markers, time) {
    let nearest = null;
    let nearestDiff = Infinity;

    for (const marker of markers) {
        const diff = Math.abs(marker.time.toSeconds() - time.toSeconds());
        if (diff < nearestDiff) {
            nearestDiff = diff;
            nearest = marker;
        }
    }

    return nearest;
}

const nearest = findNearestMarker(sequence.markers, sequence.playerPosition);
```

### Find Next/Previous Marker

```javascript
function findNextMarker(markers, currentTime) {
    let next = null;

    for (const marker of markers) {
        if (marker.time.greaterThan(currentTime)) {
            if (!next || marker.time.lessThan(next.time)) {
                next = marker;
            }
        }
    }

    return next;
}

function findPreviousMarker(markers, currentTime) {
    let prev = null;

    for (const marker of markers) {
        if (marker.time.lessThan(currentTime)) {
            if (!prev || marker.time.greaterThan(prev.time)) {
                prev = marker;
            }
        }
    }

    return prev;
}

// Navigate to next marker
const next = findNextMarker(sequence.markers, sequence.playerPosition);
if (next) {
    sequence.setPlayerPosition(next.time);
}
```

## Marker Colors

Premiere Pro uses color indices (0-15):

```javascript
const MARKER_COLORS = {
    GREEN: 0,
    RED: 1,
    PURPLE: 2,
    ORANGE: 3,
    YELLOW: 4,
    WHITE: 5,
    BLUE: 6,
    CYAN: 7,
    // 8-15 are additional colors
};

await project.executeTransaction(async () => {
    marker.color = MARKER_COLORS.RED;
}, "Set Marker Color");
```

## Practical Examples

### Create Markers from Array

```javascript
async function createMarkersFromList(sequence, markerList) {
    const { TickTime } = require("premierepro");
    const project = premierepro.app.project;

    await project.executeTransaction(async () => {
        for (const item of markerList) {
            const time = TickTime.fromSeconds(item.time);
            const marker = await sequence.markers.createMarker(time);
            marker.name = item.name || '';
            marker.comments = item.comment || '';
            if (item.color !== undefined) {
                marker.color = item.color;
            }
        }
    }, "Create Markers");
}

// Usage
await createMarkersFromList(sequence, [
    { time: 0, name: "Intro", color: 0 },
    { time: 30, name: "Chapter 1", color: 1 },
    { time: 120, name: "Chapter 2", color: 1 },
    { time: 300, name: "Outro", color: 2 }
]);
```

### Export Markers to Text

```javascript
function exportMarkersToText(markers, frameRate) {
    const lines = ['Timecode,Name,Comment,Duration'];

    for (const marker of markers) {
        const tc = marker.time.toTimecode(frameRate);
        const name = marker.name || '';
        const comment = (marker.comments || '').replace(/,/g, ';');
        const dur = marker.duration ? marker.duration.toSeconds() : 0;

        lines.push(`${tc},"${name}","${comment}",${dur}`);
    }

    return lines.join('\n');
}

const csv = exportMarkersToText(sequence.markers, 24);
console.log(csv);
```

### Import Markers from CSV

```javascript
async function importMarkersFromCSV(sequence, csvContent, frameRate) {
    const { TickTime } = require("premierepro");
    const project = premierepro.app.project;

    const lines = csvContent.split('\n');

    await project.executeTransaction(async () => {
        for (let i = 1; i < lines.length; i++) {  // Skip header
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (doesn't handle all edge cases)
            const parts = line.split(',');
            const timecode = parts[0];
            const name = parts[1] ? parts[1].replace(/"/g, '') : '';
            const comment = parts[2] ? parts[2].replace(/"/g, '') : '';

            const time = TickTime.fromTimecode(timecode, frameRate);
            const marker = await sequence.markers.createMarker(time);
            marker.name = name;
            marker.comments = comment;
        }
    }, "Import Markers");
}
```

### Create Markers at Clip Boundaries

```javascript
async function markClipBoundaries(sequence) {
    const project = premierepro.app.project;

    const boundaries = new Set();

    // Collect all clip start/end times
    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            boundaries.add(clip.start.toSeconds());
            boundaries.add(clip.end.toSeconds());
        }
    }

    // Sort times
    const times = [...boundaries].sort((a, b) => a - b);

    const { TickTime } = require("premierepro");

    await project.executeTransaction(async () => {
        for (let i = 0; i < times.length; i++) {
            const time = TickTime.fromSeconds(times[i]);
            const marker = await sequence.markers.createMarker(time);
            marker.name = `Edit ${i + 1}`;
        }
    }, "Mark Clip Boundaries");

    console.log(`Created ${times.length} markers`);
}
```

### Shift All Markers

```javascript
async function shiftMarkers(sequence, offsetSeconds) {
    const { TickTime } = require("premierepro");
    const project = premierepro.app.project;
    const offset = TickTime.fromSeconds(offsetSeconds);

    await project.executeTransaction(async () => {
        for (const marker of sequence.markers) {
            marker.time = marker.time.add(offset);
        }
    }, "Shift Markers");
}

// Shift all markers 5 seconds later
await shiftMarkers(sequence, 5);
```
