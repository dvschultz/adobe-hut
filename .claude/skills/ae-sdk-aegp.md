---
name: ae-sdk-aegp
description: "After Effects SDK AEGP plugin development: function suites, menu commands, project manipulation, and automation."
---

# AE SDK AEGP Plugins

Guide for building After Effects General Plug-ins (AEGPs) with the C++ SDK.

## AEGP Overview

AEGPs extend After Effects beyond effect processing:
- Add menu items and commands
- Modify project structure
- Create dockable panels
- Manage markers, keyframes, render queue
- Import/export custom formats

## Basic AEGP Structure

### Entry Point

```cpp
extern "C" DllExport
A_Err GPMain_Entry(
    struct SPBasicSuite    *pica_basicP,
    A_long                  major_versionL,
    A_long                  minor_versionL,
    AEGP_PluginID          aegp_plugin_id,
    AEGP_GlobalRefcon      *global_refconP)
{
    A_Err err = A_Err_NONE;

    // Store plugin ID for later use
    S_my_id = aegp_plugin_id;

    // Initialize suites
    AEGP_SuiteHandler suites(pica_basicP);

    // Register commands, hooks, etc.
    ERR(RegisterMenuCommands(suites));

    return err;
}
```

## Function Suites

### Suite Handler Pattern

```cpp
// Create suite handler
AEGP_SuiteHandler suites(pica_basicP);

// Access suites
AEGP_CompSuite11     *compS = suites.CompSuite11();
AEGP_LayerSuite9     *layerS = suites.LayerSuite9();
AEGP_ProjectSuite6   *projS = suites.ProjectSuite6();
AEGP_ItemSuite9      *itemS = suites.ItemSuite9();
```

## Key Suites

### Memory Suite

```cpp
AEGP_MemorySuite1 *memS = suites.MemorySuite1();

// Allocate memory
AEGP_MemHandle memH;
ERR(memS->AEGP_NewMemHandle(
    S_my_id,
    "My Allocation",
    size,
    AEGP_MemFlag_CLEAR,
    &memH));

// Lock and use
void *ptr;
ERR(memS->AEGP_LockMemHandle(memH, &ptr));
// Use ptr...
ERR(memS->AEGP_UnlockMemHandle(memH));

// Free
ERR(memS->AEGP_FreeMemHandle(memH));
```

### Command Suite

```cpp
AEGP_CommandSuite1 *cmdS = suites.CommandSuite1();

// Get unique command ID
AEGP_Command myCommand;
ERR(cmdS->AEGP_GetUniqueCommand(&myCommand));

// Insert menu item
ERR(cmdS->AEGP_InsertMenuCommand(
    myCommand,
    "My Command",
    AEGP_Menu_WINDOW,      // Menu location
    AEGP_MENU_INSERT_SORTED));

// Set command hook
ERR(suites.RegisterSuite5()->AEGP_RegisterCommandHook(
    S_my_id,
    AEGP_HP_BeforeAE,
    myCommand,
    CommandHook,
    NULL));
```

### Command Hook Function

```cpp
static A_Err CommandHook(
    AEGP_GlobalRefcon  plugin_refcon,
    AEGP_CommandRefcon command_refcon,
    AEGP_Command       command,
    AEGP_HookPriority  hook_priority,
    A_Boolean          already_handled,
    A_Boolean          *handled)
{
    A_Err err = A_Err_NONE;

    if (command == myCommand) {
        ERR(DoMyCommand());
        *handled = TRUE;
    }

    return err;
}
```

### Project Suite

```cpp
AEGP_ProjectSuite6 *projS = suites.ProjectSuite6();

// Get current project
AEGP_ProjectH projH;
ERR(projS->AEGP_GetProjectByIndex(0, &projH));

// Get project path
AEGP_MemHandle pathH;
ERR(projS->AEGP_GetProjectPath(projH, &pathH));

// Get project name
A_char name[AEGP_MAX_PROJ_NAME_SIZE];
ERR(projS->AEGP_GetProjectName(projH, name));

// Save project
ERR(projS->AEGP_SaveProjectToPath(projH, pathH));
```

### Item Suite

```cpp
AEGP_ItemSuite9 *itemS = suites.ItemSuite9();

// Get item count
A_long numItems;
ERR(itemS->AEGP_GetNumItems(&numItems));

// Iterate items
for (A_long i = 0; i < numItems; i++) {
    AEGP_ItemH itemH;
    ERR(itemS->AEGP_GetItemByIndex(i, &itemH));

    // Get item type
    AEGP_ItemType type;
    ERR(itemS->AEGP_GetItemType(itemH, &type));

    // Get item name
    AEGP_MemHandle nameH;
    ERR(itemS->AEGP_GetItemName(S_my_id, itemH, &nameH));
}
```

### Composition Suite

