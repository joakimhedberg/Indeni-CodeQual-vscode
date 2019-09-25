"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommandRunnerResultBase_1 = require("./CommandRunnerResultBase");
class CommandRunnerTestCreateResult extends CommandRunnerResultBase_1.CommandRunnerResultBase {
    constructor(raw_data) {
        super(raw_data);
        this.script_name = undefined;
        this.test_case = undefined;
        this.success = false;
        this.parse_results();
    }
    parse_results() {
        let match = /Preparing test case '([^']+)' for command '([^']+)'/gm;
        let result = match.exec(this.raw_data_stripped);
        if (result !== null) {
            this.test_case = result[1];
            this.script_name = result[2];
            this.success = true;
        }
    }
}
exports.CommandRunnerTestCreateResult = CommandRunnerTestCreateResult;
//# sourceMappingURL=CommandRunnerTestCreateResult.js.map