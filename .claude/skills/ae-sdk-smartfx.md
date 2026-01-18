---
name: ae-sdk-smartfx
description: "After Effects SDK SmartFX development: 32-bit rendering, pre-render phase, efficient partial rendering, and GPU effects."
---

# AE SDK SmartFX

Guide for implementing SmartFX in After Effects plugins for 32-bit and efficient rendering.

## What is SmartFX?

SmartFX is an extension of the effect API that provides:
- **32-bit per channel (float) support** - Full HDR/linear color
- **Efficient partial rendering** - Process only needed pixels
- **Bidirectional communication** - Effects declare input requirements
- **GPU rendering support** - Native GPU acceleration

## Requirements

To implement SmartFX:

1. Set `PF_OutFlag2_SUPPORTS_SMART_RENDER` in GLOBAL_SETUP
2. Handle `PF_Cmd_SMART_PRE_RENDER` command
3. Handle `PF_Cmd_SMART_RENDER` command

```cpp
static PF_Err GlobalSetup(PF_InData *in_data, PF_OutData *out_data)
{
    out_data->out_flags = PF_OutFlag_DEEP_COLOR_AWARE;

    out_data->out_flags2 =
        PF_OutFlag2_SUPPORTS_SMART_RENDER |  // Required
        PF_OutFlag2_FLOAT_COLOR_AWARE;       // For 32-bit

    return PF_Err_NONE;
}
```

## Two-Phase Rendering Model

### Phase 1: Pre-Render (`PF_Cmd_SMART_PRE_RENDER`)

The effect declares what input it needs:
- What area of input pixels
- What layers to check out
- Output bounds

### Phase 2: Render (`PF_Cmd_SMART_RENDER`)

The effect produces output using only pre-declared inputs.

## Pre-Render Implementation

```cpp
static PF_Err SmartPreRender(
    PF_InData           *in_data,
    PF_OutData          *out_data,
    PF_PreRenderExtra   *extra)
{
    PF_Err err = PF_Err_NONE;
    PF_RenderRequest *req = &extra->input->output_request;

    // Checkout input layer
    PF_CheckoutResult checkout;
    ERR(extra->cb->checkout_layer(
        in_data->effect_ref,
        0,                      // Input layer index
        0,                      // Checkout index
        req,                    // Request
        in_data->current_time,
        in_data->time_step,
        in_data->time_scale,
        &checkout));

    // Union with output rects
    UnionLRect(&checkout.result_rect, &extra->output->result_rect);
    UnionLRect(&checkout.max_result_rect, &extra->output->max_result_rect);

    return err;
}
```

### Expanded Input (Blur, Glow effects)

```cpp
static PF_Err SmartPreRenderExpanded(
    PF_InData           *in_data,
    PF_OutData          *out_data,
    PF_PreRenderExtra   *extra)
{
    PF_Err err = PF_Err_NONE;
    PF_RenderRequest *req = &extra->input->output_request;

    // Get blur radius from params
    PF_FpLong radius = GetBlurRadius(in_data);

    // Expand request rect
    PF_RenderRequest expanded_req = *req;
    expanded_req.rect.left   -= (A_long)radius;
    expanded_req.rect.top    -= (A_long)radius;
    expanded_req.rect.right  += (A_long)radius;
    expanded_req.rect.bottom += (A_long)radius;

    // Checkout expanded area
    PF_CheckoutResult checkout;
    ERR(extra->cb->checkout_layer(
        in_data->effect_ref,
        0, 0,
        &expanded_req,
        in_data->current_time,
        in_data->time_step,
        in_data->time_scale,
        &checkout));

    // Set output rects (may be larger than input)
    UnionLRect(&checkout.result_rect, &extra->output->result_rect);
    UnionLRect(&checkout.max_result_rect, &extra->output->max_result_rect);

    return err;
}
```

### Checking Out Other Layers

```cpp
static PF_Err SmartPreRenderWithLayer(
    PF_InData           *in_data,
    PF_OutData          *out_data,
    PF_PreRenderExtra   *extra)
{
    PF_Err err = PF_Err_NONE;
    PF_RenderRequest *req = &extra->input->output_request;

    // Checkout primary input
    PF_CheckoutResult checkout0;
    ERR(extra->cb->checkout_layer(
        in_data->effect_ref,
        0,      // Input layer
        0,      // Checkout index 0
        req,
        in_data->current_time,
        in_data->time_step,
        in_data->time_scale,
        &checkout0));

    // Checkout secondary layer (e.g., displacement map)
    PF_CheckoutResult checkout1;
    ERR(extra->cb->checkout_layer(
        in_data->effect_ref,
        PARAM_LAYER,    // Layer param index
        1,              // Checkout index 1
        req,
        in_data->current_time,
        in_data->time_step,
        in_data->time_scale,
        &checkout1));

    // Union both results
    UnionLRect(&checkout0.result_rect, &extra->output->result_rect);
    UnionLRect(&checkout0.max_result_rect, &extra->output->max_result_rect);

    return err;
}
```

