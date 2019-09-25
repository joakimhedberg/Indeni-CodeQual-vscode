import { MarkerResult } from "./MarkerResult";
import { Sections } from "./Section";
import { SpecialCase } from "./SpecialCase";

/*
    Base classes for the code validation functions

    CodeValidation:
        Bottom(or top?) of the hierarchy where mark needs to be specified manually

    CodeValidationRegex:
        Marks code based on a regexp
    
    CodeValidationByLine:
        Marks code line by line based on regexp. Can handle special cases and ignore lines.
*/

export class CodeValidation
{
    name : string; // Validation function name
    reason : string; // Reason/explanation for the function
    severity : FunctionSeverity; // Severity enum
    apply_to_sections : string[]; // Sections where this validation is applicable
    mark : ((content : string, sections : Sections) => MarkerResult[]) | null; // Delegate to mark the code
    public applied_markers : MarkerResult[] = [];
    offset_handled : boolean = false;
    public ignore_comments : boolean = true;
    constructor(name : string, reason : string, severity : FunctionSeverity, apply_to_sections : string[]) {
        this.name = name;
        this.reason = reason;
        this.severity = severity;
        this.apply_to_sections = apply_to_sections;
        this.mark = null;
    }

    public get_filtered_markers() : MarkerResult[] {
        let filtered = this.applied_markers.filter((element, index, array) => {
            return !element.is_ignored;
        });

        return filtered.filter((element, index, array) => {
            return array.findIndex(t => t.start_pos === element.start_pos && t.severity === element.severity && t.tooltip === element.tooltip) === index;
        });
    }

    // Summary of the applied markers, used for js/html
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

    public has_triggered() {
        return this.applied_markers.length > 0;
    }

    public reset() {
        this.applied_markers.length = 0;
    }

    public do_mark(content : string, sections : Sections) : MarkerResult[] {
        if (this.mark === null) {
            return [];
        }

        let result = this.mark(content, sections);

        for (let marker of result) {
            marker.code_validation = this;
            this.applied_markers.push(marker);
        }


        return result;
    }
}

export class CodeValidationRegex extends CodeValidation {
    constructor(name : string, reason : string, severity : FunctionSeverity, apply_to_sections : string[], regex : RegExp) {
        super(name, reason, severity, apply_to_sections);

        this.mark = (content : string, sections : Sections) : MarkerResult[] => {
            let match;
            let result : MarkerResult[] = [];

            while (match = regex.exec(content)) {
                if (match.length > 1) {
                    let idx = 0;
                    // Find the first actual match
                    for (let i = 1; i < match.length; i++)
                    {
                        if (match[i] === undefined || match[i] === null) {
                            continue;
                        }
                        idx = match[0].indexOf(match[i], idx);
                        const start_pos = match.index + idx;
                        const end_pos = match.index + idx + match[i].length;
                        result.push(new MarkerResult(start_pos, end_pos, this.reason, this.severity, this.offset_handled, match[i]));
                    }
                }
            }
            return result;
        };
    }
}

export class CodeValidationByLine extends CodeValidationRegex {
    special_cases : SpecialCase[];
    value_exclusion : RegExp[];
    constructor(name : string, reason : string, severity : FunctionSeverity, apply_to_sections : string[], line_regex : RegExp, special_cases : SpecialCase[], value_exclusion : RegExp[] = [])  {
        super(name, reason, severity, apply_to_sections, line_regex);
        this.special_cases = special_cases;
        this.value_exclusion = value_exclusion;

        this.mark = (content : string, sections : Sections) : MarkerResult[] => {
            let result : MarkerResult[] = [];
            let lines = content.split("\n");
            let line_offset = 0;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];

                let special_result = this.special(line);
                if (special_result[0]) {
                    for (let res of special_result[1]) {
                        result.push(new MarkerResult(res.start_pos + line_offset, res.end_pos + line_offset, this.reason, this.severity, this.offset_handled, res.offending_text));
                    }
                }
                else {
                    let match;
                    while (match = line_regex.exec(line)) {
                        if (match.length > 1) {
                            for (let i = 1; i < match.length; i++)
                            {
                                if (match[i] === null || match[i] === undefined) {
                                    continue;
                                }
                                if (!this.excluded(match[i])) {
                                    result.push(new MarkerResult(match.index + line_offset, match.index + match[i].length + line_offset, this.reason, this.severity, this.offset_handled, match[i]));
                                }
                            }
                        }
                    }
                }
                line_offset += line.length + 1;
            }
            return result;
        };
    }

    excluded(line : string) : boolean {
        for (let exclusion of this.value_exclusion) {
            if (exclusion.test(line)) {
                return true;
            }
        }

        return false;
    }

    special(line : string) : [boolean, MarkerResult[]] {
        for (let item of this.special_cases) {
            if (item.matches(line)) {
                return [true, item.exec(line)];
            }
        }

        return [false, []];
    }
}

export enum FunctionSeverity {
    information = "information",
    warning = "warning",
    error = "error"
}