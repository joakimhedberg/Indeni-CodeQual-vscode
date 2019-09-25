"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const CodeValidation_1 = require("../../../CodeValidation");
class YamlFourSpacesIndentaionValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super('Invalid YAML white-space', CodeValidation_1.FunctionSeverity.error);
    }
    get_markers(script) {
        let result = [];
        if (script.current_section === undefined) {
            return result;
        }
        let content = script.current_section.content;
        if (content === undefined) {
            return result;
        }
        let lines = content.split('\n');
        console.log(lines);
        return result;
    }
    space_string(count) {
        let result = '';
        for (let i = 0; i < count; i++) {
            result += ' ';
        }
        return result;
    }
    count_spaces(line) {
        let result = 0;
        for (let chr of line) {
            if (chr === ' ') {
                result++;
            }
            else {
                return result;
            }
        }
        return result;
    }
}
exports.YamlFourSpacesIndentaionValidation = YamlFourSpacesIndentaionValidation;
//# sourceMappingURL=YamlFourSpacesIndentationValidation.js.map