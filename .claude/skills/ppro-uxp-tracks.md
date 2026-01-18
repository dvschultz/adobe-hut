---
name: ppro-uxp-tracks
description: "Premiere Pro UXP track and clip operations: accessing tracks, manipulating clips, timing adjustments, and track item properties."
---

# Premiere Pro UXP: Tracks and Clips

## Accessing Tracks

```javascript
const premierepro = require("premierepro");

const sequence = premierepro.app.project.activeSequence;

// Video tracks
const videoTracks = sequence.videoTracks;

// Audio tracks
const audioTracks = sequence.audioTracks;

// Access specific track by index (0-based)
const firstVideoTrack = videoTracks[0];
const firstAudioTrack = audioTracks[0];
```

## Track Properties

```javascript
const track = sequence.videoTracks[0];

// Basic properties
const name = track.name;
const id = track.id;

// Track state
const isMuted = track.isMuted;
const isLocked = track.isLocked;

// Clips on track
const clips = track.clips;
const clipCount = clips.length;
```

## Accessing Clips

### Get All Clips on Track

```javascript
const track = sequence.videoTracks[0];

for (const clip of track.clips) {
    console.log(`Clip: ${clip.name}`);
    console.log(`  Start: ${clip.start.toTimecode(24)}`);
    console.log(`  End: ${clip.end.toTimecode(24)}`);
}
```

### Get All Clips in Sequence

```javascript
function getAllClips(sequence) {
    const clips = [];

    // Video clips
    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            clips.push({
                clip: clip,
                type: 'video',
                track: track,
                trackIndex: sequence.videoTracks.indexOf(track)
            });
        }
    }

    // Audio clips
    for (const track of sequence.audioTracks) {
        for (const clip of track.clips) {
            clips.push({
                clip: clip,
                type: 'audio',
                track: track,
                trackIndex: sequence.audioTracks.indexOf(track)
            });
        }
    }

    return clips;
}
```

### Get Selected Clips

```javascript
function getSelectedClips(sequence) {
    const selected = [];

    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            if (clip.isSelected()) {
                selected.push(clip);
            }
        }
    }

    for (const track of sequence.audioTracks) {
        for (const clip of track.clips) {
            if (clip.isSelected()) {
                selected.push(clip);
            }
        }
    }

    return selected;
}
```

## Clip Properties

### Basic Properties

```javascript
const clip = track.clips[0];

// Name
const name = clip.name;

// Timing (on timeline)
const start = clip.start;          // TickTime - where clip starts on timeline
const end = clip.end;              // TickTime - where clip ends on timeline
const duration = clip.duration;    // TickTime - clip duration

// Source timing
const inPoint = clip.inPoint;      // TickTime - source in point
const outPoint = clip.outPoint;    // TickTime - source out point

// Source item
const projectItem = clip.projectItem;

// Speed
const speed = clip.speed;  // 1.0 = 100%, 2.0 = 200%, etc.

// Selection state
const isSelected = clip.isSelected();
```

### Getting Clip Position Info

```javascript
function getClipInfo(clip, frameRate) {
    return {
        name: clip.name,
        start: {
            seconds: clip.start.toSeconds(),
            frames: clip.start.toFrames(frameRate),
            timecode: clip.start.toTimecode(frameRate)
        },
        end: {
            seconds: clip.end.toSeconds(),
            frames: clip.end.toFrames(frameRate),
            timecode: clip.end.toTimecode(frameRate)
        },
        duration: {
            seconds: clip.duration.toSeconds(),
            frames: clip.duration.toFrames(frameRate)
        },
        inPoint: clip.inPoint.toTimecode(frameRate),
        outPoint: clip.outPoint.toTimecode(frameRate),
        speed: clip.speed
    };
}
```

## Modifying Clips

### Rename Clip

```javascript
clip.name = "New Clip Name";
```

### Change In/Out Points (Source)

```javascript
const { TickTime } = require("premierepro");

// Set new in point (trims from head)
await clip.setInPoint(TickTime.fromSeconds(2));

// Set new out point (trims from tail)
await clip.setOutPoint(TickTime.fromSeconds(8));
```

### Move Clip on Timeline

```javascript
const { TickTime } = require("premierepro");

// Move to specific position
await clip.move(TickTime.fromSeconds(10));

// Move relative to current position
const currentStart = clip.start;
const newPosition = currentStart.add(TickTime.fromSeconds(5));
await clip.move(newPosition);
```

### Trim Clip Edges

```javascript
const { TickTime } = require("premierepro");

// Trim head (move in point)
const newInPoint = clip.inPoint.add(TickTime.fromFrames(10, 24));
await clip.setInPoint(newInPoint);

// Trim tail (move out point)
const newOutPoint = clip.outPoint.subtract(TickTime.fromFrames(10, 24));
await clip.setOutPoint(newOutPoint);
```

## Adding Clips to Timeline

