import * as vscode from 'vscode';
import { CodeValidations } from '../code-quality/code-validation';
import { CodeValidation } from '../code-quality/code-quality-base/CodeValidation';
import * as path from 'path';
import { SplitScriptValidationCollection } from '../code-quality/code-quality-base/split-script/validations/SplitScriptValidationCollection';
import { SplitScriptValidationBase } from '../code-quality/code-quality-base/split-script/validations/functions/SplitScriptValidationBase';

// View for the code validations. Uses VS Code WebView which might not be optimal. Still gives a pretty nice result though.
export class CodeQualityView {
    private panel : vscode.WebviewPanel | undefined = undefined;
    private resource_path : string;
    private script_uri : vscode.Uri;
    private style_uri : vscode.Uri;
    private split_script_uri : vscode.Uri;
    private split_style_uri : vscode.Uri;

    constructor(resource_path : string) {
        this.resource_path = resource_path;
        this.script_uri = vscode.Uri.file(path.join(this.resource_path, 'webview.js'));
        this.style_uri = vscode.Uri.file(path.join(this.resource_path, 'webview.css'));
        this.split_style_uri = vscode.Uri.file(path.join(this.resource_path, 'webview_split.css'));
        this.split_script_uri = vscode.Uri.file(path.join(this.resource_path, 'webview_split.js'));
    }