### Storing Pre-Render Data

```cpp
typedef struct {
    PF_FpLong   amount;
    A_long      blur_radius;
    A_Boolean   use_gpu;
} PreRenderData;

static PF_Err SmartPreRender(
    PF_InData           *in_data,
    PF_OutData          *out_data,
    PF_PreRenderExtra   *extra)
{
    PF_Err err = PF_Err_NONE;

    // Allocate pre-render data
    PreRenderData *preData = new PreRenderData;

    // Store values needed during render
    preData->amount = GetAmount(in_data);
    preData->blur_radius = GetBlurRadius(in_data);
    preData->use_gpu = CanUseGPU(extra);

    // Store in extra for render phase
    extra->output->pre_render_data = preData;

    // Continue with checkout...

    return err;
}
```

## Render Implementation

```cpp
static PF_Err SmartRender(
    PF_InData               *in_data,
    PF_OutData              *out_data,
    PF_SmartRenderExtra     *extra)
{
    PF_Err err = PF_Err_NONE;

    // Retrieve pre-render data
    PreRenderData *preData = (PreRenderData*)extra->input->pre_render_data;

    // Checkout input pixels
    PF_EffectWorld *input_world = NULL;
    ERR(extra->cb->checkout_layer_pixels(
        in_data->effect_ref,
        0,      // Checkout index from pre-render
        &input_world));

    // Checkout output buffer
    PF_EffectWorld *output_world = NULL;
    ERR(extra->cb->checkout_output(
        in_data->effect_ref,
        &output_world));

    // Determine bit depth
    PF_PixelFormat format;
    ERR(PF_GetPixelFormat(output_world, &format));

    switch (format) {
        case PF_PixelFormat_ARGB32:
            ERR(Render8(in_data, input_world, output_world, preData));
            break;
        case PF_PixelFormat_ARGB64:
            ERR(Render16(in_data, input_world, output_world, preData));
            break;
        case PF_PixelFormat_ARGB128:
            ERR(Render32(in_data, input_world, output_world, preData));
            break;
    }

    // Checkin input
    ERR(extra->cb->checkin_layer_pixels(in_data->effect_ref, 0));

    // Free pre-render data
    delete preData;

    return err;
}
```

### 32-bit (Float) Rendering

```cpp
static PF_Err Render32(
    PF_InData       *in_data,
    PF_EffectWorld  *input,
    PF_EffectWorld  *output,
    PreRenderData   *preData)
{
    PF_Err err = PF_Err_NONE;

    // Use iterate32 suite
    AEFX_SuiteScoper<PF_iterateFloatSuite1> iterateSuite =
        AEFX_SuiteScoper<PF_iterateFloatSuite1>(
            in_data, kPFIterateFloatSuite, kPFIterateFloatSuiteVersion1);

    ERR(iterateSuite->iterate(
        in_data,
        0,
        output->height,
        input,
        NULL,
        preData,
        PixelFunc32,
        output));

    return err;
}

static PF_Err PixelFunc32(
    void            *refcon,
    A_long          x,
    A_long          y,
    PF_PixelFloat   *inP,
    PF_PixelFloat   *outP)
{
    PreRenderData *data = (PreRenderData*)refcon;

    // Float values are 0.0 - 1.0 (but can exceed for HDR)
    outP->alpha = inP->alpha;
    outP->red   = inP->red * data->amount;
    outP->green = inP->green * data->amount;
    outP->blue  = inP->blue * data->amount;

    return PF_Err_NONE;
}
```

## GPU Rendering

### Requirements

1. Set `PF_OutFlag2_SUPPORTS_GPU_RENDER_F32`
2. Handle `PF_Cmd_GPU_DEVICE_SETUP`
3. Handle `PF_Cmd_SMART_RENDER_GPU`
4. Handle `PF_Cmd_GPU_DEVICE_SETDOWN`

### GPU Device Setup

```cpp
static PF_Err GPUDeviceSetup(
    PF_InData               *in_data,
    PF_OutData              *out_data,
    PF_GPUDeviceSetupExtra  *extra)
{
    PF_Err err = PF_Err_NONE;

    // Check GPU framework
    if (extra->input->what_gpu == PF_GPU_Framework_CUDA) {
        // Initialize CUDA
        extra->output->gpu_data = InitCUDA(extra->input->device_index);
    }
    else if (extra->input->what_gpu == PF_GPU_Framework_OPENCL) {
        // Initialize OpenCL
        extra->output->gpu_data = InitOpenCL(extra->input->device_index);
    }
    else if (extra->input->what_gpu == PF_GPU_Framework_METAL) {
        // Initialize Metal
        extra->output->gpu_data = InitMetal(extra->input->device_index);
    }

    return err;
}
```

### GPU Render

