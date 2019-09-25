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
const RuleRunnerCompileResult_1 = require("./results/RuleRunnerCompileResult");
class RuleRunner {
    constructor() {
        this.rulerunner_path = vscode.workspace.getConfiguration().get('indeni.ruleRunnerPath');
    }
    Compile(script_filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.rulerunner_path === undefined) {
                return Promise.reject('No rule runner path defined: ' + this.rulerunner_path);
            }
            let items = [];
            items.push({ label: 'No input' });
            items.push({ label: 'Select input' });
            let input_selection = yield vscode.window.showQuickPick(items, { placeHolder: 'Input file' });
            if (input_selection === undefined) {
                return Promise.reject('No input selection was made');
            }
            let input_filepath = undefined;
            if (input_selection.label === 'Select input') {
                let result = yield vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, openLabel: 'Select input file', canSelectMany: false });
                if (result === undefined) {
                    return Promise.reject('File selection was cancelled');
                }
                input_filepath = result[0].fsPath;
            }
            let command = 'compile ' + this.escape_filename(script_filename);
            if (input_filepath !== undefined) {
                command += ' --input ' + this.escape_filename(input_filepath);
            }
            let data = yield this.Run(command);
            if (data === undefined) {
                return Promise.reject('No data was returned from rule runner');
            }
            return new RuleRunnerCompileResult_1.RuleRunnerCompileResult(data.toString());
        });
    }
    Run(command) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.rulerunner_path === undefined) {
                return Promise.reject('No rulerunner filename specified');
            }
            command = this.escape_filename(this.rulerunner_path) + ' ' + command;
            //console.log('Running command: ' + command);
            return new Promise((resolve, reject) => {
                child.exec(command, (error, stdout, stderr) => {
                    if (error !== null) {
                        reject(error);
                        return;
                    }
                    if (stderr !== '') {
                        reject(stderr);
                        return;
                    }
                    resolve(stdout);
                });
            });
        });
    }
    /*private async Run(parameters : string) : Promise<string | undefined> {
        if (this.rulerunner_path === undefined) {
            return undefined;
        }

        let path = this.escape_filename(this.rulerunner_path);

        let process_data = child.execSync(path + ' ' + parameters, undefined);
        return process_data;
    }*/
    escape_filename(filename) {
        if (process.platform === 'win32') {
            return "\"" + filename + "\"";
        }
        return filename.replace(/\s/g, '\\ ');
    }
}
exports.RuleRunner = RuleRunner;
//# sourceMappingURL=RuleRunner.js.map