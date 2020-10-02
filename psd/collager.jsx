//@target "photoshop"

var folder1 = Folder.selectDialog("Select Image Folder 1");
var folder2 = Folder.selectDialog("Select Image Folder 2");
var output = Folder.selectDialog("Select Output Folder");
var transforms = true;
var debug = false;

// Save file options
var options = new ExportOptionsSaveForWeb();
    options.format = SaveDocumentType.PNG;
    options.PNG8 = false;
    options.transparency = false;

if (folder1 != null && folder2 != null && output != null) {
    var files1 = folder1.getFiles();
    var files2 = folder2.getFiles();
    var f1, f2;

    for (var i = 0; i < files1.length; i++) {
        f1 = app.open(files1[i]);
        f1Doc = app.activeDocument;
        f1Name = f1Doc.name;
        if(debug) $.writeln(f1Name);
        //for (var j = 0; j < 1; j++) {

        for (var j = 0; j < files2.length; j++) {
            //open second file
            f2 = app.open(files2[j]);
            f2Name = app.activeDocument.name;
            //duplicate image to f1
            activeDocument.artLayers[0].duplicate(f1Doc,ElementPlacement.PLACEATEND)
            //close file, don’t save any changes
            app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

            //move back to f1Doc
            app.activeDocument = f1Doc;
            //performs transforms
            if(transforms){
                // https://community.adobe.com/t5/photoshop/the-command-transform-is-not-currently-available/td-p/10223905?page=1
                app.activeDocument.activeLayer = app.activeDocument.artLayers[0];
                var r = (Math.random()*10)-5;
                app.activeDocument.activeLayer.rotate(r)
            }
            //save file
            fName = f1Name.split('.')[0] + '-' + f2Name.split('.')[0];
            var exportedFile = new File(output + '/' +  fName +  ".png");
            app.activeDocument.exportDocument(exportedFile, ExportType.SAVEFORWEB, options);
            if(debug) $.writeln(fName+" processed.")
            //remove layer
            f1Doc.artLayers[0].remove();
        }

        f1.close(SaveOptions.DONOTSAVECHANGES);
    }


} else {
    alert("Please select two image folders and one output folder.")
}