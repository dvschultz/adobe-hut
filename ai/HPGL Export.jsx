﻿#target illustrator
/* WORK IN PROGRESS */
/*Purpose: Converts an Adobe Illustrator Vector File to HPGL language*/
#include "../js/indexof.jsx";

/*Settings*/
var COORDINATETYPE = "BOTTOMLEFT", // "BOTTOMLEFT" or  "CENTER"
    INCLUDELABEL = false, // will include the filename on your plot
    force = 8;
    speed = 10,
    WILDSTYLE = false, //wildstyle will assign a random pen color to each shape    
    checkColors = false,
    penOptions = 1, //total number of pens your plotter supports
    splitFile = false,
    checkForCircles = false,
    checkForRects = false,
    checkDupePoints = false,
    POLYGONMODE = false,
    fillMode = "default", //color, random, default
    defaultFillType = "",
    fillOptions = fillOptions = ["FT3,45,90;","FT3,45,0;","FT3,45,45;","FT3,45,90;"],
    colors = ["red","green","blue","black"],
    minSize = 0;
    
//~     fillOptions = fillOptions = ["FT4,45,45;","FT3,60,135;","FT4,60,90;","FT3,60,90;","FT3,60,135;", "FT3,45,90;","FT3,75,45;"],
//~     colors = ["black","red","green","blue","cyan","magenta","yellow"];
    
    
    

/* Don’t alter below this line! */
var doc,shape,docH,yReset,xReset,pen,currPt,lastPt,
    hpglCom = "IN;FS" + force + ";VS" + speed + ";", // buffer to stick output before writing to file
    HPGLfile;
if(!INCLUDELABEL) {
    app.executeMenuCommand('selectall'); 
    app.executeMenuCommand('outline');
}
    
if (WILDSTYLE || checkColors) {
    var penStrings = new Array(penOptions);
    //instantiate each array to skip those annoying `undefined`s
    for(var s = 0; s < penStrings.length; s++) {
        penStrings[s] = "";
    }
} else {
    hpglCom += "SP1;";
}

if ( app.documents.length > 0 ) {
    doc = app.activeDocument;
    docH = Math.abs(doc.artboards[0].artboardRect[1] - doc.artboards[0].artboardRect[3])
    
    if(COORDINATETYPE == "BOTTOMLEFT") {
        xReset = 0;
        yReset = docH;
        // $.writeln(docH);
    } else {
        xReset = -1 * Math.abs( (doc.artboards[0].artboardRect[0] - doc.artboards[0].artboardRect[2])/2) ;
        yReset = -1 * Math.abs( (doc.artboards[0].artboardRect[1] - doc.artboards[0].artboardRect[3])/2  ) + docH;
    }
    
    app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;
    main();
}

