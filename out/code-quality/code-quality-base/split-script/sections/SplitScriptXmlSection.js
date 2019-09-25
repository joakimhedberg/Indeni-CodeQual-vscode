"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptYamlSectionBase_1 = require("./SplitScriptYamlSectionBase");
class SplitScriptXmlSection extends SplitScriptYamlSectionBase_1.SplitScriptYamlSectionBase {
    constructor(filename, content = undefined) {
        super(filename, 'xml', 'yaml', content);
    }
}
exports.SplitScriptXmlSection = SplitScriptXmlSection;
//# sourceMappingURL=SplitScriptXmlSection.js.map