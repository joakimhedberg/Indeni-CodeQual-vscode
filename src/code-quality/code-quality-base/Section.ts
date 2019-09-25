import { MarkerResult } from "./MarkerResult";
import { CodeValidations } from "../code-validation";

/*
    The .ind script is split up into sections, that way we can apply the correct check to the correct section
*/
export class Sections {
    public meta : MetaSection | null = null;
    public comments : CommentsSection | null = null;
    public awk : AwkSection | null = null;
    public json : YamlSection | null = null;
    public xml : YamlSection | null = null;
    public script : Section | null = null;
    public all : Section[] = []; // This contains all the sections. This is what we are iterating while performing the checks.

    // Minor check to see if this seems to be an Indeni script, it really only checks if the meta section is present.
    public is_valid() : Boolean {
        return this.meta !== null;
    }
}

export class Section {
    public offset : number; // Section offset in the script
    content : string; // Section content
    length : number; // Section total length
    public apply : string[]; // What type of checks should be applied here? Example: ["meta", "awk"]
    public comments : [string, number][];
    constructor(offset : number, content : string, apply : string[]) {
        this.offset = offset;
        this.content = content;
        this.length = content.length;
        this.apply = apply;
        this.comments = this.get_comments(); // Load the comments in this section, offset by the script as a whole
    }

    // Get the comments in the script, ie the text that starts with # going forward to newline.
    // Returns a list of tuples where the string is the comment (including the #) and the number is the overall offset in the script
    get_comments() : [string, number][] {
        
        let result : [string, number][] = [];
        let regex_comments = /(#[^!].*)$/gm;
        let match;

        while (match = regex_comments.exec(this.content))
        {
            if (match !== undefined)
            {
                if (match.length > 1)
                {
                    result.push([match[1], match.index + this.offset]);
                }
            }
        }
        return result;
    }

    // Check if the offset provided is within a comment
    public is_in_comment(offset : number) : boolean {
        for (let comment of this.comments) {
            if (comment[1] <= offset && offset <= comment[1] + comment[0].length) {
                return true;
            }
        }

        return false;
    }

    // Run all validations(that are applicable) and return check markers if needed
    get_marks(validations : CodeValidations, sections: Sections) : MarkerResult[] {
        let result : MarkerResult[] = [];

        for (let validation of validations.functions) {
            if (validation.mark === null) {
                continue;
            }

            let can_apply = false;
            for (let sect of validation.apply_to_sections) {
                for (let target_sect of this.apply) {
                    if (sect === target_sect) {
                        can_apply = true;
                        break;
                    }
                }
                if (can_apply) {
                    break;
                }
            }

            if (can_apply) {
                var marks = validation.do_mark(this.content, sections);
                if (marks.length > 0) {
                    for (let mark of marks) {
                        let modified_mark = this.modify_mark(mark);
                        modified_mark.ignore_comments = validation.ignore_comments;
                        result.push(modified_mark);
                    }
                }
            }
        }

        return result;
    }

    // Modify the marker offset if it's not already handled
    modify_mark(marker : MarkerResult) : MarkerResult
    {
        if (!marker.offset_handled) {
            marker.start_pos += this.offset;
            marker.end_pos += this.offset;
        }

        return marker;
    }
}


// Comment specific section. Makes it possible to get some extra data out of the specific section.
export class CommentsSection extends Section {
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
    }

