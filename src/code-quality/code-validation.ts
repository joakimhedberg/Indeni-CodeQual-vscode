import { Sections } from "./sections";

export class CodeValidation
{
    name : string;
    reason : string;
    severity : string;
    apply_to_sections : string[];
    mark : ((content : string, sections : Sections) => [number, number][]) | null;
    offset_handled : boolean = false;
    constructor(name : string, reason : string, severity : string, apply_to_sections : string[]) {
        this.name = name;
        this.reason = reason;
        this.severity = severity;
        this.apply_to_sections = apply_to_sections;
        this.mark = null;
    }
}

export class CodeValidationRegex extends CodeValidation {
    constructor(name : string, reason : string, severity : string, apply_to_sections : string[], regex : RegExp) {
        super(name, reason, severity, apply_to_sections);

        this.mark = (content : string, sections : Sections) : [number, number][] => {
            let match;
            let result : [number, number][] = [];
            console.log("Running " + this.name);
            while (match = regex.exec(content)) {
                if (match.length > 1) {
                    let idx = 0;

                    for (let i =    1; i < match.length; i++)
                    {
                        if (match[i] === undefined) {
                            continue;
                        }
                        idx = match[0].indexOf(match[1], idx);
                        const start_pos = match.index + idx;
                        const end_pos = match.index + idx + match[i].length;
                        result.push([start_pos, end_pos]);
                        console.log("Start: " + start_pos + " End: " + end_pos + " Funct: " + this.name + " Capture: " + match[i]);
                    }
                }
            }
            console.log("\tResults: " + result.length);
            return result;
        };
    }
}

export class SpecialCase {
    search_pattern : RegExp;
    mark : ((content : string) => [number, number][]) | null = null;
    constructor(search_pattern : RegExp, mark : ((content : string) => [number, number][]) | null = null) {
        this.search_pattern = search_pattern;
        this.mark = mark;
    }

    matches(content : string) {
        return content.match(this.search_pattern) !== null;
    }

    exec(content : string) : [number, number][] {
        if (this.mark !== null) {
            return this.mark(content);
        } else {
            return [];
        }
    }
}

export class CodeValidationByLine extends CodeValidationRegex {
    special_cases : SpecialCase[];
    constructor(name : string, reason : string, severity : string, apply_to_sections : string[], line_regex : RegExp, special_cases : SpecialCase[])  {
        super(name, reason, severity, apply_to_sections, line_regex);
        this.special_cases = special_cases;
        console.log("Running code validation line by line");
        this.mark = (content : string, sections : Sections) : [number, number][] => {
            let result : [number, number][] = [];
            let lines = content.split("\n");
            let line_offset = 0;
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];

                let special_result = this.special(line);
                if (special_result[0]) {
                    console.log("Special result found for line: ["+ (i + 1) +"] " + line);
                    for (let res of special_result[1]) {
                        result.push([res[0] + line_offset, res[1] + line_offset]);
                    }
                }
                else {
                
                    let match;
                    while (match = line_regex.exec(line)) {
                        if (match.length > 1) {
                            console.log("Match found for line: ["+(i+1)+"] " + match);
                            result.push([match.index + line_offset, match.index + match[1].length + line_offset]);
                        }
                    }
                }
                line_offset += line.length + 1;
            }
            return result;
        };
    }

    special(line : string) : [boolean, [number, number][]] {
        for (let item of this.special_cases) {
            if (item.matches(line)) {
                return [true, item.exec(line)];
            }
        }

        return [false, []];
    }
}

const indeni_script_name_prefixes = ["chkp", "f5", "panos", "nexus", "radware", "junos", "ios", "fortios", "cpembedded", "bluecoat", "linux", "unix"];

