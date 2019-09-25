import { SplitScriptValidationBase } from "./SplitScriptValidationBase";
import { MarkerResult } from "../../../MarkerResult";
import { SplitScript } from "../../SplitScript";
import { FunctionSeverity } from "../../../CodeValidation";
import { SplitScriptAwkSection } from "../../sections/SplitScriptAwkSection";
import { SplitScriptIndSection } from "../../sections/SplitScriptIndSection";

export class IncludesResourceDataValidation extends SplitScriptValidationBase {
    public resource_metrics : string[];
    constructor(title : string,  resource_metrics : string[]) {
        super(title, FunctionSeverity.error);
        this.resource_metrics = resource_metrics;
    }
    
    get_markers(script: SplitScript): MarkerResult[] {
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
            if (script.current_section instanceof SplitScriptIndSection) {
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
                    this.markers.push(new MarkerResult(includes[0], includes[0] + includes[1].length, "Resource data has been used but no metrics that require it seem to exist.", FunctionSeverity.error, true, includes[1]));
                }
            }
        } else if (script.current_section.content_type === 'awk' && !header_includes_resource_data) {
            let current_section = script.current_section as SplitScriptAwkSection;
            
            for (let metric of current_section.get_metrics()) {
                if (this.resource_metrics.indexOf(metric[1]) > -1) {
                    this.markers.push(new MarkerResult(metric[0], metric[0] + metric[1].length, "This tag would normally require include_resource_data in the meta section.", FunctionSeverity.error, true, metric[1]));
                } 
            }
        }

        return this.markers;
    }
}