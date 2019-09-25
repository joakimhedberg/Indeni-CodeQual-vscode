import { CommandRunnerResultBase } from "./CommandRunnerResultBase";

export class CommandRunnerTestCreateResult extends CommandRunnerResultBase {
    public script_name : string | undefined = undefined;
    public test_case : string | undefined = undefined;
    public success : boolean = false;

    public constructor(raw_data : string) {
        super(raw_data);
        this.parse_results();
    }

    private parse_results() {
        let match = /Preparing test case '([^']+)' for command '([^']+)'/gm;

        let result = match.exec(this.raw_data_stripped);
        if (result !== null) {
            this.test_case = result[1];
            this.script_name = result[2];
            this.success = true;
        }
    }
}