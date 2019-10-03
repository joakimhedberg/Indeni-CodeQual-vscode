"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
class CommandRunnerResultView {
    constructor(resource_path) {
        this.panel = undefined;
        resource_path = path.join(resource_path, 'resources');
        this.resource_path = resource_path;
        this.style_parser_uri = vscode.Uri.file(path.join(this.resource_path, 'crunner_parser.css'));
        this.script_parser_uri = vscode.Uri.file(path.join(this.resource_path, 'crunner_parser.js'));
        this.script_test_uri = vscode.Uri.file(path.join(this.resource_path, 'crunner_test.js'));
        this.script_rulerunner_result_uri = vscode.Uri.file(path.join(this.resource_path, 'rulerunner_result.js'));
    }
    get_panel(title) {
        if (this.panel === undefined) {
            this.panel = vscode.window.createWebviewPanel('commandRunnerResult', title, vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
            this.panel.onDidDispose((e) => { this.panel = undefined; });
            this.panel.webview.onDidReceiveMessage(message => {
                console.log(message);
                switch (message.command) {
                    case 'show_data':
                        if (message.data) {
                            for (let data_string of message.data) {
                                vscode.workspace.openTextDocument({ content: data_string }).then((onfulfilled) => {
                                    vscode.window.showTextDocument(onfulfilled);
                                });
                            }
                        }
                        break;
                }
            });
        }
        if (this.panel !== undefined) {
            if (!this.panel.visible) {
                this.panel.reveal();
            }
        }
        return this.panel;
    }
    show_rulerunner_result(result) {
        let panel = this.get_panel('Rule-runner result');
        panel.webview.html = this.get_parser_html(this.script_rulerunner_result_uri);
        panel.webview.postMessage({ present_rulerunner_result: result });
    }
    show_test_result(result) {
        let panel = this.get_panel('Command-runner test result');
        panel.webview.html = this.get_parser_html(this.script_test_uri);
        panel.webview.postMessage({ present_test_result: result });
    }
    show_error_result(result) {
        let panel = this.get_panel('Errors');
        panel.webview.html = '<html><body><pre>' + result + '</pre></body></html>';
    }
    show_parser_result(result) {
        let panel = this.get_panel('Command-runner parse-only result');
        panel.webview.html = this.get_parser_html(this.script_parser_uri);
        panel.webview.postMessage({ present_parser_result: result });
    }
    get_parser_html(script_uri) {
        return `<html>
        <head>
            <script src="${script_uri.with({ scheme: 'vscode-resource' })}"></script>
            <link rel="stylesheet" href="${this.style_parser_uri.with({ scheme: 'vscode-resource' })}"/>
        </head>
        </html>`;
    }
}
exports.CommandRunnerResultView = CommandRunnerResultView;
//# sourceMappingURL=CommandRunnerResultView.js.map