### Insert Clip

```javascript
const { TickTime } = require("premierepro");

// Insert clip (shifts other clips)
const track = sequence.videoTracks[0];
const projectItem = project.rootItem.children[0];  // Media to add
const insertTime = TickTime.fromSeconds(5);

await track.insertClip(projectItem, insertTime);
```

### Overwrite Clip

```javascript
// Overwrite (replaces content at position)
const track = sequence.videoTracks[0];
const projectItem = project.rootItem.children[0];
const position = TickTime.fromSeconds(5);

await track.overwriteClip(projectItem, position);
```

### Add at Playhead

```javascript
const track = sequence.videoTracks[0];
const projectItem = /* your media item */;

await track.insertClip(projectItem, sequence.playerPosition);
```

## Finding Clips

### Find by Name

```javascript
function findClipsByName(sequence, searchName) {
    const results = [];

    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            if (clip.name.includes(searchName)) {
                results.push(clip);
            }
        }
    }

    return results;
}
```

### Find Clip at Time

```javascript
function findClipAtTime(track, time) {
    for (const clip of track.clips) {
        if (time.greaterThan(clip.start) || time.equals(clip.start)) {
            if (time.lessThan(clip.end)) {
                return clip;
            }
        }
    }
    return null;
}

// Find clip at playhead
const clipAtPlayhead = findClipAtTime(
    sequence.videoTracks[0],
    sequence.playerPosition
);
```

### Find Clips in Range

```javascript
function findClipsInRange(sequence, startTime, endTime) {
    const results = [];

    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            // Check if clip overlaps with range
            const clipStart = clip.start;
            const clipEnd = clip.end;

            const startsInRange = clipStart.greaterThan(startTime) && clipStart.lessThan(endTime);
            const endsInRange = clipEnd.greaterThan(startTime) && clipEnd.lessThan(endTime);
            const spansRange = clipStart.lessThan(startTime) && clipEnd.greaterThan(endTime);

            if (startsInRange || endsInRange || spansRange) {
                results.push(clip);
            }
        }
    }

    return results;
}
```

## Batch Operations

### Batch Rename

```javascript
async function batchRename(clips, prefix) {
    const project = premierepro.app.project;

    await project.executeTransaction(async () => {
        for (let i = 0; i < clips.length; i++) {
            clips[i].name = `${prefix}_${String(i + 1).padStart(3, '0')}`;
        }
    }, "Batch Rename");
}
```

### Trim All Clips

```javascript
async function trimAllClips(sequence, headFrames, tailFrames, frameRate) {
    const { TickTime } = require("premierepro");
    const project = premierepro.app.project;

    const headTrim = TickTime.fromFrames(headFrames, frameRate);
    const tailTrim = TickTime.fromFrames(tailFrames, frameRate);

    await project.executeTransaction(async () => {
        for (const track of sequence.videoTracks) {
            for (const clip of track.clips) {
                // Trim head
                const newInPoint = clip.inPoint.add(headTrim);
                await clip.setInPoint(newInPoint);

                // Trim tail
                const newOutPoint = clip.outPoint.subtract(tailTrim);
                await clip.setOutPoint(newOutPoint);
            }
        }
    }, "Trim All Clips");
}
```

### Close Gaps

```javascript
async function closeGaps(track) {
    const { TickTime } = require("premierepro");
    const project = premierepro.app.project;

    const clips = [...track.clips];

    // Sort by start time
    clips.sort((a, b) => {
        if (a.start.lessThan(b.start)) return -1;
        if (a.start.greaterThan(b.start)) return 1;
        return 0;
    });

    await project.executeTransaction(async () => {
        let currentTime = TickTime.fromSeconds(0);

        for (const clip of clips) {
            if (clip.start.greaterThan(currentTime)) {
                await clip.move(currentTime);
            }
            currentTime = clip.end;
        }
    }, "Close Gaps");
}
```

## Complete Example: Reorganize Clips

```javascript
const premierepro = require("premierepro");

async function organizeClipsByDuration() {
    const project = premierepro.app.project;
    const sequence = project.activeSequence;
    const { TickTime } = require("premierepro");

    if (!sequence) {
        console.error("No active sequence");
        return;
    }

    // Get all video clips
    const clips = [];
    for (const track of sequence.videoTracks) {
        for (const clip of track.clips) {
            clips.push({
                clip: clip,
                duration: clip.duration.toSeconds()
            });
        }
    }

    // Sort by duration (shortest first)
    clips.sort((a, b) => a.duration - b.duration);

    // Reposition on track 1
    const targetTrack = sequence.videoTracks[0];

    await project.executeTransaction(async () => {
        let currentTime = TickTime.fromSeconds(0);

        for (const { clip } of clips) {
            await clip.move(currentTime);
            currentTime = clip.end;
        }
    }, "Organize by Duration");

    console.log(`Organized ${clips.length} clips by duration`);
}
```
