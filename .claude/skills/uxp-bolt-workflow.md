---
name: uxp-bolt-workflow
description: "Bolt UXP development workflow: project creation, uxp.config.ts configuration, Vite build system, hot-reloading, multi-panel plugins, webview UI, hybrid C++ plugins, and CCX packaging."
---

# Bolt UXP Development Workflow

## Overview

Bolt UXP is a modern boilerplate for Adobe UXP plugin development. It provides a Vite-based build system with hot-reloading, TypeScript support, and framework choice (React, Vue, or Svelte).

**Supported Adobe Apps**:
- Photoshop (full support)
- InDesign (full support)
- Premiere Pro (beta)
- Illustrator (beta access required)

**Requirements**:
- Node.js 18+
- Adobe UXP Developer Tool (UDT)
- Package manager: npm, yarn, or pnpm

## Project Creation

```bash
# Create new project
yarn create bolt-uxp
npx create-bolt-uxp
pnpm create bolt-uxp
```

The CLI will prompt for:
- Project name
- Framework (Svelte, React, or Vue)
- Target Adobe application(s)
- Webview UI (optional)
- Hybrid C++ plugin (optional)

## Project Structure

```
my-plugin/
├── src/
│   ├── api/
│   │   ├── uxp.ts              # Global UXP functions
│   │   ├── photoshop.ts        # Photoshop-specific API
│   │   ├── indesign.ts         # InDesign-specific API
│   │   └── premierepro.ts      # Premiere Pro-specific API
│   ├── hybrid/                  # C++ source (if enabled)
│   ├── lib/                     # Shared utilities
│   └── main.[svelte|tsx|vue]   # Main component
├── webview-ui/                  # Webview source (if enabled)
│   └── src/
│       └── webview-api.ts      # Functions exposed to UXP
├── public/
│   └── webview-ui/             # Built webview HTML
├── public-hybrid/               # Compiled C++ binaries
│   ├── mac/arm64/
│   ├── mac/x64/
│   └── win/x64/
├── dist/                        # Build output
├── uxp.config.ts               # Plugin configuration
├── vite.config.ts              # Vite configuration
├── manifest.json               # Generated from config
└── package.json
```

## Commands

### Development

```bash
# Install dependencies
yarn install

# Build plugin (required before first dev run)
yarn build

# Start hot-reload development
yarn dev
```

### Production

```bash
# Build for production
yarn build

# Package as CCX for distribution
yarn ccx

# Bundle CCX with assets to ZIP
yarn zip
```

### Hybrid Plugin (C++)

```bash
# Build macOS binary
yarn mac-build

# Build Windows binary
yarn win-build

# Build and sign macOS
yarn mac-build-sign

# Sign Windows binary
yarn win-sign
```

## Configuration: uxp.config.ts

The main configuration file for your plugin.

### Basic Configuration

```typescript
import { UxpConfig } from "vite-uxp-plugin";

const config: UxpConfig = {
  manifest: {
    id: "com.example.my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    main: "index.html",
    icons: [
      { width: 24, height: 24, path: "icons/icon-24.png" },
      { width: 48, height: 48, path: "icons/icon-48.png" }
    ]
  },
  host: [
    {
      app: "Photoshop",
      minVersion: "24.0.0"
    }
  ],
  entrypoints: [
    {
      type: "panel",
      id: "main",
      label: "My Plugin",
      minimumSize: { width: 200, height: 300 },
      maximumSize: { width: 600, height: 800 },
      preferredDockedSize: { width: 300, height: 400 },
      preferredFloatingSize: { width: 300, height: 400 }
    }
  ]
};

export default config;
```

### Multi-Host Configuration

```typescript
const config: UxpConfig = {
  manifest: {
    id: "com.example.my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    main: "index.html"
  },
  host: [
    {
      app: "Photoshop",
      minVersion: "24.0.0"
    },
    {
      app: "InDesign",
      minVersion: "18.0.0"
    }
  ],
  // Use same plugin ID across hosts (optional)
  uniqueIds: false,
  entrypoints: [
    {
      type: "panel",
      id: "main",
      label: "My Plugin"
    }
  ]
};
```

### Multi-Panel Configuration

```typescript
const config: UxpConfig = {
  manifest: {
    id: "com.example.my-plugin",
    name: "My Plugin",
    version: "1.0.0",
    main: "index.html"
  },
  host: [
    { app: "Photoshop", minVersion: "24.0.0" }
  ],
  entrypoints: [
    {
      type: "panel",
      id: "main",
      label: "Main Panel",
      panelid: "bolt.uxp.plugin.main"
    },
    {
      type: "panel",
      id: "settings",
      label: "Settings",
      panelid: "bolt.uxp.plugin.settings"
    }
  ]
};
```

