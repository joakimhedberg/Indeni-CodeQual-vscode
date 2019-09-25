"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
//let if_contains_single_equal_sign = new CodeValidationRegex("If statement with single equal sign", "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", FunctionSeverity.error, ["awk"], /if\s+\([^=!]+(=)[^=]+\)\s+\{/gm);// /if\s*?\([^=]+[^=!](=){1}[^=].+\)/gm);
class IfWithSingleEqualsSign extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super('If statement with single equals sign');
        this.markers = [];
    }
    get_markers(script) {
        if (script.current_section === undefined) {
            return [];
        }
        this.markers = [];
        if (['awk'].indexOf(script.current_section.content_type) > -1) {
            let regex_match = /if\s+\([^=!]+(=)[^=]+\)\s+\{/gm;
            let match;
            while (match = regex_match.exec(script.current_section.content)) {
                for (let i = 1; i < match.length; i++) {
                    this.markers.push(new MarkerResult_1.MarkerResult(match.index, match.index + match[0].length, "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", CodeValidation_1.FunctionSeverity.error, true, match[0]));
                }
            }
        }
        return this.markers;
    }
}
exports.IfWithSingleEqualsSign = IfWithSingleEqualsSign;
//# sourceMappingURL=IfWithSingleEqualsSign.js.map