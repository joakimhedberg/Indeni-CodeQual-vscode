import { MarkerResult } from "./MarkerResult";

/* 
    Special case class
    Used in CodeValidationByLine
*/
export class SpecialCase {
    search_pattern : RegExp;
    mark : ((content : string) => MarkerResult[]) | null;
    constructor(search_pattern : RegExp, mark : ((content : string) => MarkerResult[]) | null = null) {
        this.search_pattern = search_pattern;
        this.mark = mark;
    }

    matches(content : string) {
        return content.match(this.search_pattern) !== null;
    }

    exec(content : string) : MarkerResult[] {
        if (this.mark !== null) {
            return this.mark(content);
        } else {
            return [];
        }
    }
}
