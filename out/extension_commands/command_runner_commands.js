'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const SplitScript_1 = require("../code-quality/code-quality-base/split-script/SplitScript");
function test_recreate_command_method(context) {
    let editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
        let script = new SplitScript_1.SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        if (script.load(editor.document.fileName, undefined)) {
            if (script.is_valid_script) {
                script.command_runner_test_recreate(context);
            }
        }
    }
}
exports.test_recreate_command_method = test_recreate_command_method;
function set_verbose() {
    let verbose = vscode.workspace.getConfiguration();
    let verbose_value = verbose.get('indeni.commandRunnerVerbose');
    let description_on = '';
    let description_off = '';
    if (verbose_value === true) {
        description_on = 'Current value';
    }
    else {
        description_off = 'Current value';
    }
    let items = [];
    items.push({ label: 'On', description: description_on });
    items.push({ label: 'Off', description: description_off });
    vscode.window.showQuickPick(items, { placeHolder: verbose_value === true ? 'On' : 'Off' }).then((value) => {
        if (value !== undefined) {
            switch (value.label) {
                case 'On':
                    verbose.update('indeni.commandRunnerVerbose', true, true);
                    break;
                case 'Off':
                    verbose.update('indeni.commandRunnerVerbose', false, true);
                    break;
            }
        }
    }, ((reason) => { }));
}
exports.set_verbose = set_verbose;
function test_command_method(context) {
    var editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
        let script = new SplitScript_1.SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        if (script.load(editor.document.fileName, undefined)) {
            if (script.is_valid_script) {
                script.command_runner_test(context);
            }
        }
    }
}
exports.test_command_method = test_command_method;
function full_command_method(context, command_runner_statusbar_item) {
    var editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
        let script = new SplitScript_1.SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        if (script.load(editor.document.fileName, undefined)) {
            if (script.is_valid_script) {
                command_runner_statusbar_item.text = 'Full command: Running';
                command_runner_statusbar_item.show();
                script.command_runner_full_command(context).then((result) => {
                    command_runner_statusbar_item.text = 'Full command: Done';
                }).catch((error) => {
                    command_runner_statusbar_item.text = 'Full command: Done with error';
                });
            }
            else {
                vscode.window.showErrorMessage('Script is not valid');
            }
        }
        else {
            vscode.window.showErrorMessage('Unable to load script ');
        }
    }
}
exports.full_command_method = full_command_method;
function parseonly_command_method(context, command_runner_statusbar_item) {
    var editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
        let script = new SplitScript_1.SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        if (script.load(editor.document.fileName, undefined)) {
            if (script.is_valid_script) {
                command_runner_statusbar_item.text = 'Parse only: Running';
                command_runner_statusbar_item.show();
                script.command_runner_parse(context, script.script_test_folder).then((value) => {
                    command_runner_statusbar_item.text = 'Parse only: Done';
                }).catch((error) => {
                    command_runner_statusbar_item.text = 'Parse only: Done with error';
                });
            }
            else {
                vscode.window.showErrorMessage('Script is not valid');
            }
        }
        else {
            vscode.window.showErrorMessage('Unable to load script ');
        }
    }
}
exports.parseonly_command_method = parseonly_command_method;
function test_create_command_method(context) {
    let editor = vscode.window.activeTextEditor;
    if (editor !== undefined) {
        let script = new SplitScript_1.SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }
        if (script.load(editor.document.fileName, undefined)) {
            if (script.is_valid_script) {
                script.command_runner_test_create(context);
            }
        }
    }
}
exports.test_create_command_method = test_create_command_method;
//# sourceMappingURL=command_runner_commands.js.map