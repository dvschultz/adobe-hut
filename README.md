adobe-hut
=========

A collection of ExtendScript utilities and automation scripts for Adobe Creative Suite applications.

## After Effects (`ae/`)

| Script | Description |
|--------|-------------|
| `edl_to_composition.jsx` | Converts CMX 3600 EDL files into compositions with properly timed video layers |
| `randomize-layers.jsx` | Randomizes the stacking order of layers in the active composition |
| `trim_and_resequence.jsx` | Trims frames from layer in/out points and resequences clips with no gaps |
| `ae_video_extractor.js` | Extracts video filenames from all footage in a composition and saves to a text file |

### AEQuery Versions

These scripts use the [AEQuery](https://github.com/docsforadobe/aequery) library for cleaner, more readable code. Requires `lib/aequery.js`.

| Script | Description |
|--------|-------------|
| `randomize-layers-aeq.jsx` | Randomizes layer order with undo support and readable code |
| `trim_and_resequence-aeq.jsx` | Trim and resequence with `aeq.ui` dialogs and selector filtering |
| `ae_video_extractor-aeq.jsx` | Extract video filenames using chained filter/map and `aeq.writeFile` |

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

## External Libraries (`lib/`)

| Library | Description |
|---------|-------------|
| `aequery.js` | [AEQuery](https://github.com/docsforadobe/aequery) - jQuery-like library for After Effects scripting with CSS selectors and extended arrays |

---

## Claude Code Agents & Skills (`.claude/`)

This repository includes specialized agents and skills for [Claude Code](https://claude.ai/code) that provide expert knowledge for Adobe ExtendScript development and After Effects workflows.

### What Are Agents & Skills?

- **Agents**: Specialized AI assistants with deep knowledge of specific domains. They're automatically invoked when relevant to your task.
- **Skills**: Focused reference documents and code snippets that Claude can use to help with specific tasks.

### Installation

To use these agents and skills with Claude Code:

1. **Copy the `.claude` folder** to your project root:
   ```bash
   cp -r .claude /path/to/your/project/
   ```

2. **Or copy to your home directory** for global access:
   ```bash
   cp -r .claude/agents ~/.claude/agents
   cp -r .claude/skills ~/.claude/skills
   ```

3. **Start Claude Code** in your project directory. The agents and skills will be automatically available.

### Available Agents

| Agent | Description |
|-------|-------------|
| `after-effects-scripter` | ExtendScript automation for After Effects. Covers the full AE object model, layer operations, keyframes, expressions, render queue, and text handling. |
| `aequery-expert` | AEQuery library for After Effects. jQuery-like CSS selectors, extended arrays, wrapper classes (Comp, Layer, Property, Key), UI building, file operations, and persistent settings. |
| `after-effects-expressions` | After Effects expression language reference. Global objects, property methods, interpolation, vector math, color conversion, and 3D. |
| `after-effects-sdk` | C++ SDK plugin development. Effect plugins, AEGPs, AEIOs, SmartFX, GPU rendering, and custom UI. |
| `extendscript-validator` | Validates ExtendScript code for ES3 compatibility. Catches modern JavaScript syntax that won't work in Adobe apps. |
| `photoshop-uxp-expert` | Photoshop UXP plugin development (v22.0+). Modern JavaScript API including executeAsModal, batchPlay, layers, documents, selections, imaging, and file storage. |
| `premiere-uxp-expert` | Premiere Pro UXP plugin development (v25.6+). Modern JavaScript API including projects, sequences, tracks, clips, markers, actions/transactions, and manifest configuration. |
| `indesign-uxp-expert` | InDesign UXP plugin/script development (v18.0+). Modern JavaScript API including documents, pages, text frames, stories, tables, styles, and manifest configuration. |

### Available Skills

#### After Effects Expressions

| Skill | Description |
|-------|-------------|
| `ae-expression-lib` | Expression snippets: wiggle, loop, time-based, property linking, noise, color |
| `ae-expression-reference` | Quick reference card for all expression functions |
| `ae-expression-3d` | 3D expressions: cameras, lights, space transforms, lookAt |
| `ae-expression-text` | Text expressions: counters, typewriter, dynamic styling |
| `ae-expression-debug` | Find expression errors, bake to keyframes, validate syntax |
| `ae-expression-link` | Property linking, controller setup, slider/color controls |

#### AEQuery Library

| Skill | Description |
|-------|-------------|
| `aeq-selectors` | CSS-like selector syntax for querying AE objects |
| `aeq-arrayex` | Extended array methods: forEach, map, filter, find, groupBy, attr |
| `aeq-wrappers` | Wrapper classes for Comp, Layer, Property, and Key objects |
| `aeq-ui` | ScriptUI building utilities: dialogs, panels, controls |
| `aeq-file-settings` | File operations and persistent settings storage |
| `aeq-project` | Project management: folders, imports, selections, render queue |

#### After Effects SDK (C++)

| Skill | Description |
|-------|-------------|
| `ae-sdk-effects` | Effect plugin development: entry points, parameters, rendering |
| `ae-sdk-aegp` | AEGP development: function suites, menu commands, project manipulation |
| `ae-sdk-smartfx` | SmartFX: 32-bit rendering, pre-render phase, GPU effects |
| `ae-sdk-reference` | Quick reference for SDK types, macros, and patterns |

#### After Effects Scripting

| Skill | Description |
|-------|-------------|
| `ae-layer-ops` | Layer operations: creation, duplication, parenting, track mattes |
| `ae-properties` | Property access, keyframes, expressions via scripting |
| `ae-text-style` | Text layer styling: fonts, colors, paragraph settings |
| `ae-text-replace` | Find and replace text across compositions |
| `ae-batch-export` | Render queue automation, output modules, batch rendering |
| `ae-footage` | Import footage, replace sources, manage proxies |
| `ae-markers` | Composition and layer markers, reading/writing marker data |
| `ae-shape-ops` | Shape layer creation and manipulation |
| `ae-randomize` | Randomize layer properties and ordering |
| `ae-new-comp` | Create compositions with various settings |
| `ae-mogrt` | Motion Graphics templates and Essential Properties |
| `ae-edl` | EDL parsing and composition creation |
| `ae-trim-resequence` | Trim layers and resequence timing |

#### Photoshop UXP (Modern JavaScript)

| Skill | Description |
|-------|-------------|
| `ps-uxp-scripting` | UXP scripting with .psjs files: standalone scripts, execution, module access (v23.5+) |
| `ps-uxp-modal-execution` | executeAsModal patterns: progress reporting, cancellation, history suspension, timeout (v25.10+) |
| `ps-uxp-batchplay` | batchPlay API: action descriptors, dialog options, chaining, discovery methods |
| `ps-uxp-layers` | Layer manipulation: properties, transforms, filters, grouping |
| `ps-uxp-documents` | Document operations: creation, saving, image/canvas size, color modes |
| `ps-uxp-selections` | Selection API (v25.0+): shape selections, modification, transforms |
| `ps-uxp-imaging` | Imaging API: getPixels, putPixels, layer masks, pixel manipulation |
| `ps-uxp-events` | Event system: notification listeners, real-time monitoring |
| `ps-uxp-storage` | File storage: local file system, dialogs, localStorage persistence |
| `ps-uxp-reference` | Quick reference: constants, version requirements, common patterns |

#### Premiere Pro UXP (Modern JavaScript)

| Skill | Description |
|-------|-------------|
| `ppro-uxp-project` | Project and media management: opening projects, importing, project items, bins |
| `ppro-uxp-sequence` | Sequence operations: timeline navigation, playhead, in/out points, TickTime |
| `ppro-uxp-tracks` | Track and clip manipulation: accessing tracks, clip properties, timing adjustments |
| `ppro-uxp-actions` | Actions and transactions: executeTransaction, CompoundAction, undo grouping |
| `ppro-uxp-markers` | Marker operations: creating, reading, modifying sequence and clip markers |
| `ppro-uxp-manifest` | Plugin manifest configuration: entrypoints, permissions, icons |

#### InDesign UXP (Modern JavaScript)

| Skill | Description |
|-------|-------------|
| `indd-uxp-documents` | Document and page operations: creation, saving, spreads, layers, master pages |
| `indd-uxp-text` | Text frames, stories, paragraphs, characters, find/change, text threading |
| `indd-uxp-styles` | Paragraph, character, object, table, and cell styles |
| `indd-uxp-tables` | Table creation, rows, columns, cell formatting, merging |
| `indd-uxp-objects` | Page items, graphics, positioning, transformations, groups |
| `indd-uxp-manifest` | Plugin manifest: entrypoints, permissions, DOM versioning |

#### UXP Development Tools

| Skill | Description |
|-------|-------------|
| `uxp-bolt-workflow` | Bolt UXP boilerplate: project creation, uxp.config.ts, Vite builds, hot-reload, multi-panel, webview UI, hybrid C++ plugins, CCX packaging |

### Usage Examples

Once installed, Claude Code will automatically use these agents when relevant:

```
You: Create a wiggle expression that only affects the X axis

Claude: [Uses after-effects-expressions agent]
Here's an expression for X-only wiggle:

var w = wiggle(2, 50);
[w[0], value[1]]
```

```
You: Write a script to batch rename all layers with a prefix

Claude: [Uses after-effects-scripter agent]
Here's a script to add a prefix to all layer names...
```

### Contributing

To add new agents or skills:

1. Create a markdown file in `.claude/agents/` or `.claude/skills/`
2. Add YAML frontmatter with `name` and `description`
3. Document the domain knowledge, patterns, and code examples
4. Submit a pull request
