"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class SplitScriptSectionBase {
    constructor(filename, identifier, content_type, content = undefined) {
        this.filename = filename;
        this.content_type = content_type;
        this.section_identifier = identifier;
        this._content = content;
        this.comment_lines = [];
        this.quotes = [];
        this.regexp = [];
    }
    get content() {
        if (this._content === undefined) {
            try {
                this._content = fs_1.readFileSync(this.filename).toString();
            }
            catch (error) {
                console.error(error);
            }
        }
        if (this._content) {
            let quotes_match = /(["'])(?:(?=(\\?))\2.)*?\1/gm;
            let regex_match = /([/])(?:(?=(\\?))\2.)*?\1/gm;
            let comments_match = /#.*$/gm;
            let match;
            while (match = quotes_match.exec(this._content)) {
                this.quotes.push([match.index, match[0]]);
            }
            while (match = regex_match.exec(this._content)) {
                this.regexp.push([match.index, match[0]]);
            }
            while (match = comments_match.exec(this._content)) {
                this.comment_lines.push([match.index, match[0]]);
            }
        }
        return this._content;
    }
    is_in_comment(start_pos, end_pos, comparison) {
        return this.is_in_list(this.comment_lines, start_pos, end_pos, comparison);
    }
    is_in_quote(start_pos, end_pos, comparison) {
        return this.is_in_list(this.quotes, start_pos, end_pos, comparison);
    }
    is_in_regexp(start_pos, end_pos, comparison) {
        return this.is_in_list(this.regexp, start_pos, end_pos, comparison);
    }
    is_in_list(list, start_pos, end_pos, comparison) {
        for (let item of list) {
            if (this.range_match(item, start_pos, end_pos, comparison)) {
                return true;
            }
        }
        return false;
    }
    range_match(item, start_pos, end_pos, comparison) {
        switch (comparison) {
            case IsInComparison.any_within:
                return this.is_in_range(item[0], item[0] + item[1].length, start_pos) || this.is_in_range(item[0], item[0] + item[1].length, end_pos);
            case IsInComparison.both_within:
                return this.is_in_range(item[0], item[0] + item[1].length, start_pos) && this.is_in_range(item[0], item[0] + item[1].length, end_pos);
            case IsInComparison.start_within:
                return this.is_in_range(item[0], item[0] + item[1].length, start_pos);
            case IsInComparison.end_within:
                return this.is_in_range(item[0], item[0] + item[1].length, end_pos);
        }
        return false;
    }
    is_in_range(range_start, range_end, index) {
        return range_start <= index && index <= range_end;
    }
}
exports.SplitScriptSectionBase = SplitScriptSectionBase;
var IsInComparison;
(function (IsInComparison) {
    IsInComparison[IsInComparison["both_within"] = 0] = "both_within";
    IsInComparison[IsInComparison["start_within"] = 1] = "start_within";
    IsInComparison[IsInComparison["end_within"] = 2] = "end_within";
    IsInComparison[IsInComparison["any_within"] = 3] = "any_within";
})(IsInComparison = exports.IsInComparison || (exports.IsInComparison = {}));
//# sourceMappingURL=SplitScriptSectionBase.js.map