﻿#target Illustrator// Number all selected itemsgroupObj = true; //set this to true if you want to group path and number;doc = app.activeDocument;var b = new RGBColor;b.red = 255;b.blue = 0;b.green = 0;var charStyle = doc.characterStyles.add("NumberLabel");var charAttr = charStyle.characterAttributes;charAttr.size = 6;charAttr.fillColor = b;if ( app.documents.length > 0 && app.activeDocument.pathItems.length > 0 ) {    $.writeln(doc.pathItems.length);    for (var i = 0; i < doc.pathItems.length; i++ ) {        pathRef = doc.pathItems[i];        //~         $.writeln(pathRef.typename);                if (pathRef.typename == "PathItem" && pathRef.selected) {            var pointTextRef;                        if(groupObj) {                var newGroup = doc.groupItems.add();                pointTextRef = newGroup.textFrames.add();                pathRef.move(newGroup, ElementPlacement.PLACEATEND);            } else {                pointTextRef = doc.textFrames.add();            }                        pointTextRef.contents = i+1;            pointTextRef.top = pathRef.top - (pathRef.height/2);            pointTextRef.left = pathRef.left + (pathRef.width/2);            pointTextRef.selected = true;                    charStyle.applyTo(pointTextRef.textRange);                            }    }}redraw();