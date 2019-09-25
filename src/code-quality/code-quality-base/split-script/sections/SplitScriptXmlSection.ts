import { SplitScriptYamlSectionBase } from "./SplitScriptYamlSectionBase";

export class SplitScriptXmlSection extends SplitScriptYamlSectionBase {
    constructor(filename : string, content : string | undefined = undefined) {
        super(filename, 'xml', 'yaml', content);
    }
}