    // Get the metrics that has been documented in this section. Returns a tuple with metric name and metric offset
    public get_documented_metrics() : [string, number][] {
        let result : [string, number][] = [];

        let regex_assigned = /^(([^\s:\#])+)/gm;
        let match;

        while (match = regex_assigned.exec(this.content))
        {
            if (match.length > 1)
            {
                result.push([match[0], match.index]);
            }
        }
        
        return result;
    }
}

// Awk specific section. Makes it possible to get some extra data out of the specific section.
export class AwkSection extends Section {
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
    }

    // Get metrics that has been used in this section. Ignores commented lines.
    public get_metrics() : [string, number][] {
        let result : [string, number][] = [];

        let regex_assigned = /^\s{0,}[^\#]\s{0,}write.*Metric\w*\(\"(.*?)\".+$/gm;
        
        let match;
        while (match = regex_assigned.exec(this.content))
        {
            if (match.length > 1)
            {
                result.push([match[1], match[0].indexOf(match[1]) + match.index]);
            }
        }

        return result;
    }
    
    public get_variables() : [string, number, AwkVariableOccurence][] {
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


        let regex_assigned = /^[^#][\s]*(.+)[^!=<>]=[^=~]|^.*\(([^ ]*)[^!=<>]=[^=~]/gm; // Find variable assignments, Example: test_var = 23
        //let regex_assigned = /\s?([a-zA-Z\_0-9]+)(\s?|\[.*\]\s?)(?=[^=!<>,]=[^=])/gm;
        let regex_assigned_delete = /^[^#][\s]*delete ([^\s]+)/gm; // Found variable deletion, Example: delete test_var
        let regex_assigned_incdec_suffix = /^[^#][\s]*([^\s\[\]\(\)]+)(?=[\+]{2}|[\-]{2})/gm; // Find incremental and decremental variables, Examples: test++, test--
        let regex_assigned_incdec_prefix = /^[^#][\s].*([\+]{2}|[\-]{2})([^\(\)\[\]\s]+)/gm; // Find incremental and decremental variables, Examples: ++test, --test

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
                    result.push([res_var, match.index + match[0].indexOf(res_var) + this.offset, AwkVariableOccurence.assignment]);

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
                        result.push([res_var, match.index + match[0].indexOf(res_var) + this.offset, AwkVariableOccurence.assignment]);
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
                    result.push([res_var, match.index + match[0].indexOf(res_var) + this.offset, AwkVariableOccurence.delete]);

                    this.handle_parameters(parameters, match.index + var_name.indexOf(res_var), match[0], result);
                } else {
                    let res_var = this.var_cleanup(match[1]);
                    result.push([res_var, match.index + match[0].indexOf(res_var) + this.offset, AwkVariableOccurence.delete]);
                }
            }
        }
        
        while (match = regex_assigned_incdec_suffix.exec(this.content)) {
            if (match.length > 0) {
                let res_var = this.var_cleanup(match[1]);
                result.push([res_var, match.index + match[0].indexOf(res_var) + this.offset, AwkVariableOccurence.incremented_decremented]);
            }
        }
        
        while (match = regex_assigned_incdec_prefix.exec(this.content)) {
            if (match.length > 1) {
                let res_var = this.var_cleanup(match[2]);
                result.push([res_var, match.index + match[0].indexOf(res_var) + this.offset, AwkVariableOccurence.incremented_decremented]);
            }
        }

        let result2 : [string, number, AwkVariableOccurence][] = [];
        
        for (let variable of result) {          
            let index = -1;
            while ((index = this.content.indexOf(variable[0], index  + 1)) > -1) {
                result2.push([variable[0], index + this.offset, AwkVariableOccurence.embedded]);
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
            result.push([variable, match_index + full_match.indexOf(variable) + this.offset, occurence || AwkVariableOccurence.assignment]);
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

// Yaml specific section. Makes it possible to get some extra data out of the specific section.
export class YamlSection extends Section {
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
    }
    
    // Get metrics that has been used in this section. Ignores commented lines.
    public get_metrics() : [string, number][] {
        let result : [string, number][] = [];

        let regex_assigned = /im\.name\":\s*_constant:\s\"([^\"]+)/gm;

        let match;
        while (match = regex_assigned.exec(this.content)) {
            if (match.length > 1) {
                result.push([match[1], match.index + match[0].indexOf(match[1])]);
            }
        }

        return result;
    }

    /* Get awk specific sections. Example: 
    _value.double: |
                    {
                        if((temp("virtualStatus") == "offline") && (temp("enabledState") == "enabled")) {
                            print "1"
                        } else {
                            print "0"
                        }
                    }

        That way we can ignore the awk text in the yaml checks.
    */

    public get_awk() : AwkSection[] {
        let results : AwkSection[] = [];
        for (let sect of this.get_awk_sections()) {
            let result = new Section(this.offset + sect[0], this.content.slice(sect[0], sect[1]), ["awk"]);
            results.push(new AwkSection(result));
        }

        return results;
    }
    
    public get_awk_sections() : [number, number][] {
        let result : [number, number][] = [];

        let regex_assigned = /:\s+(\|)\w?[\r\n]\s*{/g;
        let match;
        while (match = regex_assigned.exec(this.content)) {
            if (match.length > 0) {
                let awk_start = match.index + match.length;
                let awk_end = this.get_awk_end(this.content, awk_start);
                result.push([awk_start, awk_end]);
            }
        }
        return result;
    }
    
    // Internal function used while parsing awk sections.
    get_awk_end(content : string, start : number) {
        let level : number = 0;
        let in_quote : boolean = false;
        let in_double_quote : boolean = false;
        let last_char : string | undefined = undefined;
        for (let i = start; i < content.length; i++) {
            let chr = content.charAt(i);
            switch (chr) {
                case "\"":
                    in_double_quote = !in_double_quote;
                    break;
                case "'":
                    in_quote = !in_quote;
                    break;
                case "{": 
                    if (!in_quote && !in_double_quote && last_char !== "\\") {
                        level++;
                    }
                    break;
                case "}":
                    if (!in_quote && !in_double_quote && last_char !== "\\") {
                        level--;
                        if (level <= 0) {
                            return i;
                        }
                    }
                    break;
            }
            last_char = chr;
        }
        return content.length;
    }
}

// Meta specific section. Makes it possible to get some extra data out of the specific section.
export class MetaSection extends Section {
    includes_resource_data : boolean = false;
    includes_resource_data_range : ([number, number]) | null = null;
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
        // Gets an indicator if the meta section uses resource data. Used in one of the checks.
        let regex_assigned = /^includes_resource_data:\s*true$/m;
        let match = this.content.match(regex_assigned);
        this.includes_resource_data = match !== null;
        if (match !== null && match.index !== null && match.length > 0 && match.index !== undefined) {
            this.includes_resource_data_range = [match.index, match.index + match[0].length];
        }
    }

    get_script_name() : [number, string] | undefined {
        let regex_name = /^name:\s*(.*)$/gm;

        let match = regex_name.exec(this.content);
        if (match !== null && match.length > 0 && match.index !== undefined)
        {
            return [match.index + match[0].indexOf(match[1]), match[1]];
        }

        return undefined;
    }
}

export enum AwkVariableOccurence {
    assignment,
    delete,
    incremented_decremented,
    embedded
}