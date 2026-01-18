---
name: ae-markers
description: "Marker operations in After Effects: add markers at intervals, convert markers to layer cuts, export marker data."
---

# AE Markers

Create, manipulate, and export markers in After Effects compositions and layers.

## Available Operations

### 1. Add Markers at Regular Intervals

Add composition or layer markers at specified time intervals.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var interval = parseFloat(prompt("Marker interval (seconds):", "1"));
    if (isNaN(interval) || interval <= 0) {
        alert("Invalid interval.");
        return;
    }

    var startAt = parseFloat(prompt("Start time (seconds):", "0"));
    if (isNaN(startAt)) startAt = 0;

    var prefix = prompt("Marker comment prefix:", "Marker");

    app.beginUndoGroup("Add Markers at Intervals");
    try {
        var markerProp = comp.markerProperty;
        var count = 0;
        var markerNum = 1;

        for (var t = startAt; t < comp.duration; t += interval) {
            var markerValue = new MarkerValue(prefix + " " + markerNum);
            markerProp.setValueAtTime(t, markerValue);
            count++;
            markerNum++;
        }

        alert("Added " + count + " composition markers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 2. Add Markers from Array

Add markers at specific times with custom labels.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    // Configuration - modify as needed
    var markers = [
        { time: 0, comment: "Intro", duration: 0 },
        { time: 2.5, comment: "Title", duration: 0.5 },
        { time: 5, comment: "Main Content", duration: 0 },
        { time: 10, comment: "Call to Action", duration: 1 },
        { time: 15, comment: "Outro", duration: 0 }
    ];

    app.beginUndoGroup("Add Custom Markers");
    try {
        var markerProp = comp.markerProperty;

        for (var i = 0; i < markers.length; i++) {
            var m = markers[i];
            var markerValue = new MarkerValue(m.comment);

            if (m.duration > 0) {
                markerValue.duration = m.duration;
            }

            markerProp.setValueAtTime(m.time, markerValue);
        }

        alert("Added " + markers.length + " markers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 3. Add Markers at Layer In/Out Points

Create markers at the beginning and end of each layer.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var markerType = prompt(
        "Add markers at:\n1 = Layer in points\n2 = Layer out points\n3 = Both",
        "3"
    );

    app.beginUndoGroup("Add Markers at Layer Points");
    try {
        var markerProp = comp.markerProperty;
        var count = 0;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (markerType === "1" || markerType === "3") {
                var inMarker = new MarkerValue(layer.name + " IN");
                markerProp.setValueAtTime(layer.inPoint, inMarker);
                count++;
            }

            if (markerType === "2" || markerType === "3") {
                var outMarker = new MarkerValue(layer.name + " OUT");
                markerProp.setValueAtTime(layer.outPoint, outMarker);
                count++;
            }
        }

        alert("Added " + count + " markers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 4. Convert Markers to Layer Splits

Split layers at marker positions (create cuts).

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select at least one layer to split.");
        return;
    }

    // Get marker times from composition
    var markerProp = comp.markerProperty;
    var markerTimes = [];

    for (var i = 1; i <= markerProp.numKeys; i++) {
        markerTimes.push(markerProp.keyTime(i));
    }

    if (markerTimes.length === 0) {
        alert("No composition markers found.");
        return;
    }

    markerTimes.sort(function(a, b) { return a - b; });

    app.beginUndoGroup("Split at Markers");
    try {
        var splitCount = 0;

        for (var j = 0; j < selected.length; j++) {
            var layer = selected[j];

            // Find markers within this layer's time range
            for (var k = 0; k < markerTimes.length; k++) {
                var markerTime = markerTimes[k];

                if (markerTime > layer.inPoint && markerTime < layer.outPoint) {
                    // Duplicate layer and trim
                    var dupe = layer.duplicate();

                    // Original layer: trim out point to marker
                    layer.outPoint = markerTime;

                    // Duplicate: trim in point to marker
                    dupe.inPoint = markerTime;

                    splitCount++;

                    // Continue with the duplicate for further splits
                    layer = dupe;
                }
            }
        }

        alert("Created " + splitCount + " split(s) at marker positions.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 5. Copy Layer Markers to Composition

Copy markers from a layer to the composition level.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selected = comp.selectedLayers;
    if (selected.length === 0) {
        alert("Please select a layer with markers.");
        return;
    }

    var sourceLayer = selected[0];

    app.beginUndoGroup("Copy Markers to Comp");
    try {
        var layerMarkers = sourceLayer.marker;
        var compMarkers = comp.markerProperty;
        var count = 0;

        for (var i = 1; i <= layerMarkers.numKeys; i++) {
            var time = layerMarkers.keyTime(i);
            var value = layerMarkers.keyValue(i);

            // Adjust time for layer start time
            var compTime = time;  // Markers are already in comp time

            compMarkers.setValueAtTime(compTime, value);
            count++;
        }

        alert("Copied " + count + " marker(s) from '" + sourceLayer.name + "' to composition.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 6. Export Markers to CSV

Export all composition markers to a CSV file.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var markerProp = comp.markerProperty;

    if (markerProp.numKeys === 0) {
        alert("No markers found in composition.");
        return;
    }

    var saveFile = File.saveDialog("Save markers as CSV", "*.csv");
    if (!saveFile) return;

    try {
        var csv = "Index,Time (seconds),Time (frames),Timecode,Comment,Duration,Chapter,URL,Frame Target,Cue Point Name\n";

        for (var i = 1; i <= markerProp.numKeys; i++) {
            var time = markerProp.keyTime(i);
            var marker = markerProp.keyValue(i);

            var frames = Math.round(time * comp.frameRate);
            var tc = framesToTimecode(frames, comp.frameRate);

            csv += i + ",";
            csv += time.toFixed(3) + ",";
            csv += frames + ",";
            csv += tc + ",";
            csv += '"' + (marker.comment || "").replace(/"/g, '""') + '",';
            csv += marker.duration + ",";
            csv += '"' + (marker.chapter || "").replace(/"/g, '""') + '",';
            csv += '"' + (marker.url || "") + '",';
            csv += '"' + (marker.frameTarget || "") + '",';
            csv += '"' + (marker.cuePointName || "") + '"';
            csv += "\n";
        }

        saveFile.open("w");
        saveFile.write(csv);
        saveFile.close();

        alert("Exported " + markerProp.numKeys + " markers to:\n" + saveFile.fsName);

    } catch (e) {
        alert("Error: " + e.message);
    }

    function framesToTimecode(frames, fps) {
        var totalSeconds = Math.floor(frames / fps);
        var f = frames % Math.round(fps);
        var s = totalSeconds % 60;
        var m = Math.floor(totalSeconds / 60) % 60;
        var h = Math.floor(totalSeconds / 3600);

        return pad(h) + ":" + pad(m) + ":" + pad(s) + ":" + pad(f);
    }

    function pad(n) {
        return n < 10 ? "0" + n : "" + n;
    }

})();
```

### 7. Import Markers from CSV

Import markers from a CSV file.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var csvFile = File.openDialog("Select CSV file with markers", "*.csv");
    if (!csvFile) return;

    app.beginUndoGroup("Import Markers from CSV");
    try {
        csvFile.open("r");
        var header = csvFile.readln();  // Skip header row
        var markerProp = comp.markerProperty;
        var count = 0;

        while (!csvFile.eof) {
            var line = csvFile.readln().trim();
            if (line === "") continue;

            // Parse CSV line (simple parser - doesn't handle all edge cases)
            var parts = line.split(",");

            if (parts.length >= 2) {
                var time = parseFloat(parts[1]);
                var comment = parts.length >= 5 ? parts[4].replace(/^"|"$/g, "") : "";
                var duration = parts.length >= 6 ? parseFloat(parts[5]) : 0;

                if (!isNaN(time)) {
                    var markerValue = new MarkerValue(comment);
                    if (!isNaN(duration) && duration > 0) {
                        markerValue.duration = duration;
                    }
                    markerProp.setValueAtTime(time, markerValue);
                    count++;
                }
            }
        }

        csvFile.close();
        alert("Imported " + count + " markers from CSV.");

    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

### 8. Clear All Markers

Remove all markers from the composition.

```javascript
#target aftereffects

(function() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var markerProp = comp.markerProperty;

    if (markerProp.numKeys === 0) {
        alert("No markers to remove.");
        return;
    }

    var confirm = prompt(
        "Remove all " + markerProp.numKeys + " composition markers?\nType 'yes' to confirm:",
        ""
    );

    if (confirm !== "yes") {
        alert("Cancelled.");
        return;
    }

    app.beginUndoGroup("Clear Markers");
    try {
        while (markerProp.numKeys > 0) {
            markerProp.removeKey(1);
        }
        alert("Removed all composition markers.");
    } catch (e) {
        alert("Error: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Marker Properties Reference

| Property | Type | Description |
|----------|------|-------------|
| comment | String | Main marker text |
| duration | Number | Marker duration in seconds |
| chapter | String | Chapter name |
| url | String | URL link |
| frameTarget | String | Frame target for URL |
| cuePointName | String | Flash cue point name |
| eventCuePoint | Boolean | Is event cue point |
| navigationCuePoint | Boolean | Is navigation cue point |

## Usage

When the user invokes `/ae-markers`, ask what they want to do:

1. Add markers at regular intervals
2. Add markers at specific times
3. Add markers at layer in/out points
4. Split layers at marker positions
5. Copy layer markers to composition
6. Export markers to CSV
7. Import markers from CSV
8. Clear all markers

## Example Requests

- "Add a marker every 5 seconds"
- "Create markers at the start of each layer"
- "Export my markers to a CSV file"
- "Split this layer wherever there's a marker"
- "Import markers from my spreadsheet"
