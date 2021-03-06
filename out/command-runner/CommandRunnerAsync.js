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
class CommandRunnerAsync {
    constructor() {
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
    escape_filename(filename) {
        if (process.platform === 'win32') {
            return "\"" + filename + "\"";
        }
        return filename.replace(/\s/g, '\\ ');
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
            let equals_index = line.indexOf('=');
            if (equals_index < 0) {
                continue;
            }
            let key = line.substring(0, line.indexOf('=') - 1);
            let value = line.substring(line.indexOf('=') + 1);
            let item = `""${key.trim()}""=>""${value.trim()}""`;
            result.push(item);
        }
        if (result.length > 0) {
            return '--inject-tags "' + result.join(' ') + '" ';
        }
        return '';
    }
    /**
     *
     * @param input_filename Script filename
     * @param ip_address Device IP
     */
    RunFullCommand(input_filename, ip_address) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let exec_string = ` full-command ${this.verbose}${this.inject_tags()}--ssh ${this.commandrunner_user},${this.commandrunner_password} --basic-authentication ${this.commandrunner_user},${this.commandrunner_password} --record ${this.escape_filename(input_filename)} ${ip_address}`;
                this.Run(exec_string).then((value) => {
                    return resolve(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, ip_address, value));
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }
    /**
     *
     * @param split_script Indeni split script
     */
    CreateTestCase(split_script) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!split_script.is_valid_script) {
                return Promise.reject('Invalid script');
            }
            if (this.commandrunner_uri === undefined) {
                return Promise.reject('Invalid command-runner path');
            }
            let test_case_name = yield vscode.window.showInputBox({ placeHolder: 'Eg. vsx-device-output', prompt: 'Test case name', ignoreFocusOut: true, validateInput: this.validate_test_case_name });
            if (test_case_name === undefined || test_case_name === '') {
                return Promise.reject('No test case name specified');
            }
            let input_data_path = yield vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, canSelectMany: false, openLabel: 'Select input file' });
            if (input_data_path === undefined || input_data_path.length < 1) {
                return Promise.reject('No input data selected');
            }
            let input_data = input_data_path[0];
            let script_filename = split_script.header_section !== undefined ? split_script.header_section.filename : '';
            let command = "test create " + this.escape_filename(script_filename) + " " + test_case_name + " " + this.escape_filename(input_data.fsPath);
            let result = yield this.Run(command);
            return Promise.resolve(new CommandRunnerTestCreateResult_1.CommandRunnerTestCreateResult(result));
        });
    }
    validate_test_case_name(value) {
        if (/\s/g.test(value)) {
            return 'Test case name can not contain spaces';
        }
        return null;
    }
    /**
     * @description Validates an ip-address
     * @param value IP address to validate
     * @returns null if the ip address is valid, otherwise string error message
     */
    validate_ip_address(value) {
        if (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s{0,}\/\s{0,}[\w\s\-]+$/.test(value)) {
            return null;
        }
        return 'Need a valid ip address';
    }
    /*
        Gives the option to re-create test cases or create a new one
    */
    ReCreateTestCase(split_script) {
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
            let input_test_case_option = yield vscode.window.showQuickPick(items, { placeHolder: 'Select existing test case name or select new name' });
            if (input_test_case_option === undefined) {
                return Promise.reject('No test case name specified');
            }
            test_case_name = input_test_case_option.label;
            let test_case_data = test_case_map[test_case_name];
            let confirmation = yield vscode.window.showQuickPick([{ label: 'Yes' }, { label: 'No' }], { canPickMany: false, ignoreFocusOut: true, placeHolder: `Do you wish to re-create test case "${test_case_name}"?` });
            if (confirmation === undefined || confirmation.label !== 'Yes') {
                return Promise.reject('Operation cancelled');
            }
            let script_filename = split_script.header_section !== undefined ? split_script.header_section.filename : '';
            let command = "test create " + this.escape_filename(script_filename) + " " + test_case_name + " " + this.escape_filename(test_case_data);
            let result = yield this.Run(command);
            return Promise.resolve(new CommandRunnerTestCreateResult_1.CommandRunnerTestCreateResult(result));
        });
    }
    /*
        Runs command-runner with parse-only parameter, script filename and input file
    */
    RunParseOnly(filename, input_filename) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let exec_string = ' parse-only ' + this.verbose + this.escape_filename(filename) + ' -f ' + this.escape_filename(input_filename);
                this.Run(exec_string).then((data) => {
                    return resolve(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, filename, data));
                }).catch((reason) => { return reject(reason); });
            });
        });
    }
    /*
        Run a test case(or all) using the command-runner
    */
    RunTestCases(filename, selected_case) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((accept, reject) => {
                let exec_string = ' test run ' + this.escape_filename(filename);
                if (selected_case !== undefined) {
                    exec_string += ' -c ' + selected_case;
                }
                this.Run(exec_string).then((data) => {
                    return accept(new CommandRunnerTestRunResult_1.CommandRunnerTestRunResult(data));
                }).catch((error) => {
                    return reject(error);
                });
            });
        });
    }
    /*
        Runs command-runner with the specified parameters
    */
    Run(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (this.commandrunner_uri === undefined || !this.verify_command_runner_path()) {
                    return reject('No valid command-runner path');
                }
                command = this.escape_filename(this.commandrunner_uri.fsPath) + ' ' + command;
                child.exec(command, { maxBuffer: 1024 * 1024 * 1024 }, (error, stdout, stderr) => {
                    if (error !== null) {
                        return reject('Command-runner failed: Command ' + command + ' -- Error: ' + error.message);
                    }
                    else if (stderr !== '') {
                        return reject('Command-runner failed: Command ' + command + ' -- Error: ' + stderr);
                    }
                    else {
                        resolve(stdout);
                    }
                });
            });
        });
    }
}
exports.CommandRunnerAsync = CommandRunnerAsync;
//# sourceMappingURL=CommandRunnerAsync.js.map