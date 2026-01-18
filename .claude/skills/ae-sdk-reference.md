---
name: ae-sdk-reference
description: "Quick reference for After Effects C++ SDK: types, macros, flags, suites, and common patterns."
---

# AE SDK Quick Reference

Compact reference for After Effects C++ SDK development.

## Plugin Types

| Type | Entry | Purpose |
|------|-------|---------|
| Effect | `PF_Cmd` main | Process video/audio |
| AEGP | `GPMain_Entry` | Extend AE functionality |
| AEIO | `GPMain_Entry` | File format support |
| Artisan | Custom | 3D rendering |
| BlitHook | Auto-load | Hardware output |

## Command Selectors

### Global (Once)

| Command | Purpose |
|---------|---------|
| `PF_Cmd_GLOBAL_SETUP` | Set flags, version |
| `PF_Cmd_PARAM_SETUP` | Define parameters |
| `PF_Cmd_GLOBAL_SETDOWN` | Cleanup |
| `PF_Cmd_ABOUT` | About dialog |

### Sequence (Per Instance)

| Command | Purpose |
|---------|---------|
| `PF_Cmd_SEQUENCE_SETUP` | Init instance data |
| `PF_Cmd_SEQUENCE_RESETUP` | Reload/duplicate |
| `PF_Cmd_SEQUENCE_FLATTEN` | Prepare for save |
| `PF_Cmd_SEQUENCE_SETDOWN` | Cleanup |

### Frame (Per Frame)

| Command | Purpose |
|---------|---------|
| `PF_Cmd_FRAME_SETUP` | Allocate, set size |
| `PF_Cmd_RENDER` | Render pixels (basic) |
| `PF_Cmd_FRAME_SETDOWN` | Free frame data |

### SmartFX

| Command | Purpose |
|---------|---------|
| `PF_Cmd_SMART_PRE_RENDER` | Declare inputs |
| `PF_Cmd_SMART_RENDER` | Render (SmartFX) |
| `PF_Cmd_SMART_RENDER_GPU` | GPU render |

### Messaging

| Command | Purpose |
|---------|---------|
| `PF_Cmd_EVENT` | UI events |
| `PF_Cmd_USER_CHANGED_PARAM` | Param changed |
| `PF_Cmd_UPDATE_PARAMS_UI` | Refresh UI |
| `PF_Cmd_DO_DIALOG` | Options dialog |

### GPU

| Command | Purpose |
|---------|---------|
| `PF_Cmd_GPU_DEVICE_SETUP` | Init GPU |
| `PF_Cmd_GPU_DEVICE_SETDOWN` | Free GPU |

## Parameter Types

| Type | Macro | Use |
|------|-------|-----|
| Integer slider | `PF_ADD_SLIDER` | Discrete |
| Float slider | `PF_ADD_FLOAT_SLIDERX` | Continuous |
| Fixed slider | `PF_ADD_FIX_SLIDER` | Precise |
| Angle | `PF_ADD_ANGLE` | Rotation |
| Checkbox | `PF_ADD_CHECKBOX` | Boolean |
| Color | `PF_ADD_COLOR` | RGB picker |
| Point | `PF_ADD_POINT` | 2D position |
| Point 3D | `PF_ADD_POINT_3D` | 3D position |
| Popup | `PF_ADD_POPUP` | Dropdown |
| Layer | `PF_ADD_LAYER` | Layer ref |
| Button | `PF_ADD_BUTTON` | Click action |
| Group start | `PF_ADD_TOPIC` | Begin group |
| Group end | `PF_END_TOPIC` | End group |

## Output Flags (out_flags)

| Flag | Purpose |
|------|---------|
| `PF_OutFlag_DEEP_COLOR_AWARE` | 16-bit support |
| `PF_OutFlag_I_EXPAND_BUFFER` | Output > input |
| `PF_OutFlag_I_DO_DIALOG` | Has options |
| `PF_OutFlag_CUSTOM_UI` | Has custom UI |
| `PF_OutFlag_PIX_INDEPENDENT` | Pixels independent |
| `PF_OutFlag_NON_PARAM_VARY` | Random/time vary |
| `PF_OutFlag_WIDE_TIME_INPUT` | Multi-frame |
| `PF_OutFlag_I_USE_AUDIO` | Audio effect |
| `PF_OutFlag_I_USE_SHUTTER_ANGLE` | Motion blur |

