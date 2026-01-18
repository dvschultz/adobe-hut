---
name: ae-sdk-effects
description: "After Effects SDK effect plugin development: entry point, command selectors, parameters, rendering, and pixel processing."
---

# AE SDK Effect Plugins

Guide for building After Effects effect plugins with the C++ SDK.

## Basic Effect Structure

### Entry Point

```cpp
extern "C" DllExport
PF_Err PluginMain(
    PF_Cmd       cmd,
    PF_InData    *in_data,
    PF_OutData   *out_data,
    PF_ParamDef  *params[],
    PF_LayerDef  *output,
    void         *extra)
{
    PF_Err err = PF_Err_NONE;

    try {
        switch (cmd) {
            case PF_Cmd_ABOUT:
                err = About(in_data, out_data);
                break;
            case PF_Cmd_GLOBAL_SETUP:
                err = GlobalSetup(in_data, out_data);
                break;
            case PF_Cmd_PARAM_SETUP:
                err = ParamsSetup(in_data, out_data);
                break;
            case PF_Cmd_RENDER:
                err = Render(in_data, out_data, params, output);
                break;
            // Add more cases as needed
        }
    } catch (...) {
        err = PF_Err_INTERNAL_STRUCT_DAMAGED;
    }

    return err;
}
```

## Command Handlers

### Global Setup

```cpp
static PF_Err GlobalSetup(PF_InData *in_data, PF_OutData *out_data)
{
    out_data->my_version = PF_VERSION(
        MAJOR_VERSION,
        MINOR_VERSION,
        BUG_VERSION,
        STAGE_VERSION,
        BUILD_VERSION);

    // Capability flags
    out_data->out_flags =
        PF_OutFlag_DEEP_COLOR_AWARE |       // 16-bit support
        PF_OutFlag_PIX_INDEPENDENT;         // Pixels don't depend on each other

    out_data->out_flags2 =
        PF_OutFlag2_SUPPORTS_SMART_RENDER | // SmartFX support
        PF_OutFlag2_FLOAT_COLOR_AWARE;      // 32-bit support

    return PF_Err_NONE;
}
```

### About Dialog

```cpp
static PF_Err About(PF_InData *in_data, PF_OutData *out_data)
{
    PF_SPRINTF(out_data->return_msg,
        "%s v%d.%d\r"
        "Copyright 2024\r"
        "Description here",
        EFFECT_NAME,
        MAJOR_VERSION,
        MINOR_VERSION);

    return PF_Err_NONE;
}
```

## Adding Parameters

### Parameter Setup

```cpp
enum {
    PARAM_INPUT = 0,    // Always the input layer
    PARAM_AMOUNT,
    PARAM_COLOR,
    PARAM_BLEND_MODE,
    PARAM_CHECKBOX,
    NUM_PARAMS
};

static PF_Err ParamsSetup(PF_InData *in_data, PF_OutData *out_data)
{
    PF_Err err = PF_Err_NONE;
    PF_ParamDef def;

    // Float Slider
    AEFX_CLR_STRUCT(def);
    PF_ADD_FLOAT_SLIDERX(
        "Amount",                   // Name
        0.0,                        // Valid min
        100.0,                      // Valid max
        0.0,                        // Slider min
        100.0,                      // Slider max
        50.0,                       // Default
        PF_Precision_HUNDREDTHS,    // Precision
        PF_ValueDisplayFlag_PERCENT,// Display as %
        0,                          // Flags
        PARAM_AMOUNT);

    // Color Picker
    AEFX_CLR_STRUCT(def);
    PF_ADD_COLOR(
        "Color",                    // Name
        255, 128, 0,                // Default RGB (0-255)
        PARAM_COLOR);

    // Popup/Dropdown
    AEFX_CLR_STRUCT(def);
    PF_ADD_POPUP(
        "Blend Mode",               // Name
        5,                          // Num choices
        1,                          // Default (1-indexed)
        "Normal|Add|Multiply|Screen|Overlay",
        PARAM_BLEND_MODE);

    // Checkbox
    AEFX_CLR_STRUCT(def);
    PF_ADD_CHECKBOXX(
        "Enable",                   // Name
        TRUE,                       // Default
        0,                          // Flags
        PARAM_CHECKBOX);

    out_data->num_params = NUM_PARAMS;
    return err;
}
```

