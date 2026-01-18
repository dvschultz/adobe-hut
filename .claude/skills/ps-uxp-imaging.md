---
name: ps-uxp-imaging
description: "Photoshop UXP Imaging API: getPixels, putPixels, pixel manipulation, layer masks, and image data buffers."
---

# UXP Imaging API

Direct pixel manipulation in Photoshop UXP for advanced image processing.

## Overview

The Imaging API provides low-level access to pixel data for:
- Reading pixels from layers, masks, and selections
- Writing pixels back to layers
- Creating image data from buffers
- Encoding image data to formats like JPEG

```javascript
const imaging = require('photoshop').imaging;
```

## PhotoshopImageData Structure

```javascript
// Returned by getPixels()
{
    imageData: ArrayBuffer,     // Pixel data buffer
    width: Number,              // Image width in pixels
    height: Number,             // Image height in pixels
    colorSpace: String,         // "RGB", "Grayscale", "LAB"
    colorProfile: String,       // ICC profile name
    hasAlpha: Boolean,          // Has alpha channel
    components: Number,         // Number of components (3 or 4)
    componentSize: Number,      // Bits per component (8, 16, 32)
    pixelFormat: String,        // "RGB", "RGBA", etc.
    typename: "PhotoshopImageData"
}
```

## Getting Pixels

### From Active Layer

```javascript
const { app, core } = require('photoshop');
const imaging = require('photoshop').imaging;

await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    const layer = doc.activeLayer;

    // Get all pixels from layer
    const imageData = await imaging.getPixels({
        documentID: doc.id,
        layerID: layer.id
    });

    console.log(`Size: ${imageData.width} x ${imageData.height}`);
    console.log(`Components: ${imageData.components}`);
    console.log(`Bit depth: ${imageData.componentSize}`);

    // Access raw pixel data
    const pixels = await imageData.imageData.getData();

}, { commandName: "Get Pixels" });
```

### From Specific Region

```javascript
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    sourceBounds: {
        left: 0,
        top: 0,
        right: 200,
        bottom: 200
    }
});
```

### With Resizing

```javascript
// Get 100x100 thumbnail of layer
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    targetSize: {
        width: 100,
        height: 100
    }
});
```

### Specify Color Space and Depth

```javascript
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    colorSpace: "RGB",       // "RGB", "Grayscale", "LAB"
    componentSize: 8         // 8, 16, or 32 bits
});
```

### From Composite (Merged View)

```javascript
// Get merged/flattened view
const imageData = await imaging.getPixels({
    documentID: doc.id,
    // Omit layerID to get composite
    sourceBounds: {
        left: 0,
        top: 0,
        right: doc.width,
        bottom: doc.height
    }
});
```

## Reading Pixel Data

### 8-bit RGB/RGBA

```javascript
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    componentSize: 8
});

const pixels = await imageData.imageData.getData();
const { width, height, components } = imageData;

// Iterate pixels
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * components;

        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const a = components === 4 ? pixels[idx + 3] : 255;

        // Process pixel...
    }
}
```

### 16-bit Data

```javascript
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    componentSize: 16
});

const pixels = await imageData.imageData.getData();
// pixels is Uint16Array for 16-bit
// Values range 0-65535
```

### 32-bit Float Data

```javascript
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    componentSize: 32
});

const pixels = await imageData.imageData.getData();
// pixels is Float32Array for 32-bit
// Values typically 0.0-1.0 (can exceed for HDR)
```

## Putting Pixels

