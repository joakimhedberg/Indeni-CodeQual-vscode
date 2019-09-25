"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
class RegexValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor(title, tooltip, severity, match_regex, sections, content_type) {
        super(title, severity);
        this.ignore_comments = true;
        this.ignore_regexp = false;
        this.ignore_quoted = true;
        this.tooltip = tooltip;
        this.sections = sections;
        this.content_type = content_type;
        this.match_regex = match_regex;
    }
    get_markers(script) {
        this.markers = [];
        if (script.current_section === undefined) {
            return this.markers;
        }
        if (!script.current_section.content) {
            return this.markers;
        }
        if (this.sections.length > 0) {
            if (this.sections.indexOf(script.current_section.section_identifier) <= -1) {
                return this.markers;
            }
        }
        if (this.content_type.length > 0) {
            if (this.content_type.indexOf(script.current_section.content_type) <= -1) {
                return this.markers;
            }
        }
        let regex_match = this.match_regex;
        let match;
        while (match = regex_match.exec(script.current_section.content)) {
            for (let i = 1; i < match.length; i++) {
                let marker = new MarkerResult_1.MarkerResult(match.index, match.index + match[0].length, this.tooltip, this.severity, true, match[0]);
                marker.ignore_comments = this.ignore_comments;
                marker.ignore_quoted = this.ignore_quoted;
                marker.ignore_regexp = this.ignore_regexp;
                this.markers.push(marker);
            }
        }
        return this.markers;
    }
}
exports.RegexValidation = RegexValidation;
//# sourceMappingURL=RegexValidation.js.map