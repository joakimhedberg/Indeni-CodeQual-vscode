import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export async function create_python_template(context : vscode.ExtensionContext) : Promise<string> {
    let template_uri = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'templates', 'IndeniParser.py.template')).with({ scheme: 'vscode-resource' });
    let data = fs.readFileSync(template_uri.fsPath, { encoding: 'utf-8' });

    if (data === undefined) {
        return Promise.reject('Unable to read template file');
    }

    let name = await vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'CamelCase', prompt: 'Class name', validateInput: validate_input });

    if (name === undefined) {
        return Promise.reject('No class name');
    }

    return Promise.resolve(data.replace('$parser_name', name));
}

function validate_input(value : string) : string | null {
    if (/^[A-Z]([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*/gm.test(value)) {
        return null;
    }

    return 'Use CamelCase for the class name';
}
