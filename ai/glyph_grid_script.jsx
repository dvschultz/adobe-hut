// Clustered Glyph Grid Generator for Adobe Illustrator
// Place this script in your Illustrator Scripts folder

(function() {
    
    // Check if document is open
    if (!app.documents.length) {
        alert("Please open a document first.");
        return;
    }
    
    var doc = app.activeDocument;
    
    // Check if something is selected
    if (!doc.selection.length) {
        alert("Please select a glyph or text object first.");
        return;
    }
    
    var selectedGlyph = doc.selection[0];
    
    // Main dialog function
    function showDialog() {
        var dialog = new Window("dialog", "Clustered Glyph Grid Generator");
        dialog.orientation = "column";
        dialog.alignChildren = "left";
        dialog.spacing = 10;
        dialog.margins = 16;
        
        // Grid settings
        var gridPanel = dialog.add("panel", undefined, "Grid Settings");
        gridPanel.orientation = "column";
        gridPanel.alignChildren = "left";
        gridPanel.spacing = 5;
        gridPanel.margins = 10;
        
        var rowGroup = gridPanel.add("group");
        rowGroup.add("statictext", undefined, "Rows:");
        var rowsInput = rowGroup.add("edittext", undefined, "10");
        rowsInput.characters = 5;
        
        var colGroup = gridPanel.add("group");
        colGroup.add("statictext", undefined, "Columns:");
        var colsInput = colGroup.add("edittext", undefined, "10");
        colsInput.characters = 5;
        
        var glyphGroup = gridPanel.add("group");
        glyphGroup.add("statictext", undefined, "Number of Glyphs:");
        var glyphCountInput = glyphGroup.add("edittext", undefined, "25");
        glyphCountInput.characters = 5;
        
        // Clustering options
        var clusterPanel = dialog.add("panel", undefined, "Clustering Method");
        clusterPanel.orientation = "column";
        clusterPanel.alignChildren = "left";
        clusterPanel.spacing = 5;
        clusterPanel.margins = 10;
        
        var clusterRadios = [];
        clusterRadios[0] = clusterPanel.add("radiobutton", undefined, "Random seed points");
        clusterRadios[1] = clusterPanel.add("radiobutton", undefined, "User-defined cluster centers");
        clusterRadios[2] = clusterPanel.add("radiobutton", undefined, "Gradient-based probability");
        clusterRadios[3] = clusterPanel.add("radiobutton", undefined, "Distance-based clustering");
        clusterRadios[0].value = true; // Default selection
        
        // Clustering parameters
        var paramPanel = dialog.add("panel", undefined, "Clustering Parameters");
        paramPanel.orientation = "column";
        paramPanel.alignChildren = "left";
        paramPanel.spacing = 5;
        paramPanel.margins = 10;
        
        var seedGroup = paramPanel.add("group");
        seedGroup.add("statictext", undefined, "Cluster Intensity (0.1-1.0):");
        var intensityInput = seedGroup.add("edittext", undefined, "0.7");
        intensityInput.characters = 5;
        
        var centerGroup = paramPanel.add("group");
        centerGroup.add("statictext", undefined, "Number of Cluster Centers:");
        var centersInput = centerGroup.add("edittext", undefined, "3");
        centersInput.characters = 5;
        
        // Variations
        var varPanel = dialog.add("panel", undefined, "Variations");
        varPanel.orientation = "column";
        varPanel.alignChildren = "left";
        varPanel.spacing = 5;
        varPanel.margins = 10;
        
        var varGroup = varPanel.add("group");
        varGroup.add("statictext", undefined, "Number of Variations:");
        var variationsInput = varGroup.add("edittext", undefined, "1");
        variationsInput.characters = 5;
        
        // Buttons
        var buttonGroup = dialog.add("group");
        buttonGroup.alignment = "center";
        var okButton = buttonGroup.add("button", undefined, "Generate");
        var cancelButton = buttonGroup.add("button", undefined, "Cancel");
        
        okButton.onClick = function() {
            var params = {
                rows: parseInt(rowsInput.text) || 10,
                cols: parseInt(colsInput.text) || 10,
                glyphCount: parseInt(glyphCountInput.text) || 25,
                clusterMethod: getSelectedClusterMethod(),
                intensity: parseFloat(intensityInput.text) || 0.7,
                centers: parseInt(centersInput.text) || 3,
                variations: parseInt(variationsInput.text) || 1
            };
            
            dialog.close();
            generateGrids(params);
        };
        
        cancelButton.onClick = function() {
            dialog.close();
        };
        
        function getSelectedClusterMethod() {
            for (var i = 0; i < clusterRadios.length; i++) {
                if (clusterRadios[i].value) return i;
            }
            return 0;
        }
        
        dialog.show();
    }
    
    // Main generation function
    function generateGrids(params) {
        // Warn user about large numbers of variations
        if (params.variations > 15) {
            var proceed = confirm("Creating " + params.variations + " variations may take a while and use significant memory. Continue?");
            if (!proceed) return;
        }
        
        try {
            var originalArtboard = doc.artboards[doc.artboards.getActiveArtboardIndex()];
            var artboardRect = originalArtboard.artboardRect;
            var artboardWidth = artboardRect[2] - artboardRect[0];
            var artboardHeight = artboardRect[1] - artboardRect[3];
            
            // Define starting position at top-left with some margin
            var startX = 0;
            var startY = 0;
            var margin = 50; // Space between artboards
            
            var batchSize = 8; // Process in batches to avoid memory issues
            var totalBatches = Math.ceil(params.variations / batchSize);
            
            for (var batch = 0; batch < totalBatches; batch++) {
                var startIdx = batch * batchSize;
                var endIdx = Math.min(startIdx + batchSize, params.variations);
                
                // Show progress for large jobs
                if (params.variations > 10) {
                    var progressMsg = "Processing variations " + (startIdx + 1) + "-" + endIdx + " of " + params.variations + "...";
                    // Note: We can't show a real progress bar in ExtendScript, but we could log to console
                }
                
                for (var v = startIdx; v < endIdx; v++) {
                    try {
                        // Create new artboard for each variation (except first)
                        var currentArtboard;
                        if (v === 0) {
                            currentArtboard = originalArtboard;
                        } else {
                            // Arrange artboards in a grid starting from top-left
                            var artboardsPerRow = 6; // Max artboards per row (increased for more space)
                            var row = Math.floor(v / artboardsPerRow);
                            var col = v % artboardsPerRow;
                            
                            var newRect = [
                                startX + col * (artboardWidth + margin),              // left
                                startY - row * (artboardHeight + margin),             // top
                                startX + col * (artboardWidth + margin) + artboardWidth,  // right
                                startY - row * (artboardHeight + margin) - artboardHeight // bottom
                            ];
                            currentArtboard = doc.artboards.add(newRect);
                            doc.artboards.setActiveArtboardIndex(doc.artboards.length - 1);
                        }
                        
                        // Generate grid for this variation
                        generateSingleGrid(params, currentArtboard);
                        
                        // Force a small delay and redraw to prevent memory buildup
                        if (v > 0 && v % 5 === 0) {
                            app.redraw();
                            // Small delay to let Illustrator catch up
                            var start = new Date().getTime();
                            while (new Date().getTime() - start < 100) {
                                // 100ms delay
                            }
                        }
                        
                    } catch (singleError) {
                        alert("Error creating variation " + (v + 1) + ": " + singleError.message + "\nContinuing with remaining variations...");
                        continue;
                    }
                }
                
                // Longer pause between batches for memory cleanup
                if (batch < totalBatches - 1) {
                    app.redraw();
                    var start = new Date().getTime();
                    while (new Date().getTime() - start < 300) {
                        // 300ms delay between batches
                    }
                }
            }
            
            alert("Generated " + params.variations + " variation(s) successfully!");
            
        } catch (e) {
            alert("Error generating grids: " + e.message + "\n\nTry reducing the number of variations or glyphs per grid.");
        }
    }
    
    // Generate a single grid variation
    function generateSingleGrid(params, artboard) {
        var artboardRect = artboard.artboardRect;
        var artboardWidth = artboardRect[2] - artboardRect[0];
        var artboardHeight = artboardRect[1] - artboardRect[3];
        
        // Calculate grid spacing
        var cellWidth = artboardWidth / (params.cols - 1);
        var cellHeight = artboardHeight / (params.rows - 1);
        
        // Create grid points
        var gridPoints = [];
        for (var row = 0; row < params.rows; row++) {
            for (var col = 0; col < params.cols; col++) {
                var x = artboardRect[0] + col * cellWidth;
                var y = artboardRect[1] - row * cellHeight;
                gridPoints.push({x: x, y: y, row: row, col: col});
            }
        }
        
        // Generate cluster probabilities based on method
        var probabilities = generateClusterProbabilities(gridPoints, params, artboardRect);
        
        // Select points based on probabilities
        var selectedPoints = selectClusteredPoints(gridPoints, probabilities, params.glyphCount, params, artboardRect);
        
        // Place glyphs at selected points
        placeGlyphs(selectedPoints);
    }
    
    // Generate cluster probabilities based on selected method
    function generateClusterProbabilities(gridPoints, params, artboardRect) {
        var probabilities = [];
        var artboardWidth = artboardRect[2] - artboardRect[0];
        var artboardHeight = artboardRect[1] - artboardRect[3];
        
        switch (params.clusterMethod) {
            case 0: // Random seed points
                probabilities = generateRandomSeedProbabilities(gridPoints, params, artboardRect);
                break;
            case 1: // User-defined cluster centers
                probabilities = generateCenterBasedProbabilities(gridPoints, params, artboardRect);
                break;
            case 2: // Gradient-based probability
                probabilities = generateGradientProbabilities(gridPoints, params, artboardRect);
                break;
            case 3: // Distance-based clustering
                probabilities = generateDistanceBasedProbabilities(gridPoints, params);
                break;
        }
        
        return probabilities;
    }
    
    // Random seed points clustering
    function generateRandomSeedProbabilities(gridPoints, params, artboardRect) {
        var probabilities = [];
        var artboardWidth = artboardRect[2] - artboardRect[0];
        var artboardHeight = artboardRect[1] - artboardRect[3];
        
        // Generate random seed points
        var seedPoints = [];
        for (var i = 0; i < params.centers; i++) {
            seedPoints.push({
                x: artboardRect[0] + Math.random() * artboardWidth,
                y: artboardRect[1] - Math.random() * artboardHeight
            });
        }
        
        // Calculate probabilities based on distance to nearest seed
        for (var i = 0; i < gridPoints.length; i++) {
            var point = gridPoints[i];
            var minDistance = Infinity;
            
            for (var j = 0; j < seedPoints.length; j++) {
                var distance = Math.sqrt(
                    Math.pow(point.x - seedPoints[j].x, 2) + 
                    Math.pow(point.y - seedPoints[j].y, 2)
                );
                minDistance = Math.min(minDistance, distance);
            }
            
            var maxDistance = Math.sqrt(artboardWidth * artboardWidth + artboardHeight * artboardHeight);
            var probability = Math.pow(1 - (minDistance / maxDistance), 2) * params.intensity;
            probabilities.push(Math.max(0.01, probability));
        }
        
        return probabilities;
    }
    
    // Center-based clustering
    function generateCenterBasedProbabilities(gridPoints, params, artboardRect) {
        var probabilities = [];
        var artboardWidth = artboardRect[2] - artboardRect[0];
        var artboardHeight = artboardRect[1] - artboardRect[3];
        
        // Generate strategic centers based on the number requested
        var centers = generateStrategicCenters(params.centers, artboardRect);
        
        for (var i = 0; i < gridPoints.length; i++) {
            var point = gridPoints[i];
            var minDistance = Infinity;
            
            for (var j = 0; j < centers.length; j++) {
                var distance = Math.sqrt(
                    Math.pow(point.x - centers[j].x, 2) + 
                    Math.pow(point.y - centers[j].y, 2)
                );
                minDistance = Math.min(minDistance, distance);
            }
            
            var maxDistance = Math.sqrt(artboardWidth * artboardWidth + artboardHeight * artboardHeight);
            var probability = Math.pow(1 - (minDistance / maxDistance), 1.5) * params.intensity;
            probabilities.push(Math.max(0.01, probability));
        }
        
        return probabilities;
    }
    
    // Generate strategic center positions based on count
    function generateStrategicCenters(count, artboardRect) {
        var centers = [];
        var artboardWidth = artboardRect[2] - artboardRect[0];
        var artboardHeight = artboardRect[1] - artboardRect[3];
        var centerX = artboardRect[0] + artboardWidth * 0.5;
        var centerY = artboardRect[1] - artboardHeight * 0.5;
        
        if (count === 1) {
            // Single center in the middle
            centers.push({x: centerX, y: centerY});
        } else if (count === 2) {
            // Two centers on opposite sides
            centers.push({x: artboardRect[0] + artboardWidth * 0.25, y: centerY});
            centers.push({x: artboardRect[0] + artboardWidth * 0.75, y: centerY});
        } else if (count === 3) {
            // Triangle formation
            centers.push({x: centerX, y: artboardRect[1] - artboardHeight * 0.2}); // top
            centers.push({x: artboardRect[0] + artboardWidth * 0.25, y: artboardRect[1] - artboardHeight * 0.8}); // bottom left
            centers.push({x: artboardRect[0] + artboardWidth * 0.75, y: artboardRect[1] - artboardHeight * 0.8}); // bottom right
        } else if (count === 4) {
            // Four corners approach to center
            centers.push({x: artboardRect[0] + artboardWidth * 0.3, y: artboardRect[1] - artboardHeight * 0.3});
            centers.push({x: artboardRect[0] + artboardWidth * 0.7, y: artboardRect[1] - artboardHeight * 0.3});
            centers.push({x: artboardRect[0] + artboardWidth * 0.3, y: artboardRect[1] - artboardHeight * 0.7});
            centers.push({x: artboardRect[0] + artboardWidth * 0.7, y: artboardRect[1] - artboardHeight * 0.7});
        } else {
            // For 5+ centers, distribute them in a rough circle around the center
            var radius = Math.min(artboardWidth, artboardHeight) * 0.25;
            for (var i = 0; i < count; i++) {
                var angle = (2 * Math.PI * i) / count;
                centers.push({
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius
                });
            }
        }
        
        return centers;
    }
    
    // Gradient-based probability
    function generateGradientProbabilities(gridPoints, params, artboardRect) {
        var probabilities = [];
        var artboardWidth = artboardRect[2] - artboardRect[0];
        var artboardHeight = artboardRect[1] - artboardRect[3];
        
        // Generate focal points for gradients based on cluster centers
        var focalPoints = generateStrategicCenters(params.centers, artboardRect);
        
        for (var i = 0; i < gridPoints.length; i++) {
            var point = gridPoints[i];
            var maxProbability = 0;
            
            // Calculate probability based on distance to nearest focal point
            for (var j = 0; j < focalPoints.length; j++) {
                var distance = Math.sqrt(
                    Math.pow(point.x - focalPoints[j].x, 2) + 
                    Math.pow(point.y - focalPoints[j].y, 2)
                );
                
                var maxDistance = Math.sqrt(artboardWidth * artboardWidth + artboardHeight * artboardHeight);
                var gradientValue = 1 - (distance / maxDistance);
                var probability = Math.pow(gradientValue, 1.5) * params.intensity;
                maxProbability = Math.max(maxProbability, probability);
            }
            
            probabilities.push(Math.max(0.01, maxProbability));
        }
        
        return probabilities;
    }
    
    // Distance-based clustering (higher probability near existing placements)
    function generateDistanceBasedProbabilities(gridPoints, params) {
        var probabilities = [];
        
        // Initialize with low probability for all points
        for (var i = 0; i < gridPoints.length; i++) {
            probabilities.push(0.1);
        }
        
        // For distance-based clustering, we'll start by placing seed glyphs
        // at strategic locations, then build clusters from there
        return probabilities; // Will be updated dynamically during selection
    }
    
    // Select points based on clustering probabilities
    function selectClusteredPoints(gridPoints, probabilities, count, params, artboardRect) {
        var selectedPoints = [];
        var availableIndices = [];
        
        // Create array of available indices
        for (var i = 0; i < gridPoints.length; i++) {
            availableIndices.push(i);
        }
        
        // Special handling for distance-based clustering
        if (params.clusterMethod === 3) {
            return selectDistanceBasedPoints(gridPoints, count, params, artboardRect);
        }
        
        // Standard weighted selection for other methods
        for (var selected = 0; selected < count && availableIndices.length > 0; selected++) {
            // Create weighted selection
            var totalWeight = 0;
            for (var i = 0; i < availableIndices.length; i++) {
                totalWeight += probabilities[availableIndices[i]];
            }
            
            var randomValue = Math.random() * totalWeight;
            var currentWeight = 0;
            var selectedIndex = -1;
            
            for (var i = 0; i < availableIndices.length; i++) {
                currentWeight += probabilities[availableIndices[i]];
                if (randomValue <= currentWeight) {
                    selectedIndex = availableIndices[i];
                    break;
                }
            }
            
            if (selectedIndex >= 0) {
                selectedPoints.push(gridPoints[selectedIndex]);
                
                // Remove selected index from available indices
                for (var i = 0; i < availableIndices.length; i++) {
                    if (availableIndices[i] === selectedIndex) {
                        availableIndices.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        return selectedPoints;
    }
    
    // Special selection method for distance-based clustering
    function selectDistanceBasedPoints(gridPoints, count, params, artboardRect) {
        var selectedPoints = [];
        var availableIndices = [];
        
        // Create array of available indices
        for (var i = 0; i < gridPoints.length; i++) {
            availableIndices.push(i);
        }
        
        // First, place seed points at strategic locations
        var seedCenters = generateStrategicCenters(params.centers, artboardRect);
        var seedIndices = [];
        
        // Find grid points closest to each seed center
        for (var s = 0; s < seedCenters.length && selectedPoints.length < count; s++) {
            var seedCenter = seedCenters[s];
            var closestIndex = -1;
            var closestDistance = Infinity;
            
            for (var i = 0; i < availableIndices.length; i++) {
                var index = availableIndices[i];
                var point = gridPoints[index];
                var distance = Math.sqrt(
                    Math.pow(point.x - seedCenter.x, 2) + 
                    Math.pow(point.y - seedCenter.y, 2)
                );
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            }
            
            if (closestIndex >= 0) {
                selectedPoints.push(gridPoints[closestIndex]);
                seedIndices.push(closestIndex);
                
                // Remove from available
                for (var i = 0; i < availableIndices.length; i++) {
                    if (availableIndices[i] === closestIndex) {
                        availableIndices.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        // Now place remaining points using distance-based clustering
        while (selectedPoints.length < count && availableIndices.length > 0) {
            // Calculate probabilities based on distance to already placed points
            var probabilities = [];
            for (var i = 0; i < availableIndices.length; i++) {
                var index = availableIndices[i];
                var point = gridPoints[index];
                var minDistance = Infinity;
                
                // Find distance to closest placed point
                for (var j = 0; j < selectedPoints.length; j++) {
                    var placedPoint = selectedPoints[j];
                    var distance = Math.sqrt(
                        Math.pow(point.x - placedPoint.x, 2) + 
                        Math.pow(point.y - placedPoint.y, 2)
                    );
                    minDistance = Math.min(minDistance, distance);
                }
                
                // Closer points get higher probability
                var probability = Math.max(0.01, Math.pow(1 - Math.min(minDistance / 300, 1), 2) * params.intensity);
                probabilities.push(probability);
            }
            
            // Weighted selection
            var totalWeight = 0;
            for (var i = 0; i < probabilities.length; i++) {
                totalWeight += probabilities[i];
            }
            
            var randomValue = Math.random() * totalWeight;
            var currentWeight = 0;
            var selectedArrayIndex = -1;
            
            for (var i = 0; i < probabilities.length; i++) {
                currentWeight += probabilities[i];
                if (randomValue <= currentWeight) {
                    selectedArrayIndex = i;
                    break;
                }
            }
            
            if (selectedArrayIndex >= 0) {
                var selectedIndex = availableIndices[selectedArrayIndex];
                selectedPoints.push(gridPoints[selectedIndex]);
                availableIndices.splice(selectedArrayIndex, 1);
            }
        }
        
        return selectedPoints;
    }
    
    // Place glyphs at selected points
    function placeGlyphs(points) {
        for (var i = 0; i < points.length; i++) {
            var point = points[i];
            var duplicate = selectedGlyph.duplicate();
            
            // Move to grid position
            var bounds = duplicate.geometricBounds;
            var centerX = (bounds[0] + bounds[2]) / 2;
            var centerY = (bounds[1] + bounds[3]) / 2;
            
            duplicate.translate(point.x - centerX, point.y - centerY);
        }
    }
    
    // Start the script
    showDialog();
    
})();