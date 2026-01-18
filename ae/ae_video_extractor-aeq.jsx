#target aftereffects
#include '../lib/aequery.js'
/*
 * Extract Video File Names from Composition (AEQuery version)
 * Gets all video file names used in the active composition and saves to a text file
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    var VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mts', '.m2ts', '.mxf', '.r3d', '.braw'];

    function isVideoFile(fileName) {
        if (!fileName) return false;
        var lowerName = fileName.toLowerCase();
        return VIDEO_EXTENSIONS.some(function(ext) {
            return lowerName.indexOf(ext) !== -1;
        });
    }

    // Check for active composition
    var comp = aeq.getActiveComp();
    if (!comp) {
        alert('Please select a composition first.');
        return;
    }

    // Get all layers with footage sources, filter to video files
    var videoFiles = aeq('layer', comp)
        .filter(function(layer) {
            // Must have a source that's footage with a file
            return layer.source &&
                   layer.source instanceof FootageItem &&
                   layer.source.file &&
                   layer.source.file.exists;
        })
        .map(function(layer) {
            return layer.source.file.name;
        })
        .filter(function(fileName) {
            return isVideoFile(fileName);
        });

    // Remove duplicates
    var seen = {};
    var uniqueFiles = videoFiles.filter(function(name) {
        if (seen[name]) return false;
        seen[name] = true;
        return true;
    });

    // Check if any video files were found
    if (uniqueFiles.length === 0) {
        alert('No video files found in the active composition.');
        return;
    }

    // Sort alphabetically
    uniqueFiles.sort();

    // Create content - just filenames, one per line
    var content = uniqueFiles.join('\n') + '\n';

    // Prompt user to choose save location
    var saveFile = File.saveDialog('Save video file list as:', '*.txt');

    if (saveFile) {
        var result = aeq.writeFile(saveFile.fsName, content);
        if (result) {
            alert('Video file list saved successfully!\n\nFile: ' + saveFile.fsName + '\nTotal video files: ' + uniqueFiles.length);
        } else {
            alert('Error saving file.');
        }
    }

})();
