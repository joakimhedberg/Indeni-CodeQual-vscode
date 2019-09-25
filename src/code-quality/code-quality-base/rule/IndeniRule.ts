import { RuleRunner } from "../../rule-runner/RuleRunner";

export class IndeniRule {
    private file_path : string;
    public constructor(file_path : string) {
        this.file_path = file_path;
    }

    public async RuleRunnerCompile() {
        let rule_runner = new RuleRunner();
        let result = await rule_runner.Compile(this.file_path);
        return Promise.resolve(result);
    }
}