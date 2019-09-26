import * as vscode from 'vscode';
import * as child from 'child_process';
import * as process from 'process';
import * as fs from 'fs';
import { CommandRunnerParseOnlyResult } from './results/CommandRunnerParseOnlyResult';

export class CommandRunnerAsync {    
    private commandrunner_path : string | undefined = undefined;
    private commandrunner_uri : vscode.Uri | undefined = undefined;
    private commandrunner_user : string | undefined = undefined;
    private commandrunner_password : string | undefined = undefined;
    private commandrunner_verbose : boolean | undefined = false;
    private commandrunner_inject_tags : string[] = [];
    public constructor() {
        this.commandrunner_path = vscode.workspace.getConfiguration().get('indeni.commandRunnerPath');
        this.commandrunner_user = vscode.workspace.getConfiguration().get('indeni.commandRunnerUser');
        this.commandrunner_password = vscode.workspace.getConfiguration().get('indeni.commandRunnerPassword');
        this.commandrunner_verbose = vscode.workspace.getConfiguration().get('indeni.commandRunnerVerbose');
        this.commandrunner_inject_tags = vscode.workspace.getConfiguration().get('indeni.commandRunnerInjectTags') || [];
        if (this.commandrunner_path !== undefined) {
            this.commandrunner_uri = vscode.Uri.file(this.commandrunner_path);
        }
    }

    private escape_filename(filename : string) : string {
        if (process.platform === 'win32') {
            return "\"" + filename + "\"";
        }
        return filename.replace(/\s/g, '\\ ');
    }

    private verify_command_runner_path() : boolean {
        let result : boolean = false;

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

    private get verbose() : string {
        if (this.commandrunner_verbose === true) {
            return "--verbose ";
        }

        return "";
    }

    public async RunParseOnly(filename : string, input_filename : string) {
        return new Promise<CommandRunnerParseOnlyResult>((resolve, reject) => {
            let exec_string = ' parse-only ' + this.verbose + this.escape_filename(filename) + ' -f ' + this.escape_filename(input_filename);

            this.Run(exec_string).then((data) => {
                return resolve(new CommandRunnerParseOnlyResult(input_filename, filename, data));
            }
            ).catch((reason) => { return reject(reason); });
        });
    }

    private async Run(command : string) {
        return new Promise<string>((resolve, reject) => 
        {
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
    }
}