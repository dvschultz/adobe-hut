﻿// Creates a new document with an RGB color space//add(documentColorSpace, width, height, numArtBoards, artboardLayout, artboardSpacing, artboardRowsOrCols)//width and height are in pts by default//DocumentArtboardLayout has the options of //DocumentArtboardLayout.GridByRow, DocumentArtboardLayout.RLGridByRow, DocumentArtboardLayout.GridByCol, //DocumentArtboardLayout.RLGridByCol, DocumentArtboardLayout.Row, DocumentArtboardLayout.RLRow, DocumentArtboardLayout.Column//DocumentArtboardLayout.GridByRow example//creates a grid from left-to-right, then top-to-bottom numArtBoards/ artboardRowsOrCols//app.documents.add( DocumentColorSpace.RGB,1024,1024,9, DocumentArtboardLayout.GridByRow,30,3);//DocumentArtboardLayout.RLGridByRow example//creates a grid from right-to-left, then top-to-bottom numArtBoards/ artboardRowsOrCols//app.documents.add( DocumentColorSpace.RGB,1024,1024,9, DocumentArtboardLayout.RLGridByRow,30,3);//DocumentArtboardLayout.GridByCol example//creates a grid from top-to-bottom , then left-to-right numArtBoards/ artboardRowsOrCols//app.documents.add( DocumentColorSpace.RGB,1024,1024,9,DocumentArtboardLayout.GridByCol,30,3);//DocumentArtboardLayout.RLGridByCol example//creates a grid from top-to-bottom , then right-to-left numArtBoards/ artboardRowsOrCols//app.documents.add( DocumentColorSpace.RGB,1024,1024,9,DocumentArtboardLayout.RLGridByCol,30,3);//DocumentArtboardLayout.Row example//creates a row from left-to-right numArtBoards// artboardRowsOrCols is ignoredapp.documents.add( DocumentColorSpace.RGB,1024,1024,9,DocumentArtboardLayout.Row,30,3);//DocumentArtboardLayout.RLRow example//creates a row from right-to-left numArtBoards// artboardRowsOrCols is ignoredapp.documents.add( DocumentColorSpace.RGB,1024,1024,9,DocumentArtboardLayout.RLRow,30,3);//DocumentArtboardLayout.Column example//creates a row from ltop-to-bottom numArtBoards// artboardRowsOrCols is ignoredapp.documents.add( DocumentColorSpace.RGB,1024,1024,9,DocumentArtboardLayout.Column,30,3);