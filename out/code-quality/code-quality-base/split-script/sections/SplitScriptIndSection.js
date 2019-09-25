"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SplitScriptSectionBase_1 = require("./SplitScriptSectionBase");
const yaml = require("js-yaml");
class SplitScriptIndSection extends SplitScriptSectionBase_1.SplitScriptSectionBase {
    get_metrics() {
        return this.get_documented_metrics();
    }
    constructor(filename, content = undefined) {
        super(filename, 'ind', 'yaml', content);
        let header_content = this.content;
        if (header_content) {
            this.yaml_header = yaml.safeLoad(header_content);
        }
    }
    get_comments_section() {
        let content = this.content;
        if (!content) {
            return undefined;
        }
        let lines = content.split('\n');
        let result = [];
        let in_comments = false;
        let index = undefined;
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
                }
                else {
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
    get_includes_resource_data() {
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
    get_script_name() {
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
    get_documented_metrics() {
        let comments = this.get_comments_section();
        if (!comments) {
            return [];
        }
        let result = [];
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
    get_parser_filenames() {
        let result = [];
        if (this.yaml_header) {
            for (let step of this.yaml_header.steps) {
                result.push(step.parse.file);
            }
        }
        return result;
    }
}
exports.SplitScriptIndSection = SplitScriptIndSection;
//# sourceMappingURL=SplitScriptIndSection.js.map