### ZIP Asset Configuration

```typescript
const config: UxpConfig = {
  // ... other config

  // Include files/folders in ZIP distribution
  copyZipAssets: [
    "README.md",
    "LICENSE",
    "public-zip/*"  // "*" copies contents without folder
  ]
};
```

## Development Workflow

### Initial Setup

1. Create project:
   ```bash
   yarn create bolt-uxp
   cd my-plugin
   yarn install
   ```

2. Build plugin:
   ```bash
   yarn build
   ```

3. Start development:
   ```bash
   yarn dev
   ```

### Loading in Adobe App

1. Open **Adobe UXP Developer Tool** (UDT)
2. Click **Add Plugin**
3. Navigate to `dist/manifest.json`
4. Click **Load** (NOT "Load and Watch")
5. Click **Debug** to open DevTools

**Important**: Use Bolt's hot-reload (`yarn dev`), not UDT's file watcher. Bolt's WebSocket-based system is more reliable.

### Hot Reload

Changes to source files automatically reload the plugin. The WebSocket connection handles:
- Component changes
- Style changes
- API code changes

**Note**: C++ hybrid plugin changes require manual unload/reload in UDT.

## Multi-Panel Plugins

Unlike CEP, UXP renders all panels in a single space with sections per panel.

### Configuration

```typescript
// uxp.config.ts
entrypoints: [
  {
    type: "panel",
    id: "main",
    label: "Main Panel",
    panelid: "bolt.uxp.plugin.main"
  },
  {
    type: "panel",
    id: "settings",
    label: "Settings",
    panelid: "bolt.uxp.plugin.settings"
  }
]
```

### Component Implementation

```svelte
<!-- Svelte example -->
<uxp-panel panelid="bolt.uxp.plugin.main">
  <h1>Main Panel Content</h1>
</uxp-panel>

<uxp-panel panelid="bolt.uxp.plugin.settings">
  <h1>Settings Panel Content</h1>
</uxp-panel>
```

```tsx
// React example
function App() {
  return (
    <>
      <uxp-panel panelid="bolt.uxp.plugin.main">
        <h1>Main Panel Content</h1>
      </uxp-panel>

      <uxp-panel panelid="bolt.uxp.plugin.settings">
        <h1>Settings Panel Content</h1>
      </uxp-panel>
    </>
  );
}
```

## Webview UI (Beta)

Webview provides full HTML/CSS/DOM support using native browser engines (Edge on Windows, Safari on macOS).

### Setup

```bash
# If not enabled during creation
cd webview-ui
yarn install
cd ..
```

### Exposing Functions to UXP

```typescript
// webview-ui/src/webview-api.ts
export const webviewAPI = {
  // Functions callable from UXP context
  processData: async (data: string) => {
    // Full DOM access here
    return data.toUpperCase();
  },

  getFormData: () => {
    const form = document.getElementById('myForm') as HTMLFormElement;
    return new FormData(form);
  }
};
```

### Calling Webview from UXP

```typescript
// src/main.ts
import { initWebview } from "./lib/webview";

const { api, page } = initWebview(webviewAPI);

// Call webview function
const result = await api.processData("hello");
console.log(result); // "HELLO"
```

### Multi-Panel Webview

```typescript
// Deconstruct by panel order
const [mainWebviewAPI, settingsWebviewAPI] = webviewAPIs;

// Each API corresponds to its panel's webview
await mainWebviewAPI.api.doSomething();
await settingsWebviewAPI.api.getSettings();
```

### Debugging Webview

- **UXP context**: Use Adobe UXP Developer Tools
- **Webview context**: Right-click in webview → "Inspect"

## Theme Support

Bolt UXP includes CSS variables that match the host app's color scheme.

### Available Variables

```css
:root {
  --uxp-host-background-color: /* app background */;
  --uxp-host-text-color: /* primary text */;
  --uxp-host-text-color-secondary: /* secondary text */;
  --uxp-host-border-color: /* borders */;
  --uxp-host-link-text-color: /* links */;
  --uxp-host-link-hover-text-color: /* link hover */;
  --uxp-host-label-text-color: /* labels */;
  --uxp-host-widget-hover-background-color: /* widget hover bg */;
  --uxp-host-widget-hover-text-color: /* widget hover text */;
  --uxp-host-widget-hover-border-color: /* widget hover border */;
}
```

### Theme Media Queries

```css
/* Dark themes */
@media (prefers-color-scheme: dark) {
  .my-element { background: #333; }
}

@media (prefers-color-scheme: darkest) {
  .my-element { background: #1a1a1a; }
}

/* Light themes */
@media (prefers-color-scheme: light) {
  .my-element { background: #f0f0f0; }
}

@media (prefers-color-scheme: lightest) {
  .my-element { background: #fff; }
}
```

