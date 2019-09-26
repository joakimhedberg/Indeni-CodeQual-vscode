import { CommandRunnerParseOnlyResult } from "../command-runner/results/CommandRunnerParseOnlyResult";
import * as vscode from 'vscode';
import * as path from 'path';
import { CommandRunnerTestRunResult } from "../command-runner/results/CommandRunnerTestRunResult";
import { RuleRunnerCompileResult } from "../code-quality/rule-runner/results/RuleRunnerCompileResult";

export class CommandRunnerResultView {
    private resource_path : string;
    private panel : vscode.WebviewPanel | undefined = undefined;
    private style_parser_uri : vscode.Uri;
    private script_test_uri : vscode.Uri;
    private script_parser_uri : vscode.Uri;
    private script_rulerunner_result_uri : vscode.Uri;
    public constructor(resource_path : string) {
        resource_path = path.join(resource_path, 'resources');
        this.resource_path = resource_path;
        this.style_parser_uri = vscode.Uri.file(path.join(this.resource_path, 'crunner_parser.css'));
        this.script_parser_uri = vscode.Uri.file(path.join(this.resource_path, 'crunner_parser.js'));
        this.script_test_uri = vscode.Uri.file(path.join(this.resource_path, 'crunner_test.js'));
        this.script_rulerunner_result_uri = vscode.Uri.file(path.join(this.resource_path, 'rulerunner_result.js'));
    }

    private get_panel(title : string) : vscode.WebviewPanel {
        if (this.panel === undefined) {
            this.panel = vscode.window.createWebviewPanel('commandRunnerResult', title, vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
            this.panel.onDidDispose((e : void) => { this.panel = undefined; });
        }


        if (this.panel !== undefined) {
            if (!this.panel.visible) {
                this.panel.reveal();
            }
        }

        return this.panel;
    }

    public show_rulerunner_result(result : RuleRunnerCompileResult) {
        let panel = this.get_panel('Rule-runner result');
        panel.webview.html = this.get_parser_html(this.script_rulerunner_result_uri);
        panel.webview.postMessage({ present_rulerunner_result : result });
    }

    public show_test_result(result : CommandRunnerTestRunResult) {
        let panel = this.get_panel('Command-runner test result');
        panel.webview.html = this.get_parser_html(this.script_test_uri);
        panel.webview.postMessage( { present_test_result: result });
    }

    public show_error_result(result : string) {
        let panel = this.get_panel('Errors');
        panel.webview.html = '<html><body><pre>' + result + '</pre></body></html>';
    }

    public show_parser_result(result : CommandRunnerParseOnlyResult) {
        let panel = this.get_panel('Command-runner parse-only result');
        panel.webview.html = this.get_parser_html(this.script_parser_uri);
        panel.webview.postMessage({ present_parser_result : result });
    }

    get_parser_html(script_uri : vscode.Uri) : string {
        return `<html>
        <head>
            <script src="${script_uri.with({ scheme: 'vscode-resource' })}"></script>
            <link rel="stylesheet" href="${this.style_parser_uri.with({ scheme: 'vscode-resource' })}"/>
        </head>
        </html>`;
    }
}