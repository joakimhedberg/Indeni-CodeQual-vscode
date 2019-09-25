import { CodeValidation, CodeValidationByLine, CodeValidationRegex, FunctionSeverity } from "./code-quality-base/CodeValidation";
import { MarkerResult } from "./code-quality-base/MarkerResult";
import { Sections, AwkSection, AwkVariableOccurence } from "./code-quality-base/Section";
import { SpecialCase } from "./code-quality-base/SpecialCase";

const indeni_script_name_prefixes = ["alteon", "api", "bluecoat", "cas", "chkp", "cpembedded", "cphaprob", "cplic", "cpmds", "cpprod", "cpstat", "f5", "fireeye", "fortigate", "fortios", "freebsd", "fwmultik", "get", "gigamon", "imp", "imperva", "indeni", "ios", "iosxe", "ipso", "junos", "linux", "lsb", "md5sum", "netobj", "nexus", "panos", "proxysg", "radware", "rest", "sgos", "srx", "ssh", "unix", "vpn"];
const resource_metrics = ["cpu-usage", "memory-usage"];

export class CodeValidations {
    public functions : CodeValidation[];
    public warning_markers : MarkerResult[] = [];
    public error_markers : MarkerResult[] = [];
    public information_markers : MarkerResult[] = [];
    public all_markers : MarkerResult[] = [];
    public marker_map : { [key: number] : MarkerResult[]; } = {};
    constructor() {
        this.functions = get_functions();
    }

    reset() {
        for (let validation of this.functions) {
            validation.reset();
        }
        this.warning_markers = [];
        this.error_markers = [];
        this.information_markers = [];
        this.all_markers = [];
    }

