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
const vscode = require("vscode");
const child = require("child_process");
const process = require("process");
const fs = require("fs");
const CommandRunnerParseOnlyResult_1 = require("./results/CommandRunnerParseOnlyResult");
const CommandRunnerTestRunResult_1 = require("./results/CommandRunnerTestRunResult");
const CommandRunnerTestCreateResult_1 = require("./results/CommandRunnerTestCreateResult");
class CommandRunner {
    constructor() {
        this.errors = [];
        this.commandrunner_path = undefined;
        this.commandrunner_uri = undefined;
        this.commandrunner_user = undefined;
        this.commandrunner_password = undefined;
        this.commandrunner_verbose = false;
        this.commandrunner_inject_tags = [];
        this.commandrunner_path = vscode.workspace.getConfiguration().get('indeni.commandRunnerPath');
        this.commandrunner_user = vscode.workspace.getConfiguration().get('indeni.commandRunnerUser');
        this.commandrunner_password = vscode.workspace.getConfiguration().get('indeni.commandRunnerPassword');
        this.commandrunner_verbose = vscode.workspace.getConfiguration().get('indeni.commandRunnerVerbose');
        this.commandrunner_inject_tags = vscode.workspace.getConfiguration().get('indeni.commandRunnerInjectTags') || [];
        if (this.commandrunner_path !== undefined) {
            this.commandrunner_uri = vscode.Uri.file(this.commandrunner_path);
        }
    }
    verify_command_runner_path() {
        let result = false;
        if (this.commandrunner_path !== undefined) {
            if (fs.existsSync(this.commandrunner_path)) {
                result = true;
            }
        }
        if (!result) {
            vscode.window.showErrorMessage('Command runner path not specified. Please do so in application settings');
        }
        return result;
    }
    get verbose() {
        if (this.commandrunner_verbose === true) {
            return "--verbose ";
        }
        return "";
    }
    inject_tags() {
        if (this.commandrunner_inject_tags.length <= 0) {
            console.log('Inject tags = 0');
            return '';
        }
        let result = [];
        for (let line of this.commandrunner_inject_tags) {
            console.log('Parsing line: ' + line);
            let key_value = line.split('=', 2);
            console.log(key_value);
            if (key_value.length === 2) {
                console.log('Reached here');
                let item = `""${key_value[0].trim()}""=>""${key_value[1].trim()}""`;
                result.push(item);
            }
        }
        if (result.length > 0) {
            return '--inject-tags "' + result.join(' ') + '" ';
        }
        return '';
    }
    RunFullCommand(input_filename, ip_address, callback) {
        if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
            return;
        }
        if (this.commandrunner_user === undefined) {
            this.commandrunner_user = '';
        }
        if (this.commandrunner_password === undefined) {
            this.commandrunner_password = '';
        }
        console.log('Inject tags');
        console.log(this.inject_tags());
        let command = this.escape_filename(this.commandrunner_uri.fsPath) + ` full-command ${this.verbose}${this.inject_tags()}--ssh ${this.commandrunner_user},${this.commandrunner_password} --basic-authentication ${this.commandrunner_user},${this.commandrunner_password} ` + this.escape_filename(input_filename) + " " + ip_address;
        console.log('Commandrunner command: ' + command);
        child.exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, ip_address, stdout));
        });
    }
    RunParseOnlyAsync(filename, input_filename) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
                    reject('Command-runner path undefined');
                    return;
                }
                let exec_string = this.escape_filename(this.commandrunner_uri.fsPath) + " parse-only " + this.verbose + this.escape_filename(filename) + " -f " + this.escape_filename(input_filename);
                this.RunCommandRunner(exec_string).then((raw_data) => { resolve(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, filename, raw_data)); }).catch((err) => { reject(err); });
            });
        });
    }
    RunParseOnly(filename, input_filename, callback) {
        if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
            return;
        }
        if (this.commandrunner_uri === undefined) {
            return;
        }
        let exec_string = this.escape_filename(this.commandrunner_uri.fsPath) + " parse-only " + this.verbose + this.escape_filename(filename) + " -f " + this.escape_filename(input_filename);
        console.log(exec_string);
        child.exec(exec_string, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, filename, stdout));
        });
    }
    CreateTestCaseAsync(split_script) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!split_script.is_valid_script) {
                return Promise.reject('Invalid script');
            }
            if (this.commandrunner_uri === undefined) {
                return Promise.reject('Invalid command-runner path');
            }
            let test_case_map = {};
            const items = [];
            let test_cases = split_script.get_test_cases();
            if (test_cases !== undefined) {
                for (let t_case of test_cases) {
                    if (t_case.name !== undefined && t_case.input_data_path !== undefined) {
                        items.push({ label: t_case.name });
                        test_case_map[t_case.name] = t_case.input_data_path;
                    }
                }
            }
            let test_case_name = '';
            items.push({ label: 'New...' });
            let input_test_case_option = yield vscode.window.showQuickPick(items, { placeHolder: 'Select existing test case name or select new name' });
            if (input_test_case_option === undefined) {
                return Promise.reject('No test case name specified');
            }
            if (input_test_case_option.label === 'New...') {
                let new_name = yield vscode.window.showInputBox({ placeHolder: 'Test case name' });
                if (new_name === undefined) {
                    return Promise.reject('No test case name specified');
                }
                test_case_name = new_name;
            }
            else {
                test_case_name = input_test_case_option.label;
            }
            items.pop();
            items.push({ label: 'Browse...' });
            let input_filename = yield vscode.window.showQuickPick(items, { placeHolder: 'Select existing input file or browse for new' });
            if (input_filename === undefined) {
                return Promise.reject('No input file specified');
            }
            let input_data_path = undefined;
            if (input_filename.label !== 'Browse...') {
                input_data_path = test_case_map[input_filename.label];
            }
            else {
                let path = yield vscode.window.showOpenDialog({ canSelectFolders: false, canSelectMany: false, openLabel: 'Select input file...' });
                if (path !== undefined) {
                    {
                        if (path.length > 0) {
                            input_data_path = path[0].fsPath;
                        }
                    }
                }
            }
            if (input_data_path === undefined) {
                return Promise.reject('No input file speficied');
            }
            let script_filename = split_script.header_section !== undefined ? split_script.header_section.filename : '';
            let command = "test create " + this.escape_filename(script_filename) + " " + test_case_name + " " + this.escape_filename(input_data_path);
            let result = yield this.RunCommandRunner(command);
            return Promise.resolve(new CommandRunnerTestCreateResult_1.CommandRunnerTestCreateResult(result));
        });
    }
    GetVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => {
                this.RunCommandRunner('--version').then(value => {
                    //command-runner: a command line tool for executing collector commands, version: 6.0.62
                    let regex_match = /version:\s+(.+)/g;
                    let match = regex_match.exec(value);
                    if (match) {
                        vscode.window.showInformationMessage('Command-runner version: ' + match[1]);
                    }
                });
            });
        });
    }
    RunCommandRunner(command) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.commandrunner_uri === undefined || !this.verify_command_runner_path()) {
                return Promise.reject('Invalid command-runner path');
            }
            command = this.escape_filename(this.commandrunner_uri.fsPath) + ' ' + command;
            return new Promise((resolve, reject) => {
                child.exec(command, (error, stdout, stderr) => {
                    if (error !== null || stderr !== '') {
                        if (error !== null) {
                            reject(error.message);
                            return;
                        }
                        else if (stderr !== '') {
                            reject(stderr);
                            return;
                        }
                    }
                    resolve(stdout);
                });
            });
        });
    }
    CreateTestCase(script_filename, case_name, input_filename, callback) {
        if (!this.verify_command_runner_path || this.commandrunner_uri === undefined) {
            return new Promise(reject => new Error('No command runner path defined'));
        }
        let command = this.escape_filename(this.commandrunner_uri.fsPath) + " test create " + this.escape_filename(script_filename) + " " + case_name + " " + this.escape_filename(input_filename);
        child.exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerTestCreateResult_1.CommandRunnerTestCreateResult(stdout));
        });
    }
    RunTests(filename, selected_case, callback) {
        if (!this.verify_command_runner_path() || this.commandrunner_uri === undefined) {
            return;
        }
        let command = this.escape_filename(this.commandrunner_uri.fsPath) + " test run " + this.escape_filename(filename);
        if (selected_case !== undefined) {
            command = this.escape_filename(this.commandrunner_uri.fsPath) + " test run " + this.escape_filename(filename) + " -c " + selected_case;
        }
        child.exec(command, (error, stdout, stderr) => {
            if (error !== null) {
                console.error(error);
            }
            if (stderr !== '') {
                console.error(stderr);
            }
            callback(new CommandRunnerTestRunResult_1.CommandRunnerTestRunResult(stdout));
        });
    }
    escape_filename(filename) {
        if (process.platform === 'win32') {
            return "\"" + filename + "\"";
        }
        return filename.replace(/\s/g, '\\ ');
    }
}
exports.CommandRunner = CommandRunner;
//# sourceMappingURL=CommandRunner.js.map