## Output Flags 2 (out_flags2)

| Flag | Purpose |
|------|---------|
| `PF_OutFlag2_SUPPORTS_SMART_RENDER` | SmartFX |
| `PF_OutFlag2_FLOAT_COLOR_AWARE` | 32-bit |
| `PF_OutFlag2_SUPPORTS_THREADED_RENDERING` | Multi-thread |
| `PF_OutFlag2_SUPPORTS_GPU_RENDER_F32` | GPU render |
| `PF_OutFlag2_SUPPORTS_QUERY_DYNAMIC_FLAGS` | Dynamic opt |

## Parameter Flags

| Flag | Purpose |
|------|---------|
| `PF_ParamFlag_CANNOT_TIME_VARY` | No keyframes |
| `PF_ParamFlag_SUPERVISE` | Get change notify |
| `PF_ParamFlag_START_COLLAPSED` | Collapsed group |

## UI Flags

| Flag | Purpose |
|------|---------|
| `PF_PUI_INVISIBLE` | Hidden param |
| `PF_PUI_DISABLED` | Grayed out |
| `PF_PUI_NO_ECW_UI` | No Effect Controls |

## Pixel Types

| Type | Depth | Range |
|------|-------|-------|
| `PF_Pixel8` | 8-bit | 0-255 |
| `PF_Pixel16` | 16-bit | 0-32768 |
| `PF_PixelFloat` | 32-bit | 0.0-1.0+ |

### Pixel Structure

```cpp
// All formats: alpha, red, green, blue
PF_Pixel8 {
    A_u_char alpha, red, green, blue;
};
```

## Key Structures

### PF_InData (Input)

```cpp
in_data->effect_ref     // Effect reference
in_data->current_time   // Frame time
in_data->time_step      // Frame duration
in_data->time_scale     // Units/second
in_data->width          // Source width
in_data->height         // Source height
in_data->quality        // HI or LO
in_data->global_data    // Plugin data
in_data->sequence_data  // Instance data
in_data->frame_data     // Frame data
```

### PF_OutData (Output)

```cpp
out_data->my_version    // Plugin version
out_data->out_flags     // Capability flags
out_data->out_flags2    // More flags
out_data->num_params    // Parameter count
out_data->global_data   // Return handle
out_data->sequence_data // Return handle
out_data->frame_data    // Return handle
out_data->width         // Output width
out_data->height        // Output height
out_data->origin        // Output origin
out_data->return_msg    // Display message
```

### PF_EffectWorld

```cpp
world->data             // Pixel pointer
world->rowbytes         // Bytes per row
world->width            // Width
world->height           // Height
```

## Common Macros

```cpp
// Clear struct
AEFX_CLR_STRUCT(def);

// Error handling
#define ERR(FUNC) { if (!err) { err = FUNC; } }

// Version
PF_VERSION(major, minor, bug, stage, build)

// Copy string
PF_STRCPY(dest, src);
PF_SPRINTF(dest, format, ...);
```

## Suites

### Effect Suites

| Suite | Purpose |
|-------|---------|
| `PF_HandleSuite1` | Memory alloc |
| `PF_Iterate8Suite1` | 8-bit iterate |
| `PF_Iterate16Suite1` | 16-bit iterate |
| `PF_iterateFloatSuite1` | 32-bit iterate |
| `PF_WorldTransformSuite1` | Copy/blend |
| `PF_EffectCustomUISuite1` | Custom UI |

### AEGP Suites

