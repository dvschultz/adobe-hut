---
name: ae-text-replace
description: "Find and replace text content in After Effects text layers across compositions."
---

# AE Text Replace

Find and replace text content in text layers across selected or all compositions.

## What This Skill Does

Searches for text content in After Effects text layers and replaces it with new text. Can operate on:

- Selected layers only
- Active composition only
- All compositions in project

## Main Script

```javascript
#target aftereffects

(function() {

    // ========== UI ==========

    function showDialog() {
        var dlg = new Window("dialog", "Find and Replace Text");

        dlg.orientation = "column";
        dlg.alignChildren = ["fill", "top"];

        // Find field
        var findGroup = dlg.add("group");
        findGroup.add("statictext", undefined, "Find:");
        var findInput = findGroup.add("edittext", undefined, "");
        findInput.characters = 30;

        // Replace field
        var replaceGroup = dlg.add("group");
        replaceGroup.add("statictext", undefined, "Replace:");
        var replaceInput = replaceGroup.add("edittext", undefined, "");
        replaceInput.characters = 30;

        // Options
        var optionsPanel = dlg.add("panel", undefined, "Scope");
        optionsPanel.alignChildren = ["left", "top"];

        var scopeRadios = optionsPanel.add("group");
        scopeRadios.orientation = "column";
        scopeRadios.alignChildren = ["left", "top"];

        var scopeSelected = scopeRadios.add("radiobutton", undefined, "Selected layers only");
        var scopeActiveComp = scopeRadios.add("radiobutton", undefined, "Active composition");
        var scopeAllComps = scopeRadios.add("radiobutton", undefined, "All compositions");
        scopeActiveComp.value = true;

        // Case sensitivity
        var caseSensitive = dlg.add("checkbox", undefined, "Case sensitive");
        caseSensitive.value = false;

        // Preview/maintain styling
        var maintainStyle = dlg.add("checkbox", undefined, "Maintain text styling");
        maintainStyle.value = true;

        // Buttons
        var btnGroup = dlg.add("group");
        btnGroup.add("button", undefined, "Replace All", { name: "ok" });
        btnGroup.add("button", undefined, "Cancel", { name: "cancel" });

        if (dlg.show() !== 1) {
            return null;
        }

        return {
            find: findInput.text,
            replace: replaceInput.text,
            scope: scopeSelected.value ? "selected" :
                   scopeActiveComp.value ? "activeComp" : "allComps",
            caseSensitive: caseSensitive.value,
            maintainStyle: maintainStyle.value
        };
    }

    // ========== REPLACE FUNCTIONS ==========

    function replaceInTextLayer(layer, findText, replaceText, caseSensitive, maintainStyle) {
        if (!(layer instanceof TextLayer)) return 0;

        var sourceText = layer.property("Source Text");
        var textDoc = sourceText.value;
        var originalText = textDoc.text;
        var newText;

        if (caseSensitive) {
            if (originalText.indexOf(findText) === -1) return 0;
            newText = originalText.split(findText).join(replaceText);
        } else {
            var regex = new RegExp(escapeRegex(findText), "gi");
            if (!regex.test(originalText)) return 0;
            newText = originalText.replace(regex, replaceText);
        }

        if (newText === originalText) return 0;

        textDoc.text = newText;
        sourceText.setValue(textDoc);
        return 1;
    }

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function processComposition(comp, findText, replaceText, caseSensitive, maintainStyle) {
        var count = 0;
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            count += replaceInTextLayer(layer, findText, replaceText, caseSensitive, maintainStyle);
        }
        return count;
    }

    function processSelectedLayers(comp, findText, replaceText, caseSensitive, maintainStyle) {
        var count = 0;
        var selected = comp.selectedLayers;
        for (var i = 0; i < selected.length; i++) {
            count += replaceInTextLayer(selected[i], findText, replaceText, caseSensitive, maintainStyle);
        }
        return count;
    }

    function processAllCompositions(findText, replaceText, caseSensitive, maintainStyle) {
        var count = 0;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem) {
                count += processComposition(item, findText, replaceText, caseSensitive, maintainStyle);
            }
        }
        return count;
    }

    // ========== MAIN ==========

    function main() {
        var options = showDialog();
        if (!options) return;

        if (options.find === "") {
            alert("Please enter text to find.");
            return;
        }

        app.beginUndoGroup("Find and Replace Text");
        try {
            var count = 0;

            if (options.scope === "selected") {
                var comp = app.project.activeItem;
                if (!(comp instanceof CompItem)) {
                    alert("Please select a composition.");
                    return;
                }
                count = processSelectedLayers(comp, options.find, options.replace,
                                               options.caseSensitive, options.maintainStyle);
            } else if (options.scope === "activeComp") {
                var comp = app.project.activeItem;
                if (!(comp instanceof CompItem)) {
                    alert("Please select a composition.");
                    return;
                }
                count = processComposition(comp, options.find, options.replace,
                                           options.caseSensitive, options.maintainStyle);
            } else {
                count = processAllCompositions(options.find, options.replace,
                                               options.caseSensitive, options.maintainStyle);
            }

            alert("Replaced text in " + count + " layer(s).");

        } catch (e) {
            alert("Error: " + e.message);
        }
        app.endUndoGroup();
    }

    main();

})();
```

## Usage

When the user invokes `/ae-text-replace`, provide the script above or a customized version. The script includes a dialog for:

- **Find**: Text to search for
- **Replace**: Replacement text
- **Scope**: Selected layers, active comp, or all comps
- **Case sensitive**: Toggle case sensitivity
- **Maintain styling**: Keep existing text formatting

## Example Requests

- "Replace all instances of '2024' with '2025' in my project"
- "Find and replace company name in all text layers"
- "Change 'Lorem Ipsum' to actual copy in selected text layers"
- "Replace placeholder text across all compositions"

## Notes

- The script uses string splitting/joining for case-sensitive replacement
- For case-insensitive replacement, it uses regex with escaped special characters
- Text styling (font, size, color) is preserved by modifying only the text property
- Works with both static and animated text (replaces at all keyframes would require additional handling)
