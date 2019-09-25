"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
const SplitScriptAwkSection_1 = require("../../sections/SplitScriptAwkSection");
class MetricsWrittenMoreThanOnceValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super("Metric written more than once", CodeValidation_1.FunctionSeverity.error);
    }
    get_markers(script) {
        this.markers = [];
        if (!script) {
            return this.markers;
        }
        if (!script.current_section || !script.header_section) {
            return this.markers;
        }
        if (script.current_section.content_type !== "awk") {
            return this.markers;
        }
        if (script.current_section instanceof SplitScriptAwkSection_1.SplitScriptAwkSection) {
            let awk_section = script.current_section;
            let used_metrics = awk_section.get_metrics();
            let duplicate_metrics = {};
            for (let used of used_metrics) {
                if (!duplicate_metrics[used[1]]) {
                    duplicate_metrics[used[1]] = [];
                }
                duplicate_metrics[used[1]].push(used);
            }
            for (let dup in duplicate_metrics) {
                let item = duplicate_metrics[dup];
                if (item.length > 1) {
                    for (let duplicate of item) {
                        let marker = new MarkerResult_1.MarkerResult(duplicate[0], duplicate[0] + duplicate[1].length, "This metric has been written more than once", CodeValidation_1.FunctionSeverity.information, true, duplicate[1]);
                        marker.ignore_quoted = false;
                        this.markers.push(marker);
                    }
                }
            }
        }
        return this.markers;
    }
}
exports.MetricsWrittenMoreThanOnceValidation = MetricsWrittenMoreThanOnceValidation;
//# sourceMappingURL=MetricsWrittenMoreThanOnceValidation.js.map