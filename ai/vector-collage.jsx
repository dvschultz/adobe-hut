//@target Illustrator
// INSTRUCTIONS
// Only have a single document open when running this
var board_count = 50;
var how_many = 3; //elements per artboard
var transforms = true;
var debug = false;


var ps = [];
var doc = app.activeDocument;
start_fn = doc.name;

//max artboard size: 16344x16344
var MAX_DIM = 16344;
// set coordinate system to artboard-based
// app.CoordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM

// STEP 1: GET ARTBOARD DIMENSIONS
var artRect = doc.artboards[0].artboardRect;
ab_h = Math.abs(artRect[3]-artRect[1]);
ab_w = Math.abs(artRect[2]-artRect[0]);
ab_cols = Math.floor(MAX_DIM/ab_w);
ab_rows = Math.floor(MAX_DIM/ab_h);
boards_per = ab_cols*ab_rows;

//doc.artboards.add([0, 0, 1024, -1024]);

if(debug){
    $.writeln('left: ',artRect[0])
    $.writeln('top: ',artRect[1])
    $.writeln('right: ',artRect[2])
    $.writeln('bottom: ',artRect[3])
    $.writeln('height: ',ab_h)
    $.writeln('width: ',ab_w)
}

// STEP 2: MAKE ARTBOARDS
ogDoc = app.documents.getByName(start_fn);
var newDoc = [];
if(board_count < boards_per) {
    newDoc.push(app.documents.add( DocumentColorSpace.RGB,ab_h,ab_w,board_count,DocumentArtboardLayout.GridByRow,0,ab_rows));
} else {
    for(var b = 0; b < board_count; b+=boards_per){
        //TODO: Handle remainders
        if ((b+boards_per) < board_count) {
            newDoc.push(app.documents.add( DocumentColorSpace.RGB,ab_h,ab_w,boards_per,DocumentArtboardLayout.GridByRow,0,ab_rows));
        } else {
            var remainder = board_count - b;
            newDoc.push(app.documents.add( DocumentColorSpace.RGB,ab_h,ab_w,remainder,DocumentArtboardLayout.GridByRow,0,ab_rows));
        }
         
    }
}

// STEP 3: GET ART
ogDoc.activate();
for(var i =0; i < ogDoc.artboards.length; i++){
    ab = ogDoc.artboards[i];
    ogDoc.artboards.setActiveArtboardIndex(i);
    ogDoc.selectObjectsOnActiveArtboard();

    for(var s=0; s < ogDoc.selection.length;s++){
        duped = ogDoc.selection[s].duplicate(doc,ElementPlacement.PLACEATEND);
        duped.top -= ab.artboardRect[1];
        duped.left -= ab.artboardRect[0];
        ps.push(duped);
        duped.selected = false;
    }
}

// STEP 4: ADD ART

abc = 0;
while(abc < board_count) {
    //TODO: work with multiple artboards
    doc_num = Math.floor(abc/boards_per);
    currDoc = newDoc[doc_num];
    currDoc.activate();
    currAbc = abc % boards_per;
    abr = currDoc.artboards[currAbc].artboardRect;

    i = 0;
    while (i < how_many) {
        randP = Math.floor(Math.random()*ps.length);
        rp = ps[randP];
        thisP = rp.duplicate(currDoc,ElementPlacement.PLACEATEND);

        //motherfucker! when you use the duplicate method it loses the x/y position. reset it by passing the top/left from parent path
        thisP.top =  rp.top + abr[1];
        thisP.left =  rp.left + abr[0];

        //do crazy transforms
        if (transforms){
            if(thisP.typename == "PathItem") {
                thisP.fillColor = makeColor(
                    Math.random()*255,
                    Math.random()*255,
                    Math.random()*255
                );
            }
            thisP.rotate(Math.random()*360);
            scale = Math.random()*2;
            scaleCenter(thisP,scale);
        }

        ++i;
    }

    ++abc;
}

// STEP 5: CLEAN UP
for (var i = ps.length-1; i >= 0; i--) {
    ps[i].remove();
}

function makeColor(r,g,b){
    var c = new RGBColor();
    c.red   = r;
    c.green = g;
    c.blue  = b;
    return c;
}

function scaleCenter(path, scale) {
    width_new = Math.abs(path.width * scale);
    height_new = Math.abs(path.height * scale);
    path.top -= (path.height - height_new)/2;
    path.left += (path.width - width_new)/2;
    path.height = height_new;
    path.width = width_new;
}