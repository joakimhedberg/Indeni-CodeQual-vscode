import { SplitScriptSectionBase } from "./SplitScriptSectionBase";
import yaml = require('js-yaml');
export class SplitScriptIndSection extends SplitScriptSectionBase {
    public get_metrics(): [number, string][] {
        return this.get_documented_metrics();
    }

    public yaml_header : any;
    constructor(filename : string, content : string | undefined = undefined) {
        super(filename, 'ind', 'yaml', content);
        let header_content = this.content;
        if (header_content) {
            this.yaml_header = yaml.safeLoad(header_content);
        }
    }

    get_comments_section() : [number, string[]] | undefined {
        let content = this.content;
        if (!content) {
            return undefined;
        }

        let lines = content.split('\n');
        
        let result : string[] = [];
        let in_comments = false;
        let index : number | undefined = undefined;
        let offset = 0;
        for (let line of lines) {
            if (line.startsWith('comments:') && !in_comments) {
                in_comments = true;
                index = offset;
                result.push(line);
                continue;
            }

            if (in_comments) {
                let match = line.match(/^\s+|\t+/gm);
                if (!match) {
                    in_comments = false;
                } else {
                    result.push(line);
                }
            }
            offset += line.length + 1;
        }

        if (index) {
            return [index, result];
        }

        return undefined;
    }
    
    get_includes_resource_data() : [number, string] | undefined {
        if (this.content === undefined) {
            return undefined;
        }
        let regex = /^includes_resource_data:[\s'"]+(.*)[\s'"]+$/gm;

        let match = regex.exec(this.content);
        if (match) {
            if (match.length > 0) {
                return [match.index + match[0].indexOf(match[1]), match[1]];
            }
        }

        return undefined;
    }

    get_script_name() : [number, string] | undefined {
        if (this.content === undefined) {
            return undefined;
        }
        
        let regex = /^name:\s+(.*)$/gm;
        let match = regex.exec(this.content);
        if (match) {
            if (match.length > 0) {
                return [match.index + match[0].indexOf(match[1]), match[1]];
            }
        }

        return undefined;
    }

    get_documented_metrics() : [number, string][] {
        let comments = this.get_comments_section();
        if (!comments) {
            return [];
        }

        let result : [number, string][] = [];
        let comments_string = comments[1].join('\n');
        let regex = /^(\s{4}|\t{1})(?![\s\t]+)(.*)$/gm;
        let match;

        while (match = regex.exec(comments_string)) {
            if (match.length === 3) {
                let offset = match.index + comments[0] + match[0].indexOf(match[2]);
                let metric = match[2].replace(/:$/, '');
                if (metric.startsWith('"')) {
                    metric = metric.replace(/^"/, '');
                    offset++;
                }
                metric = metric.replace(/[":]$/, '');
                result.push([offset, metric]);
            }
        }

        return result;
    }

    get_parser_filenames() : string[] {
        let result : string[] = [];
        if (this.yaml_header) {
            for (let step of this.yaml_header.steps) {
                result.push(step.parse.file);
            }
        }

        return result;
    }
}