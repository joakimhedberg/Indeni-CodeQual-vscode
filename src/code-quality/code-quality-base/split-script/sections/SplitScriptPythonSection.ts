import { SplitScriptSectionBase } from "./SplitScriptSectionBase";

export class SplitScriptPythonSection extends SplitScriptSectionBase {
    constructor(filename : string, content : string | undefined = undefined) {
        super(filename, 'python', 'python', content);
    }
    
    public get_metrics() : [number, string][] {
        let content = this.content;
        let result : [number, string][] = [];

        if (!content) {
            return result;
        }

        let regex_assigned = /^\s{0,}[^\#]\s{0,}self\.write.*metric\w*\(\'(.*?)\'.+$/gm;
        
        let match;
        while (match = regex_assigned.exec(content))
        {
            if (match.length > 1)
            {
                result.push([match[0].indexOf(match[1]) + match.index, match[1]]);
            }
        }

        return result;
    }

}