### Parameter Types Quick Reference

| Macro | Type | Parameters |
|-------|------|------------|
| `PF_ADD_SLIDER` | Integer | name, min, max, sliderMin, sliderMax, default, id |
| `PF_ADD_FLOAT_SLIDERX` | Float | name, min, max, sliderMin, sliderMax, default, precision, flags, extraFlags, id |
| `PF_ADD_ANGLE` | Angle | name, default, id |
| `PF_ADD_CHECKBOX` | Boolean | name, default, id |
| `PF_ADD_COLOR` | Color | name, r, g, b, id |
| `PF_ADD_POPUP` | Dropdown | name, numChoices, default, choices, id |
| `PF_ADD_POINT` | 2D Point | name, defaultX, defaultY, restrictBounds, id |
| `PF_ADD_POINT_3D` | 3D Point | name, defaultX, defaultY, defaultZ, id |
| `PF_ADD_LAYER` | Layer Ref | name, defaultIndex, id |
| `PF_ADD_BUTTON` | Button | name, buttonLabel, flags, id |

## Rendering

### Basic Render

```cpp
static PF_Err Render(
    PF_InData       *in_data,
    PF_OutData      *out_data,
    PF_ParamDef     *params[],
    PF_LayerDef     *output)
{
    PF_Err err = PF_Err_NONE;
    PF_EffectWorld *input = &params[PARAM_INPUT]->u.ld;

    // Get parameter values
    PF_FpLong amount = params[PARAM_AMOUNT]->u.fs_d.value / 100.0;
    PF_Pixel color = params[PARAM_COLOR]->u.cd.value;

    // Iterate pixels using callback
    AEFX_SuiteScoper<PF_Iterate8Suite1> iterateSuite =
        AEFX_SuiteScoper<PF_Iterate8Suite1>(
            in_data, kPFIterate8Suite, kPFIterate8SuiteVersion1, out_data);

    ERR(iterateSuite->iterate(
        in_data,
        0,                          // Progress base
        output->height,             // Progress total
        input,                      // Source
        NULL,                       // Area (NULL = whole)
        (void*)&amount,             // Refcon (custom data)
        MyPixelFunc,                // Callback function
        output));                   // Destination

    return err;
}
```

### Pixel Callback Function

```cpp
static PF_Err MyPixelFunc(
    void        *refcon,
    A_long      x,
    A_long      y,
    PF_Pixel8   *inP,
    PF_Pixel8   *outP)
{
    PF_Err err = PF_Err_NONE;
    PF_FpLong amount = *((PF_FpLong*)refcon);

    // Process pixel
    outP->alpha = inP->alpha;
    outP->red   = (A_u_char)(inP->red * amount);
    outP->green = (A_u_char)(inP->green * amount);
    outP->blue  = (A_u_char)(inP->blue * amount);

    return err;
}
```

### 16-bit Pixel Callback

```cpp
static PF_Err MyPixelFunc16(
    void        *refcon,
    A_long      x,
    A_long      y,
    PF_Pixel16  *inP,
    PF_Pixel16  *outP)
{
    PF_Err err = PF_Err_NONE;
    PF_FpLong amount = *((PF_FpLong*)refcon);

    // 16-bit max is 32768
    outP->alpha = inP->alpha;
    outP->red   = (A_u_short)(inP->red * amount);
    outP->green = (A_u_short)(inP->green * amount);
    outP->blue  = (A_u_short)(inP->blue * amount);

    return err;
}
```

## Accessing Pixel Data Directly

```cpp
// Get pixel at specific location
PF_Pixel8 *pixel = (PF_Pixel8*)((char*)input->data +
    (y * input->rowbytes) + (x * sizeof(PF_Pixel8)));

// Row iteration
for (A_long y = 0; y < input->height; y++) {
    PF_Pixel8 *rowP = (PF_Pixel8*)((char*)input->data + (y * input->rowbytes));
    for (A_long x = 0; x < input->width; x++) {
        PF_Pixel8 *pixP = rowP + x;
        // Process pixP->red, green, blue, alpha
    }
}
```

## Checking Out Other Layers

