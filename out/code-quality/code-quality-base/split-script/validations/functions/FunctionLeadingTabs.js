"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
class FunctionLeadingTabs extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super('Leading tabs');
        this.markers = [];
    }
    get_markers(script) {
        if (script.current_section === undefined) {
            return [];
        }
        this.markers = [];
        if (['awk', 'yaml'].indexOf(script.current_section.content_type) > -1) {
            let regex_match = /^([\t]+)/gm;
            let match;
            while (match = regex_match.exec(script.current_section.content)) {
                for (let i = 1; i < match.length; i++) {
                    this.markers.push(new MarkerResult_1.MarkerResult(match.index, match.index + match[0].length, "Tabs should not be used for indentation, please configure your editor to use space for indentation.", CodeValidation_1.FunctionSeverity.error, true, match[0]));
                }
            }
        }
        return this.markers;
    }
}
exports.FunctionLeadingTabs = FunctionLeadingTabs;
//# sourceMappingURL=FunctionLeadingTabs.js.map