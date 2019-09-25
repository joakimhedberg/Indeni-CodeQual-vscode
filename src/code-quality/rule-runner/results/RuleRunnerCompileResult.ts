import { CommandRunnerResultBase } from "../../../command-runner/results/CommandRunnerResultBase";

export class RuleRunnerCompileResult extends CommandRunnerResultBase {
    public items : [string, string][] = [];
    public has_error : boolean = false;
    public error_data : string = "";
    public device_status : { [ key: string ] : undefined | boolean | RuleRunnerCompileIssueResult } = {};
    public constructor(data : string) {
        super(data);

        if (data === '') {
            this.has_error = true;
            this.error_data = 'No data received from rule runner';
            return;
        }
        this.parse_items();
    }

    parse_items() {
        let info_regex = /Compiled rule:(.+?)[0-9]{4}\-[0-9]{2}\-[0-9]{2}/gs;
        let error_regex = /Error while executing rule runner(.+)[0-9]{4}\-[0-9]{2}\-[0-9]{2}/gs;
        
        let match = info_regex.exec(this.raw_data_stripped);
        if (match !== null) {
            if (match.length > 0) {
                let data = match[1].trim();

                for (let row of data.split('\n')) {
                    let items = row.split(':');
                    if (items.length === 2) {
                        this.items.push([items[0], items[1]]);
                    }
                }
            }
        }

        let error_match = error_regex.exec(this.raw_data_stripped);
        if (error_match) {
            this.has_error = true;
            this.error_data = error_match[1].trim();
        }

        let device_match = /Evaluation of device\s+'([^']+)':\s+([^\n]+)/gs;

        let match_device;
        while (match_device = device_match.exec(this.raw_data_stripped)) {
            if (match_device.length > 1) {
                let device_name = match_device[1];
                let status = match_device[2];
                if (/Unknown status/.test(status)) {
                    this.device_status[device_name] = false;
                }
                else if (/No issue/.test(status)) {
                    this.device_status[device_name] = true;
                } else if (/Issue/.test(status)) {
                    let issue_regexp = new RegExp(`Evaluation of device '${device_name}':.*?\\nAlert[\\s=]+(.*?)([0-9]{4}\-[0-9]{2}\-[0-9]{2}|\Z)`, 'gs');
                    let issue_match = issue_regexp.exec(this.raw_data_stripped);
                    if (issue_match) {
                        this.device_status[device_name] = new RuleRunnerCompileIssueResult(issue_match[1].trim());
                    }
                }
            }
        }
    }
}

class RuleRunnerCompileIssueResult {
    public issue_data : string;
    public constructor(issue_data : string) {
        this.issue_data = issue_data;
    }
}