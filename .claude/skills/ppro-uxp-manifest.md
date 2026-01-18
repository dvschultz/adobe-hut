---
name: ppro-uxp-manifest
description: "Premiere Pro UXP plugin manifest configuration: manifest.json structure, entrypoints, permissions, and plugin settings."
---

# Premiere Pro UXP: Plugin Manifest

## Overview

Every UXP plugin requires a `manifest.json` file that defines:
- Plugin identity (ID, name, version)
- Host application requirements
- Entry points (panels, commands)
- Permissions (file system, network)

## Basic Manifest Structure

```json
{
    "manifestVersion": 5,
    "id": "com.yourcompany.pluginname",
    "name": "My Plugin Name",
    "version": "1.0.0",
    "host": {
        "app": "PremierePro",
        "minVersion": "25.6"
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
| `host` | Target application config |
| `entrypoints` | Array of panels/commands |

### Host Configuration

```json
{
    "host": {
        "app": "PremierePro",
        "minVersion": "25.6",
        "maxVersion": "99.0"
    }
}
```

- `app`: Must be `"PremierePro"` for Premiere
- `minVersion`: Minimum supported version
- `maxVersion`: Optional maximum version

### Multiple Host Support

```json
{
    "host": [
        {
            "app": "PremierePro",
            "minVersion": "25.6"
        },
        {
            "app": "Photoshop",
            "minVersion": "25.0"
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

Creates a menu command without UI.

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
            "label": "My Panel"
        },
        {
            "type": "panel",
            "id": "settingsPanel",
            "label": "Settings"
        },
        {
            "type": "command",
            "id": "quickAction",
            "label": "Quick Action"
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
- `"request"` - Prompt user each time
- `"fullAccess"` - Full file system access

### Network Access

```json
{
    "requiredPermissions": {
        "network": {
            "domains": [
                "https://api.example.com",
                "https://*.myservice.com"
            ]
        }
    }
}
```

### Clipboard Access

```json
{
    "requiredPermissions": {
        "clipboard": "readAndWrite"
    }
}
```

### All Permissions Example

```json
{
    "requiredPermissions": {
        "localFileSystem": "fullAccess",
        "network": {
            "domains": [
                "https://api.example.com"
            ]
        },
        "clipboard": "readAndWrite"
    }
}
```

## Icons

### Icon Configuration

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

## Optional Fields

### Plugin Metadata

```json
{
    "author": "Your Name",
    "description": "Plugin description text",
    "homepage": "https://yoursite.com",
    "license": "MIT"
}
```

### Debug Configuration

```json
{
    "flags": {
        "enableSWc": false
    }
}
```

## Complete Manifest Example

```json
{
    "manifestVersion": 5,
    "id": "com.example.premieretools",
    "name": "Premiere Tools",
    "version": "1.2.0",
    "author": "Your Company",
    "description": "Productivity tools for Premiere Pro editors",
    "homepage": "https://example.com/premiere-tools",
    "license": "MIT",
    "host": {
        "app": "PremierePro",
        "minVersion": "25.6"
    },
    "entrypoints": [
        {
            "type": "panel",
            "id": "mainPanel",
            "label": "Premiere Tools",
            "minimumSize": {
                "width": 250,
                "height": 350
            },
            "maximumSize": {
                "width": 800,
                "height": 1200
            },
            "preferredDockedSize": {
                "width": 300,
                "height": 450
            },
            "preferredFloatingSize": {
                "width": 350,
                "height": 500
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
        },
        {
            "type": "command",
            "id": "batchRename",
            "label": "Batch Rename Clips",
            "shortcut": {
                "mac": "Cmd+Shift+R",
                "win": "Ctrl+Shift+R"
            }
        },
        {
            "type": "command",
            "id": "exportMarkers",
            "label": "Export Markers to CSV"
        }
    ],
    "requiredPermissions": {
        "localFileSystem": "fullAccess",
        "network": {
            "domains": [
                "https://api.example.com"
            ]
        },
        "clipboard": "readAndWrite"
    }
}
```

## Plugin File Structure

```
my-plugin/
├── manifest.json
├── index.html
├── index.js
├── styles.css
├── icons/
│   ├── icon-24.png
│   ├── icon-24@2x.png
│   └── icon-48.png
└── lib/
    └── utilities.js
```

## Loading Plugins

### Development Mode

1. Open UXP Developer Tools (Window > Extensions > UXP Developer Tools)
2. Click "Add Plugin"
3. Select your plugin's manifest.json
4. Click "Load" to run

### Production Installation

1. Package plugin as `.ccx` file
2. Distribute via Adobe Exchange or direct install
3. User installs via Creative Cloud

## Troubleshooting

### Common Issues

1. **Plugin doesn't appear**: Check `host.minVersion` matches your Premiere version
2. **Panel blank**: Check console for JavaScript errors
3. **Permissions denied**: Verify `requiredPermissions` in manifest
4. **Icons missing**: Check paths are relative to manifest.json

### Validating Manifest

Use UXP Developer Tools to validate your manifest before loading.
