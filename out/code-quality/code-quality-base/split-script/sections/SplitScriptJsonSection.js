"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptYamlSectionBase_1 = require("./SplitScriptYamlSectionBase");
class SplitScriptJsonSection extends SplitScriptYamlSectionBase_1.SplitScriptYamlSectionBase {
    constructor(filename, content = undefined) {
        super(filename, 'json', 'yaml', content);
    }
}
exports.SplitScriptJsonSection = SplitScriptJsonSection;
//# sourceMappingURL=SplitScriptJsonSection.js.map