// After Effects Script: Extract Video File Names from Composition
// This script gets all video file names used in the active composition and saves them to a text file

(function() {
    
    // Check if a composition is selected
    var activeComp = app.project.activeItem;
    if (!activeComp || !(activeComp instanceof CompItem)) {
        alert("Please select a composition first.");
        return;
    }
    
    // Array to store unique video file names
    var videoFiles = [];
    var seenFiles = {}; // To avoid duplicates
    
    // Define video file extensions to look for
    var videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mts', '.m2ts', '.mxf', '.r3d', '.braw'];
    
    // Function to check if file is a video based on extension
    function isVideoFile(fileName) {
        if (!fileName) return false;
        var lowerName = fileName.toLowerCase();
        for (var i = 0; i < videoExtensions.length; i++) {
            if (lowerName.indexOf(videoExtensions[i]) !== -1) {
                return true;
            }
        }
        return false;
    }
    
    // Iterate through all layers in the composition
    for (var i = 1; i <= activeComp.numLayers; i++) {
        var layer = activeComp.layer(i);
        
        // Check if layer has a source (footage item)
        if (layer.source && layer.source instanceof FootageItem) {
            var source = layer.source;
            
            // Check if it's a file (not solid color, etc.)
            if (source.file && source.file.exists) {
                var fileName = source.file.name;
                
                // Check if it's a video file and not already added
                if (isVideoFile(fileName) && !seenFiles[fileName]) {
                    videoFiles.push(fileName);
                    seenFiles[fileName] = true;
                }
            }
        }
        
        // Handle pre-compositions recursively
        if (layer.source && layer.source instanceof CompItem) {
            // You could add recursive functionality here to check nested comps
            // For now, this script only checks the active composition
        }
    }
    
    // Check if any video files were found
    if (videoFiles.length === 0) {
        alert("No video files found in the active composition.");
        return;
    }
    
    // Sort the file names alphabetically
    videoFiles.sort();
    
    // Create the content for the text file - just filenames, one per line
    var content = "";
    
    for (var j = 0; j < videoFiles.length; j++) {
        content += videoFiles[j] + "\n";
    }
    
    // Prompt user to choose save location
    var saveFile = File.saveDialog("Save video file list as:", "*.txt");
    
    if (saveFile) {
        try {
            // Open file for writing
            saveFile.open("w");
            saveFile.write(content);
            saveFile.close();
            
            alert("Video file list saved successfully!\n\nFile: " + saveFile.fsName + "\nTotal video files: " + videoFiles.length);
            
        } catch (error) {
            alert("Error saving file: " + error.toString());
        }
    }
    
})();

// To install this script:
// 1. Save this file with a .jsx extension (e.g., "Extract_Video_Files.jsx")
// 2. Place it in your After Effects Scripts folder:
//    - Windows: C:\Program Files\Adobe\Adobe After Effects [version]\Support Files\Scripts\
//    - Mac: /Applications/Adobe After Effects [version]/Scripts/
// 3. Restart After Effects
// 4. Access via File > Scripts > [Script Name]
//
// Or run it directly via File > Scripts > Run Script File...