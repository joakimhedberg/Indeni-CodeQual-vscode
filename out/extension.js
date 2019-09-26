'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const sections_1 = require("./code-quality/sections");
const code_validation_1 = require("./code-quality/code-validation");
const MarkerResult_1 = require("./code-quality/code-quality-base/MarkerResult");
const path = require("path");
const fs = require("fs");
const CodeQualityView_1 = require("./gui/CodeQualityView");
const SplitScript_1 = require("./code-quality/code-quality-base/split-script/SplitScript");
const SplitScriptValidationCollection_1 = require("./code-quality/code-quality-base/split-script/validations/SplitScriptValidationCollection");
const CodeValidation_1 = require("./code-quality/code-quality-base/CodeValidation");
const write_functions_1 = require("./resources/hover_documentation/write_functions");
const IndeniRule_1 = require("./code-quality/code-quality-base/rule/IndeniRule");
const RuleInputBuilder_1 = require("./code-quality/rule-runner/results/RuleInputBuilder");
const CommandRunnerResultView_1 = require("./gui/CommandRunnerResultView");
let error_collection;
let warning_collection;
let information_collection;
let debug_collection;
let live_update = true;
let quality_view;
const quality_functions = new code_validation_1.CodeValidations();
let split_validations = new SplitScriptValidationCollection_1.SplitScriptValidationCollection();
let command_runner_statusbar_item;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    command_runner_statusbar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    quality_view = new CodeQualityView_1.CodeQualityView(path.join(context.extensionPath, 'resources'));
    let error_decoration_type = vscode.window.createTextEditorDecorationType({
        fontWeight: 'bold',
        borderWidth: '0px 0px 2px 0px',
        borderStyle: 'dashed',
        overviewRulerColor: { id: 'extension.errorBorderColor' },
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            borderColor: { id: 'extension.errorBorderColor' }
        },
        dark: {
            borderColor: { id: 'extension.errorBorderColor' }
        }
    });
    error_collection = new MarkerResult_1.MarkerCollection(error_decoration_type);
    let warning_decoration_type = vscode.window.createTextEditorDecorationType({
        fontWeight: 'bold',
        borderWidth: '0px 0px 2px 0px',
        borderStyle: 'dashed',
        overviewRulerColor: { id: 'extension.warningBorderColor' },
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            borderColor: { id: 'extension.warningBorderColor' }
        },
        dark: {
            borderColor: { id: 'extension.warningBorderColor' }
        }
    });
    warning_collection = new MarkerResult_1.MarkerCollection(warning_decoration_type);
    let info_decoration_type = vscode.window.createTextEditorDecorationType({
        fontWeight: 'bold',
        borderWidth: '0px 0px 2px 0px',
        borderStyle: 'dashed',
        overviewRulerColor: { id: 'extension.informationBorderColor' },
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            borderColor: { id: 'extension.informationBorderColor' },
        },
        dark: {
            borderColor: { id: 'extension.informationBorderColor' },
        }
    });
    information_collection = new MarkerResult_1.MarkerCollection(info_decoration_type);
    let debug_decoration_type = vscode.window.createTextEditorDecorationType({
        borderWidth: '2px',
        borderStyle: 'dashed',
        borderColor: 'pink'
    });
    debug_collection = new MarkerResult_1.MarkerCollection(debug_decoration_type);
    vscode.window.onDidChangeActiveTextEditor(text_editor_changed);
    vscode.workspace.onDidChangeTextDocument(text_document_changed);
    let trigger_update_command = vscode.commands.registerCommand('extension.triggerUpdate', () => {
        var editor = vscode.window.activeTextEditor;
        if (editor !== null && editor !== undefined) {
            updateDecorations(editor.document, true);
        }
    });
    vscode.languages.registerHoverProvider('awk', {
        provideHover(document, position, token) {
            let range = document.getWordRangeAtPosition(position);
            let text = document.getText(range);
            if (text.startsWith('writeDoubleMetric')) {
                return {
                    contents: write_functions_1.DOC_WRITE_DOUBLE_METRIC
                };
            }
            else if (text.startsWith("writeComplexMetricString")) {
                return {
                    contents: write_functions_1.DOC_WRITE_COMPLEX_METRIC_STRING
                };
            }
            else if (text.startsWith("writeComplexMetricObjectArray")) {
                return {
                    contents: write_functions_1.DOC_WRITE_COMPLEX_METRIC_ARRAY
                };
            }
            else if (text.startsWith("writeDebug")) {
                return {
                    contents: write_functions_1.DOC_WRITE_DEBUG
                };
            }
            else if (text.startsWith("writeTag")) {
                return {
                    contents: write_functions_1.DOC_WRITE_TAG
                };
            }
        }
    });
    let set_commandrunner_verbose_command = vscode.commands.registerCommand('extension.setCommandRunnerVerbose', () => {
        //this.commandrunner_path = vscode.workspace.getConfiguration().get('indeni.commandRunnerPath');
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
                        verbose.update('indeni.commandRunnerVerbose', true);
                        break;
                    case 'Off':
                        verbose.update('indeni.commandRunnerVerbose', false);
                        break;
                }
            }
        }, ((reason) => { }));
    });
    let set_language_command = vscode.commands.registerCommand('extension.setLanguage', () => {
        var editor = vscode.window.activeTextEditor;
        if (editor !== undefined) {
            setLanguage(editor.document);
        }
    });
    let trigger_clear_command = vscode.commands.registerCommand('extension.triggerClear', () => {
        var editor = vscode.window.activeTextEditor;
        if (editor !== undefined) {
            clearDecorations(editor);
        }
    });
    let rule_runner_create_input_command = vscode.commands.registerCommand('extension.createRuleRunnerInput', () => {
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
    });
    let run_rulerunner_compile_command = vscode.commands.registerCommand('extension.triggerRuleRunnerCompile', () => {
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
                    let view = new CommandRunnerResultView_1.CommandRunnerResultView(context.extensionPath);
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
    });
    let commandrunner_test_command = vscode.commands.registerCommand('extension.commandRunnerTest', () => { commandrunner_test_command_method(context); });
    let commandrunner_test_create_command = vscode.commands.registerCommand('extension.commandRunnerTestCreate', () => { command_runner__test_create_command_method(context); });
    let commandrunner_parseonly_command = vscode.commands.registerCommand('extension.commandRunnerParseOnly', () => { commandrunner_parseonly_command_method(context); });
    let commandrunner_full_command = vscode.commands.registerCommand('extension.commandRunnerFullCommand', () => { command_runner_full_command_method(context); });
    let enable_disable_live_command = vscode.commands.registerCommand('extension.toggleLive', () => {
        live_update = !live_update;
        var editor = vscode.window.activeTextEditor;
        if (live_update) {
            vscode.window.showInformationMessage("Code quality: Live update enabled");
            if (editor !== undefined) {
                if (editor.document !== undefined) {
                    updateDecorations(editor.document);
                }
            }
        }
        else {
            vscode.window.showInformationMessage("Code quality: Live update disabled");
            if (editor !== undefined) {
                clearDecorations(editor);
            }
        }
    });
    let go_to_command = vscode.commands.registerCommand('extension.revealTestCommand', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor !== undefined) {
            let filename = path.dirname(editor.document.fileName);
            let dest_folder = undefined;
            let is_test = false;
            if (filename.includes("parsers/src") || filename.includes("parsers\\src")) {
                dest_folder = find_test_root(filename.replace("parsers/src", "parsers/test").replace("parsers\\src", "parsers\\test"));
                is_test = true;
            }
            else if (filename.includes("parsers/test") || filename.includes("parsers\\test")) {
                let root = find_test_root(filename);
                if (root !== undefined) {
                    dest_folder = root.replace("parsers/test", "parsers/src").replace("parsers\\test", "parsers\\src");
                    is_test = false;
                }
            }
            else {
                return;
            }
            if (dest_folder !== undefined && fs.existsSync(dest_folder)) {
                let new_dest = path.resolve(dest_folder, 'test.json');
                if (!is_test) {
                    new_dest = fs.readdirSync(dest_folder).find(o => o.endsWith('.ind.yaml')) || '';
                    new_dest = path.resolve(dest_folder, new_dest);
                }
                if (fs.existsSync(new_dest)) {
                    vscode.workspace.openTextDocument(new_dest).then((res => {
                        vscode.window.showTextDocument(res);
                    }));
                    return;
                }
                let uri = vscode.Uri.file(dest_folder);
                vscode.window.showOpenDialog({ "defaultUri": uri }).then((value) => {
                    if (value !== undefined) {
                        vscode.workspace.openTextDocument(value[0].fsPath).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            }
            else {
                vscode.window.showWarningMessage("'" + dest_folder + "' does not seem to exist");
            }
        }
        vscode.commands.executeCommand('workbench.files.action.showActiveFileInExplorer');
    });
    context.subscriptions.push(trigger_clear_command);
    context.subscriptions.push(trigger_update_command);
    context.subscriptions.push(enable_disable_live_command);
    context.subscriptions.push(set_language_command);
    context.subscriptions.push(go_to_command);
    context.subscriptions.push(commandrunner_test_command);
    context.subscriptions.push(commandrunner_parseonly_command);
    context.subscriptions.push(commandrunner_full_command);
    context.subscriptions.push(commandrunner_test_create_command);
    context.subscriptions.push(run_rulerunner_compile_command);
    context.subscriptions.push(rule_runner_create_input_command);
    context.subscriptions.push(set_commandrunner_verbose_command);
}
exports.activate = activate;
function command_runner__test_create_command_method(context) {
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
function commandrunner_test_command_method(context) {
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
function command_runner_full_command_method(context) {
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
function commandrunner_parseonly_command_method(context) {
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
function find_test_root(filepath, level = 0) {
    let test_json = path.join(filepath, 'test.json');
    if (fs.existsSync(test_json)) {
        return filepath;
    }
    filepath = path.resolve(filepath, '..');
    if (fs.existsSync(path.join(filepath, 'test.json'))) {
        return filepath;
    }
    return undefined;
}
function text_document_changed(change) {
    if (live_update) {
        updateDecorations(change.document);
    }
}
function text_editor_changed(editor) {
    if (editor !== undefined) {
        if (live_update) {
            updateDecorations(editor.document);
        }
    }
}
function setLanguage(document) {
    if (!document) {
        return;
    }
    const text = document.getText();
    let sections = sections_1.get_sections(text);
    if (sections.is_valid()) {
        if (sections.awk !== null) {
            if (document.languageId !== "awk") {
                vscode.languages.setTextDocumentLanguage(document, "awk");
            }
        }
        else if (sections.xml !== null || sections.json !== null) {
            if (document.languageId !== "yaml") {
                vscode.languages.setTextDocumentLanguage(document, "yaml");
            }
        }
    }
}
function is_indeni_script(document) {
    if (document === undefined) {
        return IndeniScriptType.none;
    }
    let tmp = new SplitScript_1.SplitScript();
    if (tmp.load(document.fileName, document.getText())) {
        return IndeniScriptType.split;
    }
    if (document.fileName.toLowerCase().endsWith(".ind")) {
        return IndeniScriptType.normal;
    }
    return IndeniScriptType.none;
}
function clearDecorations(editor) {
    if (!editor) {
        return;
    }
    warning_collection.detach(editor);
    error_collection.detach(editor);
    information_collection.detach(editor);
    debug_collection.detach(editor);
}
function updateDecorations(document, manual = false) {
    let editor = vscode.window.activeTextEditor;
    if (editor === null || editor === undefined) {
        return;
    }
    if (document === undefined) {
        return;
    }
    let is_script = is_indeni_script(document);
    if (is_script === IndeniScriptType.none) {
        return;
    }
    warning_collection.clear();
    error_collection.clear();
    debug_collection.clear();
    information_collection.clear();
    if (is_script === IndeniScriptType.normal) {
        const text = document.getText();
        let sections = sections_1.get_sections(text);
        if (!sections.is_valid()) {
            return;
        }
        quality_functions.apply(sections);
        for (let warning of quality_functions.warning_markers) {
            warning_collection.append(warning);
        }
        for (let error of quality_functions.error_markers) {
            error_collection.append(error);
        }
        for (let info of quality_functions.information_markers) {
            information_collection.append(info);
        }
        quality_view.show_web_view(quality_functions, manual, editor);
    }
    else if (is_script === IndeniScriptType.split) {
        let split_script = new SplitScript_1.SplitScript();
        if (!split_script.load(document.fileName, document.getText())) {
            return;
        }
        let markers = split_validations.apply(split_script);
        for (let marker of markers) {
            switch (marker.severity) {
                case CodeValidation_1.FunctionSeverity.error:
                    error_collection.append(marker);
                    break;
                case CodeValidation_1.FunctionSeverity.warning:
                    warning_collection.append(marker);
                    break;
                case CodeValidation_1.FunctionSeverity.information:
                    information_collection.append(marker);
                    break;
            }
        }
        quality_view.show_web_view_split(split_validations, manual, editor);
    }
    warning_collection.apply(editor);
    error_collection.apply(editor);
    information_collection.apply(editor);
    debug_collection.apply(editor);
}
// this method is called when the extension is deactivated
function deactivate() {
    warning_collection.dispose();
    error_collection.dispose();
    information_collection.dispose();
    debug_collection.dispose();
}
exports.deactivate = deactivate;
var IndeniScriptType;
(function (IndeniScriptType) {
    IndeniScriptType[IndeniScriptType["normal"] = 0] = "normal";
    IndeniScriptType[IndeniScriptType["split"] = 1] = "split";
    IndeniScriptType[IndeniScriptType["none"] = 2] = "none";
})(IndeniScriptType || (IndeniScriptType = {}));
//# sourceMappingURL=extension.js.map