"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MarkerResult_1 = require("./MarkerResult");
/*
    Base classes for the code validation functions

    CodeValidation:
        Bottom(or top?) of the hierarchy where mark needs to be specified manually

    CodeValidationRegex:
        Marks code based on a regexp
    
    CodeValidationByLine:
        Marks code line by line based on regexp. Can handle special cases and ignore lines.
*/
class CodeValidation {
    constructor(name, reason, severity, apply_to_sections) {
        this.applied_markers = [];
        this.offset_handled = false;
        this.ignore_comments = true;
        this.name = name;
        this.reason = reason;
        this.severity = severity;
        this.apply_to_sections = apply_to_sections;
        this.mark = null;
    }
    get_filtered_markers() {
        let filtered = this.applied_markers.filter((element, index, array) => {
            return !element.is_ignored;
        });
        return filtered.filter((element, index, array) => {
            return array.findIndex(t => t.start_pos === element.start_pos && t.severity === element.severity && t.tooltip === element.tooltip) === index;
        });
    }
    // Summary of the applied markers, used for js/html
    get_summary() {
        let result = "";
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
    build_line_string(mark) {
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
    has_triggered() {
        return this.applied_markers.length > 0;
    }
    reset() {
        this.applied_markers.length = 0;
    }
    do_mark(content, sections) {
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
exports.CodeValidation = CodeValidation;
class CodeValidationRegex extends CodeValidation {
    constructor(name, reason, severity, apply_to_sections, regex) {
        super(name, reason, severity, apply_to_sections);
        this.mark = (content, sections) => {
            let match;
            let result = [];
            while (match = regex.exec(content)) {
                if (match.length > 1) {
                    let idx = 0;
                    // Find the first actual match
                    for (let i = 1; i < match.length; i++) {
                        if (match[i] === undefined || match[i] === null) {
                            continue;
                        }
                        idx = match[0].indexOf(match[i], idx);
                        const start_pos = match.index + idx;
                        const end_pos = match.index + idx + match[i].length;
                        result.push(new MarkerResult_1.MarkerResult(start_pos, end_pos, this.reason, this.severity, this.offset_handled, match[i]));
                    }
                }
            }
            return result;
        };
    }
}
exports.CodeValidationRegex = CodeValidationRegex;
class CodeValidationByLine extends CodeValidationRegex {
    constructor(name, reason, severity, apply_to_sections, line_regex, special_cases, value_exclusion = []) {
        super(name, reason, severity, apply_to_sections, line_regex);
        this.special_cases = special_cases;
        this.value_exclusion = value_exclusion;
        this.mark = (content, sections) => {
            let result = [];
            let lines = content.split("\n");
            let line_offset = 0;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let special_result = this.special(line);
                if (special_result[0]) {
                    for (let res of special_result[1]) {
                        result.push(new MarkerResult_1.MarkerResult(res.start_pos + line_offset, res.end_pos + line_offset, this.reason, this.severity, this.offset_handled, res.offending_text));
                    }
                }
                else {
                    let match;
                    while (match = line_regex.exec(line)) {
                        if (match.length > 1) {
                            for (let i = 1; i < match.length; i++) {
                                if (match[i] === null || match[i] === undefined) {
                                    continue;
                                }
                                if (!this.excluded(match[i])) {
                                    result.push(new MarkerResult_1.MarkerResult(match.index + line_offset, match.index + match[i].length + line_offset, this.reason, this.severity, this.offset_handled, match[i]));
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
    excluded(line) {
        for (let exclusion of this.value_exclusion) {
            if (exclusion.test(line)) {
                return true;
            }
        }
        return false;
    }
    special(line) {
        for (let item of this.special_cases) {
            if (item.matches(line)) {
                return [true, item.exec(line)];
            }
        }
        return [false, []];
    }
}
exports.CodeValidationByLine = CodeValidationByLine;
var FunctionSeverity;
(function (FunctionSeverity) {
    FunctionSeverity["information"] = "information";
    FunctionSeverity["warning"] = "warning";
    FunctionSeverity["error"] = "error";
})(FunctionSeverity = exports.FunctionSeverity || (exports.FunctionSeverity = {}));
//# sourceMappingURL=CodeValidation.js.map