### Basic Put

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    const layer = doc.activeLayer;

    // Create pixel buffer
    const width = 100;
    const height = 100;
    const components = 4;  // RGBA
    const pixelData = new Uint8Array(width * height * components);

    // Fill with red
    for (let i = 0; i < pixelData.length; i += components) {
        pixelData[i] = 255;      // R
        pixelData[i + 1] = 0;    // G
        pixelData[i + 2] = 0;    // B
        pixelData[i + 3] = 255;  // A
    }

    // Create ImageData object
    const imageData = await imaging.createImageDataFromBuffer(
        pixelData,
        {
            width: width,
            height: height,
            components: components,
            componentSize: 8,
            colorSpace: "RGB"
        }
    );

    // Put pixels to layer
    await imaging.putPixels({
        documentID: doc.id,
        layerID: layer.id,
        imageData: imageData,
        targetBounds: {
            left: 0,
            top: 0,
            right: width,
            bottom: height
        }
    });

}, { commandName: "Put Pixels" });
```

### Modify Existing Pixels

```javascript
await core.executeAsModal(async () => {
    const doc = app.activeDocument;
    const layer = doc.activeLayer;

    // Get existing pixels
    const imageData = await imaging.getPixels({
        documentID: doc.id,
        layerID: layer.id,
        componentSize: 8
    });

    const pixels = await imageData.imageData.getData();
    const { width, height, components } = imageData;

    // Modify pixels (invert colors)
    for (let i = 0; i < pixels.length; i += components) {
        pixels[i] = 255 - pixels[i];         // R
        pixels[i + 1] = 255 - pixels[i + 1]; // G
        pixels[i + 2] = 255 - pixels[i + 2]; // B
        // Leave alpha unchanged
    }

    // Create new ImageData from modified buffer
    const modifiedData = await imaging.createImageDataFromBuffer(
        pixels,
        {
            width: width,
            height: height,
            components: components,
            componentSize: 8,
            colorSpace: "RGB"
        }
    );

    // Put back
    await imaging.putPixels({
        documentID: doc.id,
        layerID: layer.id,
        imageData: modifiedData,
        targetBounds: {
            left: 0,
            top: 0,
            right: width,
            bottom: height
        }
    });

}, { commandName: "Invert Pixels" });
```

## Layer Mask Operations

### Get Layer Mask

```javascript
const maskData = await imaging.getLayerMask({
    documentID: doc.id,
    layerID: layer.id
});

// Mask is grayscale (1 component)
const maskPixels = await maskData.imageData.getData();
// 0 = fully masked (transparent), 255 = fully visible
```

### Put Layer Mask

```javascript
await core.executeAsModal(async () => {
    const width = layer.bounds.right - layer.bounds.left;
    const height = layer.bounds.bottom - layer.bounds.top;

    // Create gradient mask
    const maskPixels = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Linear gradient left to right
            maskPixels[y * width + x] = Math.round((x / width) * 255);
        }
    }

    const maskData = await imaging.createImageDataFromBuffer(
        maskPixels,
        {
            width: width,
            height: height,
            components: 1,      // Grayscale
            componentSize: 8,
            colorSpace: "Grayscale"
        }
    );

    await imaging.putLayerMask({
        documentID: doc.id,
        layerID: layer.id,
        imageData: maskData
    });

}, { commandName: "Create Gradient Mask" });
```

## Selection Operations

### Get Selection as Pixels

```javascript
const selectionData = await imaging.getSelection({
    documentID: doc.id
});

if (selectionData) {
    const selPixels = await selectionData.imageData.getData();
    // Grayscale: 255 = selected, 0 = not selected
    // Intermediate values = partial selection (feathered)
}
```

### Put Selection

```javascript
await core.executeAsModal(async () => {
    const width = doc.width;
    const height = doc.height;

    // Create circular selection
    const selPixels = new Uint8Array(width * height);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) * 0.4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            selPixels[y * width + x] = dist < radius ? 255 : 0;
        }
    }

    const selData = await imaging.createImageDataFromBuffer(
        selPixels,
        {
            width: width,
            height: height,
            components: 1,
            componentSize: 8,
            colorSpace: "Grayscale"
        }
    );

    await imaging.putSelection({
        documentID: doc.id,
        imageData: selData
    });

}, { commandName: "Create Circle Selection" });
```

## Encoding Image Data

### Encode to JPEG

```javascript
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id,
    componentSize: 8
});

