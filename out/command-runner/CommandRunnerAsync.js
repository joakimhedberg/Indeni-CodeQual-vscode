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
    RunFullCommand(input_filename, ip_address) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let exec_string = ` full-command ${this.verbose}${this.inject_tags()}--ssh ${this.commandrunner_user},${this.commandrunner_password} --basic-authentication ${this.commandrunner_user},${this.commandrunner_password} ${this.escape_filename(input_filename)} ${ip_address}`;
                this.Run(exec_string).then((value) => {
                    return resolve(new CommandRunnerParseOnlyResult_1.CommandRunnerParseOnlyResult(input_filename, ip_address, value));
                }).catch((error) => {
                    return reject(error);
                });
            });
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
                child.exec(command, (error, stdout, stderr) => {
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