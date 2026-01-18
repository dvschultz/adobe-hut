---
name: ae-edl
description: "EDL workflow for After Effects: import CMX 3600 EDL files, auto-link source files, create timed compositions."
---

# AE EDL Workflow

Import Edit Decision List (EDL) files and create After Effects compositions with proper timing.

## Overview

This skill wraps the existing `edl_to_composition.jsx` script in the `ae/` folder. It parses CMX 3600 EDL files and creates compositions with layers placed at the correct timecode positions.

## Features

- Parse CMX 3600 EDL format
- Support for drop-frame and non-drop-frame timecode
- Auto-link source files from embedded paths
- Search folder for missing source files
- Frame-accurate timing placement
- Support for multiple video events

## Main Script Location

The full EDL to composition script is located at:
```
ae/edl_to_composition.jsx
```

## How to Use

### Via Script

Run the script directly in After Effects:
1. Go to `File > Scripts > Run Script File...`
2. Navigate to `ae/edl_to_composition.jsx`
3. Follow the dialog prompts

### Workflow Steps

1. **Select EDL File**: Choose your CMX 3600 EDL file
2. **Select Frame Rate**: Confirm or adjust the detected frame rate
3. **Link Source Files**:
   - If EDL has embedded paths, files are auto-linked
   - If paths are missing/wrong, select a folder to search
   - Missing files can be linked individually or skipped
4. **Composition Created**: A new comp is created with all clips placed at their edit points

## EDL Format Support

### Supported Elements

```
TITLE: My Sequence
FCM: DROP FRAME

001  clip1.mov  V     C        00:00:05:00 00:00:15:00 00:00:00:00 00:00:10:00
* SOURCE FILE: /path/to/clip1.mov
* FROM CLIP NAME: clip1.mov

002  clip2.mov  V     C        00:00:00:00 00:00:08:00 00:00:10:00 00:00:18:00
* SOURCE FILE: /path/to/clip2.mov
```

### Timecode Columns

| Column | Description |
|--------|-------------|
| Event # | Edit event number |
| Source | Reel/clip name |
| Track | V (video), A (audio), etc. |
| Trans | C (cut), D (dissolve), etc. |
| Source In | Start timecode in source |
| Source Out | End timecode in source |
| Record In | Start timecode in timeline |
| Record Out | End timecode in timeline |

### Frame Rate Options

- 23.976 fps (Film pulldown)
- 24 fps (Film)
- 25 fps (PAL)
- 29.97 fps Drop Frame (NTSC)
- 29.97 fps Non-Drop (NTSC)
- 30 fps
- 50 fps (PAL)
- 59.94 fps (NTSC)
- 60 fps

## Script Customization

### Basic EDL Parser

```javascript
#target aftereffects

(function() {

    function parseEDL(edlFile, frameRate) {
        var events = [];

        if (!edlFile.open("r")) {
            throw new Error("Cannot open file");
        }

        var currentEvent = null;

        while (!edlFile.eof) {
            var line = edlFile.readln();

            // Parse event lines (start with number)
            if (/^\d+/.test(line.trim())) {
                var parts = line.trim().split(/\s+/);
                if (parts.length >= 8) {
                    currentEvent = {
                        eventNumber: parseInt(parts[0], 10),
                        sourceName: parts[1],
                        trackType: parts[2],
                        sourceIn: parts[4],
                        sourceOut: parts[5],
                        recordIn: parts[6],
                        recordOut: parts[7],
                        sourceFile: null
                    };
                    events.push(currentEvent);
                }
            }

            // Parse SOURCE FILE line
            if (currentEvent && line.indexOf("* SOURCE FILE:") !== -1) {
                currentEvent.sourceFile = line.substring(
                    line.indexOf("* SOURCE FILE:") + 14
                ).trim();
            }
        }

        edlFile.close();
        return events;
    }

    function timecodeToSeconds(tc, frameRate) {
        var parts = tc.split(/[:;]/);
        var hours = parseInt(parts[0], 10);
        var minutes = parseInt(parts[1], 10);
        var seconds = parseInt(parts[2], 10);
        var frames = parseInt(parts[3], 10);

        var totalSeconds = hours * 3600 + minutes * 60 + seconds;
        totalSeconds += frames / frameRate;

        return totalSeconds;
    }

    // Main
    var edlFile = File.openDialog("Select EDL file", "*.edl");
    if (!edlFile) return;

    var events = parseEDL(edlFile, 30);

    $.writeln("Parsed " + events.length + " events");
    for (var i = 0; i < events.length; i++) {
        $.writeln(events[i].sourceName + " @ " + events[i].recordIn);
    }

})();
```

### Create Composition from Events

```javascript
function createCompFromEDL(events, frameRate, compName) {
    // Calculate duration
    var maxTime = 0;
    for (var i = 0; i < events.length; i++) {
        var outTime = timecodeToSeconds(events[i].recordOut, frameRate);
        if (outTime > maxTime) maxTime = outTime;
    }

    // Create composition
    var comp = app.project.items.addComp(
        compName,
        1920, 1080,
        1.0,
        maxTime + 1,
        frameRate
    );

    // Add layers
    for (var j = 0; j < events.length; j++) {
        var event = events[j];

        // Import footage
        if (event.sourceFile) {
            var file = new File(event.sourceFile);
            if (file.exists) {
                var footage = app.project.importFile(new ImportOptions(file));
                var layer = comp.layers.add(footage);

                // Set timing
                var sourceIn = timecodeToSeconds(event.sourceIn, frameRate);
                var recordIn = timecodeToSeconds(event.recordIn, frameRate);
                var recordOut = timecodeToSeconds(event.recordOut, frameRate);

                layer.startTime = recordIn - sourceIn;
                layer.inPoint = recordIn;
                layer.outPoint = recordOut;
            }
        }
    }

    return comp;
}
```

## Usage

When the user invokes `/ae-edl`:

1. Ask if they want to run the full `edl_to_composition.jsx` script or need a customized version
2. For full script: provide instructions to run `ae/edl_to_composition.jsx`
3. For custom: gather requirements and generate appropriate code

## Example Requests

- "Import an EDL and create a composition"
- "Parse this EDL file and place the clips on a timeline"
- "Create an AE comp from my Premiere export EDL"
- "I have an EDL from DaVinci Resolve, import it into After Effects"

## Notes

- Audio tracks (A1, A2, etc.) are currently skipped - only video events are processed
- Transitions are treated as cuts (dissolves are not auto-created)
- The script caches imported footage to avoid re-importing the same source
- Drop-frame timecode is handled correctly with proper frame counting