// Encode as JPEG
const jpegBuffer = await imaging.encodeImageData({
    imageData: imageData,
    format: "jpeg",
    quality: 80  // 0-100
});

// jpegBuffer is an ArrayBuffer containing JPEG data
```

### Save Encoded Data

```javascript
const { storage } = require('uxp');
const fs = storage.localFileSystem;

const file = await fs.getFileForSaving("export.jpg", {
    types: ["jpg"]
});

if (file) {
    await file.write(jpegBuffer, {
        format: storage.formats.binary
    });
}
```

## Creating Image Data from Buffer

```javascript
// From Uint8Array
const buffer = new Uint8Array(width * height * 4);
const imageData = await imaging.createImageDataFromBuffer(buffer, {
    width: width,
    height: height,
    components: 4,
    componentSize: 8,
    colorSpace: "RGB"
});

// From Uint16Array (16-bit)
const buffer16 = new Uint16Array(width * height * 3);
const imageData16 = await imaging.createImageDataFromBuffer(buffer16, {
    width: width,
    height: height,
    components: 3,
    componentSize: 16,
    colorSpace: "RGB"
});

// From Float32Array (32-bit)
const bufferFloat = new Float32Array(width * height * 3);
const imageDataFloat = await imaging.createImageDataFromBuffer(bufferFloat, {
    width: width,
    height: height,
    components: 3,
    componentSize: 32,
    colorSpace: "RGB"
});
```

## Memory Management

```javascript
// Always dispose imageData when done to free memory
const imageData = await imaging.getPixels({
    documentID: doc.id,
    layerID: layer.id
});

try {
    // Process pixels...
} finally {
    // Free memory
    imageData.dispose();
}
```

## Complete Example: Apply Sepia Filter

```javascript
const { app, core } = require('photoshop');
const imaging = require('photoshop').imaging;

async function applySepiaFilter() {
    const doc = app.activeDocument;
    if (!doc) {
        await app.showAlert("No document open");
        return;
    }

    await core.executeAsModal(async (executionContext) => {
        const hostControl = executionContext.hostControl;
        const layer = doc.activeLayer;

        const suspensionID = await hostControl.suspendHistory({
            documentID: doc.id,
            name: "Apply Sepia"
        });

        let imageData;
        try {
            // Get pixels
            imageData = await imaging.getPixels({
                documentID: doc.id,
                layerID: layer.id,
                componentSize: 8
            });

            const pixels = await imageData.imageData.getData();
            const { width, height, components } = imageData;

            // Report progress
            executionContext.reportProgress({
                value: 0.3,
                commandName: "Processing pixels..."
            });

            // Apply sepia tone
            for (let i = 0; i < pixels.length; i += components) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];

                // Sepia formula
                pixels[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                pixels[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                pixels[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }

            executionContext.reportProgress({
                value: 0.7,
                commandName: "Applying changes..."
            });

            // Create modified image data
            const modifiedData = await imaging.createImageDataFromBuffer(
                pixels,
                {
                    width: width,
                    height: height,
                    components: components,
                    componentSize: 8,
                    colorSpace: "RGB"
                }
            );

            // Put pixels back
            await imaging.putPixels({
                documentID: doc.id,
                layerID: layer.id,
                imageData: modifiedData,
                targetBounds: {
                    left: 0,
                    top: 0,
                    right: width,
                    bottom: height
                }
            });

        } finally {
            if (imageData) {
                imageData.dispose();
            }
            await hostControl.resumeHistory(suspensionID);
        }

    }, { commandName: "Apply Sepia Filter" });

    await app.showAlert("Sepia filter applied!");
}

applySepiaFilter();
```

## Best Practices

1. **Dispose imageData** when done to free memory
2. **Use appropriate componentSize** - 8-bit for most operations, 16/32 for HDR
3. **Process in chunks** for large images to avoid blocking
4. **Check isCancelled** during long pixel operations
5. **Use targetBounds** to limit pixel operations to specific areas
6. **Match colorSpace** when putting pixels back
7. **Suspend history** for pixel operations to create single undo state