```cpp
AEGP_CompSuite11 *compS = suites.CompSuite11();

// Get most recent comp
AEGP_CompH compH;
ERR(compS->AEGP_GetMostRecentlyUsedComp(&compH));

// Get comp info
A_long width, height;
A_Ratio par;
A_Time duration;
ERR(compS->AEGP_GetCompDimensions(compH, &width, &height));
ERR(compS->AEGP_GetCompPixelAspectRatio(compH, &par));
ERR(compS->AEGP_GetCompDuration(compH, &duration));

// Create new comp
AEGP_CompH newCompH;
ERR(compS->AEGP_CreateComp(
    NULL,           // Parent folder (NULL = root)
    "New Comp",     // Name
    1920,           // Width
    1080,           // Height
    &par,           // Pixel aspect ratio
    &duration,      // Duration
    &frameRate,     // Frame rate
    &newCompH));
```

### Layer Suite

```cpp
AEGP_LayerSuite9 *layerS = suites.LayerSuite9();

// Get layer count
A_long numLayers;
ERR(layerS->AEGP_GetCompNumLayers(compH, &numLayers));

// Get layer by index
AEGP_LayerH layerH;
ERR(layerS->AEGP_GetCompLayerByIndex(compH, 0, &layerH));

// Get layer name
AEGP_MemHandle nameH;
ERR(layerS->AEGP_GetLayerName(S_my_id, layerH, &nameH, NULL));

// Get layer type
AEGP_ObjectType type;
ERR(layerS->AEGP_GetLayerObjectType(layerH, &type));

// Get layer duration
A_Time inPoint, duration;
ERR(layerS->AEGP_GetLayerInPointAndDuration(layerH, &inPoint, &duration));

// Set layer name
ERR(layerS->AEGP_SetLayerName(layerH, "New Name"));
```

### Stream Suite (Properties)

```cpp
AEGP_StreamSuite5 *streamS = suites.StreamSuite5();

// Get property stream
AEGP_StreamRefH streamH;
ERR(streamS->AEGP_GetNewLayerStream(
    S_my_id,
    layerH,
    AEGP_LayerStream_POSITION,
    &streamH));

// Get stream value
AEGP_StreamValue val;
ERR(streamS->AEGP_GetNewStreamValue(
    S_my_id,
    streamH,
    AEGP_LTimeMode_LayerTime,
    &currentTime,
    FALSE,          // Pre-expression
    &val));

// Position is 3D point
A_FloatPoint3 pos = val.val.three_d;

// Dispose
ERR(streamS->AEGP_DisposeStreamValue(&val));
ERR(streamS->AEGP_DisposeStream(streamH));
```

### Keyframe Suite

```cpp
AEGP_KeyframeSuite5 *keyS = suites.KeyframeSuite5();

// Get keyframe count
A_long numKeys;
ERR(keyS->AEGP_GetStreamNumKFs(streamH, &numKeys));

// Get keyframe time
A_Time keyTime;
ERR(keyS->AEGP_GetKeyframeTime(streamH, 0, AEGP_LTimeMode_LayerTime, &keyTime));

// Add keyframe
AEGP_KeyframeIndex newIdx;
ERR(keyS->AEGP_InsertKeyframe(
    streamH,
    AEGP_LTimeMode_LayerTime,
    &newTime,
    &newIdx));

// Set keyframe value
ERR(keyS->AEGP_SetKeyframeValue(streamH, newIdx, &newValue));

// Set interpolation
ERR(keyS->AEGP_SetKeyframeInterpolation(
    streamH,
    newIdx,
    AEGP_KeyInterp_BEZIER,  // In type
    AEGP_KeyInterp_BEZIER)); // Out type
```

### Effect Suite

```cpp
AEGP_EffectSuite4 *effectS = suites.EffectSuite4();

// Get effect count on layer
A_long numEffects;
ERR(effectS->AEGP_GetLayerNumEffects(layerH, &numEffects));

// Get effect by index
AEGP_EffectRefH effectH;
ERR(effectS->AEGP_GetLayerEffectByIndex(S_my_id, layerH, 0, &effectH));

// Get effect name
AEGP_MemHandle nameH;
ERR(effectS->AEGP_GetEffectName(effectH, &nameH));

// Apply effect by match name
AEGP_InstalledEffectKey key;
ERR(effectS->AEGP_GetInstalledKeyFromLayerEffect(effectH, &key));

AEGP_EffectRefH newEffectH;
ERR(effectS->AEGP_ApplyEffect(S_my_id, layerH, key, &newEffectH));

// Dispose
ERR(effectS->AEGP_DisposeEffect(effectH));
```

### Render Suite

```cpp
AEGP_RenderSuite5 *renderS = suites.RenderSuite5();

// Set up render options
AEGP_RenderOptionsH optionsH;
ERR(renderS->AEGP_NewFromItem(S_my_id, itemH, &optionsH));

// Render frame
AEGP_FrameReceiptH receiptH;
ERR(renderS->AEGP_RenderAndCheckoutFrame(
    optionsH,
    NULL,           // Render options
    NULL,           // World options
    &receiptH));

// Get rendered world
AEGP_WorldH worldH;
ERR(renderS->AEGP_GetReceiptWorld(receiptH, &worldH));

// Get pixel data
PF_EffectWorld *effectWorld;
ERR(suites.WorldSuite3()->AEGP_GetBaseAddr32(worldH, &effectWorld));

// Check in when done
ERR(renderS->AEGP_CheckinFrame(receiptH));
ERR(renderS->AEGP_Dispose(optionsH));
```

