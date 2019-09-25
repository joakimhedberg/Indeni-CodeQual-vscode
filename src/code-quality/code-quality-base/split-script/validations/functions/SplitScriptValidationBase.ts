import { MarkerResult } from "../../../MarkerResult";
import { SplitScript } from "../../SplitScript";
import { FunctionSeverity } from "../../../CodeValidation";

export abstract class SplitScriptValidationBase
{
    public title : string;
    public severity : FunctionSeverity;
    public markers : MarkerResult[] = [];
    public id : number | undefined = undefined;
    constructor(title : string, severity : FunctionSeverity) {
        this.title = title;
        this.severity = severity;
    }

    abstract get_markers(script : SplitScript) : MarkerResult[];

    public get_filtered_markers() : MarkerResult[] {
        return this.markers.filter((element, index, array) => {
            return !element.is_ignored && array.findIndex(t => t.start_pos === element.start_pos && t.severity === element.severity && t.tooltip === element.tooltip) === index;
        });
    }

    public get_summary() : string {
        let result : string = "";

        let markers = this.get_filtered_markers();

        if (markers.length === 0) {
            return result;
        }

        for (let mark of markers) {
            let line_string = this.build_line_string(mark);
            
            result += `[Line: ${line_string}] [Start-End(global): ${mark.start_pos}, ${mark.end_pos}] Offending text: '${mark.offending_text}'<button onclick="scroll_to(${mark.start_pos}, ${mark.end_pos});">Show</button>\n`;
        }

        return result;
    }

    build_line_string(mark : MarkerResult) : string {
        if (mark.start_line !== undefined && mark.end_line !== undefined) {
            if (mark.start_line === mark.end_line) {
                return mark.start_line.toString();
            }
            else {
                 return mark.start_line.toString() + " - " + mark.end_line.toString();
            }
        }
        else if (mark.start_line !== undefined) {
            return mark.start_line.toString();
        }
        else if (mark.end_line !== undefined) {
            return mark.end_line.toString();
        }

        return "";
    }

    public tooltip_from_context() : string {
        let tooltip_map : { [id : string] : boolean } = {};

        for (let marker of this.markers.filter((element, index, array) => {
            return !element.is_ignored;
        })) {
            tooltip_map[marker.tooltip] = true;
        }
        let result : string[] = [];
        for (let key in tooltip_map) {
            result.push(key);
        }

        return result.join('\n');
    }
}