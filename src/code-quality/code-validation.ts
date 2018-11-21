import { CodeValidation, CodeValidationByLine, CodeValidationRegex, FunctionSeverity } from "./code-quality-base/CodeValidation";
import { MarkerResult } from "./code-quality-base/MarkerResult";
import { Sections } from "./code-quality-base/Section";
import { SpecialCase } from "./code-quality-base/SpecialCase";
import { print } from "util";

const indeni_script_name_prefixes = ["chkp", "f5", "panos", "nexus", "radware", "junos", "ios", "fortios", "cpembedded", "bluecoat", "linux", "unix"];

export function get_functions() {
    var functions : CodeValidation[] = [];

    // Space before examples maybe looks nice, but it's far from exact
    // Example of an offending line: 
    //# my_example
    ///A regexp/ {
    let space_before_example = new CodeValidationRegex("Space before example", "Space before examples may look nice, but it's far from exact unless the input file actually has one. Consider removing this space unless yours does.", FunctionSeverity.warning, ["awk"], /(\# .+)\n\/.+\/\s*{\n/g);
    
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
                    result.push(new MarkerResult(match.index, match.index + match[0].length, "Due to a platform bug we do not support intervals over 1 hour.", FunctionSeverity.error, false));
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
    let if_contains_single_equal_sign = new CodeValidationRegex("If statement with single equal sign", "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", FunctionSeverity.error, ["awk"], /if\s*?\([^=]+[^=!](=){1}[^=].+\)/gm);

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

    // Line feeds can differ between operating systems and editors, in a mixed environment \n is always the way to go
    // Example of offending line\r\n
    let carriage_return = new CodeValidationRegex("Carriage return", "Set your editor to use simple line feeds(LF) and not CRLF.", FunctionSeverity.error, ["script"], /(\r+)/g);

    // Changing column values is potentially the cause of bugs and should be avoided
    // Example of an offending line:
    //clusterMode = trim(substr($0, index($0, ":") + 1))
    let column_variable_manipulation = new CodeValidationRegex("Column variable manipulation", "Changing column values (ie. $0, $1) could easily lead to unexpected behaviors.\nIt is highly recommended to instead save the column value to a variable and change that.", FunctionSeverity.warning, ["awk"], /g{0,1}sub.+?(\$[0-9])+/g);
 
    // A "~" should always be followed by a space (unless it is a regexp)
    // Example of an offending line:
    // if ($0 ~/Active/) {
    let tilde_without_space = new CodeValidationRegex("Tilde without space", "Tilde signs should be followed by space.\nExceptions to this are regexp.", FunctionSeverity.error, ["awk"], /([^ \n]{1}~[^ \n]{1})|([^ \n]{1}~)|(~[^ \n]{1})/gm);

    // Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).
    // Example of an offending line:
    // if ($0 ~ "ClusterXL Inactive") {
    let tilde_without_regexp_notation = new CodeValidationRegex("Tilde without regexp notation", "Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).", FunctionSeverity.warning, ["awk"], /(~\s+[^/])/gm);

    // Prefixes is important not only to distinguish which type of device the script is executed on
    // but also to avoid script name collisions. 
    // This is just a recommendation.
    // Example of an offending line: 
    //name: sausage-metric
    let valid_scriptname_prefix = new CodeValidation("Valid script name prefix", "Prefixes are important, not only to distinguish which type of device the script is executed on, but also to avoid script name collisions.\nValid prefixes: " + indeni_script_name_prefixes.join(", "), FunctionSeverity.error, ["meta"]);
    valid_scriptname_prefix.mark = (content : string, sections : Sections) : MarkerResult[] => {
        let result : MarkerResult[] = [];
        let reason = "Prefixes are important, not only to distinguish which type of device the script is executed on, but also to avoid script name collisions.\nValid prefixes: " + indeni_script_name_prefixes.join(", ");
        var script_name_row = content.match(/^name:.*$/m);
        if (script_name_row !== null && script_name_row.length === 1) {
            var script_name = script_name_row[0].split(" ")[1];

            var prefix = script_name.replace(/-.+$/, "");
            if (indeni_script_name_prefixes.indexOf(prefix) === -1) {
                var re = new RegExp(script_name);
                var match = re.exec(content);
                if (match !== null && match.length > 0) {
                    result.push(new MarkerResult(match.index, match.index + match[0].length, reason, FunctionSeverity.error, false));
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
                        result.push(new MarkerResult(metrics[i][1], metrics[i][1] + metrics[i][0].length, reason, FunctionSeverity.information, false));
                        result.push(new MarkerResult(metrics[j][1], metrics[j][1] + metrics[j][0].length, reason, FunctionSeverity.information, false));
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
    let variable_naming_convention = new CodeValidationByLine("Variable naming", "Most people uses snake case (ie. my_variable) in the repository. This is a suggestion for you to do the same.", FunctionSeverity.warning, ["awk"], /(?!.*\()(["]?[a-z0-9]+([A-Z0-9][a-z0-9]+["]?)+)/g, [new SpecialCase(/\//), new SpecialCase(/#/)], [/"[^"]+"|(([a-z0-9]+\-)+[a-z0-9]+)/g]);

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
    
    let comparison_operator_no_space = new CodeValidationByLine("Equals sign without space", "The equals sign and other comparison operators should be followed by a space.\nExceptions to this are regexp and bash scripts.", FunctionSeverity.error, ["awk"], /([^ =!<>~\n]{1}([=!<>~]{1,2})[^ \n]{1})|(([^ =!<>~\n]{1})([=!<>~]{1,2}))|(([=!<>~]{1,2})[^ =!<>~\n]{1})/gm, [new SpecialCase(/split/), new SpecialCase(/gsub/), new SpecialCase(/sub/), new SpecialCase(/index/), new SpecialCase(/match/), new SpecialCase(/join/), new SpecialCase(/\!\(/), new SpecialCase(/!\//), new SpecialCase(/#/)]);

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
    functions.push(verify_metric_documentation);
    functions.push(only_write_metric_once);
    functions.push(comma_without_space);
    functions.push(variable_naming_convention);
    functions.push(includes_resource_data);
    functions.push(invalid_yaml_leading_space);
    functions.push(comparison_operator_no_space);
    return functions;
}

function verify_yaml_indent(content : string, sections : Sections) : MarkerResult[] {
    let lines = content.split("\n");
    let result : MarkerResult[] = [];
    let line_offset = 0;
    //let indexes = get_awk_index(content);
    //console.log("Awk indexes: ");
    //console.log(indexes);
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let regex = /^\s+/;
        let match = line.match(regex);
        if (match !== null && match !== undefined)
        {
            if (match.index !== undefined) {
                if (match[0].length % 4) {
                    result.push(new MarkerResult(match.index + line_offset, match.index + match[0].length + line_offset, "Yaml indent not divisible by 4", FunctionSeverity.error, false));
                }
            }
        }
        line_offset += lines[i].length + 1;
    }

    return result;
}

function get_awk_index(content : string) : [number, number][] {
    let result : [number, number][] = [];

    let lines = content.split("\n");
    let line_offset = 0;
    let in_awk = false;
    let awk_start : number | undefined = undefined;
    let indent = 0;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (/\s+\|\s?$/g.test(line) && !in_awk) {
            in_awk = true;
        }
        else if (in_awk) {
            for (let c_idx = 0; c_idx = line.length; c_idx++)
            {
                let chr = line.charAt(c_idx);
                console.log("Line " + chr);
                if (chr === "{")
                {
                    if (awk_start === undefined) {
                        awk_start = line_offset + c_idx;
                        indent++;
                    }
                }
                else if (chr === "}")
                {
                    indent--;
                    if (indent <= 0 && awk_start !== undefined) {
                        result.push([awk_start, line_offset + c_idx]);
                        awk_start = undefined;
                        in_awk = false;
                    }
                }
            }
        }
        line_offset += line.length + 1;
    }

    return result;
}

function resource_data_mark(content : string, sections : Sections) : MarkerResult[] {
    let result : MarkerResult[] = [];
    if (sections.meta === null) {
        // No meta section, opt out
        return result;
    }
    
    let resource_metrics = ["cpu-usage", "memory-usage"];

    let parser = sections.awk || sections.json || sections.xml;

    if (parser !== undefined && parser !== null) {
        let metrics = parser.get_metrics();

        let resource_metric_found : boolean = false;
        for (let metric of metrics) {
            if (resource_metrics.indexOf(metric[0]) > -1) {
                resource_metric_found = true;
                if (!sections.meta.includes_resource_data) {
                    result.push(new MarkerResult(metric[1] + parser.offset, metric[1] + parser.offset + metric[0].length, "This tag would normally require include_resource_data in the meta section.", FunctionSeverity.error, true));
                }
            }
        }
        if (!resource_metric_found && sections.meta.includes_resource_data_range !== null) {
            let marker = new MarkerResult(sections.meta.includes_resource_data_range[0] + sections.meta.offset, sections.meta.includes_resource_data_range[1] + sections.meta.offset, "Resource data has been used but no metrics that require it seem to exist.", FunctionSeverity.error, true); 
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
                result.push(new MarkerResult(doc[1] + sections.comments.offset, doc[1] + sections.comments.offset + doc[0].length, "This metric has been documented but is not used in the code.", FunctionSeverity.error, false));
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
                result.push(new MarkerResult(use[1] + section.offset, use[1] + section.offset + use[0].length, "This metric is used in the code but has not been documented in the meta section!", FunctionSeverity.error, false));
            }
        }
    }

    return result;
}
