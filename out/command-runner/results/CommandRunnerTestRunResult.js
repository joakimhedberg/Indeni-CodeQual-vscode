"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandRunnerTestCase_1 = require("./CommandRunnerTestCase");
const CommandRunnerResultBase_1 = require("./CommandRunnerResultBase");
class CommandRunnerTestRunResult extends CommandRunnerResultBase_1.CommandRunnerResultBase {
    constructor(raw_data) {
        super(raw_data);
        this.script_name = undefined;
        this.test_cases = [];
        this.parse_test_results();
    }
    parse_test_results() {
        if (this.raw_data === undefined) {
            return;
        }
        let regex_names = /Running test case '([^']+)/g;
        let match;
        while (match = regex_names.exec(this.raw_data_stripped)) {
            let test_case = new CommandRunnerTestCase_1.CommandRunnerTestCase(match[1], this.raw_data_stripped);
            this.test_cases.push(test_case);
        }
    }
}
exports.CommandRunnerTestRunResult = CommandRunnerTestRunResult;
//# sourceMappingURL=CommandRunnerTestRunResult.js.map