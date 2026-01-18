---
name: ps-uxp-storage
description: "Photoshop UXP file storage: local file system, plugin folders, file dialogs, and data persistence with localStorage."
---

# UXP File Storage

File system access and data persistence in Photoshop UXP.

## Storage Modules

```javascript
// UXP Storage API (primary)
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Node-style fs (limited, for reading plugin files)
const fsNode = require('fs');
```

## File System Access

### Get Special Folders

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

// Plugin data folder (persistent across sessions)
const dataFolder = await fs.getDataFolder();

// Temporary folder (may be cleared)
const tempFolder = await fs.getTemporaryFolder();

// Plugin installation folder (read-only)
const pluginFolder = await fs.getPluginFolder();
```

### Folder Schemes

| Scheme | Description | Persistence |
|--------|-------------|-------------|
| `plugin:` | Plugin installation folder | Read-only |
| `plugin-data:` | Plugin data folder | Persistent |
| `plugin-temp:` | Temporary folder | Session only |
| `file:` | User file system | Requires permission |

## User File Dialogs

### Open File Dialog

```javascript
const fs = storage.localFileSystem;

// Single file
const file = await fs.getFileForOpening({
    types: ["psd", "jpg", "png"]  // Allowed extensions
});

if (file) {
    console.log("Selected:", file.name);
    console.log("Path:", file.nativePath);
}

// Multiple files
const files = await fs.getFileForOpening({
    types: ["jpg", "png"],
    allowMultiple: true
});

if (files && files.length > 0) {
    for (const file of files) {
        console.log("Selected:", file.name);
    }
}
```

### Save File Dialog

```javascript
const file = await fs.getFileForSaving("output.png", {
    types: ["png", "jpg"]
});

if (file) {
    // File entry created - now write to it
    console.log("Will save to:", file.nativePath);
}
```

### Folder Selection

```javascript
const folder = await fs.getFolder();

if (folder) {
    console.log("Selected folder:", folder.nativePath);

    // List contents
    const entries = await folder.getEntries();
    for (const entry of entries) {
        console.log(entry.isFile ? "File:" : "Folder:", entry.name);
    }
}
```

## Reading Files

### Read Text File

```javascript
const file = await fs.getFileForOpening({ types: ["txt", "json"] });

if (file) {
    const content = await file.read({
        format: storage.formats.utf8
    });
    console.log(content);
}
```

### Read JSON File

```javascript
const file = await fs.getFileForOpening({ types: ["json"] });

if (file) {
    const content = await file.read({ format: storage.formats.utf8 });
    const data = JSON.parse(content);
    console.log(data);
}
```

### Read Binary File

```javascript
const file = await fs.getFileForOpening({ types: ["png", "jpg"] });

if (file) {
    const buffer = await file.read({
        format: storage.formats.binary
    });
    // buffer is ArrayBuffer
    console.log("Size:", buffer.byteLength);
}
```

### Read from Plugin Folder

```javascript
// Using UXP storage
const pluginFolder = await fs.getPluginFolder();
const configFile = await pluginFolder.getEntry("config.json");
const config = JSON.parse(await configFile.read());

// Using Node-style fs (simpler for plugin files)
const fsNode = require('fs');
const configPath = "plugin:config.json";
const configContent = fsNode.readFileSync(configPath, { encoding: "utf-8" });
const config = JSON.parse(configContent);
```

## Writing Files

### Write Text File

```javascript
const file = await fs.getFileForSaving("output.txt", { types: ["txt"] });

if (file) {
    await file.write("Hello, World!", {
        format: storage.formats.utf8
    });
}
```

### Write JSON File

```javascript
const data = { name: "Test", value: 42 };

const file = await fs.getFileForSaving("data.json", { types: ["json"] });
if (file) {
    await file.write(JSON.stringify(data, null, 2), {
        format: storage.formats.utf8
    });
}
```

### Write Binary File

```javascript
// Save ArrayBuffer to file
const file = await fs.getFileForSaving("image.png", { types: ["png"] });

if (file) {
    await file.write(arrayBuffer, {
        format: storage.formats.binary
    });
}
```

### Write to Data Folder

```javascript
const dataFolder = await fs.getDataFolder();

// Create or overwrite file
const settingsFile = await dataFolder.createFile("settings.json", {
    overwrite: true
});

await settingsFile.write(JSON.stringify(settings), {
    format: storage.formats.utf8
});
```

## Working with Folders

### Create Folder

```javascript
const dataFolder = await fs.getDataFolder();
const subFolder = await dataFolder.createFolder("exports");
```

### List Folder Contents

```javascript
const folder = await fs.getFolder();

if (folder) {
    const entries = await folder.getEntries();

    for (const entry of entries) {
        if (entry.isFile) {
            console.log("File:", entry.name);
        } else if (entry.isFolder) {
            console.log("Folder:", entry.name);
        }
    }
}
```

### Filter Files by Extension

```javascript
const folder = await fs.getFolder();

if (folder) {
    const entries = await folder.getEntries();
    const images = entries.filter(e =>
        e.isFile && /\.(jpg|jpeg|png|psd)$/i.test(e.name)
    );

    console.log(`Found ${images.length} image files`);
}
```

### Get Specific Entry

```javascript
const folder = await fs.getDataFolder();

// Get file
const file = await folder.getEntry("settings.json");
if (file) {
    const content = await file.read();
}

// Check if exists
try {
    const entry = await folder.getEntry("maybeExists.txt");
    console.log("File exists");
} catch (e) {
    console.log("File does not exist");
}
```

## File Entry Properties

```javascript
const file = await fs.getFileForOpening();

