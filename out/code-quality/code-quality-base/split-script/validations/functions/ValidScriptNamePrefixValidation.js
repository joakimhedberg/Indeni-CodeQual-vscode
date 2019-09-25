"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
const SplitScriptIndSection_1 = require("../../sections/SplitScriptIndSection");
class ValidScriptNamePrefix extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor(valid_prefixes) {
        super("Valid script name", CodeValidation_1.FunctionSeverity.error);
        this.valid_prefixes = valid_prefixes;
    }
    get_markers(script) {
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
        if (script.current_section instanceof SplitScriptIndSection_1.SplitScriptIndSection) {
            let header_section = script.current_section;
            let script_name = header_section.get_script_name();
            if (script_name !== undefined) {
                let script_name_split = script_name[1].split(/-/);
                if (this.valid_prefixes.indexOf(script_name_split[0]) === -1) {
                    this.markers.push(new MarkerResult_1.MarkerResult(script_name[0], script_name[0] + script_name_split[0].length, "Prefixes are important, not only to distinguish which type of device the script is executed on, but also to avoid script name collisions.\nValid prefixes: " + this.valid_prefixes.join(", "), this.severity, true, script_name_split[0]));
                }
                let error_characters = /([^a-z\-0-9])/gm;
                let match;
                while (match = error_characters.exec(script_name[1])) {
                    this.markers.push(new MarkerResult_1.MarkerResult(script_name[0] + match.index, script_name[0] + match.index + match[1].length, "A script name should consist of letters(a-z) and dashes(-)", this.severity, true, match[1]));
                }
            }
        }
        return this.markers;
    }
}
exports.ValidScriptNamePrefix = ValidScriptNamePrefix;
//# sourceMappingURL=ValidScriptNamePrefixValidation.js.map