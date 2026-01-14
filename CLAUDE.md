# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This repository contains ExtendScript (.jsx) stubs and utility scripts for Adobe Creative Suite applications. ExtendScript is Adobe's JavaScript-based scripting language (ES3 target) used to automate Illustrator, Photoshop, InDesign, After Effects, Premiere, and other Adobe apps.

## Repository Structure

- `ai/` - Illustrator scripts (largest collection)
- `ae/` - After Effects scripts
- `psd/` - Photoshop scripts
- `indd/` - InDesign scripts
- `pr/` - Premiere scripts
- `cross/` - Cross-application scripts
- `global/` - Shared utilities (BridgeTalk for inter-app communication)
- `helpers/` - Math and utility functions
- `js/` - JavaScript polyfills (JSON2, indexOf for ES3)
- `types/` - TypeScript definitions for Adobe APIs by version
- `docs/` - Adobe scripting reference PDFs and HTML docs

## Development

### Running Scripts

Scripts are executed directly within Adobe applications:
- **Via VSCode**: Use ExtendScript Debugger extension (configured in `.vscode/launch.json`)
- **Via Adobe app**: File > Scripts > Other Script, or place in app's Scripts folder

### Language Constraints

ExtendScript targets ES3 with Adobe extensions:
- No `let`/`const` - use `var`
- No arrow functions, template literals, or modern array methods
- Use `#target "appname"` directive at file start (e.g., `#target "photoshop"`)
- Use `$.writeln()` for console output during debugging

### Key Patterns

**Application entry point:**
```javascript
var doc = app.activeDocument;
// or check if document exists first
if (app.documents.length == 0) {
    doc = app.documents.add();
}
```

**BridgeTalk for cross-app communication:**
```javascript
BridgeTalk.getSpecifier("photoshop");
BridgeTalk.launch("indesign");
BridgeTalk.bringToFront("photoshop");
```

**File/Folder dialogs:**
```javascript
var folder = Folder.selectDialog("Select folder");
var files = folder.getFiles("*.psd");
```

### Type Definitions

The `types/` directory contains TypeScript definitions for IDE autocomplete, organized by app and version. The `types/shared/` folder contains common types (ScriptUI, global functions, JavaScript polyfills).

Configure via `jsconfig.json` for VSCode IntelliSense support.
