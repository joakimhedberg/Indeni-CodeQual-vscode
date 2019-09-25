import { SplitScriptValidationBase } from "./SplitScriptValidationBase";
import { MarkerResult } from "../../../MarkerResult";
import { SplitScript } from "../../SplitScript";
import { FunctionSeverity } from "../../../CodeValidation";
import { SplitScriptAwkSection } from "../../sections/SplitScriptAwkSection";

export class MetricsWrittenMoreThanOnceValidation extends SplitScriptValidationBase {
    constructor() {
        super("Metric written more than once", FunctionSeverity.error);
    }
    
    get_markers(script: SplitScript): MarkerResult[] {
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

        if (script.current_section instanceof SplitScriptAwkSection) {
            let awk_section = script.current_section as SplitScriptAwkSection;
            let used_metrics = awk_section.get_metrics();
            let duplicate_metrics : { [name : string] : [number, string][] } = {};
            
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
                        let marker = new MarkerResult(duplicate[0], duplicate[0] + duplicate[1].length, "This metric has been written more than once", FunctionSeverity.information, true, duplicate[1]);
                        marker.ignore_quoted = false;
                        this.markers.push(marker);
                    }
                }
            }
        }

        return this.markers;
    }
}