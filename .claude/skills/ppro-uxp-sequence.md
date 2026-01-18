---
name: ppro-uxp-sequence
description: "Premiere Pro UXP sequence operations: creating sequences, timeline navigation, playhead position, in/out points, and sequence settings."
---

# Premiere Pro UXP: Sequence Operations

## Getting the Active Sequence

```javascript
const premierepro = require("premierepro");

const project = premierepro.app.project;
const sequence = project.activeSequence;

if (!sequence) {
    console.error("No active sequence");
    return;
}
```

## Sequence Properties

```javascript
// Basic info
const name = sequence.name;
const id = sequence.id;

// Tracks
const videoTracks = sequence.videoTracks;  // Array of VideoTrack
const audioTracks = sequence.audioTracks;  // Array of AudioTrack

// Track counts
const numVideoTracks = videoTracks.length;
const numAudioTracks = audioTracks.length;

// Duration (in/out points of sequence)
const inPoint = sequence.inPoint;     // TickTime
const outPoint = sequence.outPoint;   // TickTime
```

## Player Position (Playhead)

### Get Current Position

```javascript
const { TickTime } = require("premierepro");

// Get playhead position
const position = sequence.playerPosition;

// Convert to useful formats
const seconds = position.toSeconds();
const frames = position.toFrames(24);  // At 24fps
const timecode = position.toTimecode(24);  // "00:00:00:00" format
```

### Set Player Position

```javascript
const { TickTime } = require("premierepro");

// Move playhead to specific time
const newPosition = TickTime.fromSeconds(10.5);
sequence.setPlayerPosition(newPosition);

// Move to specific frame
const framePosition = TickTime.fromFrames(240, 24);  // Frame 240 at 24fps
sequence.setPlayerPosition(framePosition);

// Move to beginning
sequence.setPlayerPosition(TickTime.fromSeconds(0));
```

## Sequence In/Out Points

### Get In/Out Points

```javascript
const inPoint = sequence.inPoint;
const outPoint = sequence.outPoint;

// Check if in/out are set
const hasInPoint = inPoint !== null;
const hasOutPoint = outPoint !== null;

// Get duration of marked region
if (hasInPoint && hasOutPoint) {
    const duration = outPoint.subtract(inPoint);
    console.log(`Marked duration: ${duration.toSeconds()} seconds`);
}
```

### Set In/Out Points

```javascript
const { TickTime } = require("premierepro");

// Set in point at current playhead
sequence.inPoint = sequence.playerPosition;

// Set out point at specific time
sequence.outPoint = TickTime.fromSeconds(30);

// Set in/out to specific range
sequence.inPoint = TickTime.fromSeconds(5);
sequence.outPoint = TickTime.fromSeconds(15);
```

### Clear In/Out Points

```javascript
// Clear in point
sequence.inPoint = null;

// Clear out point
sequence.outPoint = null;

// Clear both
sequence.inPoint = null;
sequence.outPoint = null;
```

## Working with TickTime

### Creating TickTime

```javascript
const { TickTime } = require("premierepro");

// From seconds
const time1 = TickTime.fromSeconds(5.5);

// From frames (requires frame rate)
const time2 = TickTime.fromFrames(120, 24);  // 120 frames at 24fps

// From timecode string
const time3 = TickTime.fromTimecode("00:01:30:00", 24);
```

### Converting TickTime

```javascript
const time = sequence.playerPosition;

// To seconds
const seconds = time.toSeconds();

// To frames
const frames = time.toFrames(24);

// To timecode string
const timecode = time.toTimecode(24);  // "00:00:05:12"
```

### TickTime Arithmetic

```javascript
const { TickTime } = require("premierepro");

const time1 = TickTime.fromSeconds(10);
const time2 = TickTime.fromSeconds(5);

// Addition
const sum = time1.add(time2);  // 15 seconds

// Subtraction
const diff = time1.subtract(time2);  // 5 seconds

// Comparison
const isLess = time1.lessThan(time2);      // false
const isEqual = time1.equals(time2);       // false
const isGreater = time1.greaterThan(time2); // true
```

## Creating Sequences

### Create Basic Sequence

```javascript
// Create with default settings
const newSequence = await project.createSequence("My Sequence");

// Make it the active sequence
project.activeSequence = newSequence;
```

### Create from Preset

```javascript
// Create sequence from preset ID
const sequence = await project.createSequence("HD Sequence", presetId);
```

## Subsequences

### Create Subsequence from Selection

```javascript
// Create subsequence from selected clips
const subsequence = await sequence.createSubsequence("SubSeq Name");
```

### Nest Sequence

