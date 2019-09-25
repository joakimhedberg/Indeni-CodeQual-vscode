"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
const SplitScriptIndSection_1 = require("../../sections/SplitScriptIndSection");
class IncludesResourceDataValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor(title, resource_metrics) {
        super(title, CodeValidation_1.FunctionSeverity.error);
        this.resource_metrics = resource_metrics;
    }
    get_markers(script) {
        this.markers = [];
        if (!script) {
            return this.markers;
        }
        if (!script.current_section || !script.header_section) {
            return this.markers;
        }
        if (script.header_section === undefined) {
            return this.markers;
        }
        let header_includes_resource_data = false;
        let includes = script.header_section.get_includes_resource_data();
        if (includes !== undefined) {
            if (includes[1] === 'true') {
                header_includes_resource_data = true;
            }
        }
        if (script.current_section.content_type === 'yaml' && script.current_section.section_identifier === 'ind' && header_includes_resource_data) {
            if (script.current_section instanceof SplitScriptIndSection_1.SplitScriptIndSection) {
                let resource_metric_found = false;
                for (let awk_sect of script.awk_sections) {
                    for (let metric of awk_sect.get_metrics()) {
                        if (this.resource_metrics.indexOf(metric[1]) > -1) {
                            resource_metric_found = true;
                            break;
                        }
                        if (resource_metric_found) {
                            break;
                        }
                    }
                }
                if (!resource_metric_found && includes !== undefined) {
                    this.markers.push(new MarkerResult_1.MarkerResult(includes[0], includes[0] + includes[1].length, "Resource data has been used but no metrics that require it seem to exist.", CodeValidation_1.FunctionSeverity.error, true, includes[1]));
                }
            }
        }
        else if (script.current_section.content_type === 'awk' && !header_includes_resource_data) {
            let current_section = script.current_section;
            for (let metric of current_section.get_metrics()) {
                if (this.resource_metrics.indexOf(metric[1]) > -1) {
                    this.markers.push(new MarkerResult_1.MarkerResult(metric[0], metric[0] + metric[1].length, "This tag would normally require include_resource_data in the meta section.", CodeValidation_1.FunctionSeverity.error, true, metric[1]));
                }
            }
        }
        return this.markers;
    }
}
exports.IncludesResourceDataValidation = IncludesResourceDataValidation;
//# sourceMappingURL=IncludesResourceDataValidation.js.map