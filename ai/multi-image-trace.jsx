var doc = app.activeDocument;
images = doc.placedItems

while (images.length > 0){
    var pluginItem = images[0].trace();
    pluginItem.tracing.tracingOptions.loadFromPreset('16mm');
    // app.redraw()
    pluginItem.tracing.expandTracing();
    i++;
}