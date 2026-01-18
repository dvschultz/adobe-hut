---
name: indd-uxp-manifest
description: "InDesign UXP plugin manifest configuration: manifest.json structure, entrypoints (panel, command), permissions, DOM versioning, and UXP Developer Tools setup."
---

# InDesign UXP: Plugin Manifest

## Overview

Every UXP plugin for InDesign requires a `manifest.json` file that defines the plugin's identity, capabilities, entry points, and permissions. This skill covers manifest configuration for InDesign UXP plugins.

**Requires**: InDesign v18.0+ (v18.4+ for DOM versioning)

## Basic Manifest Structure

```json
{
    "manifestVersion": 5,
    "id": "com.yourcompany.pluginname",
    "name": "My InDesign Plugin",
    "version": "1.0.0",
    "host": {
        "app": "InDesign",
        "minVersion": "18.0"
    },
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "My Panel"
        }
    ]
}
```

## Manifest Fields

### Required Fields

| Field | Description |
|-------|-------------|
| `manifestVersion` | Always `5` for current UXP |
| `id` | Unique reverse-domain identifier |
| `name` | Display name of the plugin |
| `version` | Semantic version (x.y.z) |
| `host` | Target application configuration |
| `entrypoints` | Array of panels/commands |

### Plugin Identity

```json
{
    "manifestVersion": 5,
    "id": "com.example.indesign-tools",
    "name": "InDesign Tools",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "Productivity tools for InDesign workflows",
    "homepage": "https://example.com/indesign-tools",
    "license": "MIT"
}
```

**ID Guidelines:**
- Use reverse-domain format: `com.company.pluginname`
- Must be unique across all plugins
- Use lowercase, alphanumeric characters, dots, and hyphens
- Cannot change after distribution

### Version Numbering

```json
{
    "version": "1.2.3"
}
```

Follow semantic versioning:
- **Major** (1.x.x): Breaking changes
- **Minor** (x.1.x): New features, backward compatible
- **Patch** (x.x.1): Bug fixes

## Host Configuration

### Single Host

```json
{
    "host": {
        "app": "InDesign",
        "minVersion": "18.0",
        "maxVersion": "99.0"
    }
}
```

| Field | Description |
|-------|-------------|
| `app` | Must be `"InDesign"` |
| `minVersion` | Minimum supported InDesign version |
| `maxVersion` | Optional maximum version |

### InDesign Version Reference

| InDesign Version | Year | UXP Support |
|------------------|------|-------------|
| 18.0 | 2023 | Initial UXP |
| 18.4 | 2023 | require() required |
| 19.0 | 2024 | DOM versioning |

### Multiple Host Support

For plugins that work in multiple Adobe apps:

```json
{
    "host": [
        {
            "app": "InDesign",
            "minVersion": "18.0"
        },
        {
            "app": "InCopy",
            "minVersion": "18.0"
        }
    ]
}
```

## Entry Points

### Panel Entry Point

Creates a dockable UI panel.

```json
{
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "My Panel",
            "minimumSize": {
                "width": 200,
                "height": 300
            },
            "maximumSize": {
                "width": 600,
                "height": 800
            },
            "preferredDockedSize": {
                "width": 300,
                "height": 400
            },
            "preferredFloatingSize": {
                "width": 350,
                "height": 450
            },
            "icons": [
                {
                    "width": 24,
                    "height": 24,
                    "path": "icons/icon-24.png",
                    "scale": [1, 2],
                    "theme": ["darkest", "dark", "light", "lightest"]
                }
            ]
        }
    ]
}
```

**Panel Properties:**

| Property | Description |
|----------|-------------|
| `type` | `"panel"` |
| `id` | Unique identifier within plugin |
| `label` | Display name in Window menu |
| `minimumSize` | Minimum panel dimensions |
| `maximumSize` | Maximum panel dimensions |
| `preferredDockedSize` | Default size when docked |
| `preferredFloatingSize` | Default size when floating |
| `icons` | Panel icon definitions |

### Command Entry Point

Creates a menu command without persistent UI.

```json
{
    "entrypoints": [
        {
            "type": "command",
            "id": "myCommand",
            "label": "Run My Command",
            "shortcut": {
                "mac": "Cmd+Shift+X",
                "win": "Ctrl+Shift+X"
            }
        }
    ]
}
```

**Command Properties:**

| Property | Description |
|----------|-------------|
| `type` | `"command"` |
| `id` | Unique identifier |
| `label` | Menu item text |
| `shortcut` | Optional keyboard shortcut |

### Multiple Entry Points

