'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const rule_parameters_1 = require("../resources/hover_documentation/rule_parameters");
const write_functions_1 = require("../resources/hover_documentation/write_functions");
function create_yaml_provider() {
    return vscode.languages.registerHoverProvider('yaml', {
        provideHover(document, position, token) {
            if (/rules/g.test(document.fileName) || document.isUntitled) {
                let range = document.getWordRangeAtPosition(position);
                let text = document.getText(range);
                let contents = rule_parameters_1.RULE_PARAMETER_DOCUMENTATION[text];
                if (contents !== undefined) {
                    contents.unshift(text);
                    return { contents: contents };
                }
            }
        }
    });
}
exports.create_yaml_provider = create_yaml_provider;
function create_awk_provider() {
    return vscode.languages.registerHoverProvider('awk', {
        provideHover(document, position, token) {
            let range = document.getWordRangeAtPosition(position);
            let text = document.getText(range);
            let contents = write_functions_1.WRITE_METRIC_DOCUMENTATION[text];
            if (contents !== undefined) {
                contents.unshift(text);
                return { contents: contents };
            }
        }
    });
}
exports.create_awk_provider = create_awk_provider;
//# sourceMappingURL=hover_providers.js.map