```cpp
static PF_Err SmartRenderGPU(
    PF_InData               *in_data,
    PF_OutData              *out_data,
    PF_SmartRenderExtra     *extra)
{
    PF_Err err = PF_Err_NONE;

    // Get GPU data
    void *gpu_data = extra->input->gpu_data;

    // Checkout GPU input
    PF_EffectWorld *input_gpu = NULL;
    ERR(extra->cb->checkout_layer_pixels(
        in_data->effect_ref,
        0,
        &input_gpu));

    // Checkout GPU output
    PF_EffectWorld *output_gpu = NULL;
    ERR(extra->cb->checkout_output(
        in_data->effect_ref,
        &output_gpu));

    // Render on GPU
    switch (extra->input->what_gpu) {
        case PF_GPU_Framework_CUDA:
            ERR(RenderCUDA(gpu_data, input_gpu, output_gpu));
            break;
        case PF_GPU_Framework_METAL:
            ERR(RenderMetal(gpu_data, input_gpu, output_gpu));
            break;
        case PF_GPU_Framework_OPENCL:
            ERR(RenderOpenCL(gpu_data, input_gpu, output_gpu));
            break;
    }

    // Checkin
    ERR(extra->cb->checkin_layer_pixels(in_data->effect_ref, 0));

    return err;
}
```

### GPU Device Setdown

```cpp
static PF_Err GPUDeviceSetdown(
    PF_InData                   *in_data,
    PF_OutData                  *out_data,
    PF_GPUDeviceSetdownExtra    *extra)
{
    // Free GPU resources
    if (extra->input->gpu_data) {
        FreeGPUResources(extra->input->gpu_data);
    }

    return PF_Err_NONE;
}
```

## Result Rect Rules

### result_rect
The bounding box of non-transparent output pixels for the current request.

### max_result_rect
The bounding box of non-transparent output pixels if the entire layer were requested.

**Critical:** `max_result_rect` must be identical regardless of which output area is requested.

```cpp
// Wrong - depends on request
extra->output->max_result_rect = requested_rect;

// Right - always the full extent
extra->output->max_result_rect = full_layer_extent;
```

## Pre-Render Extra Structures

### PF_PreRenderInput

```cpp
typedef struct {
    PF_RenderRequest    output_request;  // What AE wants
    A_short             bitdepth;        // 8, 16, or 32
    void                *gpu_data;       // GPU context
    PF_GPU_Framework    what_gpu;        // GPU framework
    A_u_long            device_index;    // GPU device
} PF_PreRenderInput;
```

### PF_PreRenderOutput

```cpp
typedef struct {
    PF_LRect            result_rect;     // Set this!
    PF_LRect            max_result_rect; // Set this!
    PF_Boolean          solid;           // Output is solid
    PF_Boolean          reserved;
    PF_RenderOutputFlags flags;
    void                *pre_render_data;// Store data here
} PF_PreRenderOutput;
```

## Best Practices

### 1. Always Check Result

```cpp
if (!checkout.result_rect.left && !checkout.result_rect.right) {
    // Empty result - nothing to render
    return err;
}
```

### 2. Handle Zero-Alpha Pixels

```cpp
// Some effects need empty pixels for glow, etc.
out_data->out_flags |= PF_OutFlag_REVEALS_ZERO_ALPHA;
```

### 3. Free Pre-Render Data

```cpp
// In SmartRender
if (extra->input->pre_render_data) {
    delete (PreRenderData*)extra->input->pre_render_data;
}
```

### 4. Preserve Alpha

```cpp
// Don't forget alpha in 32-bit
outP->alpha = inP->alpha;
```

## Entry Point Example

```cpp
PF_Err PluginMain(
    PF_Cmd          cmd,
    PF_InData       *in_data,
    PF_OutData      *out_data,
    PF_ParamDef     *params[],
    PF_LayerDef     *output,
    void            *extra)
{
    PF_Err err = PF_Err_NONE;

    try {
        switch (cmd) {
            case PF_Cmd_GLOBAL_SETUP:
                err = GlobalSetup(in_data, out_data);
                break;
            case PF_Cmd_PARAM_SETUP:
                err = ParamsSetup(in_data, out_data);
                break;
            case PF_Cmd_SMART_PRE_RENDER:
                err = SmartPreRender(in_data, out_data,
                    (PF_PreRenderExtra*)extra);
                break;
            case PF_Cmd_SMART_RENDER:
                err = SmartRender(in_data, out_data,
                    (PF_SmartRenderExtra*)extra);
                break;
            case PF_Cmd_GPU_DEVICE_SETUP:
                err = GPUDeviceSetup(in_data, out_data,
                    (PF_GPUDeviceSetupExtra*)extra);
                break;
            case PF_Cmd_SMART_RENDER_GPU:
                err = SmartRenderGPU(in_data, out_data,
                    (PF_SmartRenderExtra*)extra);
                break;
            case PF_Cmd_GPU_DEVICE_SETDOWN:
                err = GPUDeviceSetdown(in_data, out_data,
                    (PF_GPUDeviceSetdownExtra*)extra);
                break;
        }
    } catch (...) {
        err = PF_Err_INTERNAL_STRUCT_DAMAGED;
    }

    return err;
}
```
