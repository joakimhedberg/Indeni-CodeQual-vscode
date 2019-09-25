"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
const SplitScriptIndSection_1 = require("../../sections/SplitScriptIndSection");
class UnusedMetricsValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super("Metric has been documented but is not used", CodeValidation_1.FunctionSeverity.error);
    }
    get_markers(script) {
        this.markers = [];
        if (!script) {
            return this.markers;
        }
        if (!script.current_section || !script.header_section) {
            return this.markers;
        }
        if (script.current_section.content_type !== "yaml") {
            return this.markers;
        }
        if (script.current_section instanceof SplitScriptIndSection_1.SplitScriptIndSection) {
            let header_section = script.current_section;
            let documented_metrics = header_section.get_documented_metrics();
            let used_metrics = [];
            for (let section of script.sections) {
                for (let used of section.get_metrics()) {
                    used_metrics.push(used);
                }
            }
            for (let doc of documented_metrics) {
                let found = false;
                for (let used of used_metrics) {
                    if (doc[1] === used[1]) {
                        found = true;
                    }
                }
                if (!found) {
                    this.markers.push(new MarkerResult_1.MarkerResult(doc[0], doc[0] + doc[1].length, "This metric has been documented in the comments section but is not used in the script", this.severity, true, doc[1]));
                }
            }
        }
        return this.markers;
    }
}
exports.UnusedMetricsValidation = UnusedMetricsValidation;
//# sourceMappingURL=UnusedMetricsValidation.js.map