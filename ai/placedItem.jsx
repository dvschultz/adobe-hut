if ( app.documents.length > 0) {
    var f = File.openDialog("Select Image"),
    doc = app.activeDocument;
    var placedItem = doc.placedItems.add();
    placedItem.file = new File(f);
}