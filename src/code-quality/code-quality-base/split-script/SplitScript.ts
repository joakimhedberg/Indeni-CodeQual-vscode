import { readdirSync, readFileSync } from "fs";
import { SplitScriptIndSection } from "./sections/SplitScriptIndSection";
import { SplitScriptAwkSection } from "./sections/SplitScriptAwkSection";
import { SplitScriptXmlSection } from "./sections/SplitScriptXmlSection";
import { SplitScriptJsonSection } from "./sections/SplitScriptJsonSection";
import { sep } from "path";
import { SplitScriptSectionBase } from "./sections/SplitScriptSectionBase";
import { CommandRunner } from "../../../command-runner/CommandRunner";
import * as path from 'path';
import * as fs from "fs";
import { CommandRunnerResultView } from "../../../gui/CommandRunnerResultView";
import * as vscode from 'vscode';
import { SplitScriptTestCases } from "./test_cases/SplitScriptTestCases";
import { SplitScriptTestCase } from "./test_cases/SplitScriptTestCase";
import { SplitScriptPythonSection } from "./sections/SplitScriptPythonSection";
import { CommandRunnerAsync } from "../../../command-runner/CommandRunnerAsync";

export class SplitScript {
    // Current open filename
    public current_filename : string = '';

    // Current open file extension
    public current_file_extension = '';

    // File name without path and extension
    public current_file_basename : string = '';

    // Full file path without extension
    public basepath : string = '';

    // Indeni script path
    public path : string = '';

    public header_section : SplitScriptIndSection | undefined;
    public awk_sections : SplitScriptAwkSection[] = [];
    public xml_sections : SplitScriptXmlSection[] = [];
    public python_sections : SplitScriptPythonSection[] = [];
    public json_sections : SplitScriptJsonSection[] = [];
    public sections : SplitScriptSectionBase[] = [];

    public load_errors : string[] = [];

    public current_section : SplitScriptSectionBase | undefined = undefined;

