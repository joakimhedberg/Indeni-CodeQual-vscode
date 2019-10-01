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
const path = require("path");
const fs = require("fs");
function create_python_template(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let template_uri = vscode.Uri.file(path.join(context.extensionPath, 'resources', 'templates', 'IndeniParser.py.template')).with({ scheme: 'vscode-resource' });
        let data = fs.readFileSync(template_uri.fsPath, { encoding: 'utf-8' });
        if (data === undefined) {
            return Promise.reject('Unable to read template file');
        }
        let name = yield vscode.window.showInputBox({ ignoreFocusOut: true, placeHolder: 'CamelCase', prompt: 'Class name', validateInput: validate_input });
        if (name === undefined) {
            return Promise.reject('No class name');
        }
        return Promise.resolve(data.replace('$parser_name', name));
    });
}
exports.create_python_template = create_python_template;
function validate_input(value) {
    if (/^[A-Z]([A-Z0-9]*[a-z][a-z0-9]*[A-Z]|[a-z0-9]*[A-Z][A-Z0-9]*[a-z])[A-Za-z0-9]*/gm.test(value)) {
        return null;
    }
    return 'Use CamelCase for the class name';
}
//# sourceMappingURL=misc_commands.js.map