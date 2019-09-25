"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandRunnerResultBase {
    constructor(raw_data) {
        this.raw_data = raw_data;
        this.raw_data_stripped = raw_data.replace(/\x1b\[[0-9;]*m/g, '');
    }
}
exports.CommandRunnerResultBase = CommandRunnerResultBase;
//# sourceMappingURL=CommandRunnerResultBase.js.map