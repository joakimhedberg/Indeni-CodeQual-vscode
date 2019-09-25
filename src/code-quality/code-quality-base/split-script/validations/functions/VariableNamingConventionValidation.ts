import { SplitScriptValidationBase } from "./SplitScriptValidationBase";
import { MarkerResult } from "../../../MarkerResult";
import { SplitScript } from "../../SplitScript";
import { FunctionSeverity } from "../../../CodeValidation";
import { SplitScriptAwkSection } from "../../sections/SplitScriptAwkSection";
import { AwkVariableOccurence } from "../../../Section";

export class VariableNamingConventionValidation extends SplitScriptValidationBase {
    constructor() {
        super("Variable naming", FunctionSeverity.warning);
    }

    get_markers(script: SplitScript): MarkerResult[] {
        this.markers = [];
        if (script.current_section === undefined) {
            return this.markers;
        }

        if (script.current_section.content_type !== 'awk') {
            return this.markers;
        }

        let variables : Map<string, number[]> = new Map();
        let assignments : [string, number, AwkVariableOccurence][] = [];
        let other : Map<string, number> = new Map();
   
        let section = script.current_section as SplitScriptAwkSection;
        let section_variables = section.get_variables();
        if (section_variables === undefined) {
            return this.markers;
        }

        for (let variable of section_variables) {
            if (variable[2] === AwkVariableOccurence.assignment) {
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
                    let marker = new MarkerResult(startpos, startpos + item[0].length, "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", this.severity, true, item[0]);
                    marker.ignore_quoted = true;
                    marker.ignore_regexp = true;
                    this.markers.push(marker);
                }
            }
        }
        return this.markers;
    }

    valid_variable_name(varname : string) : boolean {
        let match = varname.match("^[a-z0-9_]*");
        if (match === null) {
            return false;
        }
        
        return match[0] === varname;
    }

    valid_array_variable_name(array_variable_name : [number, string]) : MarkerResult[] {
        let result : MarkerResult[] = [];
        let variable_name = array_variable_name[1].substring(0, array_variable_name[1].indexOf('['));
        if (!this.valid_variable_name(variable_name)) {
            let marker = new MarkerResult(array_variable_name[0], array_variable_name[0] + variable_name.length, "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", this.severity, true, variable_name);
            marker.ignore_quoted = true;
            result.push(marker);
        }
        return result;
    }

    verify_variable_spelling(varname : string) : boolean {
        let match = varname.match(/[a-z0-9_]+|FS|\$[a-z0-9_]+/g);
        if (match === null) {
            return false;
        }
        
        return match[0] === varname;
    }
    
}