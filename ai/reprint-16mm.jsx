// MAKE SURE TO USE V3 TEMPLATE!!!
//vertical 8.5 x 11
//1600x1080
var rows = 30,
    columns = 10,
    start_left = 30,
    start_top = 52,
    item_width = 29.5,
    item_height = 21.6291,
    item_board_count = rows*columns,
    ab_w = 612,
    ab_h = 792,
    space_x = 24,
    direction = "YthenX",
    start_count = 1; //for text output only

var dlg = new Window( "dialog", "Reprint Settings" );
    
    dlg.alertBtnsPnl = dlg.add( "panel", undefined, "Frames per column" );
    dlg.alertBtnsPnl.alignment = "left";
    dlg.alertBtnsPnl.width = 450;
    // dlg.alertBtnsPnl.perf4 = dlg.alertBtnsPnl.add( "radiobutton", undefined, "4 perf" );
    dlg.alertBtnsPnl.frameCount = dlg.alertBtnsPnl.add ("edittext", undefined, rows.toString());
    dlg.alertBtnsPnl.frameCount.characters = 10;
    dlg.alertBtnsPnl2 = dlg.add("panel", undefined, "Frame Settings")
    dlg.alertBtnsPnl2.orientation = "row";
    dlg.alertBtnsPnl2.alignment = "left";
    dlg.alertBtnsPnl2.width = 450;
    dlg.alertBtnsPnl.r16 = dlg.alertBtnsPnl2.add( "radiobutton", undefined, "Regular 16" );
    dlg.alertBtnsPnl.s16 = dlg.alertBtnsPnl2.add( "radiobutton", undefined, "Super 16" );
    dlg.alertBtnsPnl.r16.value = true;

    dlg.alertBtnsPnl3 = dlg.add("panel", undefined, "Stretch Settings")
    dlg.alertBtnsPnl3.orientation = "row";
    dlg.alertBtnsPnl3.alignment = "left";
    dlg.alertBtnsPnl3.width = 450;
    dlg.alertBtnsPnl.stretch = dlg.alertBtnsPnl3.add( "radiobutton", undefined, "Stretch" );
    dlg.alertBtnsPnl.pad= dlg.alertBtnsPnl3.add( "radiobutton", undefined, "Pad" );
    dlg.alertBtnsPnl.stretch.value = true;

    dlg.alertBtnsPnl.okBtn = dlg.add( "button", undefined, "OK", { name: "ok" } );
    dlg.show();

rows = parseInt(dlg.alertBtnsPnl.frameCount.text)

// alert(dlg.alertBtnsPnl.frameCount.text)

if (dlg.alertBtnsPnl.r16.value) {
    item_width = 29.5,
    item_board_count = rows*columns
} else if (dlg.alertBtnsPnl.s16.value) {
    item_width = 37.500,
    space_x = 16,
    item_board_count = rows*columns
}

if (dlg.alertBtnsPnl.stretch.value) {
    stretchtype = "stretch"
} else if(dlg.alertBtnsPnl.pad.value) {
    stretchtype = "pad"
}

// var debug = true;
// doc = app.activeDocument;
var MAX_DIM = 16344;
var img_folder = Folder.selectDialog("Select Image Folder"),
    images = img_folder.getFiles("*.png"),
    //calculate how many artboards are needed
    board_count = Math.ceil(images.length/item_board_count),
    ab_cols = Math.floor(MAX_DIM/ab_w);
    ab_rows = Math.floor(MAX_DIM/ab_h);
    boards_per = ab_cols*ab_rows;

var new_doc = app.documents.add(DocumentColorSpace.RGB,ab_w,ab_h,board_count,DocumentArtboardLayout.GridByRow,0,ab_rows); 

var flip = app.getScaleMatrix(-100,100);
i = 0
ii = (images.length-1);
ab_index = 0;

while (i < images.length) {
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
        

        if(stretchtype == "pad") {
            // generate correct height based in input dimensions
            new_height = itemToPlace.height/(itemToPlace.width/item_width)
            itemToPlace.top = t - ((item_height-new_height)/2);
            itemToPlace.left = l;
            
            
            itemToPlace.width = item_width; //flips left to right 
            itemToPlace.height = new_height;
        } else {
            itemToPlace.top = t;
            itemToPlace.left = l;
            itemToPlace.width = item_width; //flips left to right 
            itemToPlace.height = item_height;
        }
        itemToPlace.transform(flip);
        itemToPlace.rotate(180)

    i++;
    ii--;

    // some debug shit
    // alert(images[i].path + "/" + images[i].name)
    // var text = new_doc.layers[0].textFrames.add();
    // text.contents = images[i].path;
    // text.position = [0,i*-10];
    
}

