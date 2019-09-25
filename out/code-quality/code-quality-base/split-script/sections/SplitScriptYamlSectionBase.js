"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptSectionBase_1 = require("./SplitScriptSectionBase");
class SplitScriptYamlSectionBase extends SplitScriptSectionBase_1.SplitScriptSectionBase {
    get_metrics() {
        let regex_match = /\"im.name\"[^\"]*\"([^\"]+)/g;
        let result = [];
        if (this.content === undefined) {
            return result;
        }
        let match;
        while (match = regex_match.exec(this.content)) {
            if (match.length > 1) {
                result.push([match[0].indexOf(match[1]) + match.index, match[1]]);
            }
        }
        return result;
    }
}
exports.SplitScriptYamlSectionBase = SplitScriptYamlSectionBase;
//# sourceMappingURL=SplitScriptYamlSectionBase.js.map