function main() {
    // $.writeln('total paths:' + doc.pathItems.length);
    // $.writeln('total compound paths: ' + doc.compoundPathItems.length);
    
    if( POLYGONMODE && (doc.compoundPathItems.length > 0) ) {
        for (var c = doc.compoundPathItems.length - 1; c >= 0; c--) {
            compoundShape = doc.compoundPathItems[c];
            
            if (WILDSTYLE) {
                penStrings[pen] += returnCompoundPolygon(compoundShape);
            } else if(checkColors) {
                var penNum = getPenNum(compoundShape);
                if(fillMode == "color") {
                    penStrings[penNum] += fillOptions[penNum];
                }
                penStrings[penNum] += returnCompoundPolygon(compoundShape);
            } else if(fillMode == "color") {
                var num = getPenNum(compoundShape);
                 hpglCom += fillOptions[num];
                 hpglCom += returnCompoundPolygon(compoundShape);
            } else {
                hpglCom += returnCompoundPolygon(compoundShape);
            }
        
        }
    }
    
    // now process all non-compound paths
    for (var i = doc.pathItems.length - 1; i >= 0; i--) {
        // $.writeln('processing path:' + i);
        shape = doc.pathItems[i];

        if( (shape.parent.typename == "CompoundPathItem") && POLYGONMODE ) {
//~             $.writeln("skipping part of compound path: path " + i);
            continue;
        }
        if (shape.height < minSize && shape.width < minSize) {
//~             $.writeln("skipping tiny path: path " + i);
            continue;
        }
        
        if (shape.guides || shape.clipping) continue; // ignore clipping masks and guides
        if (WILDSTYLE) pen = getRandomPen();
        
        if(shape.closed) {
            if (WILDSTYLE) {
                penStrings[pen] += returnClosedPathHPGL(shape);
            } else if(checkColors) {
                var penNum = getPenNum(shape);
                if(fillMode == "color") penStrings[penNum] += fillOptions[penNum];
                penStrings[penNum] += returnClosedPathHPGL(shape);
            } else if(fillMode == "color") {
                var num = getPenNum(shape);
                 hpglCom += fillOptions[num];
                 hpglCom += returnClosedPathHPGL(shape);
            } else {
                hpglCom += returnClosedPathHPGL(shape);
            }
        } else {
            if (WILDSTYLE) {
                penStrings[pen] += returnPathHPGL(shape);
            } else if(checkColors) {
                var penNum = getPenNum(shape);
                if (penNum == -1) penNum = 0; // failsafe for colors that don’t exist in colors[]
                if (fillMode == "color") penStrings[penNum] += fillOptions[penNum];
                penStrings[penNum] += returnClosedPathHPGL(shape);
            } else if(fillMode == "color") {
                var num = getPenNum(shape);
//~                     $.writeln(num);
//~                 $.writeln(fillOptions[num]);
                 hpglCom += fillOptions[num];
                 hpglCom += returnClosedPathHPGL(shape);
            } else {
                hpglCom += returnPathHPGL(shape);
            }
        }
    }
    writeFile();
}

function writeFile() {
    var hpgl2,
        docFile = File(doc.fullName);

        // $.writeln(doc.fullName);
    
    if (splitFile){
        for(var s = 0; s < penStrings.length; s++) {
            hpgl2 = hpglCom;
            hpgl2 += "SP1;";
            hpgl2 += penStrings[s];
            HPGLfile = File(docFile.path + "/" + docFile.displayName + "-colors-" + (s+1) +".hpgl");
            HPGLfile.open("w");
            HPGLfile.write( hpgl2 );
            HPGLfile.close();
        }
        return true;
    }

    if(WILDSTYLE || checkColors) {
        for(var s = 0; s < penStrings.length; s++) {
            if(penStrings[s].length > 0) {
                hpglCom+="SP" + (s+1) + ";";
                hpglCom += penStrings[s];
            }
        }
    }

    if(INCLUDELABEL) hpglCom += returnLabel();
    hpglCom+="PU;" // include PU as last line to avoid pen bleed
    
    if (WILDSTYLE) {
        HPGLfile = File(docFile.path + "/" + docFile.displayName + "-wildstyle.hpgl");
    } else if (checkColors) {
        HPGLfile = File(docFile.path + "/" + docFile.displayName + "-colors.hpgl");
    } else {
        HPGLfile = File(docFile.path + "/" + docFile.displayName + ".hpgl");
    }
    HPGLfile.open("w");
    HPGLfile.write( hpglCom );
    HPGLfile.close();
}

/*  this needs work still */
function returnLabel() {
    var docFile = File(doc.fullName),
        labelName = docFile.displayName.replace(".ai","");
    // if your file name contains a $ its going to cause problems. sorry!
    var temp = "DT$;\n";
    temp += "PA0,10;SL;LB" + labelName + "$\n";
    return temp;
}

