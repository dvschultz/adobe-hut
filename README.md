adobe-hut
=========

A collection of ExtendScript utilities and automation scripts for Adobe Creative Suite applications.

## After Effects (`ae/`)

| Script | Description |
|--------|-------------|
| `edl_to_composition.jsx` | Converts CMX 3600 EDL files into compositions with properly timed video layers |
| `randomize-layers.jsx` | Randomizes the stacking order of layers in the active composition |
| `ae_video_extractor.js` | Extracts video filenames from all footage in a composition and saves to a text file |

## Illustrator (`ai/`)

### Utility Scripts

| Script | Description |
|--------|-------------|
| `reprint.jsx` | Contact sheet generator with multiple preset layouts for various paper sizes |
| `reprint-16mm.jsx` | Contact sheet layout for 16mm film frames (Regular/Super 16, stretch/pad options) |
| `reprint-35mm.jsx` | Contact sheet layout for 35mm film frames (4-perf, 3-perf configurations) |
| `vector-collage.jsx` | Creates artboards filled with random duplicates and transformations of selected elements |
| `glyph_grid_script.jsx` | Generates clustered grids of glyphs with configurable clustering methods |
| `foldgen.jsx` | Generates 3D paper fold templates (pyramids, tents, cubes, prisms) with fold marks |
| `foldgen_vday2017.jsx` | Extended foldgen with JSON config support for different fold types and modes |
| `HPGL Export.jsx` | Converts vector paths to HPGL format for plotter output |
| `multi-image-trace.jsx` | Applies image trace to all placed items using a preset |
| `circlePackingInception.jsx` | Circle packing algorithm to arrange grouped shapes without overlapping |

### Cleanup & Processing

| Script | Description |
|--------|-------------|
| `cleanupDivide.jsx` | Extracts and redraws lines, filtering by angle mode and minimum distance |
| `angleCleanup.jsx` | Removes paths where anchor points are at specific diagonal angles |
| `bb_sticker_cleanup.jsx` | Removes sticker masks and clipping paths, cleans up thin/black strokes |
| `removeDupePaths.jsx` | Removes duplicate paths with identical position and dimensions |
| `removeEveryOther.jsx` | Removes every other path in the document |
| `removeEveryOtherCompound.jsx` | Removes every other compound path |
| `combinePathsOfSameColors.jsx` | Combines all shapes with matching fill color using Pathfinder add |
| `pathfinder add-expand.jsx` | Groups shapes, applies Pathfinder add, then expands |
| `outlineFonts.jsx` | Converts all text to outlines and saves |

### Path & Color Tools

| Script | Description |
|--------|-------------|
| `Lotsa Anchors.jsx` | Adds multiple anchor points to selected paths |
| `Lotsa Anchors 2 Same Stroke Color.jsx` | Adds anchor points to shapes with matching stroke color |
| `scaleAllPaths.jsx` | Scales all paths uniformly from center point |
| `numberAllPaths.jsx` | Adds numbered text labels to all selected paths |
| `matchStrokeFill.jsx` | Sets stroke color to match fill color of each path |
| `roundColor.jsx` | Rounds RGB values to 0, 127, or 255 and matches stroke to fill |
| `duplicate-selection.jsx` | Duplicates selected objects to a new document |

### Line Generators

| Script | Description |
|--------|-------------|
| `cross.jsx` | Generates horizontal grid lines at specified intervals |
| `diag.jsx` | Generates diagonal lines based on aspect ratio |

### Stubs & Examples

| Script | Description |
|--------|-------------|
| `ai_artboards.jsx` | Examples of creating documents with various artboard grid layouts |
| `ai_document.jsx` | Basic document operations and layer access |
| `ai_file.jsx` | File properties access (URI, creation date, path) |
| `ai_fonts.jsx` | System font access and font property retrieval |
| `ai_shapes.jsx` | Creating basic shapes (rectangles, ellipses, polygons, stars) |
| `ai_textframes.jsx` | Creating area text, path text, and point text frames |
| `acidblot.jsx` | Document and document properties API patterns |
| `pathAnchors.jsx` | Logs anchor point coordinates of all paths |
| `pathItems.jsx` | Logs anchor point coordinates (same as pathAnchors) |
| `placedItem.jsx` | How to place an image file in a document |
| `fileWriter.jsx` | Writing file content to disk |
| `function_readCSV.jsx` | Reading and parsing CSV files |
| `write-file-test.js` | File writing with encoding and folder creation |

## Photoshop (`psd/`)

| Script | Description |
|--------|-------------|
| `batch_export.jsx` | Batch converts all PSDs in a folder to PNG with optional output folder |
| `collager.jsx` | Creates collages by randomly transforming layers from image folders |

## InDesign (`indd/`)

| Script | Description |
|--------|-------------|
| `AllThatsFitToJPEG.jsx` | Resizes pages to fit content and exports as PNG |
| `fitPageToItems.jsx` | Resizes pages to fit content (no export) |
| `sockets.jsx` | Fetches JSON via socket and populates text frames by label |
| `myDoc.jsx` | Example: get page count of active document |

## Premiere Pro (`pr/`)

| Script | Description |
|--------|-------------|
| `random-layers.jsx.js` | Randomizes clip order across tracks in a sequence |

## Cross-Application (`cross/`)

| Script | Description |
|--------|-------------|
| `illScreencap2psd.jsx` | Captures Illustrator screenshot and opens in Photoshop via BridgeTalk |

## Global Utilities (`global/`)

| Script | Description |
|--------|-------------|
| `bridgetalk.jsx` | BridgeTalk API examples for inter-app communication |

## Helpers (`helpers/`)

| Script | Description |
|--------|-------------|
| `math.jsx` | Degree to radian conversion |

## JavaScript Polyfills (`js/`)

| Script | Description |
|--------|-------------|
| `indexof.jsx` | Array.prototype.indexOf() polyfill for ES3 |
| `json2.js` | JSON.stringify() and JSON.parse() polyfill for ES3 |