### Usage Example

```css
.panel {
  background-color: var(--uxp-host-background-color);
  color: var(--uxp-host-text-color);
  border: 1px solid var(--uxp-host-border-color);
}

.button {
  background: var(--uxp-host-widget-hover-background-color);
  color: var(--uxp-host-widget-hover-text-color);
}
```

## Hybrid Plugins (C++)

For performance-critical operations, Bolt supports C++ hybrid plugins.

### Structure

```
src/hybrid/
├── main.cpp           # Main source
└── CMakeLists.txt     # Build configuration
```

### Main Function

```cpp
// The primary exported function
extern "C" const char* execSync(const char* command) {
    // Execute system command
    // Return output as string
}
```

### Building

```bash
# macOS (requires Xcode + CLI tools)
yarn mac-build

# Windows (requires Visual Studio 2019)
yarn win-build
```

### Output

```
public-hybrid/
├── mac/arm64/bolt-uxp-hybrid.uxpaddon
├── mac/x64/bolt-uxp-hybrid.uxpaddon
└── win/x64/bolt-uxp-hybrid.uxpaddon
```

### Signing (Production)

1. Copy `.env.example` to `.env`
2. Fill in signing credentials:
   - macOS: Apple Developer ID, notarization credentials
   - Windows: EV certificate (optional but recommended)

```bash
# macOS: Build and sign
yarn mac-build-sign

# Windows: Sign existing binary
yarn win-sign
```

## Packaging & Distribution

### CCX Package

```bash
yarn ccx
```

Creates CCX file(s) in project root. Multi-host plugins generate separate CCX per app.

### ZIP Bundle

```bash
yarn zip
```

Creates ZIP in `./zip/` containing:
- CCX file(s)
- Assets from `copyZipAssets` config

### Installation Methods

**ZXP/UXP Installer** (Recommended):
- Download from https://aescripts.com/learn/zxp-installer/
- Drag-and-drop CCX file

**Double-click CCX**:
- Uses Adobe's UPIA backend
- Requires Creative Cloud

**Command Line (UPIA)**:

```bash
# Windows
cd "C:\Program Files\Common Files\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent"
UnifiedPluginInstallerAgent.exe /install /path/to/plugin.ccx

# macOS
cd "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS"
./UnifiedPluginInstallerAgent --install /path/to/plugin.ccx
```

## GitHub Actions

Bolt includes automatic CCX builds on git tags.

### Trigger Release

```bash
git tag 1.0.0
git push origin --tags
```

### Configuration

Edit `.github/workflows/main.yml` for custom release workflow.

## App-Specific API Files

### Photoshop

```typescript
// src/api/photoshop.ts
const { app, core, action } = require("photoshop");

export async function getActiveDocument() {
  return app.activeDocument;
}

export async function createLayer(name: string) {
  await core.executeAsModal(async () => {
    await app.activeDocument.createLayer({ name });
  }, { commandName: "Create Layer" });
}
```

### InDesign

```typescript
// src/api/indesign.ts
const { app } = require("indesign");

export function getActiveDocument() {
  return app.activeDocument;
}

export function addTextFrame(page: any, bounds: number[]) {
  return page.textFrames.add({
    geometricBounds: bounds
  });
}
```

### Premiere Pro

```typescript
// src/api/premierepro.ts
const premierepro = require("premierepro");

export function getProject() {
  return premierepro.app.project;
}

export function getActiveSequence() {
  return premierepro.app.project.activeSequence;
}
```

## Updating Projects

When updating Bolt UXP version, update these files from the new template:

1. `package.json` (especially `vite-uxp-plugin` version)
2. `vite.config.ts`
3. `uxp.config.ts` (merge with your settings)
4. `src/api/` folder
5. `src/lib/` folder
6. `src/hybrid/` folder (if not customized)

## Troubleshooting

### Plugin Not Loading

- Ensure `yarn build` ran before `yarn dev`
- Check `dist/manifest.json` exists
- Verify host app version meets `minVersion`

### Hot Reload Not Working

- Use `yarn dev`, not UDT's "Load and Watch"
- Check terminal for WebSocket connection
- Restart `yarn dev` if connection drops

### Webview Not Rendering

- Ensure webview dependencies installed: `cd webview-ui && yarn install`
- Check browser console (right-click → Inspect)
- Verify `webview-api.ts` exports are correct

### Build Errors

- Clear `dist/` and rebuild: `rm -rf dist && yarn build`
- Check Node.js version (18+ required)
- Update dependencies: `yarn upgrade`

## Resources

- **GitHub**: https://github.com/hyperbrew/bolt-uxp
- **Discord**: Free community support
- **Hyper Brew**: https://hyperbrew.co (consulting available)
