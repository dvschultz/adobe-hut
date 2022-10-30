//vertical 8.5 x 11
//1600x1080
// var rows = 5,
//     columns = 2,
//     start_left = 100,
//     start_top = 69,
//     item_width = 192,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 576,
//     ab_h = 792,
//     start_count = 1; //for text output only

// horizontal 8.5 x 11
var rows = 5,
    columns = 4,
    start_left = 60,
    start_top = 30,
    item_width = 153.6,
    item_height = 83.52,
    item_board_count = rows*columns,
    ab_w = 792,
    ab_h = 612,
    start_count = 1; //for text output only

// horizontal 8.5 x11
// square 1080x1080
// var rows = 3,
//     columns = 5,
//     start_left = 71.6,
//     start_top = 93.2,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 792,
//     ab_h = 576,
//     start_count = 1; //for text output only

// horizontal 8 x 10.75
// square 1080x1080
// var rows = 4,
//     columns = 5,
//     start_left = 64.0,
//     start_top = 28.2,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 774,
//     ab_h = 576,
//     start_count = 1; //for text output only

// vertical 7x9
// square 1080x1080
// var rows = 4,
//     columns = 3,
//     start_left = 57.2,
//     start_top = 64.2,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 504,
//     ab_h = 648,
//     start_count = 1; //for text output only

// vertical 8.5x11
// square 1080x1080
// var rows = 5,
//     columns = 4,
//     start_left = 46.8,
//     start_top = 62,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 612,
//     ab_h = 792, //828
//     start_count = 1; //for text output only

// vertical 8.5x11
// Black Belly Tarantula
    // var rows = 5,
    // columns = 2,
    // start_left = 75.6,
    // start_top = 88.8,
    // item_width = 230.4, //230.4 1920
    // item_height = 120.96, //128.6 BBT
    // item_board_count = rows*columns,
    // ab_w = 612,
    // ab_h = 792, //828
    // start_count = 1; //for text output only

// vertical 11x8.5
// Vertigo
// var rows = 4,
// columns = 3,
// start_left = 75.6,
// start_top = 84.8,
// item_width = 230.4, //228.5 BBT
// item_height = 124.5, //128.6 BBT
// item_board_count = rows*columns,
// ab_w = 792,
// ab_h = 612, //828
// start_count = 1; //for text output only

// // vertical 8.5x11.5
// // square 1080x1080
//     var rows = 5,
//     columns = 4,
//     start_left = 46.8,
//     start_top = 62,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 612,
//     ab_h = 828, 
//     start_count = 1; //for text output only

// square 8.5x8.5
// square 1080x1080
// var rows = 4,
//     columns = 4,
//     start_left = 46,
//     start_top = 46,
//     item_width = 129.75,
//     item_height = 129.75,
//     item_board_count = rows*columns,
//     ab_w = 576,
//     ab_h = 576,
//     start_count = 1; //for text output only

// vertical 8.5 x11
// square 1080x1080
// var rows = 3,
//     columns = 5,
//     start_left = 71.6,
//     start_top = 93.2,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 576,
//     ab_h = 792,
//     start_count = 1; //for text output only

// vertical 8.5x12.5
// square 1080x1080
// var rows = 6,
//     columns = 4,
//     start_left = 46.25,
//     start_top = 50.5,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 612,
//     ab_h = 900,
//     start_count = 1; //for text output only

// vertical 8.5x11.75
// square 1080x1080
// var rows = 6,
//     columns = 4,
//     start_left = 46.25,
//     start_top = 36,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 612,
//     ab_h = 846,
//     start_count = 1; //for text output only

// vertical 4.5x7.5
// square 1080x1080
// var rows = 3,
//     columns = 2,
//     start_left = 32.5,
//     start_top = 75.8,
//     item_width = 129.6,
//     item_height = 129.6,
//     item_board_count = rows*columns,
//     ab_w = 324,
//     ab_h = 540,
//     start_count = 1; //for text output only

// var debug = true;
// doc = app.activeDocument;
var MAX_DIM = 16344;
var img_folder = Folder.selectDialog("Select Image Folder"),
    images = img_folder.getFiles(),
    //calculate how many artboards are needed
    board_count = Math.ceil(images.length/item_board_count),
    ab_cols = Math.floor(MAX_DIM/ab_w);
    ab_rows = Math.floor(MAX_DIM/ab_h);
    boards_per = ab_cols*ab_rows;

var new_doc = app.documents.add(DocumentColorSpace.RGB,ab_w,ab_h,board_count,DocumentArtboardLayout.GridByRow,0,ab_rows); 

i = 0;
ab_index = 0;
while (i < images.length) {
    if(i % item_board_count == 0){
        //all coordinates must be relative to correct artboard, so grab top and left of artboard
        new_doc.artboards.setActiveArtboardIndex(ab_index);
        ab_top = new_doc.artboards[ab_index].artboardRect[1] * -1;
        ab_left = new_doc.artboards[ab_index].artboardRect[0];
        // alert(ab_top + "," + ab_left)

        var text = new_doc.layers[0].textFrames.add();
        text.contents = (ab_index + start_count).toString();
        text.textRange.characterAttributes.size = 24;
        // text.textRange.characterAttributes.textFont.style = "Bold";
        text.position = [ab_left+20,-ab_top - 30];

        ab_index++;
    }

    //im at a loss for why I need to multiply this by -1; prob something to do with the insane illustrator coordinate system
    t =  -1 * ((ab_top+start_top) + (item_height * Math.floor((i % item_board_count)/columns)));
    l = (ab_left+start_left) + (item_width * (i%columns));

    var itemToPlace = new_doc.placedItems.add();
    itemToPlace.file = images[i];   
    itemToPlace.layer = new_doc.currentLayer;
    itemToPlace.top = t;
    itemToPlace.left = l;
    itemToPlace.width = item_width;
    itemToPlace.height = item_height;

    i++;

    // some debug shit
    // alert(images[i].path + "/" + images[i].name)
    // var text = new_doc.layers[0].textFrames.add();
    // text.contents = images[i].path;
    // text.position = [0,i*-10];
    
}

