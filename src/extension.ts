'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { get_sections } from "./code-quality/sections";
import { get_functions, MarkerResult } from './code-quality/code-validation';

let errorDecorationType : vscode.TextEditorDecorationType;
let warningDecorationType : vscode.TextEditorDecorationType;
let infoDecorationType : vscode.TextEditorDecorationType;
let activeEditor : vscode.TextEditor | undefined = undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    errorDecorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'red',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            borderColor: 'red',
        },
        dark: {
            borderColor: 'red'
        }
    });

    warningDecorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'yellow',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            borderColor: '#a29c37'
        },
        dark: {
            borderColor: '#ffff00'
        }
    });

    infoDecorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'blue',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            borderColor: 'blue'
        },
        dark: {
            borderColor: '#00cccc'
        }
    });

    activeEditor = vscode.window.activeTextEditor;
    /*if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => 
        {
            activeEditor = editor;
            if (activeEditor)
            {
                triggerUpdateDecorations();
            }
        }, null, context.subscriptions);


    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document)
        {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);*/

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.triggerUpdate', () => { updateDecorations(); });
    context.subscriptions.push(disposable);
}

function updateDecorations() {
    activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return;
    }
    
    const text = activeEditor.document.getText();
    let sections = get_sections(text);

    console.log("Sections.meta: " + (sections.meta !== null));
    console.log("Sections.comments: " + (sections.comments !== null));
    console.log("Sections.awk: " + (sections.awk !== null));
    console.log("Sections.json: " + (sections.json !== null));
    console.log("Sections.xml: " + (sections.xml !== null));

    let quality_functions = get_functions();
    const warnings : vscode.DecorationOptions[] = [];
    const errors : vscode.DecorationOptions[] = [];
    const information : vscode.DecorationOptions[] = [];

    for (let sect of sections.all) {
        let marks = sect.get_marks(quality_functions, sections);
        if (marks.length > 0) {
            for (let mark of marks) {
                switch (mark.severity) {
                    case "warning":
                        warnings.push(create_decoration(activeEditor, mark));
                    break;
                    case "error":
                        errors.push(create_decoration(activeEditor, mark));
                    break;
                    case "information":
                        information.push(create_decoration(activeEditor, mark));
                    break;
                }
            }
        }
    }


    activeEditor.setDecorations(warningDecorationType, warnings);
    activeEditor.setDecorations(errorDecorationType, errors);
    activeEditor.setDecorations(infoDecorationType, information);
}

function create_decoration(editor : vscode.TextEditor, marker : MarkerResult) {
    const start_pos = editor.document.positionAt(marker.start_pos);
    const end_pos = editor.document.positionAt(marker.end_pos);
    return { range: new vscode.Range(start_pos, end_pos), hoverMessage: marker.tooltip };
}

/*function create_decoration(editor : vscode.TextEditor, tooltiptext : string, start : number, end : number) {
    const start_pos = editor.document.positionAt(start);
    const end_pos = editor.document.positionAt(end);
    return { range: new vscode.Range(start_pos, end_pos), hoverMessage: tooltiptext };
}*/

// this method is called when your extension is deactivated
export function deactivate() {
}