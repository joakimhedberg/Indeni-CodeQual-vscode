import { SplitScriptYamlSectionBase } from "./SplitScriptYamlSectionBase";

export class SplitScriptJsonSection extends SplitScriptYamlSectionBase {
    constructor(filename : string, content : string | undefined = undefined) {
        super(filename, 'json', 'yaml', content);
    }
}