    public load(filename : string, content : string | undefined) : boolean {

        if (content === undefined) {
            try
            {
                content = readFileSync(filename).toString();
            } catch (error) {
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
        } else {
            this.load_errors.push('Opt out on basepath');
            return false;
        }
        
        let filename_split = this.current_filename.split(/^([^.]+)[\.](.*)$/g).filter((el) => {
            return el !== "";
        });

        if (filename_split.length === 2) {
            this.current_file_basename = filename_split[0];
            this.current_file_extension = filename_split[1];
        } else {
            return false;
        }

        this.path = filename.substring(0, filename.length - this.current_filename.length);

        for (let fn of readdirSync(this.path)) {
            if (fn.endsWith('.ind.yaml')) {
                this.header_section = new SplitScriptIndSection(this.path + sep + fn);
                for (let fn_sub of this.header_section.get_parser_filenames()) {
                    this.assign_section(this.path + sep + fn_sub);
                }
                break;
            }
        }

        if (this.current_filename.toLowerCase().endsWith('.ind.yaml')) {
            this.current_section = new SplitScriptIndSection(this.current_filename, content);
        } else if (this.current_filename.toLowerCase().endsWith('.awk')) {
            this.current_section = new SplitScriptAwkSection(this.current_filename, content);
        } else if (this.current_filename.toLowerCase().endsWith('.json.yaml')) {
            this.current_section = new SplitScriptJsonSection(this.current_filename, content);
        } else if (this.current_filename.toLowerCase().endsWith('.xml.yaml')) {
            this.current_section = new SplitScriptXmlSection(this.current_filename, content);
        } else if (this.current_filename.toLowerCase().endsWith('.py')) {
            this.current_section = new SplitScriptPythonSection(this.current_filename, content);
        }
        else {
            return false;
        }

        return true;
    }

    private assign_section(filename : string) {
        if (filename.endsWith('.ind.yaml')) {
            this.header_section = new SplitScriptIndSection(filename);
        } else if (filename.endsWith('.awk')) {
            let section = new SplitScriptAwkSection(filename);
            this.awk_sections.push(section);
            this.sections.push(section);
        } else if (filename.endsWith('.json.yaml')) {
            let section = new SplitScriptJsonSection(filename);
            this.json_sections.push(section);
            this.sections.push(section);
        } else if (filename.endsWith('.xml.yaml')) {
            let section = new SplitScriptXmlSection(filename);
            this.xml_sections.push(section);
            this.sections.push(section);
        } else if (filename.endsWith('.py')) {
            let section = new SplitScriptPythonSection(filename);
            this.python_sections.push(section);
            this.sections.push(section);
        }
    }
    
    get is_valid_script() {
        return this.header_section !== undefined;
    }

    get script_test_folder() : string | undefined {
        if (this.header_section === undefined) {
            return undefined;
        }

        return this.find_test_root(this.header_section.filename.replace("parsers/src", "parsers/test").replace("parsers\\src", "parsers\\test"));
    }

    find_test_root(filepath : string) : string | undefined {
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

    public get_test_cases() : SplitScriptTestCase[] | undefined {
        let test_root = this.script_test_folder;
        if (test_root === undefined) {
            return undefined;
        }

        let test_file = path.join(test_root, 'test.json');
        if (!fs.existsSync(test_file)) {
            return undefined;
        }
        return SplitScriptTestCases.get(test_file);
    }

    public async command_runner_test_create(context : vscode.ExtensionContext) {
        let command_runner = new CommandRunner();

        try {
            let result = await command_runner.CreateTestCaseAsync(this);
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
        } catch (e) {
            vscode.window.showErrorMessage(e);
        }
    }

    public async command_runner_test(context : vscode.ExtensionContext) : Promise<void> {
        return new Promise<void>((accept, reject) => {
               
            if (this.header_section === undefined) {
                return reject('No header section');
            }
        
            let test_cases = this.get_test_cases();
            
            if (test_cases !== undefined) {
                if (test_cases.length > 0) {
                    const items = <vscode.QuickPickItem[]>test_cases.map(
                        item => 
                        {
                            return {
                                label: item.name
                            };
                        });
                        items.unshift({ label: 'All' });
                        
                    vscode.window.showQuickPick(items, { 'canPickMany': false, 'placeHolder': 'Pick test case' }).then((value : vscode.QuickPickItem | undefined) => {
                        let selected_case : string | undefined = undefined;
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

                        let command_runner = new CommandRunnerAsync();
                        let view = new CommandRunnerResultView(context.extensionPath);
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
                let command_runner = new CommandRunnerAsync();
                let view = new CommandRunnerResultView(context.extensionPath);
                command_runner.RunTestCases(this.header_section.filename, undefined).then((result) => {
                    view.show_test_result(result);
                    accept();
                }).catch((err) => {
                    view.show_error_result(err);
                    reject();
                });
            }
        });
    }

    public async command_runner_full_command(context : vscode.ExtensionContext) {
        return new Promise<void>((accept, reject) => {

            if (this.header_section === undefined) {
                return reject('No header section defined');
            }

            vscode.window.showInputBox({ placeHolder: 'IP Address' }).then((value : string | undefined) => {
                if (value === undefined || this.header_section === undefined) {
                    return reject('No ip address entered');
                }
                let command_runner = new CommandRunnerAsync();
                let view = new CommandRunnerResultView(context.extensionPath);
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
    }

    public async command_runner_parse(context : vscode.ExtensionContext, tests_path : string | undefined) {
        return new Promise<void>((accept, reject) => {
        if (this.header_section === undefined) {
            return reject('No header section defined');
        }
        
        let pick_items : vscode.QuickPickItem[] = [];
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
        vscode.window.showQuickPick(pick_items, { 'canPickMany': false, 'placeHolder': 'Pick test case' }).then((value : vscode.QuickPickItem | undefined) => {
            if (value !== undefined) {
                if (value.label === 'Browse...') {
                    vscode.window.showOpenDialog( { 'canSelectFolders' : false, 'canSelectFiles': true, 'canSelectMany': false, 'defaultUri': (tests_path !== undefined)? vscode.Uri.file(tests_path): undefined } ).then((value : vscode.Uri[] | undefined) => {
                        if (value !== undefined && this.header_section !== undefined) {
                            if (value.length > 0) {
                                let command_runner = new CommandRunnerAsync();
                                let view = new CommandRunnerResultView(context.extensionPath);
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
                    let selected_case = test_cases.find((item : SplitScriptTestCase) => { return item.name === value.label; });

                    if (selected_case !== undefined && this.header_section !== undefined) {
                        if (selected_case.input_data_path !== undefined) {
                            let command_runner = new CommandRunnerAsync();
                            let view = new CommandRunnerResultView(context.extensionPath);
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
}
}