```json
{
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "Document Tools"
        },
        {
            "type": "panel",
            "id": "settingsPanel",
            "label": "Settings"
        },
        {
            "type": "command",
            "id": "quickProcess",
            "label": "Quick Process",
            "shortcut": {
                "mac": "Cmd+Shift+P",
                "win": "Ctrl+Shift+P"
            }
        },
        {
            "type": "command",
            "id": "batchExport",
            "label": "Batch Export"
        }
    ]
}
```

## Permissions

### File System Access

```json
{
    "requiredPermissions": {
        "localFileSystem": "fullAccess"
    }
}
```

Options:
- `"request"` - Prompt user each time (sandboxed)
- `"fullAccess"` - Full file system access

### Network Access

```json
{
    "requiredPermissions": {
        "network": {
            "domains": [
                "https://api.example.com",
                "https://*.myservice.com",
                "wss://socket.example.com"
            ]
        }
    }
}
```

**Domain Patterns:**
- Specific domain: `"https://api.example.com"`
- Wildcard subdomain: `"https://*.example.com"`
- WebSocket: `"wss://socket.example.com"`

### Clipboard Access

```json
{
    "requiredPermissions": {
        "clipboard": "readAndWrite"
    }
}
```

Options:
- `"readAndWrite"` - Full clipboard access
- `"read"` - Read-only access

### All Permissions Example

```json
{
    "requiredPermissions": {
        "localFileSystem": "fullAccess",
        "network": {
            "domains": [
                "https://api.example.com",
                "https://cdn.example.com"
            ]
        },
        "clipboard": "readAndWrite"
    }
}
```

## Icons

### Basic Icon Configuration

```json
{
    "icons": [
        {
            "width": 24,
            "height": 24,
            "path": "icons/icon.png"
        }
    ]
}
```

### Multi-Resolution Icons

```json
{
    "icons": [
        {
            "width": 24,
            "height": 24,
            "path": "icons/icon-24.png",
            "scale": [1, 2]
        },
        {
            "width": 48,
            "height": 48,
            "path": "icons/icon-48.png",
            "scale": [1, 2]
        }
    ]
}
```

For `scale: [1, 2]`, provide both files:
- `icon-24.png` (24x24)
- `icon-24@2x.png` (48x48)

### Theme-Aware Icons

```json
{
    "icons": [
        {
            "width": 24,
            "height": 24,
            "path": "icons/icon-dark.png",
            "theme": ["darkest", "dark"]
        },
        {
            "width": 24,
            "height": 24,
            "path": "icons/icon-light.png",
            "theme": ["light", "lightest"]
        }
    ]
}
```

Available themes: `"darkest"`, `"dark"`, `"light"`, `"lightest"`

### Complete Icon Setup

```json
{
    "icons": [
        {
            "width": 24,
            "height": 24,
            "path": "icons/icon-dark-24.png",
            "scale": [1, 2],
            "theme": ["darkest", "dark"]
        },
        {
            "width": 24,
            "height": 24,
            "path": "icons/icon-light-24.png",
            "scale": [1, 2],
            "theme": ["light", "lightest"]
        }
    ]
}
```

## DOM Versioning

Starting with InDesign v18.4, you can request specific DOM versions for compatibility.

### Manifest Configuration

```json
{
    "requiredPermissions": {
        "ipc": {
            "enableSockets": true
        }
    },
    "featureFlags": {
        "enableDOMVersioning": true
    }
}
```

### Using in Code

```javascript
const indesign = require('indesign');

// Request specific DOM version
const dom = indesign.dom('19.0');
const { app } = dom;

// Or use latest
const { app } = require('indesign');
```

## Debug Configuration

```json
{
    "flags": {
        "enableSWc": false
    }
}
```

## Complete Manifest Examples

### Simple Panel Plugin

```json
{
    "manifestVersion": 5,
    "id": "com.example.simple-panel",
    "name": "Simple Panel",
    "version": "1.0.0",
    "host": {
        "app": "InDesign",
        "minVersion": "18.0"
    },
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "Simple Panel",
            "minimumSize": { "width": 200, "height": 200 },
            "preferredDockedSize": { "width": 300, "height": 400 }
        }
    ]
}
```

### Production Plugin

