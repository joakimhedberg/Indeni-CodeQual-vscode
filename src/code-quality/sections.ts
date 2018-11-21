import { Sections, Section, MetaSection, CommentsSection, AwkSection, YamlSection } from "./code-quality-base/Section";

export function get_sections(content : string) : Sections {
    let sections : Section[] = [];
    
    sections.push(new Section(0, content, ["script"]));
    let result = new Sections();
    result.script = new Section(0, content, ["script"]);
    result.all.push(result.script);

    var meta = get_section(["meta", "yaml"], /#! META(\n|\r)([.\S\s]+?)#!/g.exec(content));
    if (meta) {
        result.meta = new MetaSection(meta);
        result.all.push(meta);
        sections.push(meta);
    }

    var comments = get_section(["yaml", "comments"], /#! COMMENTS(\n|\r)([.\S\s]+?)#!/g.exec(content));
    if (comments) {
        result.comments = new CommentsSection(comments);
        result.all.push(result.comments);
        sections.push(comments);
    }

    var awk = get_section(["awk"], /#! PARSER::AWK.*(\n|\r)([.\S\s]+?)$/g.exec(content));
    if (awk) {
        result.awk = new AwkSection(awk);
        result.all.push(awk);
        sections.push(awk);
    }

    var json = get_section(["json", "yaml"], /#! PARSER::JSON.*(\n|\r)([.\S\s]+?)$/g.exec(content));
    if (json) {
        result.json = new YamlSection(json);
        result.all.push(json);
        sections.push(json);
    }

    var xml = get_section(["xml", "yaml"], /#! PARSER::XML.*(\n|\r)([.\S\s]+?)$/g.exec(content));
    if (xml) {
        result.xml = new YamlSection(xml);
        result.all.push(xml);
        sections.push(xml);
    }

    return result;
}

function get_section(apply : string[], regex_result : RegExpExecArray | null) {
    if (regex_result !== null) {
        return new Section(regex_result.index, regex_result[0], apply);
    }

    return null;
}