function returnClosedPathHPGL(shape) {
    var temp = "";
    //~     var temp = "PU;";
    if (checkForRects && isRect(shape)) {
        var r1x = hpglUnit(shape.pathPoints[0].anchor[0] + xReset),
            r1y = hpglUnit(shape.pathPoints[0].anchor[1] + yReset),
            r2x = hpglUnit(shape.pathPoints[2].anchor[0] + xReset),
            r2y = hpglUnit(shape.pathPoints[2].anchor[1] + yReset);
 
        if (shape.filled && shape.fillColor.gray != 0) {
            if (WILDSTYLE) {
                temp += getRandomFT();
            } else {
                temp += defaultFillType;
            }
            temp += "PA" + r1x + "," + r1y + ";";
            temp += "RA" + r2x + "," + r2y + ";";
        }
        if (shape.stroked && shape.strokeColor.gray != 0) {
            temp += "PA" + r1x + "," + r1y + ";";
            temp += "EA" + r2x + "," + r2y + ";";
        }
    } else if ( checkForCircles && isCircle(shape) ) {
        var c1x = hpglUnit(shape.pathPoints[0].anchor[0] + xReset),
            c1y = hpglUnit(shape.pathPoints[0].anchor[1] + yReset),
            c2x = hpglUnit(shape.pathPoints[2].anchor[0] + xReset),
            c2y = hpglUnit(shape.pathPoints[2].anchor[1] + yReset),
            cx = (c1x+c2x)/2,
            cy = (c1y+c2y)/2,
            r = calcPathDist(cx, cy, c2x, c2y);
            
        if (shape.filled && shape.fillColor.gray != 0) {
            if (WILDSTYLE) {
                temp += getRandomFT();
            } else {
                temp += defaultFillType;
            }
            temp += "PA" + cx + "," + cy +";"; //center point
            temp += "WG" + r + ",0,360;"
            temp += "PU;";
        }
        if (shape.stroked && shape.strokeColor.gray != 0) {
            temp += "PA" + cx + "," + cy +";"; //center point
            temp += "CI" + r +";"; // radius
            temp += "PU;";
        }
        
    } else {
        if(POLYGONMODE) {
            temp += returnPolygon(shape);
        } else {
            temp += returnPathHPGL(shape);
        }
    }
    return temp;
}

function isCircle(shape) {
    var is4 = (shape.pathPoints.length == 4);
    if (!is4) {
        return false;
    } else {
        var t1 = shape.pathPoints[0].pointType == PointType.SMOOTH,
               t2 = shape.pathPoints[0].pointType == PointType.SMOOTH,
               t3 = shape.pathPoints[0].pointType == PointType.SMOOTH,
               t4 = shape.pathPoints[0].pointType == PointType.SMOOTH;
         return (t1 == t2 == t3 == t4 == true );
    }
    // $.writeln('possible error');
    return false;
}

function isRect(shape) {
    /* wow this is a stupid amount of code...maybe not worth it? */
    var is4 = (shape.pathPoints.length == 4);
    if (!is4) {
        return false;
    } else if(shape.pathPoints[0].pointType == PointType.SMOOTH || shape.pathPoints[1].pointType == PointType.SMOOTH || shape.pathPoints[2].pointType == PointType.SMOOTH || shape.pathPoints[3].pointType == PointType.SMOOTH ){
        return false;
    } else {
        var a1 = calcAngle(shape.pathPoints[0].anchor, shape.pathPoints[1].anchor),
            a2 = calcAngle(shape.pathPoints[1].anchor, shape.pathPoints[2].anchor), 
            a3 = calcAngle(shape.pathPoints[2].anchor, shape.pathPoints[3].anchor), 
            a4 = calcAngle(shape.pathPoints[3].anchor, shape.pathPoints[0].anchor);
//~         $.writeln(a2);
//~         $.writeln(a3);
//~         $.writeln(a4);
//~         $.writeln((a1 == 180 && a2 == 90 && a3 == 0 && a4 == -90) || 
//~         (a1 == 0 && a2 == -90 && a3 == 180 && a4 == 90) || (a1 == 0 && a2 == 90 && a3 == 180 && a4 == -90) ||
//~         (a1 == 180 && a2 == -90 && a3 == 0 && a4 == 90) || (a1 == -90 && a2 == 180 && a3 == 90 && a4 == 0));
        return ((a1 == 180 && a2 == 90 && a3 == 0 && a4 == -90) || 
        (a1 == 0 && a2 == -90 && a3 == 180 && a4 == 90) || (a1 == 0 && a2 == 90 && a3 == 180 && a4 == -90) ||
        (a1 == 180 && a2 == -90 && a3 == 0 && a4 == 90) || (a1 == -90 && a2 == 180 && a3 == 90 && a4 == 0) );
    }
    // $.writeln('possible error');
    return false;
}

