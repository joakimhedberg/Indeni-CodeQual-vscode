import { SplitScriptSectionBase } from "./SplitScriptSectionBase";
import { AwkVariableOccurence } from "../../Section";

export class SplitScriptAwkSection extends SplitScriptSectionBase {
    constructor(filename : string, content : string | undefined = undefined) {
        super(filename, 'awk', 'awk', content);
    }

    public get_metrics() : [number, string][] {
        let content = this.content;
        let result : [number, string][] = [];

        if (!content) {
            return result;
        }

        let regex_assigned = /^\s{0,}[^\#]\s{0,}write.*Metric\w*\(\"(.*?)\".+$/gm;
        
        let match;
        while (match = regex_assigned.exec(content))
        {
            if (match.length > 1)
            {
                result.push([match[0].indexOf(match[1]) + match.index, match[1]]);
            }
        }

        return result;
    }

    public get_variables() : [string, number, AwkVariableOccurence][] | undefined {
        if (this.content === undefined) {
            return undefined;
        }
        /*
        What can variables look like?
            Assignment:
                var_name = value
                    Taking into account that the space between = on both sides can be 0 to infinity
                tags_arr[parameters] = value
            Incremental/decremental
                var_name++
                ++var_name
                var_name--
                --var_name
                tags_arr[parameters]++
                ++tags_arr[parameters]
                tags_arr[parameters]--
                --tags_arr[parameters]

            Removal
                delete var_name
                delete tags_arr[parameter]

            Operators
                < Less than
                <= Less than or equal to
                > Greater than
                >= Greater than or equal to
                == Equal to
                != Not equal to
                ~ Matches(compares a string to a regular expression)
                !~ Does not match
                variable in array
        */


        //let regex_assigned = /^[^#][\s]*(.+)[^!=<>]=[^=~]|^.*\(([^ ]*)[^!=<>]=[^=~]/gm; // Find variable assignments, Example: test_var = 23
        let regex_assigned = /([a-z0-9A-Z_]+)(?=\s?\=)/gm;
        //let regex_assigned = /\s?([a-zA-Z\_0-9]+)(\s?|\[.*\]\s?)(?=[^=!<>,]=[^=])/gm;
        let regex_assigned_delete = /^[^#][\s]*delete ([^\s]+)/gm; // Found variable deletion, Example: delete test_var
        //let regex_assigned_incdec_prefix = /^[^#][\s]*([^\s\[\]\(\)]+)(?=[\+]{2}|[\-]{2})/gm; // Find incremental and decremental variables, Examples: ++test, --test
        //let regex_assigned_incdec_suffix= /^[^#][\s].*([\+]{2}|[\-]{2})([^\(\)\[\]\s]+)/gm; // Find incremental and decremental variables, Examples: test++, test--
        let regex_assigned_incdec_prefix = /[^\+\-](\+{2}|\-{2})([a-z_0-9A-Z]+)/gm;
        let regex_assigned_incdec_suffix = /([a-z_0-9A-Z]+)(\+{2}|\-{2})[^\+\-]/gm;

        let match;
        let result : [string, number, AwkVariableOccurence][] = [];
        while (match = regex_assigned.exec(this.content)) {
            if (match.length > 0) {
                let var_idx = 1;

                for (let i = match.length - 1; i > 0; i--) {
                    if (match[i] !== undefined) {
                        var_idx = i;
                        break;
                    }
                }
                let var_name : string = match[var_idx];

                let array_match = /\[.*\]/g.exec(var_name);
                
                if (array_match !== null && array_match.index !== undefined)
                {
                    let res_var = var_name.replace(/\[.*\]/, "");
                    let parameters = array_match[0].replace(/\[(.*)\]/, "$1");
                    result.push([res_var, match.index + match[0].indexOf(res_var), AwkVariableOccurence.assignment]);

                    this.handle_parameters(parameters, match.index + var_name.indexOf(res_var), match[0], result);
                }
                else {
                    if (var_name !== undefined)
                    {
                        let p_idx = var_name.indexOf("(") + 1;
                        if (p_idx > 0) {
                            var_name = var_name.slice(p_idx, var_name.length);
                        }

                        if (!isNaN(Number(var_name))) {
                            continue;
                        }

                        if (var_name.trim() === "") {
                            continue;
                        }

                        let res_var = this.var_cleanup(var_name);
                        result.push([res_var, match.index + match[0].indexOf(res_var), AwkVariableOccurence.assignment]);
                    }
                }
            }
        }
        
        while (match = regex_assigned_delete.exec(this.content)) {
            if (match.length > 0) 
            {
                let var_name = match[1];
                let arr_match = /\[.*\]/g.exec(var_name);
                if (arr_match !== null && arr_match.index !== undefined)
                {
                    let res_var = var_name.replace(/\[.*\]/, "");
                    let parameters = arr_match[0].replace(/\[(.*)\]/, "$1");
                    result.push([res_var, match.index + match[0].indexOf(res_var), AwkVariableOccurence.delete]);

                    this.handle_parameters(parameters, match.index + var_name.indexOf(res_var), match[0], result);
                } else {
                    let res_var = this.var_cleanup(match[1]);
                    result.push([res_var, match.index + match[0].indexOf(res_var), AwkVariableOccurence.delete]);
                }
            }
        }
        
        while (match = regex_assigned_incdec_suffix.exec(this.content)) {
            if (match.length > 0) {
                let res_var = this.var_cleanup(match[1]);
                result.push([res_var, match.index + match[0].indexOf(res_var), AwkVariableOccurence.incremented_decremented]);
            }
        }
        
        while (match = regex_assigned_incdec_prefix.exec(this.content)) {
            if (match.length > 1) {
                let res_var = this.var_cleanup(match[2]);
                result.push([res_var, match.index + match[0].indexOf(res_var), AwkVariableOccurence.incremented_decremented]);
            }
        }

        let result2 : [string, number, AwkVariableOccurence][] = [];
        
        for (let variable of result) {          
            let index = -1;
            while ((index = this.content.indexOf(variable[0], index  + 1)) > -1) {
                result2.push([variable[0], index, AwkVariableOccurence.embedded]);
            }

        }

        if (result2.length > 0) {
            result = result.concat(result2);
        }
        return result;
    }

    var_cleanup(variable : string) {
        let result = variable.trim();
        if (result.indexOf("=") > -1) {
            result = result.substring(0, result.indexOf("="));
        }

        return result.trim();
    }

    handle_var(variable : string, match_index : number, full_match : string, result : [string, number, AwkVariableOccurence][], occurence : AwkVariableOccurence | undefined = undefined) {
        if (variable === undefined) {
            return;
        }

        variable = variable.replace("[ ,]", '');
        
        // Skip commented lines
        if (full_match.match(/^\s*[#]/) || variable.startsWith("\"") || !variable) {
            return;
        }
        
        let array_match = /([^\s].*)\[(.*)\]/g.exec(variable);

        //let parenthesis_match = /for\s\((.*)\)/g.exec(variable);
        let equals_match = /(.?)[=\s<>]+/g.exec(variable);
        // Check if the variable is an array
        if (array_match !== null && array_match.length > 1 && array_match.index !== undefined) {
            result.push([array_match[1], full_match.indexOf(array_match[1]), AwkVariableOccurence.assignment]);
            this.handle_parameters(array_match[2], match_index, full_match, result);
        }
        else if (equals_match !== null && equals_match.length > 1 && equals_match.index !== undefined) {
            this.handle_var(equals_match[1], match_index + equals_match.index, full_match, result);
        }
        else {
            let p_idx = variable.indexOf("(");
            if (p_idx > -1)
            {
                variable = variable.substring(p_idx, variable.length - p_idx);
            }
            if (!isNaN(Number(variable))) {
                return;
            }
            result.push([variable, match_index + full_match.indexOf(variable), occurence || AwkVariableOccurence.assignment]);
        }
    }

    handle_parameters(content : string, match_index : number, full_match : string, result : [string, number, AwkVariableOccurence][]) {
        let items = content.split(/[,+-/\\\s]+(?=([^\"]*\"[^\"]*\")*[^\"]*$)/g);
        for (let i = 0; i < items.length; i++) {
            if (items[i] === undefined) {
                continue;
            }
            this.handle_var(items[i], match_index, full_match, result, AwkVariableOccurence.embedded);
        }
    }    
}