if (file) {
    file.name;           // Filename with extension
    file.nativePath;     // Full system path
    file.isFile;         // true
    file.isFolder;       // false

    // Get metadata
    const metadata = await file.getMetadata();
    metadata.size;       // File size in bytes
    metadata.dateCreated;
    metadata.dateModified;
}
```

## Persistent Tokens

For accessing the same file/folder across sessions:

```javascript
// Save token when user selects file
const file = await fs.getFileForOpening();
if (file) {
    const token = await fs.createPersistentToken(file);
    localStorage.setItem("lastOpenedFile", token);
}

// Later, retrieve file using token
const savedToken = localStorage.getItem("lastOpenedFile");
if (savedToken) {
    try {
        const file = await fs.getEntryForPersistentToken(savedToken);
        // File is accessible again
    } catch (e) {
        // Token invalid or file moved/deleted
        localStorage.removeItem("lastOpenedFile");
    }
}
```

## localStorage

Simple key-value storage that persists across sessions.

### Basic Usage

```javascript
// Store string
localStorage.setItem("username", "john");

// Retrieve string
const username = localStorage.getItem("username");

// Remove item
localStorage.removeItem("username");

// Clear all
localStorage.clear();

// Check if exists
if (localStorage.getItem("key") !== null) {
    // Key exists
}
```

### Store Complex Data

```javascript
// Store object
const settings = {
    theme: "dark",
    fontSize: 14,
    recentFiles: ["/path/to/file1.psd", "/path/to/file2.psd"]
};
localStorage.setItem("settings", JSON.stringify(settings));

// Retrieve object
const savedSettings = JSON.parse(
    localStorage.getItem("settings") || "{}"
);

// Update partial settings
function updateSetting(key, value) {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");
    settings[key] = value;
    localStorage.setItem("settings", JSON.stringify(settings));
}
```

### Settings Helper Class

```javascript
class PluginSettings {
    constructor(storageKey = "pluginSettings") {
        this.storageKey = storageKey;
        this.defaults = {
            quality: 80,
            format: "jpeg",
            autoSave: true
        };
    }

    get(key) {
        const settings = this.getAll();
        return settings[key] ?? this.defaults[key];
    }

    set(key, value) {
        const settings = this.getAll();
        settings[key] = value;
        this.saveAll(settings);
    }

    getAll() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? { ...this.defaults, ...JSON.parse(stored) } : { ...this.defaults };
    }

    saveAll(settings) {
        localStorage.setItem(this.storageKey, JSON.stringify(settings));
    }

    reset() {
        localStorage.removeItem(this.storageKey);
    }
}

// Usage
const settings = new PluginSettings();
console.log(settings.get("quality"));  // 80
settings.set("quality", 90);
console.log(settings.get("quality"));  // 90
```

## Complete Example: Export History Manager

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

class ExportHistory {
    constructor() {
        this.maxHistory = 10;
    }

    getHistory() {
        return JSON.parse(localStorage.getItem("exportHistory") || "[]");
    }

    addEntry(filePath, format, size) {
        const history = this.getHistory();
        history.unshift({
            path: filePath,
            format: format,
            size: size,
            date: new Date().toISOString()
        });

        // Keep only recent entries
        if (history.length > this.maxHistory) {
            history.pop();
        }

        localStorage.setItem("exportHistory", JSON.stringify(history));
    }

    async exportToFile() {
        const file = await fs.getFileForSaving("export-history.json", {
            types: ["json"]
        });

        if (file) {
            const history = this.getHistory();
            await file.write(JSON.stringify(history, null, 2), {
                format: storage.formats.utf8
            });
            return true;
        }
        return false;
    }

    clearHistory() {
        localStorage.removeItem("exportHistory");
    }
}

// Usage
const history = new ExportHistory();
history.addEntry("/Users/me/Desktop/image.jpg", "JPEG", 1024000);
console.log(history.getHistory());
```

## Batch File Processing

```javascript
const { app, core } = require('photoshop');
const { storage } = require('uxp');
const fs = storage.localFileSystem;

async function batchProcess() {
    // Select input folder
    const inputFolder = await fs.getFolder();
    if (!inputFolder) return;

    // Select output folder
    const outputFolder = await fs.getFolder();
    if (!outputFolder) return;

    // Get all PSD files
    const entries = await inputFolder.getEntries();
    const psdFiles = entries.filter(e =>
        e.isFile && e.name.toLowerCase().endsWith(".psd")
    );

    for (const file of psdFiles) {
        await core.executeAsModal(async () => {
            // Open
            const doc = await app.open(file);

            // Process (example: resize)
            await doc.resizeImage(1920, undefined, null);

            // Save to output folder
            const outputName = file.name.replace(".psd", ".jpg");
            const outputFile = await outputFolder.createFile(outputName, {
                overwrite: true
            });

            // Export as JPEG using batchPlay
            await action.batchPlay([{
                _obj: "save",
                as: {
                    _obj: "JPEG",
                    quality: 10
                },
                in: {
                    _path: outputFile.nativePath,
                    _kind: "local"
                },
                copy: true
            }], {});

            // Close without saving PSD
            await doc.close(constants.SaveOptions.DONOTSAVECHANGES);

        }, { commandName: `Processing ${file.name}` });
    }

    await app.showAlert(`Processed ${psdFiles.length} files!`);
}
```

## Best Practices

1. **Use data folder** for plugin settings and cache
2. **Use temp folder** for temporary processing files
3. **Request permissions** only when needed (file dialogs)
4. **Store tokens** for recently used files
5. **Handle missing files** gracefully with try-catch
6. **Validate JSON** when reading from localStorage
7. **Limit localStorage size** - typically 5MB limit
8. **Use persistent tokens** for "recent files" features
