"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const SplitScriptIndSection_1 = require("./sections/SplitScriptIndSection");
const SplitScriptAwkSection_1 = require("./sections/SplitScriptAwkSection");
const SplitScriptXmlSection_1 = require("./sections/SplitScriptXmlSection");
const SplitScriptJsonSection_1 = require("./sections/SplitScriptJsonSection");
const path_1 = require("path");
const CommandRunner_1 = require("../../../command-runner/CommandRunner");
const path = require("path");
const fs = require("fs");
const CommandRunnerResultView_1 = require("../../../gui/CommandRunnerResultView");
const vscode = require("vscode");
const SplitScriptTestCases_1 = require("./test_cases/SplitScriptTestCases");
const SplitScriptPythonSection_1 = require("./sections/SplitScriptPythonSection");
const CommandRunnerAsync_1 = require("../../../command-runner/CommandRunnerAsync");
class SplitScript {
    constructor() {
        // Current open filename
        this.current_filename = '';
        // Current open file extension
        this.current_file_extension = '';
        // File name without path and extension
        this.current_file_basename = '';
        // Full file path without extension
        this.basepath = '';
        // Indeni script path
        this.path = '';
        this.awk_sections = [];
        this.xml_sections = [];
        this.python_sections = [];
        this.json_sections = [];
        this.sections = [];
        this.load_errors = [];
        this.current_section = undefined;
    }
    load(filename, content) {
        if (content === undefined) {
            try {
                content = fs_1.readFileSync(filename).toString();
            }
            catch (error) {
                console.error(error);
                return false;
            }
        }
        this.load_errors = [];
        let filename_match = filename.match(/([^\\/]+)$/g);
        if (filename_match) {
            this.current_filename = filename_match[0];
        }
        else {
            this.load_errors.push('Opt out on current_filename');
            return false;
        }
        let basename_match = filename.match(/^([^.]+)/g);
        if (basename_match) {
            this.basepath = basename_match[0];
        }
        else {
            this.load_errors.push('Opt out on basepath');
            return false;
        }
        let filename_split = this.current_filename.split(/^([^.]+)[\.](.*)$/g).filter((el) => {
            return el !== "";
        });
        if (filename_split.length === 2) {
            this.current_file_basename = filename_split[0];
            this.current_file_extension = filename_split[1];
        }
        else {
            return false;
        }
        this.path = filename.substring(0, filename.length - this.current_filename.length);
        for (let fn of fs_1.readdirSync(this.path)) {
            if (fn.endsWith('.ind.yaml')) {
                this.header_section = new SplitScriptIndSection_1.SplitScriptIndSection(this.path + path_1.sep + fn);
                for (let fn_sub of this.header_section.get_parser_filenames()) {
                    this.assign_section(this.path + path_1.sep + fn_sub);
                }
                break;
            }
        }
        if (this.current_filename.toLowerCase().endsWith('.ind.yaml')) {
            this.current_section = new SplitScriptIndSection_1.SplitScriptIndSection(this.current_filename, content);
        }
        else if (this.current_filename.toLowerCase().endsWith('.awk')) {
            this.current_section = new SplitScriptAwkSection_1.SplitScriptAwkSection(this.current_filename, content);
        }
        else if (this.current_filename.toLowerCase().endsWith('.json.yaml')) {
            this.current_section = new SplitScriptJsonSection_1.SplitScriptJsonSection(this.current_filename, content);
        }
        else if (this.current_filename.toLowerCase().endsWith('.xml.yaml')) {
            this.current_section = new SplitScriptXmlSection_1.SplitScriptXmlSection(this.current_filename, content);
        }
        else if (this.current_filename.toLowerCase().endsWith('.py')) {
            this.current_section = new SplitScriptPythonSection_1.SplitScriptPythonSection(this.current_filename, content);
        }
        else {
            return false;
        }
        return true;
    }
    assign_section(filename) {
        if (filename.endsWith('.ind.yaml')) {
            this.header_section = new SplitScriptIndSection_1.SplitScriptIndSection(filename);
        }
        else if (filename.endsWith('.awk')) {
            let section = new SplitScriptAwkSection_1.SplitScriptAwkSection(filename);
            this.awk_sections.push(section);
            this.sections.push(section);
        }
        else if (filename.endsWith('.json.yaml')) {
            let section = new SplitScriptJsonSection_1.SplitScriptJsonSection(filename);
            this.json_sections.push(section);
            this.sections.push(section);
        }
        else if (filename.endsWith('.xml.yaml')) {
            let section = new SplitScriptXmlSection_1.SplitScriptXmlSection(filename);
            this.xml_sections.push(section);
            this.sections.push(section);
        }
        else if (filename.endsWith('.py')) {
            let section = new SplitScriptPythonSection_1.SplitScriptPythonSection(filename);
            this.python_sections.push(section);
            this.sections.push(section);
        }
    }
    get is_valid_script() {
        return this.header_section !== undefined;
    }
    get script_test_folder() {
        if (this.header_section === undefined) {
            return undefined;
        }
        return this.find_test_root(this.header_section.filename.replace("parsers/src", "parsers/test").replace("parsers\\src", "parsers\\test"));
    }
    find_test_root(filepath) {
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
    get_test_cases() {
        let test_root = this.script_test_folder;
        if (test_root === undefined) {
            return undefined;
        }
        let test_file = path.join(test_root, 'test.json');
        if (!fs.existsSync(test_file)) {
            return undefined;
        }
        return SplitScriptTestCases_1.SplitScriptTestCases.get(test_file);
    }
    command_runner_test_create(context) {
        return __awaiter(this, void 0, void 0, function* () {
            let command_runner = new CommandRunner_1.CommandRunner();
            try {
                let result = yield command_runner.CreateTestCaseAsync(this);
                let fail = true;
                if (result !== undefined) {
                    if (result.success) {
                        vscode.window.showInformationMessage(`Test case '${result.test_case}' created for script '${result.script_name}'`);
                        fail = false;
                    }
                }
                if (fail) {
                    vscode.window.showErrorMessage('Test case creation failed');
                }
            }
            catch (e) {
                vscode.window.showErrorMessage(e);
            }
        });
    }
    command_runner_test(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((accept, reject) => {
                if (this.header_section === undefined) {
                    return reject('No header section');
                }
                let test_cases = this.get_test_cases();
                if (test_cases !== undefined) {
                    if (test_cases.length > 0) {
                        const items = test_cases.map(item => {
                            return {
                                label: item.name
                            };
                        });
                        items.unshift({ label: 'All' });
                        vscode.window.showQuickPick(items, { 'canPickMany': false, 'placeHolder': 'Pick test case' }).then((value) => {
                            let selected_case = undefined;
                            if (value !== undefined) {
                                if (value.label !== 'All') {
                                    selected_case = value.label;
                                }
                            }
                            else {
                                return reject('No test case selection');
                            }
                            if (this.header_section === undefined) {
                                return reject('No header section defined');
                            }
                            let command_runner = new CommandRunnerAsync_1.CommandRunnerAsync();
                            let view = new CommandRunnerResultView_1.CommandRunnerResultView(context.extensionPath);
                            command_runner.RunTestCases(this.header_section.filename, selected_case).then((result) => {
                                view.show_test_result(result);
                                accept();
                            }).catch((err) => {
                                view.show_error_result(err);
                                reject();
                            });
                        });
                    }
                }
                else {
                    let command_runner = new CommandRunnerAsync_1.CommandRunnerAsync();
                    let view = new CommandRunnerResultView_1.CommandRunnerResultView(context.extensionPath);
                    command_runner.RunTestCases(this.header_section.filename, undefined).then((result) => {
                        view.show_test_result(result);
                        accept();
                    }).catch((err) => {
                        view.show_error_result(err);
                        reject();
                    });
                }
            });
        });
    }
    command_runner_full_command(context) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((accept, reject) => {
                if (this.header_section === undefined) {
                    return reject('No header section defined');
                }
                vscode.window.showInputBox({ placeHolder: 'IP Address' }).then((value) => {
                    if (value === undefined || this.header_section === undefined) {
                        return reject('No ip address entered');
                    }
                    let command_runner = new CommandRunnerAsync_1.CommandRunnerAsync();
                    let view = new CommandRunnerResultView_1.CommandRunnerResultView(context.extensionPath);
                    command_runner.RunFullCommand(this.header_section.filename, value).then((result) => {
                        view.show_parser_result(result);
                        accept();
                    }).catch((error) => {
                        view.show_error_result(error);
                        reject();
                    });
                    /*command_runner.RunFullCommand(this.header_section.filename, value, (result) => {
                    let view = new CommandRunnerResultView(context.extensionPath);
                    view.show_parser_result(result);
                    status_bar.text = 'Command-runner full-command: Done';
                    return;
                });*/
                });
            });
        });
    }
    command_runner_parse(context, tests_path) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((accept, reject) => {
                if (this.header_section === undefined) {
                    return reject('No header section defined');
                }
                let pick_items = [];
                let test_cases = this.get_test_cases();
                if (test_cases !== undefined) {
                    if (test_cases.length > 0) {
                        for (let test_case of test_cases) {
                            if (test_case.name !== undefined) {
                                pick_items.push({ label: test_case.name });
                            }
                        }
                    }
                }
                pick_items.push({ label: 'Browse...' });
                vscode.window.showQuickPick(pick_items, { 'canPickMany': false, 'placeHolder': 'Pick test case' }).then((value) => {
                    if (value !== undefined) {
                        if (value.label === 'Browse...') {
                            vscode.window.showOpenDialog({ 'canSelectFolders': false, 'canSelectFiles': true, 'canSelectMany': false, 'defaultUri': (tests_path !== undefined) ? vscode.Uri.file(tests_path) : undefined }).then((value) => {
                                if (value !== undefined && this.header_section !== undefined) {
                                    if (value.length > 0) {
                                        let command_runner = new CommandRunnerAsync_1.CommandRunnerAsync();
                                        let view = new CommandRunnerResultView_1.CommandRunnerResultView(context.extensionPath);
                                        command_runner.RunParseOnly(this.header_section.filename, value[0].fsPath).then((result) => {
                                            view.show_parser_result(result);
                                            accept();
                                        }).catch((error) => {
                                            view.show_error_result(error);
                                            reject();
                                        });
                                    }
                                }
                            });
                            return;
                        }
                        else if (test_cases !== undefined) {
                            let selected_case = test_cases.find((item) => { return item.name === value.label; });
                            if (selected_case !== undefined && this.header_section !== undefined) {
                                if (selected_case.input_data_path !== undefined) {
                                    let command_runner = new CommandRunnerAsync_1.CommandRunnerAsync();
                                    let view = new CommandRunnerResultView_1.CommandRunnerResultView(context.extensionPath);
                                    command_runner.RunParseOnly(this.header_section.filename, selected_case.input_data_path).then((result) => {
                                        view.show_parser_result(result);
                                        accept();
                                    }).catch((reason) => {
                                        view.show_error_result(reason);
                                        reject();
                                    });
                                }
                            }
                        }
                    }
                });
            });
        });
    }
}
exports.SplitScript = SplitScript;
//# sourceMappingURL=SplitScript.js.map