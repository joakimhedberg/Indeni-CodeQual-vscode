import { ResultMetric, ResultMetricTag } from "./ResultMetric";
import { CommandRunnerResultBase } from "./CommandRunnerResultBase";
import * as path from 'path';

export class CommandRunnerParseOnlyResult extends CommandRunnerResultBase {
    public input_path : string | undefined = undefined;
    public script_path : string | undefined = undefined;
    public input_file_name : string | undefined = undefined;
    public script_file_name : string | undefined = undefined;

    public metrics : ResultMetric[] = [];
    public script_name : string | undefined = undefined;
    public duration : number | undefined = undefined;
    public size : number | undefined = undefined;
    public size_unit : string | undefined = undefined;

    public tags : ResultMetricTag[] = [];

    public constructor(input_file : string, script_file : string, raw_data : string) {
        super(raw_data);
        this.input_path = input_file;
        this.script_path = script_file;
        this.input_file_name = path.basename(input_file);
        this.script_file_name = path.basename(script_file);
        this.parse_info();
        this.parse_metrics();
    }

    parse_metrics() {
        this.metrics = ResultMetric.parse_from_text(this.raw_data_stripped);
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
                let tag = new ResultMetricTag();
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