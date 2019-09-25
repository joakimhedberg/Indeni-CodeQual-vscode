"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
/*
    Result markers for the checks, check markers really...
*/
class MarkerResult {
    constructor(start_pos, end_pos, tooltip, severity, offset_handled, offending_text) {
        this.code_validation = undefined; // Parent validation of the check
        this.ignore_comments = true;
        this.ignore_quoted = true;
        this.ignore_regexp = false;
        this.is_ignored = false;
        this.start_pos = start_pos;
        this.end_pos = end_pos;
        this.tooltip = tooltip;
        this.offset_handled = offset_handled;
        this.severity = severity;
        this.offending_text = offending_text;
    }
}
exports.MarkerResult = MarkerResult;
class MarkerCollection extends vscode.Disposable {
    constructor(decoration, severity = undefined) {
        super(() => { this.dispose(); });
        this.markers = new Map();
        this.decoration = decoration;
        this.severity = severity;
    }
    clear() {
        this.markers.clear();
    }
    append(marker) {
        if (marker.is_ignored) {
            return;
        }
        if (this.severity !== undefined) {
            if (marker.severity !== this.severity) {
                return;
            }
        }
        let existing = this.markers.get(marker.start_pos);
        if (existing !== undefined) {
            for (let exists of existing) {
                if (exists.end_pos === marker.end_pos && exists.tooltip === marker.tooltip) {
                    return false;
                }
            }
            existing.push(marker);
        }
        else {
            this.markers.set(marker.start_pos, [marker]);
        }
    }
    apply(editor) {
        let decorations = [];
        for (let marker_collection of this.markers) {
            for (let marker of marker_collection[1]) {
                let start_pos = editor.document.positionAt(marker.start_pos);
                let end_pos = editor.document.positionAt(marker.end_pos);
                decorations.push({ range: new vscode.Range(start_pos, end_pos), hoverMessage: marker.tooltip });
            }
        }
        if (this.decoration !== undefined) {
            editor.setDecorations(this.decoration, decorations);
        }
    }
    detach(editor) {
        if (this.decoration !== undefined) {
            editor.setDecorations(this.decoration, []);
        }
    }
    dispose() {
        if (this.decoration !== undefined) {
            this.decoration.dispose();
        }
        this.markers.clear();
    }
}
exports.MarkerCollection = MarkerCollection;
//# sourceMappingURL=MarkerResult.js.map