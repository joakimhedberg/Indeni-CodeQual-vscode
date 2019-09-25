"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptSectionBase_1 = require("./SplitScriptSectionBase");
class SplitScriptPythonSection extends SplitScriptSectionBase_1.SplitScriptSectionBase {
    constructor(filename, content = undefined) {
        super(filename, 'python', 'python', content);
    }
    get_metrics() {
        let content = this.content;
        let result = [];
        if (!content) {
            return result;
        }
        let regex_assigned = /^\s{0,}[^\#]\s{0,}self\.write.*metric\w*\(\'(.*?)\'.+$/gm;
        let match;
        while (match = regex_assigned.exec(content)) {
            if (match.length > 1) {
                result.push([match[0].indexOf(match[1]) + match.index, match[1]]);
            }
        }
        return result;
    }
}
exports.SplitScriptPythonSection = SplitScriptPythonSection;
//# sourceMappingURL=SplitScriptPythonSection.js.map