import { SplitScriptValidationBase } from "./SplitScriptValidationBase";
import { MarkerResult } from "../../../MarkerResult";
import { SplitScript } from "../../SplitScript";
import { FunctionSeverity } from "../../../CodeValidation";
import { SplitScriptIndSection } from "../../sections/SplitScriptIndSection";

export class UnusedMetricsValidation extends SplitScriptValidationBase {
    constructor() {
        super("Metric has been documented but is not used", FunctionSeverity.error);
    }

    get_markers(script: SplitScript): MarkerResult[] {
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

        if (script.current_section instanceof SplitScriptIndSection) {
            let header_section = script.current_section as SplitScriptIndSection;
            let documented_metrics = header_section.get_documented_metrics();
            let used_metrics : [number, string][] = [];

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
                    this.markers.push(new MarkerResult(doc[0], doc[0] + doc[1].length, "This metric has been documented in the comments section but is not used in the script", this.severity, true, doc[1]));
                }
            }
        }

        return this.markers;
    }
}