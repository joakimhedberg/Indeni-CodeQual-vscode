import { SplitScriptSectionBase } from "./SplitScriptSectionBase";

export class SplitScriptYamlSectionBase extends SplitScriptSectionBase {
    public get_metrics(): [number, string][] {
        let regex_match = /\"im.name\"[^\"]*\"([^\"]+)/g;
        let result : [number, string][] = [];

        if (this.content === undefined) {
            return result;
        }
        let match;

        while (match = regex_match.exec(this.content))
        {
            if (match.length > 1)
            {
                result.push([match[0].indexOf(match[1]) + match.index, match[1]]);
            }
        }

        return result;
    }

}