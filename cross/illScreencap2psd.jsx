﻿//this takes a screenshot in illustrator and opens it in Photoshop#target "illustrator"//~ var ill = BridgeTalk.getSpecifier( "illustrator")//~ BridgeTalk.target = ill;var screencap = new File("~/Desktop/ill-screencap.png");var currDoc = app.activeDocument;currDoc.imageCapture(screencap);if ( BridgeTalk.isRunning("photoshop") ) {    photoshop.open(screencap);} else {    BridgeTalk.launch("photoshop");    photoshop.open(screencap)}