function returnPathHPGL(shape) {
    var temp = "PU";

    //this covers a simple point
    if (shape.pathPoints.length == 1) {
//~         $.writeln('only one point');
        currPt = {'x':hpglUnit(shape.pathPoints[0].anchor[0] + xReset),'y':hpglUnit(shape.pathPoints[0].anchor[1] + yReset)};
        temp+= currPt.x + ',' + currPt.y;
        temp += ";PD";
    }
    
    else {
        for (var p= 0; p < shape.pathPoints.length; p++) {
            currPt = {'x':hpglUnit(shape.pathPoints[p].anchor[0] + xReset),'y':hpglUnit(shape.pathPoints[p].anchor[1] + yReset)};
            if (p == 1) temp += "PD";

        
            if(checkDupePoints) {
                if (p >= 1) {
                    if (equalPoints(currPt,lastPt)) {
                        continue;
                    } else {
                        temp+= currPt.x + ',' + currPt.y;
                        lastPt = currPt;
                    }
                } else {
                    temp+= currPt.x + ',' + currPt.y;
                    lastPt = currPt;
                }
            } else {
                temp+= currPt.x + ',' + currPt.y;
                }
            
            if (p == 0) {
                temp+= ";";
            } else if( p!= shape.pathPoints.length-1) {
                temp+= ",";
            }
            
        }
        
        // if the shape is closed we need to pass it the last point again
        if(shape.closed) {
            temp+= ",";
            temp+=  hpglUnit(shape.pathPoints[0].anchor[0] + xReset);  
            temp+= ",";
            temp+= hpglUnit(shape.pathPoints[0].anchor[1] + yReset);
        }
    }
    temp += ";"
    temp += "PU;";
    return temp;
}

function equalPoints(currPt,lastPt){
    if(!checkDupePoints) return true;
//~     $.writeln("currPt: " + currPt.x + "," + currPt.y);
//~     $.writeln("lastPt: " + lastPt.x + "," + lastPt.y);
    if(typeof lastPt.x != undefined && typeof currPt.x != undefined) {
        var x = lastPt.x-1 <= currPt.x && currPt.x <= lastPt.x+1;
        var y = lastPt.y-1 <= currPt.y && currPt.y <= lastPt.y+1;
    }
//~     $.writeln("x:" + x);
//~     $.writeln("y:" + x);
    return x && y;
}

function returnPolygon(shape) {
    var temp = "GM18504,0,0,3000,3072;PA";
//~     $.writeln('total points in shape:' + shape.pathPoints.length);

    //move to first position
    temp+=  hpglUnit(shape.pathPoints[0].anchor[0] + xReset);  
    temp+= ",";
    temp+= hpglUnit(shape.pathPoints[0].anchor[1] + yReset);
    temp+= ",";
    
    temp += "PM0;PD";
    
    for (var p= 1; p < shape.pathPoints.length; p++) {
        temp+=  hpglUnit(shape.pathPoints[p].anchor[0] + xReset);  
        temp+= ",";
        temp+= hpglUnit(shape.pathPoints[p].anchor[1] + yReset);
        temp+= ",";
    }

    // add last point to polygon
    temp+=  hpglUnit(shape.pathPoints[0].anchor[0] + xReset);  
    temp+= ",";
    temp+= hpglUnit(shape.pathPoints[0].anchor[1] + yReset);
    temp+= ";";  
    
    temp += "PM2;";
    
    //check for fillTypes
    if(fillMode == "random") {
        var randFill = Math.floor( Math.random() * fillOptions.length );
        temp += fillOptions[randFill];
    } else if(fillMode == "default") {
        temp += defaultFillType;
    }
    temp += "EP;FP;";
    temp += "GM3072,0,0,3000,18504;";
    return temp;
}

