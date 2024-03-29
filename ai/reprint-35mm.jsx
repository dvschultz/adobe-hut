// MAKE SURE TO USE V3 TEMPLATE!!!
//4 perf
var rows = 12,
    columns = 4,
    // columns = 5,
    start_left = 60,
    start_top = 50,
    item_width = 71.2,
    item_height = 53.7, //4 perf
    item_board_count  = rows*columns,
    ab_w = 612,
    ab_h = 792,
    // ab_w = 648,
    // ab_h = 864,
    space_x = 50,
    direction = "YthenX",
    start_count = 1; //for text output only

//4 perf
// var rows = 34,
//     columns = 10,
//     start_left = 50,
//     start_top = 40,
//     item_width = 71.2,
//     item_height = 40.3, //4 perf
//     item_board_count = rows*columns,
//     ab_w = 612,
//     ab_h = 792,
//     space_x = 50,
//     direction = "YthenX",
//     start_count = 1; //for text output only

var dlg = new Window( "dialog", "Select Perf Type" );
    dlg.alertBtnsPnl = dlg.add( "panel", undefined, "Perf Type" );
    dlg.alertBtnsPnl.perf4 = dlg.alertBtnsPnl.add( "radiobutton", undefined, "4 perf" );
    dlg.alertBtnsPnl.perf3 = dlg.alertBtnsPnl.add( "radiobutton", undefined, "3 perf" );
    dlg.alertBtnsPnl.perf4.value = true;
    dlg.alertBtnsPnl.okBtn = dlg.alertBtnsPnl.add( "button", undefined, "OK", { name: "ok" } );
    dlg.show();

// var debug = true;
// doc = app.activeDocument;
var MAX_DIM = 16344;
var img_folder = Folder.selectDialog("Select Image Folder"),
    // images = img_folder.getFiles(/\.(jpg|png|tif)$/i),
    images = img_folder.getFiles("*.png"),
    //calculate how many artboards are needed
    board_count = Math.ceil(images.length/item_board_count),
    ab_cols = Math.floor(MAX_DIM/ab_w);
    ab_rows = Math.floor(MAX_DIM/ab_h);
    boards_per = ab_cols*ab_rows;

// alert("Perf 5?: " + dlg.alertBtnsPnl.perf5.value)
// alert("Perf 4?: " + dlg.alertBtnsPnl.perf4.value)

if (dlg.alertBtnsPnl.perf4.value) {
    // rows = 12
    // rows = 14
    // columns = 5
    item_height = 53.7
    item_board_count  = rows*columns
    board_count = Math.ceil(images.length/item_board_count)
} else if (dlg.alertBtnsPnl.perf3.value) {
    rows = 16
    columns = 4
    item_height = 40.2938
    item_board_count  = rows*columns
    board_count = Math.ceil(images.length/item_board_count)
}

var new_doc = app.documents.add(DocumentColorSpace.RGB,ab_w,ab_h,board_count,DocumentArtboardLayout.GridByRow,0,ab_rows); 

var flip = app.getScaleMatrix(-100,100);
i = 0
ii = (images.length-1);
ab_index = 0;

while (i < images.length) {
    // if (images[ii].name[0] != "."){
    // alert(images[ii].name[0])
        if(i % item_board_count == 0){
            //all coordinates must be relative to correct artboard, so grab top and left of artboard
            new_doc.artboards.setActiveArtboardIndex(ab_index);
            ab_top = new_doc.artboards[ab_index].artboardRect[1] * -1;
            ab_left = new_doc.artboards[ab_index].artboardRect[0];
            // alert(ab_top + "," + ab_left)

            // var text = new_doc.layers[0].textFrames.add();
            // text.contents = (ab_index + start_count).toString();
            // text.textRange.characterAttributes.size = 24;
            // // text.textRange.characterAttributes.textFont.style = "Bold";
            // text.position = [ab_left+20,-ab_top - 30];

            ab_index++;
        }

        if(direction=="YthenX") {
            //im at a loss for why I need to multiply this by -1; prob something to do with the insane illustrator coordinate system
            t =  -1 * ((ab_top+start_top) + (item_height * Math.floor(i%rows)));
            l = (ab_left+start_left) + ((item_width + space_x) * Math.floor((i % item_board_count)/rows) );
        } else {
            //im at a loss for why I need to multiply this by -1; prob something to do with the insane illustrator coordinate system
            t =  -1 * ((ab_top+start_top) + (item_height * Math.floor((i % item_board_count)/columns)));
            l = (ab_left+start_left) + (item_width * (i%columns));
        }
        
        

        var itemToPlace = new_doc.placedItems.add();
        itemToPlace.file = images[ii];   
        itemToPlace.layer = new_doc.currentLayer;
        itemToPlace.top = t;
        itemToPlace.left = l;
        itemToPlace.width = item_width; //flips left to right 
        itemToPlace.height = item_height;
        itemToPlace.transform(flip);
        itemToPlace.rotate(180)

    i++;
    ii--;
    // }

    // some debug shit
    // alert(images[i].path + "/" + images[i].name)
    // var text = new_doc.layers[0].textFrames.add();
    // text.contents = images[i].path;
    // text.position = [0,i*-10];
    
}

