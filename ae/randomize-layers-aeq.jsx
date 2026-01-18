#target aftereffects
#include '../lib/aequery.js'
/*
 * Randomize Layer Order (AEQuery version)
 * Shuffles the stacking order of layers in the active composition
 *
 * Usage: Run from File > Scripts > Run Script File...
 */

(function() {

    var comp = aeq.getActiveComp();
    if (!comp) {
        alert('Please select a composition.');
        return;
    }

    if (comp.numLayers === 0) {
        alert('Composition has no layers.');
        return;
    }

    aeq.createUndoGroup('Randomize Layer Order', function() {
        // Get all layers as arrayEx
        var layers = aeq('layer', comp);

        // Fisher-Yates shuffle using arrayEx
        var shuffled = [];
        var indices = [];

        // Build index array
        layers.forEach(function(layer, i) {
            indices.push(i);
        });

        // Shuffle indices
        for (var i = indices.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = indices[i];
            indices[i] = indices[j];
            indices[j] = temp;
        }

        // Reorder layers by moving to beginning in reverse shuffle order
        for (var k = indices.length - 1; k >= 0; k--) {
            layers[indices[k]].moveToBeginning();
        }
    });

})();