### Render Queue Suite

```cpp
AEGP_RenderQueueSuite1 *rqS = suites.RenderQueueSuite1();

// Get render queue
AEGP_RenderQueueH rqH;
ERR(rqS->AEGP_GetRenderQueue(&rqH));

// Get item count
A_long numItems;
ERR(rqS->AEGP_GetNumRQItems(&numItems));

// Add item to queue
AEGP_RQItemRefH rqItemH;
ERR(rqS->AEGP_AddCompToRenderQueue(compH, NULL, &rqItemH));

// Render
ERR(rqS->AEGP_RenderQueueStartRendering(NULL));
```

## Creating Dockable Panels (CC+)

```cpp
AEGP_PanelSuite1 *panelS = suites.PanelSuite1();

// Register panel
ERR(panelS->AEGP_RegisterCreatePanelHook(
    S_my_id,
    "My Panel",
    CreatePanelHook,
    NULL,
    TRUE));     // Dockable

// Panel hook
static A_Err CreatePanelHook(
    AEGP_GlobalRefcon    global_refcon,
    AEGP_CreatePanelRefcon create_panel_refcon,
    AEGP_PlatformViewRef platform_view,
    AEGP_PanelH          panelH,
    AEGP_PanelFunctions  *panel_functionsP,
    AEGP_PanelRefcon     *panel_refconP)
{
    // Create panel content using platform_view
    return A_Err_NONE;
}
```

## Idle Hooks

```cpp
// Register idle hook
ERR(suites.RegisterSuite5()->AEGP_RegisterIdleHook(
    S_my_id,
    IdleHook,
    NULL));

static A_Err IdleHook(
    AEGP_GlobalRefcon   plugin_refcon,
    AEGP_IdleRefcon     idle_refcon,
    A_long              *max_sleep)
{
    // Called during idle
    // Set *max_sleep to ms before next call
    *max_sleep = 1000;  // 1 second
    return A_Err_NONE;
}
```

## Update Menu Hooks

```cpp
// Register update menu hook
ERR(suites.RegisterSuite5()->AEGP_RegisterUpdateMenuHook(
    S_my_id,
    UpdateMenuHook,
    NULL));

static A_Err UpdateMenuHook(
    AEGP_GlobalRefcon     plugin_refcon,
    AEGP_UpdateMenuRefcon menu_refcon,
    AEGP_WindowType       active_window)
{
    // Enable/disable commands based on context
    AEGP_CommandSuite1 *cmdS = suites.CommandSuite1();

    A_Boolean enable = (active_window == AEGP_Window_COMP);
    ERR(cmdS->AEGP_EnableCommand(myCommand, enable));

    return A_Err_NONE;
}
```

## PiPL for AEGP

```r
resource 'PiPL' (16000) {
    {
        Kind { AEGeneral },
        Name { "My AEGP" },

        CodeMacIntel64 { "GPMain_Entry" },
        CodeMacARM64 { "GPMain_Entry" },
        CodeWin64X86 { "GPMain_Entry" },

        AE_Effect_Match_Name { "ADBE MyAEGP" },
    }
};
```

## Common Patterns

### Find Composition by Name

```cpp
static A_Err FindCompByName(
    const A_char    *name,
    AEGP_CompH      *compPH)
{
    A_Err err = A_Err_NONE;
    AEGP_SuiteHandler suites(S_pica_basicP);

    A_long numItems;
    ERR(suites.ItemSuite9()->AEGP_GetNumItems(&numItems));

    for (A_long i = 0; i < numItems && !*compPH; i++) {
        AEGP_ItemH itemH;
        ERR(suites.ItemSuite9()->AEGP_GetItemByIndex(i, &itemH));

        AEGP_ItemType type;
        ERR(suites.ItemSuite9()->AEGP_GetItemType(itemH, &type));

        if (type == AEGP_ItemType_COMP) {
            AEGP_MemHandle nameH;
            ERR(suites.ItemSuite9()->AEGP_GetItemName(S_my_id, itemH, &nameH));

            A_char *nameP;
            ERR(suites.MemorySuite1()->AEGP_LockMemHandle(nameH, (void**)&nameP));

            if (strcmp(nameP, name) == 0) {
                ERR(suites.CompSuite11()->AEGP_GetCompFromItem(itemH, compPH));
            }

            ERR(suites.MemorySuite1()->AEGP_FreeMemHandle(nameH));
        }
    }

    return err;
}
```

### Iterate All Layers

```cpp
static A_Err ProcessAllLayers(AEGP_CompH compH)
{
    A_Err err = A_Err_NONE;
    AEGP_SuiteHandler suites(S_pica_basicP);

    A_long numLayers;
    ERR(suites.LayerSuite9()->AEGP_GetCompNumLayers(compH, &numLayers));

    for (A_long i = 0; i < numLayers; i++) {
        AEGP_LayerH layerH;
        ERR(suites.LayerSuite9()->AEGP_GetCompLayerByIndex(compH, i, &layerH));

        // Process layer...
    }

    return err;
}
```