```json
{
    "manifestVersion": 5,
    "id": "com.example.indesign-toolkit",
    "name": "InDesign Toolkit",
    "version": "2.1.0",
    "author": "Your Company",
    "description": "Professional tools for InDesign automation",
    "homepage": "https://example.com/toolkit",
    "license": "Commercial",
    "host": {
        "app": "InDesign",
        "minVersion": "18.0"
    },
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "Toolkit",
            "minimumSize": { "width": 250, "height": 300 },
            "maximumSize": { "width": 800, "height": 1200 },
            "preferredDockedSize": { "width": 320, "height": 500 },
            "preferredFloatingSize": { "width": 400, "height": 600 },
            "icons": [
                {
                    "width": 24,
                    "height": 24,
                    "path": "icons/toolkit-24.png",
                    "scale": [1, 2],
                    "theme": ["darkest", "dark", "light", "lightest"]
                }
            ]
        },
        {
            "type": "command",
            "id": "batchProcess",
            "label": "Batch Process Documents",
            "shortcut": { "mac": "Cmd+Shift+B", "win": "Ctrl+Shift+B" }
        },
        {
            "type": "command",
            "id": "exportAll",
            "label": "Export All Pages"
        }
    ],
    "requiredPermissions": {
        "localFileSystem": "fullAccess",
        "network": {
            "domains": [
                "https://api.example.com",
                "https://license.example.com"
            ]
        },
        "clipboard": "readAndWrite"
    }
}
```

## Plugin File Structure

```
my-indesign-plugin/
├── manifest.json          # Plugin configuration
├── index.html             # Main panel HTML
├── index.js               # Main JavaScript
├── styles.css             # Styles
├── icons/
│   ├── toolkit-24.png
│   ├── toolkit-24@2x.png
│   ├── toolkit-48.png
│   └── toolkit-48@2x.png
├── lib/
│   └── utilities.js       # Shared utilities
└── panels/
    ├── settings.html      # Additional panels
    └── settings.js
```

## Entry Point JavaScript

### Panel Entry Point

```javascript
// index.js
const { app } = require('indesign');

// Panel show handler
function panelShow() {
    console.log("Panel shown");
    updateUI();
}

// Panel hide handler
function panelHide() {
    console.log("Panel hidden");
}

function updateUI() {
    const doc = app.activeDocument;
    document.getElementById("docName").textContent =
        doc ? doc.name : "No document open";
}

// Export for UXP
module.exports = {
    panelShow,
    panelHide
};
```

### Command Entry Point

```javascript
// For command entrypoints, define the handler
const { app } = require('indesign');

async function batchProcess() {
    const doc = app.activeDocument;
    if (!doc) {
        console.log("No document open");
        return;
    }

    // Process document...
    console.log("Processing:", doc.name);
}

// Export command handlers
module.exports = {
    commands: {
        batchProcess: batchProcess,
        exportAll: async () => {
            // Export logic
        }
    }
};
```

## Loading Plugins

### Development Mode

1. Open **UXP Developer Tools**
   - Window > Extensions > UXP Developer Tools

2. Click **Add Plugin**

3. Select your plugin's `manifest.json`

4. Click **Load** to run the plugin

5. Use **Reload** after code changes

### Debug Console

- View console.log output in UXP Developer Tools
- Set breakpoints in JavaScript
- Inspect HTML elements

### Common Development Workflow

1. Edit code in your editor
2. Click **Reload** in UXP Developer Tools
3. Test changes in InDesign
4. Check console for errors
5. Repeat

## Distribution

### Package for Distribution

1. Create `.ccx` package using UXP Developer Tools
2. Sign the package (required for distribution)
3. Submit to Adobe Exchange or distribute directly

### Installing Packages

Users can install `.ccx` packages:
1. Double-click the `.ccx` file
2. Creative Cloud installs the plugin
3. Restart InDesign

## Troubleshooting

### Plugin Doesn't Appear

- Check `host.minVersion` matches your InDesign version
- Verify `manifestVersion` is `5`
- Check for JSON syntax errors

### Panel Is Blank

- Check console for JavaScript errors
- Verify HTML file path is correct
- Check for missing dependencies

### Permissions Denied

- Verify `requiredPermissions` includes needed access
- For file operations, check `localFileSystem`
- For network, check `network.domains`

### Icons Not Showing

- Verify icon paths are relative to manifest.json
- Check file names match manifest exactly
- Ensure icons are in correct format (PNG)

### Validating Manifest

Use UXP Developer Tools to validate:
1. Add your plugin
2. Check for error messages
3. Fix any reported issues

## Best Practices

1. **Start with minimal permissions** - Only request what you need
2. **Use semantic versioning** - Follow x.y.z format
3. **Provide multiple icon sizes** - Support HiDPI displays
4. **Support all themes** - Dark and light mode icons
5. **Test minimum version** - Verify on oldest supported version
6. **Document keyboard shortcuts** - Avoid conflicts
7. **Use descriptive IDs** - Clear, unique identifiers
