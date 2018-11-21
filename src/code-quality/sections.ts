import { CodeValidation, MarkerResult } from "./code-validation";

export class Section {
    public offset : number;
    content : string;
    length : number;
    public apply : string[];
    constructor(offset : number, content : string, apply : string[]) {
        this.offset = offset;
        this.content = content;
        this.length = content.length;
        this.apply = apply;
    }

    get_marks(validations : CodeValidation[], sections: Sections) : MarkerResult[] {
        let result : MarkerResult[] = [];

        for (let validation of validations) {
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
                var marks = validation.mark(this.content, sections);
                if (marks.length > 0) {
                    for (let mark of marks) {
                        result.push(this.modify_mark(mark)); // this.create_mark(mark, validation.severity, validation.reason, validation.offset_handled));
                    }
                }
            }
        }

        return result;
    }

    modify_mark(marker : MarkerResult) : MarkerResult
    {
        if (!marker.offset_handled) {
            marker.start_pos += this.offset;
            marker.end_pos += this.offset;
        }

        return marker;
    }

    create_mark(range : [number, number], severity : string, tooltip : string, offset_handled : boolean) : [string, string, number, number] {
        let offset : number = 0;
        if (!offset_handled) {
            offset = this.offset;
        }
        return [severity, tooltip, range[0] + offset, range[1] + offset];
    }
}

export class CommentsSection extends Section {
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
    }

    public get_documented_metrics() : [string, number][] {
        let result : [string, number][] = [];

        let regex = /^(([^\s:\#])+)/gm;
        let match;

        while (match = regex.exec(this.content))
        {
            if (match.length > 1)
            {
                result.push([match[0], match.index]);
            }
        }
        
        return result;
    }
}

export class AwkSection extends Section {
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
    }

    public get_metrics() : [string, number][] {
        let result : [string, number][] = [];

        let regex = /^\s{0,}[^\#]\s{0,}write.*Metric\w+\(\"(.*?)\".+$/gm;
        
        let match;
        while (match = regex.exec(this.content))
        {
            if (match.length > 1)
            {
                result.push([match[1], match[0].indexOf(match[1]) + match.index]);
            }
        }

        return result;
    }
}

export class YamlSection extends Section {
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);
    }

    public get_metrics() : [string, number][] {
        let result : [string, number][] = [];

        let regex = /im\.name\":\s*_constant:\s\"([^\"]+)/gm;

        let match;
        while (match = regex.exec(this.content)) {
            if (match.length > 1) {
                result.push([match[1], match.index + match[0].indexOf(match[1])]);
            }
        }

        return result;
    }
}

export class MetaSection extends Section {
    includes_resource_data : boolean = false;
    includes_resource_data_range : ([number, number]) | null = null;
    constructor(section : Section) {
        super(section.offset, section.content, section.apply);

        let regex = /^includes_resource_data:\s*true$/m;
        let match = this.content.match(regex);
        this.includes_resource_data = match !== null;
        if (match !== null && match.index !== null && match.length > 0 && match.index !== undefined) {
            this.includes_resource_data_range = [match.index, match.index + match[0].length];
        }
    }

}

export class Sections {
    public meta : MetaSection | null = null;
    public comments : CommentsSection | null = null;
    public awk : AwkSection | null = null;
    public json : YamlSection | null = null;
    public xml : YamlSection | null = null;
    public script : Section | null = null;
    public all : Section[] = [];
}

export function get_sections(content : string) : Sections {
    let sections : Section[] = [];
    
    sections.push(new Section(0, content, ["script"]));
    let result = new Sections();
    result.script = new Section(0, content, ["script"]);
    result.all.push(result.script);

    var meta = get_section(["meta"], /#! META(\n|\r)([.\S\s]+?)#!/g.exec(content));
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