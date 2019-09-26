import { SplitScriptValidationBase } from "./functions/SplitScriptValidationBase";
import { MarkerResult } from "../../MarkerResult";
import { SplitScript } from "../SplitScript";
import { RegexValidation } from "./functions/RegexValidation";
import { FunctionSeverity } from "../../CodeValidation";
import { UndocumentedMetricsValidation } from "./functions/UndocumentedMetricsValidation";
import { UnusedMetricsValidation } from "./functions/UnusedMetricsValidation";
import { ValidScriptNamePrefix } from "./functions/ValidScriptNamePrefixValidation";
import { IncludesResourceDataValidation } from "./functions/IncludesResourceDataValidation";
import { VariableNamingConventionValidation } from "./functions/VariableNamingConventionValidation";
import { IsInComparison } from "../sections/SplitScriptSectionBase";

const INDENI_SCRIPT_NAME_PREFIXES = [
    "alteon",
    "api",
    "bluecoat",
    "cas",
    "chkp",
    "cpembedded",
    "cphaprob",
    "cplic",
    "cpmds",
    "cpprod",
    "cpstat",
    "f5",
    "fireeye",
    "fortigate",
    "fortios",
    "freebsd",
    "fwmultik",
    "get",
    "gigamon",
    "imp",
    "imperva",
    "indeni",
    "ios",
    "iosxe",
    "ipso",
    "junos",
    "linux",
    "lsb",
    "md5sum",
    "netobj",
    "nexus",
    "panos",
    "proxysg",
    "radware",
    "rest",
    "sgos",
    "srx",
    "ssh",
    "unix",
    "vpn"];

const INDENI_RESOURCE_METRICS = [
    "cpu-usage",
    "memory-usage"
];


export class SplitScriptValidationCollection {
    public validations : SplitScriptValidationBase[];

