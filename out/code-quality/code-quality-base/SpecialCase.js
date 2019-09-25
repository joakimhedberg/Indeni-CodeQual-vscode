"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
    Special case class
    Used in CodeValidationByLine
*/
class SpecialCase {
    constructor(search_pattern, mark = null) {
        this.search_pattern = search_pattern;
        this.mark = mark;
    }
    matches(content) {
        return content.match(this.search_pattern) !== null;
    }
    exec(content) {
        if (this.mark !== null) {
            return this.mark(content);
        }
        else {
            return [];
        }
    }
}
exports.SpecialCase = SpecialCase;
//# sourceMappingURL=SpecialCase.js.map