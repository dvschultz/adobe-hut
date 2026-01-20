// Random Layer Order Script for Adobe Premiere Pro
// Enable UI display for the script
#target premiere

// Main function to randomize layers
function randomizeLayers() {
    // Get the active sequence
    var sequence = app.project.activeSequence;
    
    if (!sequence) {
        alert("Please select a sequence first!");
        return;
    }
    
    // Get all video tracks
    var videoTracks = sequence.videoTracks;
    
    // Create array to store track items
    var trackItems = [];
    
    // Collect all track items
    for (var i = 0; i < videoTracks.numTracks; i++) {
        var track = videoTracks[i];
        var clips = track.clips;
        
        for (var j = 0; j < clips.numItems; j++) {
            var clip = clips[j];
            if (clip.name !== "") {  // Skip empty clips
                trackItems.push({
                    clip: clip,
                    originalTrack: i,
                    originalStart: clip.start.seconds,
                    duration: clip.duration.seconds
                });
            }
        }
    }
    
    // Function to shuffle array
    function shuffleArray(array) {
        for (var i = array.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
        return array;
    }
    
    // Create undo group for the operation
    app.project.beginUndoGroup("Randomize Layers");
    
    try {
        // Remove all clips first
        for (var i = 0; i < trackItems.length; i++) {
            trackItems[i].clip.remove(false, false);
        }
        
        // Shuffle the array
        trackItems = shuffleArray(trackItems);
        
        // Redistribute clips to tracks
        var currentTrack = 0;
        for (var i = 0; i < trackItems.length; i++) {
            var item = trackItems[i];
            var targetTrack = videoTracks[currentTrack];
            
            // Insert the clip at its original time but on the new track
            targetTrack.insertClip(item.clip, item.originalStart);
            
            // Move to next track, wrap around if needed
            currentTrack = (currentTrack + 1) % videoTracks.numTracks;
        }
        
        alert("Layers randomized successfully!");
    } catch (error) {
        alert("Error: " + error.toString());
    }
    
    app.project.endUndoGroup();
}

// Create the user interface
var window = new Window("dialog", "Randomize Layers");
var buttonGroup = window.add("group");
var randomizeButton = buttonGroup.add("button", undefined, "Randomize");
var cancelButton = buttonGroup.add("button", undefined, "Cancel");

randomizeButton.onClick = function() {
    randomizeLayers();
    window.close();
}

cancelButton.onClick = function() {
    window.close();
}

window.show();