function returnCompoundPolygon(compoundShape) {
    var temp = "GM18504,0,0,3000,3072;";
//~     $.writeln('total paths that are part of shape: ' +  compoundShape.pathItems.length);

    for(var s = 0; s < compoundShape.pathItems.length; s++ ) {
        if (s != 0) temp += "PM1;";
        //start with a PU;
        temp += "PU;";
        
        var shape = compoundShape.pathItems[s];
        //move absolutely to first position
        temp+=  "PA" + hpglUnit(shape.pathPoints[0].anchor[0] + xReset);  
        temp+= ",";
        temp+= hpglUnit(shape.pathPoints[0].anchor[1] + yReset);
        temp+= ",";
        
        //now start drawing polygon
        if (s == 0) temp += "PM0;";
        
        temp += "PD";
        //loop thru path points
        for (var p= 1; p < shape.pathPoints.length; p++) {
            temp+=  hpglUnit(shape.pathPoints[p].anchor[0] + xReset);  
            temp+= ",";
            temp+= hpglUnit(shape.pathPoints[p].anchor[1] + yReset);
            temp+= ",";
        }

        // add last point to polygon
        temp+=  hpglUnit(shape.pathPoints[0].anchor[0] + xReset);  
        temp+= ",";
        temp+= hpglUnit(shape.pathPoints[0].anchor[1] + yReset);
        temp+= ";";  
        
    }

    //close polygons
    temp += "PM2;";
    
    //check for fillTypes: random or default
    if(fillMode == "random") {
        var randFill = Math.floor( Math.random() * fillOptions.length );
        temp += fillOptions[randFill];
    } else if(fillMode == "default") {
        temp += defaultFillType;
    }
    //fill and outline shape
    temp += "EP;FP;";
    //reset internal bufffer
    temp += "GM3072,0,0,3000,18504;";
    
    return temp;
}

function hpglUnit(ptUnit) {
    return Math.round( (ptUnit.toFixed(2)/72)*1016 );
}

/*  not necessary with `app.coordinateSystem = CoordinateSystem.ARTBOARDCOORDINATESYSTEM;` but will leave here  */
function convertPoint(item) {
        return doc.convertCoordinate(item,CoordinateSystem.DOCUMENTCOORDINATESYSTEM, CoordinateSystem.ARTBOARDCOORDINATESYSTEM);
}

function getRandomPenSP() {
    var pen = Math.ceil(Math.random()*penOptions);
    return "SP"+pen+";";
}

function getRandomPen() {
    return Math.floor(Math.random()*penOptions);
}

function getPenNum(shape) {
    var index;
    
    if(typeof shape.strokeColor != "undefined") {
        return colors.indexOf(returnColor(shape.strokeColor));
    } else {
        // it might be a compound path, so check if the individual path has a color
        if(shape.pathItems.length > 0) {
            index = colors.indexOf(returnColor(shape.pathItems[0].strokeColor));
            return (index == -1) ? 0 : index;
        } else {
            // $.writeln("error?");
            //otherwise let’s just guess its the first pen color
            return 0;
        }
    }
}

function getRandomFT() {
    var temp = "FT",
        number = Math.ceil(Math.random()*4),
        spacing, angle;
    if (number < 2) {
        spacing = Math.ceil(Math.random()*10);
        angle = Math.round(Math.random()*90);
        temp += (number + "," + spacing + "," + angle + ";");
    } else {
        temp += (number + ";");
    }
    return temp;
}

function calcAngle (p1,p2) {
    var angleDeg = Math.atan2(p2[1].toFixed(2) - p1[1].toFixed(2), p2[0].toFixed(2) - p1[0].toFixed(2)) * 180 / Math.PI;
    return angleDeg;
}

function calcPathDist (x1,y1,x2,y2) {
    var dist = Math.sqrt( Math.pow ((x2 - x1), 2) + Math.pow ((y2 - y1), 2) );
    return dist;
}




function returnColor(c) {
    if(typeof c == "undefined") return "black";
//~     $.writeln(c.toString());
//~     $.writeln("red: " + c.red);
//~     $.writeln("green: " + c.green);
//~     $.writeln("blue: " + c.blue);
    
    if(c.red == 0 && c.green == 0 && c.blue == 0){
        return "black";
    }
    if(c.red == 255 && c.green == 0 && c.blue == 0){
        return "red";
    }
    if(c.red == 0 && c.green == 255 && c.blue == 0){
        return "green";
    }
    if(c.red == 0 && c.green == 0 && c.blue == 255){
        return "blue";
    }
    if(c.red == 255 && c.green == 255 && c.blue == 0){
        return "yellow";
    }
    if(c.red == 255 && c.green == 0 && c.blue == 255){
        return "magenta";
    }
    if(c.red == 0 && c.green == 255 && c.blue == 255){
        return "cyan";
    }

    return "black";
}