export function get_functions() {
    var functions : CodeValidation[] = [];

    // Space before examples maybe looks nice, but it's far from exact
    // Example of an offending line: 
    //# my_example
    ///A regexp/ {
    let space_before_example = new CodeValidationRegex("Space before example", "Space before examples may look nice, but it's far from exact unless the input file actually has one. Consider removing this space unless yours does.", "warning", ["awk"], /(\# .+)\n\/.+\/\s*{\n/g);
    
    // Simply for good manners
    // Example of an offending line:
    // description: grab some data from the device
    let lowercase_description = new CodeValidationRegex("Description begins in lower case", "In the english language, it's good practice to begin sentences with upper case.", "error", ["meta"], /^description:\s+([a-z]+)/gm);
    
    // We have had a bug in the platform with scripts running with intervals of more than 60 minutes
    //
    // Example of an offending line:
    // monitoring_interval: 61 minutes
    let monitoring_interval_above_60 = new CodeValidationRegex("Monitoring interval over 60", "Due to a platform bug we don't support intervals over 1 hour.", "error", ["meta"], /([6-9][1-9][0-9]*? minute[s]{0,1})|([2-9][0-9]*? hour[s]{0,1})/gm);
    
    // Tabs should not be used for indentation
    // Example of an offending line:
    //  variable = test
    let leading_tab = new CodeValidationRegex("Leading tabs", "Tabs should not be used for indentation, please configure your editor to use space for indentation.", "error", ["awk", "yaml"], /^([\t]+)/gm);
    
    // Single equal sign in an if is always true and the cause of bugs
    // Example of an offending line: 
    //if (variable = 1) { 
    let if_contains_single_equal_sign = new CodeValidationRegex("If statement with single equal sign", "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", "error", ["awk"], /if\s*?\([^=]+[^=!](=){1}[^=].+\)/gm);

    //Trailing white space serves no purpose
    // Example of an offending line:
    // variable = test 
    let trailing_whitespace = new CodeValidationRegex("Trailing white-space", "Trailing white space serves no purpose and should be removed.", "error", ["awk", "yaml"], /([ \t]+)$/gm);

    // writeDebug is great for troubleshooting, but code with that command should never reach customers.
    // Example of an offending line: 
    //writeDebug("this is a debug")    
    let writedebug_exists = new CodeValidationRegex("writeDebug()", "writeDebug() (or debug()) are great for troubleshooting, but code with that function should never reach customers.", "error", ["awk"], /(writeDebug\(.+\)|debug\(.+\))/gm);
    
    // Empty BEGIN sections serves no purpose and should be disposed of.
    // Example of an offending line: 
    //BEGIN {
    //    
    //}
    let empty_begin_section = new CodeValidationRegex("Empty BEGIN", "Empty BEGIN sections serves no purpose and should be disposed of.", "warning", ["awk"], /(BEGIN {\s*})/g);

    // Empty END sections serves no purpose and should be disposed of.
    // Example of an offending line: 
    //END {
    //    
    //}
    let empty_end_section = new CodeValidationRegex("Empty END", "Empty END sections serves no purpose and should be disposed of.", "warning", ["awk"], /(END {\s*})/g);

    // Space before and after curly brackets and parenthesis makes the code less compact and more readable
    // This is just a recommendation.
    // Example of an offending line: 
    //#if(something == "1"){
    ///A regexp/ {
    let generic_space_before_example_and_after = new CodeValidationRegex("Space <3", "Space in certain places makes the code look nicer.", "information", ["awk"], /(if\()|(\){)|}else|else{/g);

    // Line feeds can differ between operating systems and editors, in a mixed environment \n is always the way to go
    // Example of offending line\r\n
    let carriage_return = new CodeValidationRegex("Carriage return", "Set your editor to use simple line feeds(LF) and not CRLF.", "error", ["script"], /(\r+)/g);

    // Changing column values is potentially the cause of bugs and should be avoided
    // Example of an offending line:
    //clusterMode = trim(substr($0, index($0, ":") + 1))
    let column_variable_manipulation = new CodeValidationRegex("Column variable manipulation", "Changing column values (ie. $0, $1) could easily lead to unexpected behaviors.\nIt is highly recommended to instead save the column value to a variable and change that.", "warning", ["awk"], /g{0,1}sub.+?(\$[0-9])+/g);
 
    // A "~" should always be followed by a space (unless it is a regexp)
    // Example of an offending line:
    // if ($0 ~/Active/) {
    let tilde_without_space = new CodeValidationRegex("Tilde without space", "Tilde signs should be followed by space.\nExceptions to this are regexp.", "error", ["awk"], /([^ \n]{1}~[^ \n]{1})|([^ \n]{1}~)|(~[^ \n]{1})/gm);

    // Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).
    // Example of an offending line:
    // if ($0 ~ "ClusterXL Inactive") {
    let tilde_without_regexp_notation = new CodeValidationRegex("Tilde without regexp notation", "Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).", "warning", ["awk"], /(~\s+[^/])/gm);

    // Prefixes is important not only to distinguish which type of device the script is executed on
    // but also to avoid script name collisions. 
    // This is just a recommendation.
    // Example of an offending line: 
    //name: sausage-metric
    let valid_scriptname_prefix = new CodeValidation("Valid script name prefix", "Prefixes are important, not only to distinguish which type of device the script is executed on, but also to avoid script name collisions.\nValid prefixes: " + indeni_script_name_prefixes.join(", "), "error", ["meta"]);
    valid_scriptname_prefix.mark = (content : string, sections : Sections) : [number, number][] => {
        let result : [number, number][] = [];

        var script_name_row = content.match(/^name:.*$/m);
        if (script_name_row !== null && script_name_row.length === 1) {
            var script_name = script_name_row[0].split(" ")[1];

            var prefix = script_name.replace(/-.+$/, "");
            if (indeni_script_name_prefixes.indexOf(prefix) === -1) {
                var re = new RegExp(script_name);
                var match = re.exec(content);
                if (match !== null && match.length > 0) {
                    result.push([match.index, match.index + match[0].length]);
                }
            }
        }
        return result;
    };

    let verify_awk_documentation = new CodeValidation("Undocumented/unused metrics", "The documentation section should have one entry per metric used in the script, and the script should use all documented metrics.", "error", ["script"]);
    verify_awk_documentation.mark = verify_awk_marker;
    verify_awk_documentation.offset_handled = true;

    let only_write_metric_once = new CodeValidation("Metric written more than once", "Each metric should only be written in one place. If the metric has been written more than once this test fails.", "information", ["awk"]);
    only_write_metric_once.mark = (content : string, sections : Sections) : [number, number][] => {
        let result : [number, number][] = [];
        
        if (sections.awk !== null) {
            let metrics = sections.awk.get_metrics();

            for (let i = 0; i < metrics.length - 1; i++) {
                for (let j = i + 1; j < metrics.length; j++) {
                    if (metrics[i][0] === metrics[j][0]) {
                        result.push([metrics[i][1], metrics[i][1] + metrics[i][0].length]);
                        result.push([metrics[j][1], metrics[j][1] + metrics[j][0].length]);
                    }
                }
            }
        }

        return result;
    };

    let comma_without_space = new CodeValidationByLine("Comma without space", "Comma signs should be followed by a space.\nExceptions to this are regexp and bash scripts.", "error", ["awk"], /(,)[^ \/]/gm, [new SpecialCase(/#/, null)]);

    functions.push(space_before_example);
    functions.push(lowercase_description);
    functions.push(monitoring_interval_above_60);
    functions.push(leading_tab);
    functions.push(if_contains_single_equal_sign);
    functions.push(trailing_whitespace);
    functions.push(writedebug_exists);
    functions.push(empty_begin_section);
    functions.push(empty_end_section);
    functions.push(generic_space_before_example_and_after);
    functions.push(carriage_return);
    functions.push(column_variable_manipulation);
    functions.push(tilde_without_space);
    functions.push(tilde_without_regexp_notation);
    functions.push(valid_scriptname_prefix);
    functions.push(verify_awk_documentation);
    functions.push(only_write_metric_once);
    functions.push(comma_without_space);
    return functions;
}

function verify_awk_marker(content  : string, sections : Sections) : [number, number][] {
    let result : [number, number][] = [];

    if (sections.comments !== null && sections.awk !== null)
    {
        let documented = sections.comments.get_documented_metrics();
        let used = sections.awk.get_metrics();

        for (let doc of documented) {
            let exists = false;
            for (let use of used)
            {
                if (use[0] === doc[0]) {
                    exists = true;
                    break;
                }
                if (exists) {
                    break;
                }
            }

            if (!exists) {
                result.push([doc[1] + sections.comments.offset, doc[1] + sections.comments.offset + doc[0].length])
            }
        }

        for (let use of used) {
            let exists = false;
            for (let doc of documented) {
                if (use[0] === doc[0]) {
                    exists = true;
                    break;
                }
                if (exists) {
                    break;
                }
            }
            if (!exists) {
                result.push([use[1] + sections.awk.offset, use[1] + sections.awk.offset + use[0].length]);
            }
        }
    }

    return result;
}
