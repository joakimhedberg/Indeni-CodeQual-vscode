import { SplitScriptValidationBase } from "./SplitScriptValidationBase";
import { SplitScript } from "../../SplitScript";
import { MarkerResult } from "../../../MarkerResult";
import { FunctionSeverity } from "../../../CodeValidation";

export class RegexValidation extends SplitScriptValidationBase {
    
    private tooltip : string;
    private sections : string[];
    private content_type : string[];
    private match_regex : RegExp;
    public ignore_comments : boolean = true;
    public ignore_regexp : boolean = false;
    public ignore_quoted : boolean = true;

    constructor(title : string, tooltip : string, severity : FunctionSeverity, match_regex : RegExp, sections : string[], content_type : string[]) {
        super(title, severity);
        this.tooltip = tooltip;
        this.sections = sections;
        this.content_type = content_type;
        this.match_regex = match_regex;
    }

    get_markers(script: SplitScript) : MarkerResult[] {
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
                let marker = new MarkerResult(match.index, match.index + match[0].length, this.tooltip, this.severity, true, match[0]);
                marker.ignore_comments = this.ignore_comments;
                marker.ignore_quoted = this.ignore_quoted;
                marker.ignore_regexp = this.ignore_regexp;

                this.markers.push(marker);
            }
        }

        return this.markers;
    }

}