    public show_web_view_split(validations : SplitScriptValidationCollection, manual : boolean, editor : vscode.TextEditor) {
        if (this.panel === undefined && manual) {
            this.panel = vscode.window.createWebviewPanel("codeQualityView", "Indeni code quality result", vscode.ViewColumn.Beside, { enableScripts: true });
            this.panel.onDidDispose((e : void) => { this.panel = undefined; });
            this.panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'scroll':
                        if (message.start && message.end && editor !== undefined) {
                            let doc = editor.document;
                            let pos1 = doc.positionAt(message.start);
                            let pos2 = doc.positionAt(message.end);
                            let rng = new vscode.Range(pos1, pos2);
                            if (editor.document.validateRange(rng)) {
                                editor.revealRange(rng);
                                editor.selection = new vscode.Selection(pos1, pos2);
                            }
                        }
                        break;
                }
            }, undefined);
        }

        if (this.panel !== undefined) {
            //this.panel.webview.html = this.get_html_split(validations);
            this.panel.webview.html = this.get_split_html();
            if (!this.panel.visible) {
                this.panel.reveal(vscode.ViewColumn.Beside);
            }

            this.panel.webview.postMessage({ clean: true });

            for (let validation of validations.validations) {

                let validation_data : { [id : string] : any} = {};
                validation_data['id'] = validation.id;
                validation_data['title'] = validation.title;
                validation_data['severity'] = validation.severity;
                validation_data['tooltip'] = validation.tooltip_from_context();
                validation_data['markers'] = validation.get_filtered_markers();

                if (validation_data.markers.length <= 0) {
                    this.panel.webview.postMessage( { append_compliant: validation_data });
                } else {
                    this.panel.webview.postMessage( { append_noncompliant: validation_data });
                }
            }
        }
    }

    public show_web_view(validations : CodeValidations, manual : boolean, editor : vscode.TextEditor) {
        if (this.panel === undefined && manual) {
            this.panel = vscode.window.createWebviewPanel("codeQualityView", "Indeni code quality result", vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true } );
            this.panel.onDidDispose((e : void) => { this.panel = undefined; });
            this.panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'scroll':
                        if (message.start && message.end) {
                            if (editor !== undefined) {
                                let doc = editor.document;
                                let pos1 = doc.positionAt(message.start);
                                let pos2 = doc.positionAt(message.end);
                                let rng = new vscode.Range(pos1, pos2);
                                if (editor.document.validateRange(rng)) {
                                    editor.revealRange(rng);
                                    editor.selection = new vscode.Selection(pos1, pos2);
                                }
                            }
                        
                        }
                    break;
                }
            }, undefined);
        }

        if (this.panel !== undefined)
        {
            this.panel.webview.html = this.get_html(validations);
            if (!this.panel.visible)
            {
                this.panel.reveal(vscode.ViewColumn.Beside);
            }
        }
    }

    get_html_split(validations : SplitScriptValidationCollection) : string {
        let result : string = "<html><head>";
        let summary_data : { [id : number] : string } = {};
        result += "</head>";
        result += "<body>";
        result += this.get_script();
        result += this.get_style();
        result += '<div class="used" id="validation">Non-compliant</div>';
        let index : number = 0;
        let header_drawn : boolean = false;
        
        for (let validation of validations.validations.sort(this.sort_validation_split)) {
            if (validation.markers.length === 0 && !header_drawn) {
                result += '<div class="unused">Compliant</div>';
                header_drawn = true;
            }
            
            let div_class = header_drawn? "compliant" : validation.severity + " tooltip";
            result += `<div class="${div_class}" onclick="show_summary('${index}');">${validation.title}<span class="validation_result">(${validation.get_filtered_markers().length})</span><span class="tooltiptext">${validation.tooltip_from_context()}</div>`;
            
            let summary = validation.get_summary();
            if (summary.length > 0) {
                summary_data[index] = validation.get_summary();
            }
            index++;
        }

        result += '<div id="summary_parent">';
        for (let data in summary_data) {
            result += `<div id="summary_${data}" class="summary">Summary<br/><pre>${summary_data[data]}</pre></div>`;
        }
        result += '</div>';

        return result + "</body></html>";
    }

    get_html(validations : CodeValidations) : string {
        let result : string = "<html><head>";
        let summary_data : { [id : number] : string } = {};
        result += "</head>";
        result += `<body>`;
        result += this.get_script();
        result += this.get_style();
        result += `<div class="used" id="validation">Non-compliant</div>`;
        let index : number = 0;
        let header_drawn : boolean = false;
        for (let validation of validations.functions.sort(this.sort_validation)) {
            if (validation.applied_markers.length === 0 && !header_drawn) {
                result += `<div class="unused">Compliant</div>`;
                header_drawn = true;
            }
            let div_class = header_drawn? "compliant": validation.severity;
            result += `<div class="${div_class} tooltip" onclick="show_summary('${index}');">${validation.name}<span class="validation_result">(${validation.get_filtered_markers().length})</span><span class="tooltiptext">${validation.reason}</div>`;
            let summary = validation.get_summary();
            if (summary.length > 0) {
                summary_data[index] = validation.get_summary();
            }
            index++;
        }
        
        result += `<div id="summary_parent">`;
        for (let data in summary_data) {
            result += `<div id="summary_${data}" class="summary">Summary<br/><pre>${summary_data[data]}</pre></div>`;
        }
        result += "</div>";

        return result + "</body></html>";
    }

    sort_validation(a : CodeValidation, b : CodeValidation) : number {
        let result = a.applied_markers.length > b.applied_markers.length? -1: a.applied_markers.length < b.applied_markers.length? 1: 0; 
        if (result === 0) {
            result = a.severity > b.severity? 1: a.severity === b.severity? 0: -1;
        }

        return result;
    }

    sort_validation_split(a : SplitScriptValidationBase, b : SplitScriptValidationBase) : number {
        let result = a.markers.length > b.markers.length? -1: a.markers.length < b.markers.length? 1: 0; 
        if (result === 0) {
            result = a.severity > b.severity? 1: a.severity === b.severity? 0: -1;
        }

        return result;
    }

    get_script() : string {
        return `<script src="${this.script_uri.with({ scheme: 'vscode-resource' })}"></script>`;
    }

    get_style() : string {
        return `<link rel="stylesheet" href="${this.style_uri.with({ scheme: 'vscode-resource' })}"/>`;
    }

    get_split_html() {
        return `<html>
        <head>
            <script src="${this.split_script_uri.with({ scheme: 'vscode-resource' })}"></script>
            <link rel="stylesheet" href="${this.split_style_uri.with({ scheme: 'vscode-resource' })}"/>
        </head>
        </html>`;
    }
}