```cpp
static PF_Err RenderWithLayerCheckout(
    PF_InData       *in_data,
    PF_OutData      *out_data,
    PF_ParamDef     *params[],
    PF_LayerDef     *output)
{
    PF_Err err = PF_Err_NONE;

    // Get layer parameter
    A_long layer_index = params[PARAM_LAYER]->u.ld.dephault;

    if (layer_index != PF_LayerDefault_NONE) {
        PF_ParamDef checkout;
        AEFX_CLR_STRUCT(checkout);

        ERR(PF_CHECKOUT_PARAM(
            in_data,
            PARAM_LAYER,
            in_data->current_time,
            in_data->time_step,
            in_data->time_scale,
            &checkout));

        if (!err && checkout.u.ld.data) {
            PF_EffectWorld *other_layer = &checkout.u.ld;
            // Use other_layer...
        }

        ERR(PF_CHECKIN_PARAM(in_data, &checkout));
    }

    return err;
}
```

## Expand Output Buffer

```cpp
static PF_Err FrameSetup(
    PF_InData       *in_data,
    PF_OutData      *out_data)
{
    // Expand by 50 pixels each direction
    A_long expand = 50;

    out_data->width = in_data->width + expand * 2;
    out_data->height = in_data->height + expand * 2;
    out_data->origin.h = -expand;  // Offset origin
    out_data->origin.v = -expand;

    return PF_Err_NONE;
}
```

## Using World Transform Suite

```cpp
static PF_Err CopyWorld(
    PF_InData       *in_data,
    PF_EffectWorld  *src,
    PF_EffectWorld  *dst)
{
    PF_Err err = PF_Err_NONE;

    AEFX_SuiteScoper<PF_WorldTransformSuite1> transformSuite =
        AEFX_SuiteScoper<PF_WorldTransformSuite1>(
            in_data, kPFWorldTransformSuite, kPFWorldTransformSuiteVersion1);

    ERR(transformSuite->copy(
        in_data->effect_ref,
        src,
        dst,
        NULL,   // Source rect (NULL = all)
        NULL)); // Dest rect (NULL = all)

    return err;
}
```

## Common Patterns

### Parameter Supervision

```cpp
// In ParamsSetup, add SUPERVISE flag
def.flags = PF_ParamFlag_SUPERVISE;

// Handle in PluginMain
case PF_Cmd_USER_CHANGED_PARAM:
    err = HandleParamChange(in_data, out_data, params,
        ((PF_UserChangedParamExtra*)extra)->param_index);
    break;

static PF_Err HandleParamChange(
    PF_InData       *in_data,
    PF_OutData      *out_data,
    PF_ParamDef     *params[],
    A_long          changed_param)
{
    if (changed_param == PARAM_BLEND_MODE) {
        // Update other params based on mode
    }
    return PF_Err_NONE;
}
```

### Options Dialog

```cpp
// In GlobalSetup
out_data->out_flags |= PF_OutFlag_I_DO_DIALOG;

// Handle in PluginMain
case PF_Cmd_DO_DIALOG:
    err = ShowOptionsDialog(in_data, out_data, params);
    break;
```

## PiPL Resource Template

```r
resource 'PiPL' (16000) {
    {
        Kind { AEEffect },
        Name { "My Effect" },
        Category { "My Category" },

        CodeMacIntel64 { "PluginMain" },
        CodeMacARM64 { "PluginMain" },
        CodeWin64X86 { "PluginMain" },

        AE_Effect_Spec_Version { PF_PLUG_IN_VERSION, PF_PLUG_IN_SUBVERS },
        AE_Effect_Version {
            MAJOR_VERSION * 524288 +
            MINOR_VERSION * 32768 +
            BUG_VERSION * 2048 +
            STAGE_VERSION * 512 +
            BUILD_VERSION
        },

        AE_Effect_Global_OutFlags {
            0x00000000
        },
        AE_Effect_Global_OutFlags_2 {
            0x00000000
        },

        AE_Effect_Match_Name { "ADBE MyEffect" },
        AE_Reserved_Info { 8 },
    }
};
```

## Error Handling Macro

```cpp
#define ERR(FUNC) { if (!err) { err = FUNC; } }

// Usage
PF_Err err = PF_Err_NONE;
ERR(FirstFunction());
ERR(SecondFunction());
ERR(ThirdFunction());
return err;  // Returns first error encountered
```
