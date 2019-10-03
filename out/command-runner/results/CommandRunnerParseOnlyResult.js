"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ResultMetric_1 = require("./ResultMetric");
const CommandRunnerResultBase_1 = require("./CommandRunnerResultBase");
const path = require("path");
class CommandRunnerParseOnlyResult extends CommandRunnerResultBase_1.CommandRunnerResultBase {
    constructor(input_file, script_file, raw_data) {
        super(raw_data);
        this.input_path = undefined;
        this.script_path = undefined;
        this.input_file_name = undefined;
        this.script_file_name = undefined;
        this.metrics = [];
        this.script_name = undefined;
        this.duration = undefined;
        this.size = undefined;
        this.size_unit = undefined;
        this.tags = [];
        this.json_sections = [];
        this.remote_contents = [];
        this.input_path = input_file;
        this.script_path = script_file;
        this.input_file_name = path.basename(input_file);
        this.script_file_name = path.basename(script_file);
        this.parse_info();
        this.parse_metrics();
        this.parse_json_sections();
    }
    parse_metrics() {
        this.metrics = ResultMetric_1.ResultMetric.parse_from_text(this.raw_data_stripped);
    }
    parse_json_sections() {
        let regexp_start = /(?:\r|\n){/g;
        let match;
        while (match = regexp_start.exec(this.raw_data_stripped)) {
            try {
                let result = JSON.parse(this.parse_json_section(match.index + match.length));
                this.json_sections.push(result);
                if (result['event-type'] === 'record-step') {
                    let record = result['record'];
                    if (record) {
                        if (record.content) {
                            this.remote_contents.push(record.content);
                        }
                    }
                }
            }
            catch (_a) {
            }
        }
        console.log(this.remote_contents);
    }
    parse_json_section(offset) {
        let level = 0;
        let content = '';
        for (let i = offset; i < this.raw_data_stripped.length; i++) {
            let char = this.raw_data_stripped[i];
            switch (char) {
                case '{':
                    level++;
                    break;
                case '}':
                    level--;
                    break;
            }
            content += char;
            if (level <= 0) {
                break;
            }
        }
        return content;
    }
    parse_info() {
        let match_running = /Running '([^']+)/g;
        let match_duration = /The command duration was\s+([^\s]+)/g;
        let match_size = /The result size was\s+([^\s]+)\s+(.+)$/gm;
        let match_tags = /Found [0-9]{0,} tags:(.+)The result size/gs;
        let running = match_running.exec(this.raw_data_stripped);
        if (running !== null) {
            if (running.length > 0) {
                this.script_name = running[1];
            }
        }
        let tags_result = match_tags.exec(this.raw_data_stripped);
        if (tags_result !== null) {
            let tags_match = /([^\s]+)\s=\s(.+)/gm;
            let match;
            while (match = tags_match.exec(tags_result[1])) {
                let tag = new ResultMetric_1.ResultMetricTag();
                tag.name = match[1];
                tag.value = match[2];
                this.tags.push(tag);
            }
        }
        let duration = match_duration.exec(this.raw_data_stripped);
        if (duration !== null) {
            this.duration = parseInt(duration[1]);
        }
        let size = match_size.exec(this.raw_data_stripped);
        if (size !== null) {
            this.size = parseFloat(size[1]);
            this.size_unit = size[2].trim();
        }
    }
}
exports.CommandRunnerParseOnlyResult = CommandRunnerParseOnlyResult;
//# sourceMappingURL=CommandRunnerParseOnlyResult.js.map