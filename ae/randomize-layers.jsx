{
var myComp = app.project.activeItem;
var n = myComp.numLayers;
var myLayers = [];
var myIdx = [];
for (var i = 1; i<= n; i++){ myIdx[i-1] = i; myLayers[i-1] = myComp.layer(i); } var idx; var temp; for (var i = 0; i < myIdx.length; i++){ idx = i + Math.floor(Math.random()*(myIdx.length - i)); temp = myIdx[i]; myIdx[i] = myIdx[idx]; myIdx[idx] = temp; } for (var i = 0; i < myIdx.length; i++){ myLayers[myIdx[i]-1].moveToBeginning(); } 
}