| Suite | Purpose |
|-------|---------|
| `AEGP_MemorySuite1` | Memory |
| `AEGP_CommandSuite1` | Menu commands |
| `AEGP_ProjectSuite6` | Projects |
| `AEGP_ItemSuite9` | Items |
| `AEGP_CompSuite11` | Compositions |
| `AEGP_LayerSuite9` | Layers |
| `AEGP_StreamSuite5` | Properties |
| `AEGP_KeyframeSuite5` | Keyframes |
| `AEGP_EffectSuite4` | Effects |
| `AEGP_RenderSuite5` | Rendering |

## Acquiring Suites

```cpp
// Effect suite
AEFX_SuiteScoper<PF_HandleSuite1> handleS =
    AEFX_SuiteScoper<PF_HandleSuite1>(
        in_data, kPFHandleSuite, kPFHandleSuiteVersion1);

// AEGP suite
AEGP_SuiteHandler suites(pica_basicP);
AEGP_CompSuite11 *compS = suites.CompSuite11();
```

## Pixel Access

```cpp
// Get pixel at x,y
PF_Pixel8 *p = (PF_Pixel8*)((char*)world->data +
    y * world->rowbytes + x * sizeof(PF_Pixel8));

// Iterate rows
for (A_long y = 0; y < world->height; y++) {
    PF_Pixel8 *row = (PF_Pixel8*)((char*)world->data +
        y * world->rowbytes);
    for (A_long x = 0; x < world->width; x++) {
        PF_Pixel8 *pix = row + x;
        // pix->red, green, blue, alpha
    }
}
```

## PiPL Properties

| Property | Purpose |
|----------|---------|
| `Kind` | Plugin type |
| `Name` | Display name |
| `Category` | Menu category |
| `CodeMacIntel64` | Intel entry |
| `CodeMacARM64` | ARM entry |
| `CodeWin64X86` | Windows entry |
| `AE_Effect_Match_Name` | Unique ID |
| `AE_Effect_Global_OutFlags` | Flags |
| `AE_Effect_Global_OutFlags_2` | More flags |

## Time Values

```cpp
// A_Time structure
typedef struct {
    A_long value;
    A_u_long scale;
} A_Time;

// Convert to seconds
double seconds = (double)time.value / time.scale;

// Current frame
A_long frame = (A_long)(time.value * fps / time.scale);
```

## Error Codes

| Code | Meaning |
|------|---------|
| `PF_Err_NONE` | Success |
| `PF_Err_OUT_OF_MEMORY` | Memory fail |
| `PF_Err_INTERNAL_STRUCT_DAMAGED` | Crash |
| `PF_Interrupt_CANCEL` | User cancel |

## Minimum Effect Template

```cpp
PF_Err main(PF_Cmd cmd, PF_InData *in, PF_OutData *out,
            PF_ParamDef *params[], PF_LayerDef *output, void *extra)
{
    PF_Err err = PF_Err_NONE;
    try {
        switch (cmd) {
            case PF_Cmd_GLOBAL_SETUP:
                out->my_version = PF_VERSION(1,0,0,0,0);
                out->out_flags = PF_OutFlag_DEEP_COLOR_AWARE;
                out->out_flags2 = PF_OutFlag2_SUPPORTS_SMART_RENDER |
                                  PF_OutFlag2_FLOAT_COLOR_AWARE;
                break;
            case PF_Cmd_PARAM_SETUP:
                out->num_params = 1;  // Just input
                break;
            case PF_Cmd_SMART_PRE_RENDER:
                err = PreRender(in, out, (PF_PreRenderExtra*)extra);
                break;
            case PF_Cmd_SMART_RENDER:
                err = Render(in, out, (PF_SmartRenderExtra*)extra);
                break;
        }
    } catch (...) { err = PF_Err_INTERNAL_STRUCT_DAMAGED; }
    return err;
}
```

## Thread Safety (AE 22+)

### UI Thread
- SEQUENCE_SETUP
- USER_CHANGED_PARAM
- DO_DIALOG
- EVENT

### Render Thread
- RENDER
- SMART_PRE_RENDER
- SMART_RENDER

### Multi-Frame Opt-In
```cpp
out_data->out_flags2 |= PF_OutFlag2_SUPPORTS_THREADED_RENDERING;
```
