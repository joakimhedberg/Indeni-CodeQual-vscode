'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const IndeniRule_1 = require("../code-quality/code-quality-base/rule/IndeniRule");
const CommandRunnerResultView_1 = require("../gui/CommandRunnerResultView");
const IndeniRuleCreator_1 = require("../code-quality/code-quality-base/rule/IndeniRuleCreator");
const RuleInputBuilder_1 = require("../code-quality/rule-runner/results/RuleInputBuilder");
function create_rule() {
    if (vscode.workspace.workspaceFolders !== undefined) {
        let folder = vscode.workspace.workspaceFolders[0];
        let creator = new IndeniRuleCreator_1.IndeniRuleCreator(folder.uri.fsPath);
        creator.load().then((data) => {
            creator.get_yaml_rule().then((yaml) => {
                vscode.workspace.openTextDocument({ content: yaml, language: 'yaml' }).then(onfulfilled => {
                    if (vscode.window.activeTextEditor !== undefined) {
                        vscode.window.showTextDocument(onfulfilled);
                    }
                }, onrejected => {
                });
            });
        });
    }
}
exports.create_rule = create_rule;
function create_rulerunner_input() {
    let default_uri = undefined;
    if (vscode.window.activeTextEditor !== undefined) {
        default_uri = vscode.Uri.file(vscode.window.activeTextEditor.document.fileName);
    }
    vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, openLabel: 'Open output test file', defaultUri: default_uri }).then(value => {
        if (value === undefined) {
            return;
        }
        let filename = value[0].fsPath;
        let input_builder = new RuleInputBuilder_1.RuleInputBuilder();
        input_builder.from_time_series_output(filename).then(result => {
            if (result !== undefined) {
                vscode.workspace.openTextDocument({ content: result, language: 'yaml' }).then(onfulfilled => {
                    if (vscode.window.activeTextEditor !== undefined) {
                        vscode.window.showTextDocument(onfulfilled);
                    }
                }, onrejected => {
                });
            }
        }).catch(err => {
            console.error(err);
        });
    });
}
exports.create_rulerunner_input = create_rulerunner_input;
function compile_command(extension_path, command_runner_statusbar_item) {
    var editor = vscode.window.activeTextEditor;
    command_runner_statusbar_item.show();
    command_runner_statusbar_item.text = "Rule runner: Running";
    command_runner_statusbar_item.tooltip = "";
    if (editor !== undefined) {
        let rule = new IndeniRule_1.IndeniRule(editor.document.fileName);
        rule.RuleRunnerCompile().then(value => {
            if (value !== undefined) {
                if (value.has_error) {
                    command_runner_statusbar_item.text = 'Rule Runner: Failed';
                    command_runner_statusbar_item.tooltip = value.error_data;
                    console.log(value.error_data);
                }
                else {
                    vscode.window.showInformationMessage('Rule runner: Success');
                    command_runner_statusbar_item.text = 'Rule runner: Success';
                    command_runner_statusbar_item.tooltip = "Rule compiled successfully";
                }
                let view = new CommandRunnerResultView_1.CommandRunnerResultView(extension_path);
                view.show_rulerunner_result(value);
            }
            else {
                vscode.window.showErrorMessage('Rule runner: Failed');
                command_runner_statusbar_item.text = 'Rule runner: Failed';
            }
        }).catch((error => {
            vscode.window.showErrorMessage(error);
            command_runner_statusbar_item.text = "Rule runner: Failed";
            command_runner_statusbar_item.tooltip = error;
            console.log(error);
        }));
    }
}
exports.compile_command = compile_command;
//# sourceMappingURL=rulerunner_commands.js.map