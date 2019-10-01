"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommandRunnerResultBase {
    constructor(raw_data) {
        this.debug_lines = [];
        this.raw_data = raw_data;
        this.raw_data_stripped = raw_data.replace(/\x1b\[[0-9;]*m/g, '');
        this.parse_debug_lines();
    }
    parse_debug_lines() {
        let regexp_debug = /DEBUG\s+--\s(.+)/gm;
        let match;
        while (match = regexp_debug.exec(this.raw_data_stripped)) {
            if (match.length > 1) {
                this.debug_lines.push(match[1]);
            }
        }
    }
}
exports.CommandRunnerResultBase = CommandRunnerResultBase;
//# sourceMappingURL=CommandRunnerResultBase.js.map