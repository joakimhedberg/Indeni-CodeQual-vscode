import { CommandRunnerTestCase } from "./CommandRunnerTestCase";
import { CommandRunnerResultBase } from "./CommandRunnerResultBase";

export class CommandRunnerTestRunResult extends CommandRunnerResultBase {
    public script_name : string | undefined = undefined;
    public test_cases : CommandRunnerTestCase[] = [];

    public constructor(raw_data : string) {
        super(raw_data);
        this.parse_test_results();
    }

    parse_test_results() {
        if (this.raw_data === undefined) {
            return;
        }

        let regex_names = /Running test case '([^']+)/g;

        let match;
        while (match = regex_names.exec(this.raw_data_stripped)) {
            let test_case = new CommandRunnerTestCase(match[1], this.raw_data_stripped);
            this.test_cases.push(test_case);
        }
    }
}