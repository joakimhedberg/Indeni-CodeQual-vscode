'use strict';
import * as vscode from 'vscode';
import { SplitScript } from '../code-quality/code-quality-base/split-script/SplitScript';

export function test_recreate_command_method(context : vscode.ExtensionContext) {
    let editor = vscode.window.activeTextEditor;
    if (editor !== undefined)
    {
        let script = new SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }

        if (script.load(editor.document.fileName, undefined))
        {
            if (script.is_valid_script)
            {
                script.command_runner_test_recreate(context);
            }
        }
    }
}

export function set_verbose() {
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
        let items : vscode.QuickPickItem[] = [];
        items.push({ label: 'On', description: description_on });
        items.push({ label: 'Off', description: description_off });

        vscode.window.showQuickPick(items, { placeHolder: verbose_value === true? 'On': 'Off' }).then((value) => {
            if (value !== undefined) {
                switch (value.label) {
                    case 'On':
                        verbose.update('indeni.commandRunnerVerbose', true);
                        break;
                    case 'Off':
                        verbose.update('indeni.commandRunnerVerbose', false);
                        break;
                }
            }
        }, ((reason) => {}));
}

export function test_command_method(context : vscode.ExtensionContext) {
    var editor = vscode.window.activeTextEditor;
    if (editor !== undefined)
    {
        let script = new SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }

        if (script.load(editor.document.fileName, undefined))
        {
            if (script.is_valid_script)
            {
                script.command_runner_test(context);
            }
        }
    }
}

export function full_command_method(context : vscode.ExtensionContext, command_runner_statusbar_item : vscode.StatusBarItem) {
    var editor = vscode.window.activeTextEditor;
    if (editor !== undefined)
    {
        let script = new SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }

        if (script.load(editor.document.fileName, undefined))
        {
            
            if (script.is_valid_script) {
                command_runner_statusbar_item.text = 'Full command: Running';
                command_runner_statusbar_item.show();
                script.command_runner_full_command(context).then((result) => {
                    command_runner_statusbar_item.text = 'Full command: Done';
                }).catch((error) => {
                    command_runner_statusbar_item.text = 'Full command: Done with error';
                });
            } else {
                vscode.window.showErrorMessage('Script is not valid');
            }
        }
        else {
            vscode.window.showErrorMessage('Unable to load script ');
        }
    }
}

export function parseonly_command_method(context : vscode.ExtensionContext, command_runner_statusbar_item : vscode.StatusBarItem) {
    var editor = vscode.window.activeTextEditor;
    if (editor !== undefined)
    {
        let script = new SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }

        if (script.load(editor.document.fileName, undefined))
        {
            if (script.is_valid_script)
            {
                command_runner_statusbar_item.text = 'Parse only: Running';
                command_runner_statusbar_item.show();
                script.command_runner_parse(context, script.script_test_folder).then((value) => {
                    command_runner_statusbar_item.text = 'Parse only: Done';
                }).catch((error) => {
                    command_runner_statusbar_item.text = 'Parse only: Done with error';
                });
            } else {
                vscode.window.showErrorMessage('Script is not valid');
            }
        }
        else {
            vscode.window.showErrorMessage('Unable to load script ');
        }
    }
}

export function test_create_command_method(context : vscode.ExtensionContext) {
    let editor = vscode.window.activeTextEditor;
    if (editor !== undefined)
    {
        let script = new SplitScript();
        let editor = vscode.window.activeTextEditor;
        if (editor === undefined) {
            return;
        }

        if (script.load(editor.document.fileName, undefined))
        {
            if (script.is_valid_script)
            {
                script.command_runner_test_create(context);
            }
        }
    }
}