    public has_marker(marker : MarkerResult) {
        let items = this.marker_map[marker.start_pos];
        if (items) {
            for (let existing_marker of items) {
                if (existing_marker.end_pos === marker.end_pos) {
                    if (existing_marker.offending_text === marker.offending_text && existing_marker.severity === marker.severity) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public apply(sections : Sections) {
        this.reset();
        for (let sect of sections.all) {
            let marks = sect.get_marks(this, sections);

            for (let mark of marks) {
                if (mark.ignore_comments && sections.script !== null)
                {
                    if (sections.script.is_in_comment(mark.start_pos) || sections.script.is_in_comment(mark.end_pos))
                    {
                        mark.is_ignored = true;
                        continue;
                    }
                }
                
                if (this.has_marker(mark)) {
                    continue;
                }
                
                switch (mark.severity) {
                    case FunctionSeverity.warning:
                        this.warning_markers.push(mark);    
                    break;
                    case FunctionSeverity.error:
                        this.error_markers.push(mark);
                    break;
                    case FunctionSeverity.information:
                        this.information_markers.push(mark);
                    break;
                }
                this.all_markers.push(mark);
            }
        }
    }
}

function get_functions() {
    var functions : CodeValidation[] = [];

    // Space before examples maybe looks nice, but it's far from exact
    // Example of an offending line: 
    //# my_example
    ///A regexp/ {
    let space_before_example = new CodeValidationRegex("Space before example", "Space before examples may look nice, but it's far from exact unless the input file actually has one. Consider removing this space unless yours does.", FunctionSeverity.warning, ["awk"], /^(\# .+)(\n|\r\n)\/.+\/\s*{/gm);
    space_before_example.ignore_comments = false;

    // Simply for good manners
    // Example of an offending line:
    // description: grab some data from the device
    let lowercase_description = new CodeValidationRegex("Description begins in lower case", "In the english language, it's good practice to begin sentences with upper case.", FunctionSeverity.error, ["meta"], /^description:\s+([a-z]+)/gm);

    // We have had a bug in the platform with scripts running with intervals of more than 60 minutes
    //
    // Example of an offending line:
    // monitoring_interval: 61 minutes
    let monitoring_interval_above_60 = new CodeValidation("Monitoring interval over 60", "Due to a platform bug we don't support intervals over 1 hour.", FunctionSeverity.error, ["meta"]);
    monitoring_interval_above_60.mark = (content : string, sections : Sections) : MarkerResult[] => {
        let result : MarkerResult[] = [];
        let regex = /([0-9][0-9]*? minute[s]{0,1})|([1-9][1-9]*? hour[s]{0,1})/;

        let match = regex.exec(content);
        if (match !== null) {
            if (match.length > 0 && match.index !== undefined) {
                let items = match[0].split(/\s/);
                let time : number = +items[0];
                let unit = items[1];
                if (unit.indexOf('hour') !== -1) {
                    time *= 60;
                }

                if (time > 60) {
                    result.push(new MarkerResult(match.index, match.index + match[0].length, "Due to a platform bug we do not support intervals over 1 hour.", FunctionSeverity.error, false, match[0]));
                }
            }
        }

        return result;
        
    };
    
    // Tabs should not be used for indentation
    // Example of an offending line:
    //  variable = test
    let leading_tab = new CodeValidationRegex("Leading tabs", "Tabs should not be used for indentation, please configure your editor to use space for indentation.", FunctionSeverity.error, ["awk", "yaml"], /^([\t]+)/gm);
    
    // Single equal sign in an if is always true and the cause of bugs
    // Example of an offending line: 
    //if (variable = 1) { 
    let if_contains_single_equal_sign = new CodeValidationRegex("If statement with single equal sign", "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", FunctionSeverity.error, ["awk"], /if\s+\([^=!]+(=)[^=]+\)\s+\{/gm);// /if\s*?\([^=]+[^=!](=){1}[^=].+\)/gm);

    //Trailing white space serves no purpose
    // Example of an offending line:
    // variable = test 
    let trailing_whitespace = new CodeValidationRegex("Trailing white-space", "Trailing white space serves no purpose and should be removed.", FunctionSeverity.error, ["awk", "yaml"], /([ \t]+)$/gm);

    // writeDebug is great for troubleshooting, but code with that command should never reach customers.
    // Example of an offending line: 
    //writeDebug("this is a debug")    
    let writedebug_exists = new CodeValidationRegex("writeDebug()", "writeDebug() (or debug()) are great for troubleshooting, but code with that function should never reach customers.", FunctionSeverity.error, ["awk"], /(writeDebug\(.+\)|debug\(.+\))/gm);
    
    // Empty BEGIN sections serves no purpose and should be disposed of.
    // Example of an offending line: 
    //BEGIN {
    //    
    //}
    let empty_begin_section = new CodeValidationRegex("Empty BEGIN", "Empty BEGIN sections serves no purpose and should be disposed of.", FunctionSeverity.warning, ["awk"], /(BEGIN {\s*})/g);

    // Empty END sections serves no purpose and should be disposed of.
    // Example of an offending line: 
    //END {
    //    
    //}
    let empty_end_section = new CodeValidationRegex("Empty END", "Empty END sections serves no purpose and should be disposed of.", FunctionSeverity.warning, ["awk"], /(END {\s*})/g);

    // Space before and after curly brackets and parenthesis makes the code less compact and more readable
    // This is just a recommendation.
    // Example of an offending line: 
    //#if(something == "1"){
    ///A regexp/ {
    let generic_space_before_example_and_after = new CodeValidationRegex("Space <3", "Space in certain places makes the code look nicer.", FunctionSeverity.information, ["awk"], /(if\()|(\){)|}else|else{/g);

    // Changing column values is potentially the cause of bugs and should be avoided
    // Example of an offending line:
    //clusterMode = trim(substr($0, index($0, ":") + 1))
    let column_variable_manipulation = new CodeValidationRegex("Column variable manipulation", "Changing column values (ie. $0, $1) could easily lead to unexpected behaviors.\nIt is highly recommended to instead save the column value to a variable and change that.", FunctionSeverity.warning, ["awk"], /g{0,1}sub.+?(\$[0-9])+/g);
 
    // A "~" should always be followed by a space (unless it is a regexp)
    // Example of an offending line:
    // if ($0 ~/Active/) {
    let tilde_without_space = new CodeValidationRegex("Tilde without space", "Tilde signs should be followed by space.\nExceptions to this are regexp.", FunctionSeverity.error, ["awk"], /([^ \n]~[^ \n]|[^ \n]~|~[^ \n])/gm);

    // Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).
    // Example of an offending line:
    // if ($0 ~ "ClusterXL Inactive") {
    let tilde_without_regexp_notation = new CodeValidationRegex("Tilde without regexp notation", "Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).", FunctionSeverity.warning, ["awk"], /(~\s+[^/])/gm);

    // Prefixes is important not only to distinguish which type of device the script is executed on
    // but also to avoid script name collisions. 
    // A script name should consist of letters a-z and scores
    // This is just a recommendation.
    // Example of an offending line: 
    //name: sausage-metric
    let valid_script_name = new CodeValidation("Valid script name", "Script names should consist of letters a-z and scores -", FunctionSeverity.error, ["meta"]);
    valid_script_name.mark = (content : string, sections : Sections) : MarkerResult[] => {
        let result : MarkerResult[] = [];

        if (sections.meta !== null)
        {
            let script_name = sections.meta.get_script_name();
            if (script_name !== undefined)
            {
                let script_name_split = script_name[1].split(/-/);
                if (indeni_script_name_prefixes.indexOf(script_name_split[0]) === -1) {
                    result.push(new MarkerResult(script_name[0], script_name[0] + script_name_split[0].length, "Prefixes are important, not only to distinguish which type of device the script is executed on, but also to avoid script name collisions.\nValid prefixes: " + indeni_script_name_prefixes.join(", "), FunctionSeverity.error, false, script_name_split[0]));
                }

                let error_characters = /([^a-z\-])/gm;

                let match;
                while (match = error_characters.exec(script_name[1])) {
                    result.push(new MarkerResult(script_name[0] + match.index, script_name[0] + match.index + match[1].length, "A script name should consist of letters(a-z) and dashes(-)", FunctionSeverity.error, false, match[1]));
                }
            }
        }

        return result;
    };
    
    // This function is a bit special as it it does not only parse and mark, it also compares data from different sections
    // Verify that metrics are represented both in Write and in the documentation
    let verify_metric_documentation = new CodeValidation("Undocumented/unused metrics", "The documentation section should have one entry per metric used in the script, and the script should use all documented metrics.", FunctionSeverity.error, ["script"]);
    verify_metric_documentation.mark = verify_metric_marker;
    verify_metric_documentation.offset_handled = true;
    
    // Metrics should only be written once according to:
    // https://indeni.atlassian.net/wiki/spaces/IKP/pages/81794466/Code+Review+Pull+Requests
    let only_write_metric_once = new CodeValidation("Metric written more than once", "Each metric should only be written in one place. If the metric has been written more than once this test fails.", FunctionSeverity.information, ["awk"]);
    only_write_metric_once.mark = (content : string, sections : Sections) : MarkerResult[] => {
        let result : MarkerResult[] = [];
        let reason = "Each metric should only be written in one place. If the metric has been written more than once this test fails.";    
        if (sections.awk !== null) {
            let metrics = sections.awk.get_metrics();

            for (let i = 0; i < metrics.length - 1; i++) {
                for (let j = i + 1; j < metrics.length; j++) {
                    if (metrics[i][0] === metrics[j][0]) {
                        result.push(new MarkerResult(metrics[i][1], metrics[i][1] + metrics[i][0].length, reason, FunctionSeverity.information, false, metrics[i][0]));
                        result.push(new MarkerResult(metrics[j][1], metrics[j][1] + metrics[j][0].length, reason, FunctionSeverity.information, false, metrics[j][0]));
                    }
                }
            }
        }

        return result;
    };

    // A comma should always be followed by a space (unless it is a regexp)
    // Example of an offending line:
    // writeDoubleMetric("debug-status",debugtags,"gauge",3600,state)
    let comma_without_space = new CodeValidationByLine("Comma without space", "Comma signs should be followed by a space.\nExceptions to this are regexp and bash scripts.", FunctionSeverity.error, ["awk"], /(,)[^ \/]/gm, [new SpecialCase(/#/, null)]);

    // Variables should use snake case (snake_case)
    // Example of an offending line: 
    //myVariable = 1
    //my-variable = 1
    //let variable_naming_convention = new CodeValidationByLine("Variable naming", "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", FunctionSeverity.warning, ["awk"], /(?!.*\()(["]?[a-z0-9]+([A-Z0-9][a-z0-9]+["]?)+)/g, [new SpecialCase(/\//), new SpecialCase(/#/)], [/"[^"]+"|(([a-z0-9]+\-)+[a-z0-9]+)/g]);
    let variable_naming_convention = new CodeValidation("Variable naming", "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", FunctionSeverity.warning, ["awk", "yaml"]);
    variable_naming_convention.mark = awk_variable_naming;

    // includes_resource_data means that the script is always executed by indeni, even during high CPU usage
    //includes_resource_data: true
    let includes_resource_data = new CodeValidation("Resource data validation", "includes_resource_data means that the script is always executed by indeni, even during high CPU usage. It has to be included for scripts using the cpu-usage and/or memory-usage metrics.\nIf this check fails it means that you have specified includes_resource_data, but not used the metrics, or that you have used cpu-usage and/or memory-usage without including includes_resource_data in the meta section.", FunctionSeverity.error, ["script"]);
    includes_resource_data.mark = resource_data_mark;

    // This controls if your YAML script has invalid indentation
    // Since indentation is 4 spaces having a number not divideable 
    // by 4 would cause an error
    //
    // Example of an offending line:
    //       skip-documentation: true
    let invalid_yaml_leading_space = new CodeValidation("Invalid YAML white-space", "Since indentation in YAML is 4 spaces having a number not divisible by 4 would cause an error in most cases.", FunctionSeverity.error, ["yaml"]);
    invalid_yaml_leading_space.mark = verify_yaml_indent;
    
    // Example of offending lines:
    // testar_var=23
    // test_var= 23
    // test_var =23
    let comparison_operator_no_space = new CodeValidationByLine("Equals sign without space", "The equals sign and other comparison operators should be followed by a space.\nExceptions to this are regexp and bash scripts.", FunctionSeverity.error, ["awk"], /([^ =!<>~\n]{1}([=!<>~]{1,2})[^ \n]{1})|(([^ =!<>~\n]{1})([=!<>~]{1,2}))|(([=!<>~]{1,2})[^ =!<>~\n]{1})/gm, [new SpecialCase(/split/), new SpecialCase(/gsub/), new SpecialCase(/sub/), /*new SpecialCase(/index/), */new SpecialCase(/match/), new SpecialCase(/join/), new SpecialCase(/\!\(/), new SpecialCase(/!\//), new SpecialCase(/#/)]);
    
    // Example of offending lines:
    // # META
    // #META
    // # REMOTE::SSH
    // # REMOTE SSH
    // #! REMOTE SSH
    // #!REMOTE SSH
    let erroneous_section_definition = new CodeValidation("Erroneous section marker", "The section marker must start with #!, otherwise the script might fail or show some unpredicted behavior", FunctionSeverity.error, ["script"]);
    erroneous_section_definition.mark = mark_erroneous_section_definitions;

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
    functions.push(column_variable_manipulation);
    functions.push(tilde_without_space);
    functions.push(tilde_without_regexp_notation);
    functions.push(valid_script_name);
    functions.push(verify_metric_documentation);
    functions.push(only_write_metric_once);
    functions.push(comma_without_space);
    functions.push(variable_naming_convention);
    functions.push(includes_resource_data);
    functions.push(invalid_yaml_leading_space);
    functions.push(comparison_operator_no_space);
    functions.push(erroneous_section_definition);
    
    return functions;
}

function awk_variable_naming(content : string, sections : Sections) : MarkerResult[] {
    let result : MarkerResult[] = [];

    if (sections.awk !== null) {
        for (let res of awk_section_variable_naming(sections.awk)) {
            result.push(res);
        }
    } else {
        let yaml_section = sections.xml || sections.json;
        if (yaml_section !== null)
        {
            for (let awk_section of yaml_section.get_awk()) {
                for (let res of awk_section_variable_naming(awk_section)) {
                    result.push(res);
                }
            }
        }
    }

    return result;
}

function mark_erroneous_section_definitions(content : string, sections : Sections) : MarkerResult[] {
    let result : MarkerResult[] = [];
    let regex_remote = /^(.*)(REMOTE)(.*?)([A-Z]{3,4})\s?$/gm;
    let regex_parser = /^(.*)(PARSER)(.*)?([A-Z]{3,4})\s?$/gm;
    let regex_meta = /^(.*)(META)\s?/gm;
    let regex_comments = /^(.*)(COMMENTS)\s?/gm;
    
    let match;
    while (match = regex_remote.exec(content)) {
        mark_erroneous_section(match, result);
    }

    while (match = regex_parser.exec(content)) {
        mark_erroneous_section(match, result);
    }

    while (match = regex_meta.exec(content)) {
        let fail : boolean = false;
        if (match.length < 2) {
            fail = true;
        }
        else
        {
            if (!match[0].startsWith("#!")) {
                fail = true;
            }
        }
        if (fail) {
            result.push(new MarkerResult(match.index, match.index + match[0].length, "A meta section marker should keep the format #! META", FunctionSeverity.error, false, match[0]));
        }
    }

    while (match = regex_comments.exec(content)) {
        let fail : boolean = false;
        if (match.length < 2) {
            fail = true;
        }
        else
        {
            if (!match[0].startsWith("#!")) {
                fail = true;
            }
        }
        if (fail) {
            result.push(new MarkerResult(match.index, match.index + match[0].length, "A comment section marker should keep the format #! META", FunctionSeverity.error, false, match[0]));
        }
    }


    return result;
}

function mark_erroneous_section(match : RegExpExecArray, result : MarkerResult[]) {

    let fail : boolean = false;
    // There should be 5 matches 0: (Full match) 1: (#!), 2: (REMOTE), 3: (::), 4: (HTTP|SSH)
    if (match.length < 4) {
        fail = true;
    }
    else
    {
        if (!match[1].startsWith("#!")) {
            fail = true;
        }
        else
        {
            if (!match[3].startsWith("::")) {
                fail = true;
            }
        }
    }

    if (fail) {
        result.push(new MarkerResult(match.index, match.index + match[0].length, "A section marker should keep the format #! SECTION::SUBSECTION + / ", FunctionSeverity.error, false, match[0]));
    }
}


function awk_section_variable_naming(section : AwkSection) : MarkerResult[] {
    let result : MarkerResult[] = [];

    let variables : Map<string, number[]> = new Map();
    let assignments : [string, number, AwkVariableOccurence][] = [];
    let other : Map<string, number> = new Map();

    for (let variable of section.get_variables()) {
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
        if (!verify_variable_spelling(item[0])) {
            for (let startpos of item[1]) {
                result.push(new MarkerResult(startpos, startpos + item[0].length, "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", FunctionSeverity.warning, true, item[0]));
            }
        }
    }
    return result;
}

function verify_variable_spelling(varname : string) : boolean {
    let match = varname.match("^[a-z0-9_]*");
    if (match === null) {
        return false;
    }
    
    return match[0] === varname;
}

function verify_yaml_indent(content : string, sections : Sections) : MarkerResult[] {
    let result : MarkerResult[] = [];

    let regex = /[\r\n](\s*)/g;

    let match;
    let section = sections.json || sections.xml;
    let indexes : [number, number][] = [];
    if (section !== null) {
        indexes = section.get_awk_sections();
    }

    while (match = regex.exec(content)) {
        if (is_within(indexes, match.index)) {
            continue;
        }
        if (match.length > 0) {
            let text = match[1].replace(/[\r\n]*/, '');
            if (text.length % 4 && text.length > 0) {
                result.push(new MarkerResult(match.index + match[0].indexOf(text), match.index + match[0].indexOf(text) + text.length, "Yaml indent not divisible by 4", FunctionSeverity.error, false, text + " - " + text.length + " characters"));
            }
        }
    }
    
    return result;
    /*let lines = content.split("\n");
    let line_offset = 0;

    let indexes : [number, number][] = [];
    if (sections.json !== null){
        indexes = sections.json.get_awk_sections();
    }
    else if (sections.xml !== null) {
        indexes = sections.xml.get_awk_sections();
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let regex = /^(\s+)/;
        let match = line.match(regex);
        if (match !== null && match !== undefined)
        {
            if (match.index !== undefined) {
                if (!is_within(indexes, match.index + line_offset))
                {
                    // Workaround to handle CRLF situations. The regex was behaving strangely. Seems like ^ only matches \n which means (\r) is also in the mix
                    var issue = match[1];
                    if (issue.length % 4 && issue.length > 0) {
                        result.push(new MarkerResult(match.index + line_offset, match.index + issue.length + line_offset, "Yaml indent not divisible by 4", FunctionSeverity.error, false, issue));
                    }
                }
            }
        }
        line_offset += lines[i].length + 1;
    }

    return result;*/
}

function is_within(indexes : [number, number][], match_index : number) : boolean {
    for (let index of indexes) {
        let result = (index[0] <= match_index && match_index <= index[1]);
        if (result) {
            return result;
        }
    }

    return false;
}

function resource_data_mark(content : string, sections : Sections) : MarkerResult[] {
    let result : MarkerResult[] = [];
    if (sections.meta === null) {
        // No meta section, opt out
        return result;
    }
    
    let parser = sections.awk || sections.json || sections.xml;

    if (parser !== undefined && parser !== null) {
        let metrics = parser.get_metrics();

        let resource_metric_found : boolean = false;
        for (let metric of metrics) {
            if (resource_metrics.indexOf(metric[0]) > -1) {
                resource_metric_found = true;
                if (!sections.meta.includes_resource_data) {
                    result.push(new MarkerResult(metric[1] + parser.offset, metric[1] + parser.offset + metric[0].length, "This tag would normally require include_resource_data in the meta section.", FunctionSeverity.error, true, metric[0]));
                }
            }
        }
        if (!resource_metric_found && sections.meta.includes_resource_data_range !== null) {
            let marker = new MarkerResult(sections.meta.includes_resource_data_range[0] + sections.meta.offset, sections.meta.includes_resource_data_range[1] + sections.meta.offset, "Resource data has been used but no metrics that require it seem to exist.", FunctionSeverity.error, true, "includes_resource_data: true");
            result.push(marker);
        }
    }

    return result;
}

function verify_metric_marker(content  : string, sections : Sections) : MarkerResult[] {
    let result : MarkerResult[] = [];

    let section = sections.awk || sections.json || sections.xml;
    if (sections.comments !== null && section !== undefined && section !== null)
    {
        let documented = sections.comments.get_documented_metrics();
        let used = section.get_metrics();

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
                result.push(new MarkerResult(doc[1] + sections.comments.offset, doc[1] + sections.comments.offset + doc[0].length, "This metric has been documented but is not used in the code.", FunctionSeverity.error, false, doc[0]));
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
                result.push(new MarkerResult(use[1] + section.offset, use[1] + section.offset + use[0].length, "This metric is used in the code but has not been documented in the meta section!", FunctionSeverity.error, false, use[0]));
            }
        }
    }

    return result;
}