    constructor() {
        this.validations = [];
        //let leading_tab = new CodeValidationRegex("Leading tabs", "Tabs should not be used for indentation, please configure your editor to use space for indentation.", FunctionSeverity.error, ["awk", "yaml"], /^([\t]+)/gm);
        this.validations.push(new RegexValidation("Leading tabs", "Tabs should not be used for indentation, please configure your editor to use space for indentation.", FunctionSeverity.error, /^([\t]+)/gm, [], ["awk", "yaml"]));

        //let if_contains_single_equal_sign = new CodeValidationRegex("If statement with single equal sign", "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", FunctionSeverity.error, ["awk"], /if\s+\([^=!]+(=)[^=]+\)\s+\{/gm);// /if\s*?\([^=]+[^=!](=){1}[^=].+\)/gm);
        this.validations.push(new RegexValidation("If statement with single equals sign", "Found an if statement that contains a single equals sign. Since this is most likely an accident (and it'd always return true) it could cause strange bugs in the code. Consider replacing with double equal signs.", FunctionSeverity.error, /if\s?\(.+[^=!<>~](=)[^=!<>~].+(?=\))/gm, [], ["awk"]));

        //let space_before_example = new CodeValidationRegex("Space before example", "Space before examples may look nice, but it's far from exact unless the input file actually has one. Consider removing this space unless yours does.", FunctionSeverity.warning, ["awk"], /^(\# .+)(\n|\r\n)\/.+\/\s*{/gm);
        let space_before_example = new RegexValidation("Space before example", "Space before examples may look nice, but it's far from exact unless the input file actually has one. Consider removing this space unless yours does.", FunctionSeverity.warning, /^^(\# .+)(?=(\n|\r\n)\/.+\/\s*{)/gm, [], ["awk"]);
        space_before_example.ignore_comments = false;
        this.validations.push(space_before_example);

        //let trailing_whitespace = new CodeValidationRegex("Trailing white-space", "Trailing white space serves no purpose and should be removed.", FunctionSeverity.error, ["awk", "yaml"], /([ \t]+)$/gm);
        let trailing_whitespace = new RegexValidation("Trailing white-space", "Trailing white space serves no purpose and should be removed.", FunctionSeverity.error, /([ \t]+)$/gm, [], ["awk", "yaml"]);
        trailing_whitespace.ignore_quoted = false;
        this.validations.push(trailing_whitespace);

        //let writedebug_exists = new CodeValidationRegex("writeDebug()", "writeDebug() (or debug()) are great for troubleshooting, but code with that function should never reach customers.", FunctionSeverity.error, ["awk"], /(writeDebug\(.+\)|debug\(.+\))/gm);
        this.validations.push(new RegexValidation("writeDebug()", "writeDebug() (or debug()) are great for troubleshooting, but code with that function should never reach customers.", FunctionSeverity.error, /(writeDebug\(.+\)|debug\(.+\))/gm, [], ["awk", "python"]));
        
        //let empty_begin_section = new CodeValidationRegex("Empty BEGIN", "Empty BEGIN sections serves no purpose and should be disposed of.", FunctionSeverity.warning, ["awk"], /(BEGIN {\s*})/g);
        this.validations.push(new RegexValidation("Empty BEGIN", "Empty BEGIN sections serves no purpose and should be disposed of.", FunctionSeverity.warning, /(BEGIN\s+{\s*})/g, [], ["awk"]));
        
        //let empty_end_section = new CodeValidationRegex("Empty END", "Empty END sections serves no purpose and should be disposed of.", FunctionSeverity.warning, ["awk"], /(END {\s*})/g);
        this.validations.push(new RegexValidation("Empty END", "Empty END sections serves no purpose and should be disposed of.", FunctionSeverity.warning, /(END\s+{\s*})/g, [], ["awk"]));
        
        //let generic_space_before_example_and_after = new CodeValidationRegex("Space <3", "Space in certain places makes the code look nicer.", FunctionSeverity.information, ["awk"], /(if\()|(\){)|}else|else{/g);
        this.validations.push(new RegexValidation("Space <3", "Space in certain places makes the code look nicer.", FunctionSeverity.information,  /(if\()|(\){)|}else|else{/g, [], ["awk"]));

        //let column_variable_manipulation = new CodeValidationRegex("Column variable manipulation", "Changing column values (ie. $0, $1) could easily lead to unexpected behaviors.\nIt is highly recommended to instead save the column value to a variable and change that.", FunctionSeverity.warning, ["awk"], /g{0,1}sub.+?(\$[0-9])+/g);
        this.validations.push(new RegexValidation("Column variable manipulation", "Changing column values (ie. $0, $1) could easily lead to unexpected behaviors.\nIt is highly recommended to instead save the column value to a variable and change that.", FunctionSeverity.warning, /g{0,1}sub.+?(\$[0-9])+/g, [], ["awk"]));

        //let tilde_without_space = new CodeValidationRegex("Tilde without space", "Tilde signs should be followed by space.\nExceptions to this are regexp.", FunctionSeverity.error, ["awk"], /([^ \n]~[^ \n]|[^ \n]~|~[^ \n])/gm);
        // TODO: Need to look this over
        //let tilde_without_space = new RegexValidation("Tilde without space", "Tilde signs should be followed by space.\nExceptions to this are regexp.", FunctionSeverity.error, /([^ \n]~[^ \n]|[^ \n]~|~[^ \n])/gm, [], ["awk"]);
        let tilde_without_space = new RegexValidation("Tilde without space", "Tilde signs should be followed by space.\nExceptions to this are regexp.", FunctionSeverity.error, /([^ \n]~[^ \n]|~[^ \n])/gm, [], ["awk"]);
        tilde_without_space.ignore_regexp = true;
        this.validations.push(tilde_without_space);

        //let tilde_without_regexp_notation = new CodeValidationRegex("Tilde without regexp notation", "Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).", FunctionSeverity.warning, ["awk"], /(~\s+[^/])/gm);
        this.validations.push(new RegexValidation("Tilde without regexp notation", "Tilde signs should be followed by a regex enclosed in a traditional regex notation (ie. /regexp/).", FunctionSeverity.warning, /(~\s+[^/])/gm, [], ["awk"]));
        
        this.validations.push(new UndocumentedMetricsValidation());
        this.validations.push(new UnusedMetricsValidation());
        this.validations.push(new ValidScriptNamePrefix(INDENI_SCRIPT_NAME_PREFIXES));
        this.validations.push(new RegexValidation("Description begins in lower case", "In the english language, it's good practice to begin sentences with upper case.", FunctionSeverity.error, /^description:\s+([a-z]+)/gm, ["ind"], ["yaml"]));
        
        let comma_without_space = new RegexValidation("Comma without space", "Comma signs should be followed by a space.\nExceptions to this are regexp and bash scripts", FunctionSeverity.error, /(,)[^ \/]/gm, [], ["awk"]);
        comma_without_space.ignore_regexp = true;
        this.validations.push(comma_without_space);
        this.validations.push(new IncludesResourceDataValidation("Resource data validation", INDENI_RESOURCE_METRICS));
        let equals_sign_validation = new RegexValidation("Equals sign without space", "The equals sign and other comparison operators should be followed by a space.\nExceptions to this are regexp and bash scripts.", FunctionSeverity.error, /([^ =!<>~\n]{1}([=!<>~]{1,2})[^ \n]{1})|(([^ =!<>~\n]{1})([=!<>~]{1,2}))|(([=!<>~]{1,2})[^ =!<>~\n]{1})/gm, [], ['awk']);
        equals_sign_validation.ignore_regexp = true;
        equals_sign_validation.ignore_comments = true;
        equals_sign_validation.ignore_quoted = true;
        this.validations.push(equals_sign_validation);
        this.validations.push(new VariableNamingConventionValidation());

        let index = 0;
        for (let validation of this.validations) {
            validation.id = index++;
        }
    }

    apply(script : SplitScript) : MarkerResult[] {
        let result : MarkerResult[] = [];

        for (let validation of this.validations) {
            for (let marker of validation.get_markers(script)) {
                this.clean_up(script, marker);
                result.push(marker);
            }
        }

        return result;
    }

    clean_up(script : SplitScript, marker : MarkerResult) {
        if (!script.current_section) {
            return;
        }

        if (marker.ignore_comments) {
            if (script.current_section.is_in_comment(marker.start_pos, marker.end_pos, IsInComparison.any_within)) {
                marker.is_ignored = true;
            }
        }

        if (marker.ignore_quoted) {
            if (script.current_section.is_in_quote(marker.start_pos, marker.end_pos, IsInComparison.any_within)) {
                marker.is_ignored = true;
            }
        }

        if (marker.ignore_regexp) {
            if (script.current_section.is_in_regexp(marker.start_pos, marker.end_pos, IsInComparison.any_within)) {
                marker.is_ignored = true;
            }
        }
    }
}