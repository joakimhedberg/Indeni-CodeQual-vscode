'use strict';
import * as vscode from 'vscode';
import { RULE_PARAMETER_DOCUMENTATION } from '../resources/hover_documentation/rule_parameters';
import { WRITE_METRIC_DOCUMENTATION } from '../resources/hover_documentation/write_functions';

export function create_yaml_provider() : vscode.Disposable {
    return vscode.languages.registerHoverProvider('yaml', {
        provideHover(document, position, token) {
            if (/rules/g.test(document.fileName) || document.isUntitled) {
                let range = document.getWordRangeAtPosition(position);
                let text = document.getText(range);
                let contents = RULE_PARAMETER_DOCUMENTATION[text];
                if (contents !== undefined) {
                    contents.unshift(text);
                    return { contents: contents };
                }
            }
        }
    });
}

export function create_awk_provider() : vscode.Disposable {
    return vscode.languages.registerHoverProvider('awk', {
        provideHover(document, position, token) {
            let range = document.getWordRangeAtPosition(position);
            let text = document.getText(range);
            let contents = WRITE_METRIC_DOCUMENTATION[text];
            if (contents !== undefined) {
                contents.unshift(text);
                return { contents: contents };
            }
        }
      });
}