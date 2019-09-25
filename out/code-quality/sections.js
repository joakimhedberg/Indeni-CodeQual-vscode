"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Section_1 = require("./code-quality-base/Section");
// Parse out all the script sections and return a Sections class
function get_sections(content) {
    let result = new Section_1.Sections();
    result.script = new Section_1.Section(0, content, ["script"]);
    result.all.push(result.script);
    var meta = get_section(["meta", "yaml"], /#! META(\n|\r)([.\S\s]+?)#!/g.exec(content));
    if (meta) {
        result.meta = new Section_1.MetaSection(meta);
        result.all.push(meta);
    }
    var comments = get_section(["yaml", "comments"], /#! COMMENTS(\n|\r)([.\S\s]+?)#!/g.exec(content));
    if (comments) {
        result.comments = new Section_1.CommentsSection(comments);
        result.all.push(result.comments);
    }
    var awk = get_section(["awk"], /#! PARSER::AWK.*(\n|\r)([.\S\s]+?)$/g.exec(content));
    if (awk) {
        result.awk = new Section_1.AwkSection(awk);
        result.all.push(awk);
    }
    var json = get_section(["json", "yaml"], /#! PARSER::JSON.*(\n|\r)([.\S\s]+?)$/g.exec(content));
    if (json) {
        result.json = new Section_1.YamlSection(json);
        result.all.push(json);
    }
    var xml = get_section(["xml", "yaml"], /#! PARSER::XML.*(\n|\r)([.\S\s]+?)$/g.exec(content));
    if (xml) {
        result.xml = new Section_1.YamlSection(xml);
        result.all.push(xml);
    }
    return result;
}
exports.get_sections = get_sections;
function get_section(apply, regex_result) {
    if (regex_result !== null) {
        return new Section_1.Section(regex_result.index, regex_result[0], apply);
    }
    return null;
}
//# sourceMappingURL=sections.js.map