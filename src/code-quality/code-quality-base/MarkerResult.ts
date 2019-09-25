import { FunctionSeverity, CodeValidation } from "./CodeValidation";

import * as vscode from 'vscode';
/*
    Result markers for the checks, check markers really...
*/
export class MarkerResult {
    start_pos : number; // Start position of the error, in relation to the entire script
    end_pos : number; // End position of the error, in relation to the entire script
    start_line : number | undefined; // Start line of the error, used when reporting the issue in the GUI
    end_line : number | undefined; // End line of the error, used when reporting the issue in the GUI
    tooltip : string; // Tooltip text when hovering over the issue
    offset_handled : boolean; // Set this to true when the offset(in relation to the entire script) is handled.
    severity : FunctionSeverity; // Severity of the check
    code_validation : CodeValidation | undefined = undefined; // Parent validation of the check
    offending_text : string; // The text that has been grabbed while doing the check
    public ignore_comments : boolean = true;
    public ignore_quoted : boolean = true;
    public ignore_regexp : boolean = false;
    public is_ignored : boolean = false;

    constructor(start_pos : number, end_pos : number, tooltip : string, severity : FunctionSeverity, offset_handled : boolean, offending_text : string) {
        this.start_pos = start_pos;
        this.end_pos = end_pos;
        this.tooltip = tooltip;
        this.offset_handled = offset_handled;
        this.severity = severity;
        this.offending_text = offending_text;
    }
}

export class MarkerCollection extends vscode.Disposable {
    markers : Map<number, MarkerResult[]> = new Map();
    decoration : vscode.TextEditorDecorationType | undefined;
    severity : FunctionSeverity | undefined;
    constructor(decoration : vscode.TextEditorDecorationType | undefined, severity : FunctionSeverity | undefined = undefined) {
        super(() => { this.dispose(); });
        this.decoration = decoration;
        this.severity = severity;
    }

    public clear() {
        this.markers.clear();
    }

    public append(marker : MarkerResult) {
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

    public apply(editor : vscode.TextEditor)
    {
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

    public detach(editor : vscode.TextEditor) {
        if (this.decoration !== undefined) {
            editor.setDecorations(this.decoration, []);
        }
    }

    public dispose() {
        if (this.decoration !== undefined) {
            this.decoration.dispose();
        }
        this.markers.clear();
    }
}