```javascript
// Get a sequence as a project item
function findSequenceItem(project, sequenceName) {
    function search(item) {
        for (const child of item.children) {
            if (child.type === 'sequence' && child.name === sequenceName) {
                return child;
            }
            if (child.type === 'bin') {
                const found = search(child);
                if (found) return found;
            }
        }
        return null;
    }
    return search(project.rootItem);
}

// Insert nested sequence into timeline
const seqItem = findSequenceItem(project, "Nested Sequence");
if (seqItem) {
    const track = sequence.videoTracks[0];
    await track.insertClip(seqItem, sequence.playerPosition);
}
```

## Timeline Navigation Helpers

### Go to Start

```javascript
const { TickTime } = require("premierepro");
sequence.setPlayerPosition(TickTime.fromSeconds(0));
```

### Go to End

```javascript
sequence.setPlayerPosition(sequence.outPoint);
```

### Go to Next/Previous Frame

```javascript
function moveByFrames(sequence, frameCount, frameRate) {
    const { TickTime } = require("premierepro");
    const currentFrames = sequence.playerPosition.toFrames(frameRate);
    const newPosition = TickTime.fromFrames(currentFrames + frameCount, frameRate);
    sequence.setPlayerPosition(newPosition);
}

// Next frame
moveByFrames(sequence, 1, 24);

// Previous frame
moveByFrames(sequence, -1, 24);

// Jump 10 frames forward
moveByFrames(sequence, 10, 24);
```

### Go to Next/Previous Edit

```javascript
function getNextEdit(sequence, currentTime) {
    let nextEdit = null;

    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            // Check clip start
            if (clip.start.greaterThan(currentTime)) {
                if (!nextEdit || clip.start.lessThan(nextEdit)) {
                    nextEdit = clip.start;
                }
            }
            // Check clip end
            if (clip.end.greaterThan(currentTime)) {
                if (!nextEdit || clip.end.lessThan(nextEdit)) {
                    nextEdit = clip.end;
                }
            }
        }
    }

    return nextEdit;
}

// Navigate to next edit
const nextEdit = getNextEdit(sequence, sequence.playerPosition);
if (nextEdit) {
    sequence.setPlayerPosition(nextEdit);
}
```

## Getting Sequence Statistics

```javascript
function getSequenceStats(sequence) {
    let totalClips = 0;
    let totalDuration = 0;
    let lastClipEnd = null;

    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            totalClips++;
            totalDuration += clip.duration.toSeconds();
            if (!lastClipEnd || clip.end.greaterThan(lastClipEnd)) {
                lastClipEnd = clip.end;
            }
        }
    }

    return {
        videoTrackCount: sequence.videoTracks.length,
        audioTrackCount: sequence.audioTracks.length,
        totalClips: totalClips,
        totalClipDuration: totalDuration,
        timelineEnd: lastClipEnd ? lastClipEnd.toSeconds() : 0
    };
}
```

## Complete Example: Sequence Report

```javascript
const premierepro = require("premierepro");

async function generateSequenceReport() {
    const project = premierepro.app.project;
    const sequence = project.activeSequence;

    if (!sequence) {
        console.error("No active sequence");
        return;
    }

    const report = [];

    report.push(`Sequence: ${sequence.name}`);
    report.push(`Video Tracks: ${sequence.videoTracks.length}`);
    report.push(`Audio Tracks: ${sequence.audioTracks.length}`);
    report.push('');

    // List all clips with timing
    report.push('Video Clips:');
    for (let i = 0; i < sequence.videoTracks.length; i++) {
        const track = sequence.videoTracks[i];
        for (const clip of track.clips) {
            const start = clip.start.toTimecode(24);
            const end = clip.end.toTimecode(24);
            report.push(`  V${i + 1}: ${clip.name} (${start} - ${end})`);
        }
    }

    report.push('');
    report.push('Audio Clips:');
    for (let i = 0; i < sequence.audioTracks.length; i++) {
        const track = sequence.audioTracks[i];
        for (const clip of track.clips) {
            const start = clip.start.toTimecode(24);
            const end = clip.end.toTimecode(24);
            report.push(`  A${i + 1}: ${clip.name} (${start} - ${end})`);
        }
    }

    // Current position
    report.push('');
    report.push(`Playhead: ${sequence.playerPosition.toTimecode(24)}`);

    // In/out points
    if (sequence.inPoint) {
        report.push(`In Point: ${sequence.inPoint.toTimecode(24)}`);
    }
    if (sequence.outPoint) {
        report.push(`Out Point: ${sequence.outPoint.toTimecode(24)}`);
    }

    console.log(report.join('\n'));
    return report.join('\n');
}
```
