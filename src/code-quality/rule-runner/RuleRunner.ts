import * as vscode from 'vscode';
import * as child from 'child_process';
import { RuleRunnerCompileResult } from './results/RuleRunnerCompileResult';


export class RuleRunner {
    private rulerunner_path : string | undefined;
    public constructor() {
        this.rulerunner_path = vscode.workspace.getConfiguration().get('indeni.ruleRunnerPath');
    }

    public async Compile(script_filename : string) {
        if (this.rulerunner_path === undefined) {
            return Promise.reject('No rule runner path defined: ' + this.rulerunner_path);
        }

        let items : vscode.QuickPickItem[] = [];
        items.push({ label: 'No input' });
        items.push({ label: 'Select input' });

        let input_selection = await vscode.window.showQuickPick(items, { placeHolder: 'Input file' });

        if (input_selection === undefined) {
            return Promise.reject('No input selection was made');
        }

        let input_filepath : string | undefined = undefined;
        if (input_selection.label === 'Select input') {
            let result = await vscode.window.showOpenDialog({ canSelectFiles: true, canSelectFolders: false, openLabel: 'Select input file', canSelectMany: false });
            if (result === undefined) {
                return Promise.reject('File selection was cancelled');
            }

            input_filepath = result[0].fsPath;
        }

        let command = 'compile ' + this.escape_filename(script_filename);
        if (input_filepath !== undefined) {
            command += ' --input ' + this.escape_filename(input_filepath); 
        }

        let data = await this.Run(command);
        if (data === undefined) {
            return Promise.reject('No data was returned from rule runner');
        }

        return new RuleRunnerCompileResult(data.toString());
    }

    private async Run(command : string) : Promise<string> {

        if (this.rulerunner_path === undefined) {
            return Promise.reject('No rulerunner filename specified');
        }

        command = this.escape_filename(this.rulerunner_path) + ' ' + command;
        //console.log('Running command: ' + command);
        return new Promise<string>(
            (resolve, reject) => {
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
                }
                );
            }
        );
    }

    /*private async Run(parameters : string) : Promise<string | undefined> {
        if (this.rulerunner_path === undefined) {
            return undefined;
        }

        let path = this.escape_filename(this.rulerunner_path);

        let process_data = child.execSync(path + ' ' + parameters, undefined);
        return process_data;
    }*/

    private escape_filename(filename : string) : string {
        if (process.platform === 'win32') {
            return "\"" + filename + "\"";
        }
        return filename.replace(/\s/g, '\\ ');
    }
}