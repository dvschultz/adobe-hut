---
name: ae-new-comp
description: "Create a new After Effects composition with preset dimensions, frame rate, and duration."
---

# AE New Composition

Create a new After Effects composition with common presets and custom settings.

## What This Skill Does

Generates an ExtendScript that creates a new composition in After Effects with user-specified settings including:

- Preset dimensions (HD, 4K, social media formats)
- Custom dimensions
- Frame rate selection (23.976, 24, 25, 29.97, 30, 60 fps)
- Duration specification
- Background color option

## Available Presets

| Preset | Dimensions | Common Use |
|--------|------------|------------|
| HD 1080p | 1920x1080 | Standard video |
| HD 720p | 1280x720 | Web video |
| 4K UHD | 3840x2160 | High resolution |
| 4K DCI | 4096x2160 | Cinema |
| Instagram Square | 1080x1080 | Social media |
| Instagram Portrait | 1080x1350 | Social media |
| Instagram Story | 1080x1920 | Vertical video |
| TikTok/Reels | 1080x1920 | Vertical video |
| YouTube Shorts | 1080x1920 | Vertical video |
| Twitter Video | 1280x720 | Social media |

## Usage

When the user invokes `/ae-new-comp`, ask them to specify:

1. **Preset or custom dimensions**
2. **Frame rate** (default to 30 fps if not specified)
3. **Duration** in seconds or timecode
4. **Composition name** (optional)

## Script Template

```javascript
#target aftereffects

(function() {
    // Configuration - modify as needed
    var config = {
        name: "{{COMP_NAME}}",
        width: {{WIDTH}},
        height: {{HEIGHT}},
        pixelAspect: 1.0,
        duration: {{DURATION}},  // seconds
        frameRate: {{FRAME_RATE}}
    };

    app.beginUndoGroup("Create Composition");
    try {
        var comp = app.project.items.addComp(
            config.name,
            config.width,
            config.height,
            config.pixelAspect,
            config.duration,
            config.frameRate
        );

        // Optional: Set as active item
        comp.openInViewer();

        alert("Created composition: " + comp.name + "\n" +
              config.width + "x" + config.height + " @ " + config.frameRate + " fps\n" +
              "Duration: " + config.duration + " seconds");

    } catch (e) {
        alert("Error creating composition: " + e.message);
    }
    app.endUndoGroup();

})();
```

## Example Requests

- "Create a new 4K composition at 24fps, 10 seconds long"
- "Make an Instagram Story composition called 'Promo'"
- "New 1920x1080 comp at 60fps for 30 seconds"
- "Create a square comp for Instagram"

## Notes

- The script uses ES3 syntax for ExtendScript compatibility
- Compositions are created in the root of the project panel
- The new composition will open in the viewer automatically
