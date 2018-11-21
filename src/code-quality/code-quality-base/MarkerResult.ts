import { FunctionSeverity } from "./CodeValidation";

export class MarkerResult {
    start_pos : number;
    end_pos : number;
    tooltip : string;
    offset_handled : boolean;
    severity : FunctionSeverity;
    constructor(start_pos : number, end_pos : number, tooltip : string, severity : FunctionSeverity, offset_handled : boolean) {
        this.start_pos = start_pos;
        this.end_pos = end_pos;
        this.tooltip = tooltip;
        this.offset_handled = offset_handled;
        this.severity = severity;
    }
}