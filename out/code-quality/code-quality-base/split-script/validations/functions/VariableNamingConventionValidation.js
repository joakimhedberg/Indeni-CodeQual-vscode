"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptValidationBase_1 = require("./SplitScriptValidationBase");
const MarkerResult_1 = require("../../../MarkerResult");
const CodeValidation_1 = require("../../../CodeValidation");
const Section_1 = require("../../../Section");
class VariableNamingConventionValidation extends SplitScriptValidationBase_1.SplitScriptValidationBase {
    constructor() {
        super("Variable naming", CodeValidation_1.FunctionSeverity.warning);
    }
    get_markers(script) {
        this.markers = [];
        if (script.current_section === undefined) {
            return this.markers;
        }
        if (script.current_section.content_type !== 'awk') {
            return this.markers;
        }
        let variables = new Map();
        let assignments = [];
        let other = new Map();
        let section = script.current_section;
        let section_variables = section.get_variables();
        if (section_variables === undefined) {
            return this.markers;
        }
        for (let variable of section_variables) {
            if (variable[2] === Section_1.AwkVariableOccurence.assignment) {
                assignments.push(variable);
            }
            else {
                other.set(variable[0], (other.get(variable[0]) || 0) + 1);
            }
            let arr = variables.get(variable[0]);
            if (arr === undefined) {
                arr = [];
                variables.set(variable[0], arr);
            }
            arr.push(variable[1]);
        }
        for (let item of variables) {
            if (!this.verify_variable_spelling(item[0])) {
                for (let startpos of item[1]) {
                    let marker = new MarkerResult_1.MarkerResult(startpos, startpos + item[0].length, "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", this.severity, true, item[0]);
                    marker.ignore_quoted = true;
                    marker.ignore_regexp = true;
                    this.markers.push(marker);
                }
            }
        }
        return this.markers;
    }
    valid_variable_name(varname) {
        let match = varname.match("^[a-z0-9_]*");
        if (match === null) {
            return false;
        }
        return match[0] === varname;
    }
    valid_array_variable_name(array_variable_name) {
        let result = [];
        let variable_name = array_variable_name[1].substring(0, array_variable_name[1].indexOf('['));
        if (!this.valid_variable_name(variable_name)) {
            let marker = new MarkerResult_1.MarkerResult(array_variable_name[0], array_variable_name[0] + variable_name.length, "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", this.severity, true, variable_name);
            marker.ignore_quoted = true;
            result.push(marker);
        }
        return result;
    }
    verify_variable_spelling(varname) {
        let match = varname.match(/[a-z0-9_]+|FS|\$[a-z0-9_]+/g);
        if (match === null) {
            return false;
        }
        return match[0] === varname;
    }
}
exports.VariableNamingConventionValidation = VariableNamingConventionValidation;
//# sourceMappingURL=VariableNamingConventionValidation.js.map