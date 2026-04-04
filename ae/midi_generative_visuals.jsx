#target aftereffects
/*
 * MIDI Generative Visuals
 * Reads a pre-converted MIDI CSV file and generates position keyframes
 * on a single shape layer. X = time progression, Y = note pitch.
 * Includes a seeded randomness slider for position offset.
 *
 * CSV format: time_sec,note,velocity
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    // ========== UTILITY FUNCTIONS ==========

    function trim(str) {
        return str.replace(/^\s+|\s+$/g, "");
    }

    function mapValue(value, inMin, inMax, outMin, outMax) {
        if (inMax === inMin) return (outMin + outMax) / 2;
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    function clamp(value, min, max) {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    function seededRandom(seed) {
        var state = seed + 1; // avoid 0-state
        return function() {
            state = (state * 9301 + 49297) % 233280;
            return state / 233280; // returns 0 to ~1
        };
    }

    // ========== CSV PARSING ==========

    function parseCSV(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) {
            throw new Error("Cannot open CSV file: " + file.fsName);
        }

        var data = [];

        // Read and skip header
        var header = file.readln();
        var headerParts = header.split(",");
        if (headerParts.length < 3) {
            file.close();
            throw new Error("CSV header must have at least 3 columns (time_sec,note,velocity). Found: " + header);
        }

        var lineNum = 1;
        while (!file.eof) {
            var line = file.readln();
            lineNum++;
            line = trim(line);
            if (line.length === 0) continue;

            var parts = line.split(",");
            if (parts.length < 3) continue;

            var timeSec = parseFloat(trim(parts[0]));
            var note = parseInt(trim(parts[1]), 10);
            var velocity = parseInt(trim(parts[2]), 10);

            if (isNaN(timeSec) || isNaN(note)) {
                continue; // skip malformed rows
            }

            data.push({
                time_sec: timeSec,
                note: note,
                velocity: isNaN(velocity) ? 100 : velocity
            });
        }

        file.close();

        if (data.length === 0) {
            throw new Error("No valid note events found in CSV.");
        }

        return data;
    }

    // ========== DIALOG ==========

    function showDialog() {
        var dlg = new Window("dialog", "MIDI Generative Visuals");

        // File picker
        var filePanel = dlg.add("panel", undefined, "MIDI CSV File");
        filePanel.alignment = ["fill", "top"];
        filePanel.orientation = "row";
        var fileLabel = filePanel.add("statictext", undefined, "No file selected");
        fileLabel.preferredSize = [250, -1];
        var browseBtn = filePanel.add("button", undefined, "Browse...");

        var selectedFile = null;
        browseBtn.onClick = function() {
            var f = File.openDialog("Select MIDI CSV file", "*.csv");
            if (f) {
                selectedFile = f;
                fileLabel.text = f.name;
            }
        };

        // Shape type
        var shapePanel = dlg.add("panel", undefined, "Shape Type");
        shapePanel.alignment = ["fill", "top"];
        var shapeDropdown = shapePanel.add("dropdownlist", undefined, ["Circle", "Rectangle"]);
        shapeDropdown.selection = 0;

        // Randomness slider
        var randomPanel = dlg.add("panel", undefined, "Randomness (0 = none, 10 = max)");
        randomPanel.alignment = ["fill", "top"];
        var sliderGroup = randomPanel.add("group");
        sliderGroup.orientation = "row";
        var slider = sliderGroup.add("slider", undefined, 0, 0, 10);
        slider.preferredSize = [200, -1];
        var valueText = sliderGroup.add("statictext", undefined, "0");
        valueText.characters = 3;

        slider.onChanging = function() {
            valueText.text = String(Math.round(slider.value));
        };

        // OK / Cancel
        var btnGroup = dlg.add("group");
        var okBtn = btnGroup.add("button", undefined, "Generate");
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");

        okBtn.onClick = function() { dlg.close(1); };
        cancelBtn.onClick = function() { dlg.close(0); };

        if (dlg.show() !== 1) {
            return null;
        }

        if (!selectedFile) {
            alert("Please select a CSV file.");
            return null;
        }

        return {
            file: selectedFile,
            shapeType: shapeDropdown.selection.text,
            randomness: Math.round(slider.value)
        };
    }

    // ========== SHAPE LAYER CREATION ==========

    function createShapeLayer(comp, shapeType) {
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = "MIDI Visual";

        var contents = shapeLayer.property("Contents");
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        shapeGroup.name = "Shape";

        var shapesInGroup = shapeGroup.property("Contents");

        // Add shape based on type
        if (shapeType === "Circle") {
            var ellipse = shapesInGroup.addProperty("ADBE Vector Shape - Ellipse");
            ellipse.property("Size").setValue([40, 40]);
        } else {
            var rect = shapesInGroup.addProperty("ADBE Vector Shape - Rect");
            rect.property("Size").setValue([40, 40]);
        }

        // Add white fill
        var fill = shapesInGroup.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue([1, 1, 1]); // white

        return shapeLayer;
    }

    // ========== KEYFRAME GENERATION ==========

    function generateKeyframes(layer, csvData, comp, randomness) {
        var margin = 50;
        var maxOffset = 10; // pixels per randomness unit

        // First pass: find data range
        var minNote = csvData[0].note;
        var maxNote = csvData[0].note;
        var maxTime = csvData[0].time_sec;

        for (var i = 1; i < csvData.length; i++) {
            if (csvData[i].note < minNote) minNote = csvData[i].note;
            if (csvData[i].note > maxNote) maxNote = csvData[i].note;
            if (csvData[i].time_sec > maxTime) maxTime = csvData[i].time_sec;
        }

        // Handle edge case: all same note
        if (minNote === maxNote) {
            minNote = minNote - 1;
            maxNote = maxNote + 1;
        }

        // Initialize seeded PRNG
        var rng = seededRandom(randomness);

        // Get position property
        var position = layer.property("Transform").property("Position");

        // Set keyframes
        for (var j = 0; j < csvData.length; j++) {
            var entry = csvData[j];

            var x = mapValue(entry.time_sec, 0, maxTime, margin, comp.width - margin);
            var y = mapValue(entry.note, minNote, maxNote, comp.height - margin, margin);

            // Add random offset if randomness > 0
            if (randomness > 0) {
                var offsetRange = randomness * maxOffset;
                x += (rng() - 0.5) * 2 * offsetRange;
                y += (rng() - 0.5) * 2 * offsetRange;
            }

            // Clamp to comp bounds
            x = clamp(x, 0, comp.width);
            y = clamp(y, 0, comp.height);

            position.setValueAtTime(entry.time_sec, [x, y]);
        }

        // Set all keyframes to linear interpolation
        for (var k = 1; k <= position.numKeys; k++) {
            position.setInterpolationTypeAtKey(k, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
            position.setSpatialTangentsAtKey(k, [0, 0], [0, 0]);
        }

        return csvData.length;
    }

    // ========== USER FEEDBACK ==========

    function showResults(keyframeCount, layerName) {
        alert("Done!\n\nCreated " + keyframeCount + " keyframes on \"" + layerName + "\".");
    }

    // ========== MAIN FUNCTION ==========

    function main() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var settings = showDialog();
        if (!settings) return;

        // Parse CSV
        var csvData;
        try {
            csvData = parseCSV(settings.file);
        } catch (e) {
            alert("CSV Error: " + e.message);
            return;
        }

        // Warn on large files
        if (csvData.length > 500) {
            var proceed = confirm("CSV has " + csvData.length + " notes. This may take a moment. Continue?");
            if (!proceed) return;
        }

        // Create shape and generate keyframes
        var shapeLayer = createShapeLayer(comp, settings.shapeType);
        var count = generateKeyframes(shapeLayer, csvData, comp, settings.randomness);

        showResults(count, shapeLayer.name);
    }

    // ========== EXECUTE ==========

    app.beginUndoGroup("MIDI Generative Visuals");
    try {
        main();
    } catch (e) {
        alert("Script error: " + e.message);
    }
    app.endUndoGroup();

})();
