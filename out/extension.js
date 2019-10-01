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
const commandrunner_commands = require("./extension_commands/command_runner_commands");
const rulerunner_commands = require("./extension_commands/rulerunner_commands");
const hover_providers_1 = require("./extension_commands/hover_providers");
const misc_commands_1 = require("./extension_commands/misc_commands");
let error_collection;
let warning_collection;
let information_collection;
let debug_collection;
let live_update = true;
let quality_view;
const quality_functions = new code_validation_1.CodeValidations();
let split_validations = new SplitScriptValidationCollection_1.SplitScriptValidationCollection();
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    exports.command_runner_statusbar_item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
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
    let yaml_rule_provider = hover_providers_1.create_yaml_provider();
    let awk_provider = hover_providers_1.create_awk_provider();
    let set_commandrunner_verbose_command = vscode.commands.registerCommand('extension.setCommandRunnerVerbose', () => { commandrunner_commands.set_verbose(); });
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
    let create_python_parser_command = vscode.commands.registerCommand('extension.createPythonParserCommand', () => {
        misc_commands_1.create_python_template(context).then((data) => {
            vscode.workspace.openTextDocument({ content: data, language: 'python' }).then((doc) => {
                vscode.window.showTextDocument(doc);
            });
        }).catch((err) => {
            vscode.window.showErrorMessage(err);
        });
    });
    let create_indeni_rule = vscode.commands.registerCommand('extension.createRuleCommand', () => { rulerunner_commands.create_rule(); });
    let rule_runner_create_input_command = vscode.commands.registerCommand('extension.createRuleRunnerInput', () => { rulerunner_commands.create_rulerunner_input(); });
    let run_rulerunner_compile_command = vscode.commands.registerCommand('extension.triggerRuleRunnerCompile', () => { rulerunner_commands.compile_command(context.extensionPath, exports.command_runner_statusbar_item); });
    let commandrunner_test_command = vscode.commands.registerCommand('extension.commandRunnerTest', () => { commandrunner_commands.test_command_method(context); });
    let commandrunner_test_create_command = vscode.commands.registerCommand('extension.commandRunnerTestCreate', () => { commandrunner_commands.test_create_command_method(context); });
    let commandrunner_test_recreate_command = vscode.commands.registerCommand('extension.commandRunnerTestReCreate', () => { commandrunner_commands.test_recreate_command_method(context); });
    let commandrunner_parseonly_command = vscode.commands.registerCommand('extension.commandRunnerParseOnly', () => { commandrunner_commands.parseonly_command_method(context, exports.command_runner_statusbar_item); });
    let commandrunner_full_command = vscode.commands.registerCommand('extension.commandRunnerFullCommand', () => { commandrunner_commands.full_command_method(context, exports.command_runner_statusbar_item); });
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
    context.subscriptions.push(create_python_parser_command);
    context.subscriptions.push(trigger_clear_command);
    context.subscriptions.push(trigger_update_command);
    context.subscriptions.push(enable_disable_live_command);
    context.subscriptions.push(set_language_command);
    context.subscriptions.push(go_to_command);
    context.subscriptions.push(commandrunner_test_command);
    context.subscriptions.push(commandrunner_parseonly_command);
    context.subscriptions.push(commandrunner_full_command);
    context.subscriptions.push(commandrunner_test_create_command);
    context.subscriptions.push(commandrunner_test_recreate_command);
    context.subscriptions.push(run_rulerunner_compile_command);
    context.subscriptions.push(rule_runner_create_input_command);
    context.subscriptions.push(set_commandrunner_verbose_command);
    context.subscriptions.push(awk_provider);
    context.subscriptions.push(yaml_rule_provider);
    context.subscriptions.push(create_indeni_rule);
}
exports.activate = activate;
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